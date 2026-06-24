import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ApiError } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            media: { orderBy: { order: "asc" } },
            category: true,
            seller: { include: { profile: true } },
          },
        },
        bids: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            bidder: {
              select: { id: true, profile: { select: { firstName: true } } },
            },
          },
        },
      },
    });
    if (!auction) throw new ApiError("Auction not found", 404);

    return Response.json({
      ...auction,
      bids: auction.bids.map((bid) => ({
        ...bid,
        bidder: {
          id: bid.bidder.id,
          maskedName:
            (bid.bidder.profile?.firstName?.slice(0, 2) ?? "??") + "***",
        },
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
