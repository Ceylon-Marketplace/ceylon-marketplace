import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000;
const ANTI_SNIPE_EXTENSION_MS = 2 * 60 * 1000;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: auctionId } = await params;
    const user = requireAuth(req);
    const { amount } = await req.json();

    // Preliminary seller check (cheap, before taking transaction)
    const auctionCheck = await prisma.auction.findUnique({ where: { id: auctionId }, select: { sellerId: true } });
    if (!auctionCheck) throw new ApiError("Auction not found", 404);
    if (auctionCheck.sellerId === user.sub) throw new ApiError("Sellers cannot bid on their own auction", 403);

    // All validation + writes inside a single transaction to prevent race conditions
    const { bid, updatedAuction, previousHighBidderId, extended } = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: { bids: { orderBy: { createdAt: "desc" }, take: 1 } },
      });
      if (!auction) throw new ApiError("Auction not found", 404);
      if (auction.status !== "LIVE") throw new ApiError("Auction is not live");

      const now = new Date();
      if (now >= auction.endTime) throw new ApiError("Auction has already ended");

      const minBid = Number(auction.currentPrice) + Number(auction.bidIncrement);
      if (amount < minBid) throw new ApiError(`Minimum bid is ${minBid}`);

      const timeLeft = auction.endTime.getTime() - now.getTime();
      const extended = timeLeft <= ANTI_SNIPE_WINDOW_MS;
      const newEndTime = extended ? new Date(auction.endTime.getTime() + ANTI_SNIPE_EXTENSION_MS) : auction.endTime;
      const previousHighBidderId = auction.bids[0]?.bidderId;

      const bid = await tx.bid.create({ data: { auctionId, bidderId: user.sub, amount } });
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: { currentPrice: amount, bidCount: { increment: 1 }, ...(extended && { endTime: newEndTime }) },
      });

      return { bid, updatedAuction, previousHighBidderId, extended };
    });

    if (previousHighBidderId && previousHighBidderId !== user.sub) {
      await prisma.notification.create({
        data: {
          userId: previousHighBidderId,
          type: "OUTBID",
          title: "You've been outbid!",
          content: `Someone placed a higher bid of ${amount}.`,
          metadata: { auctionId },
        },
      });
    }

    return Response.json({ auction: updatedAuction, bid, extended }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
