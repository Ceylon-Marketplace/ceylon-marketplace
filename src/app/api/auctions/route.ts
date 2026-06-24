import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams;
    const page = Number(q.get("page") || 1);
    const limit = Number(q.get("limit") || 20);

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where: { status: { in: ["LIVE", "SCHEDULED"] } },
        include: {
          listing: {
            include: {
              media: { orderBy: { order: "asc" }, take: 1 },
              category: true,
            },
          },
          _count: { select: { bids: true } },
        },
        orderBy: { endTime: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auction.count({
        where: { status: { in: ["LIVE", "SCHEDULED"] } },
      }),
    ]);
    return Response.json({ auctions, total, page, limit });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const data = await req.json();

    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      include: { auction: true },
    });
    if (!listing) throw new ApiError("Listing not found", 404);
    if (listing.sellerId !== user.sub) throw new ApiError("Forbidden", 403);
    if (listing.auction)
      throw new ApiError("Auction already exists for this listing");

    const auction = await prisma.auction.create({
      data: {
        listingId: data.listingId,
        sellerId: user.sub,
        startPrice: data.startPrice,
        currentPrice: data.startPrice,
        reservePrice: data.reservePrice,
        bidIncrement: data.bidIncrement ?? 1,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        status: "SCHEDULED",
      },
      include: { listing: { include: { media: { take: 1 } } } },
    });
    return Response.json(auction, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
