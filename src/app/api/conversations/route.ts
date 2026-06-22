import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const convs = await prisma.conversation.findMany({
      where: { OR: [{ buyerId: user.sub }, { sellerId: user.sub }] },
      include: {
        listing: { include: { media: { take: 1 } } },
        buyer: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        seller: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
    return Response.json(convs);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { listingId } = await req.json();

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new ApiError("Listing not found", 404);
    if (listing.sellerId === user.sub) throw new ApiError("Cannot message yourself", 403);

    const conv = await prisma.conversation.upsert({
      where: { listingId_buyerId: { listingId, buyerId: user.sub } },
      update: {},
      create: { listingId, buyerId: user.sub, sellerId: listing.sellerId },
      include: {
        listing: { include: { media: { take: 1 } } },
        buyer: { include: { profile: true } },
        seller: { include: { profile: true } },
        messages: { orderBy: { createdAt: "asc" }, take: 50 },
      },
    });
    return Response.json(conv, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
