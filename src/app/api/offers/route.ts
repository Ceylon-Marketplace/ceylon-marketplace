import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const type = req.nextUrl.searchParams.get("type");

    if (type === "received") {
      const offers = await prisma.offer.findMany({
        where: { listing: { sellerId: user.sub } },
        include: {
          listing: { include: { media: { take: 1, orderBy: { order: "asc" } } } },
          buyer: { include: { profile: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return Response.json(offers);
    }

    const offers = await prisma.offer.findMany({
      where: { buyerId: user.sub },
      include: {
        listing: { include: { media: { take: 1, orderBy: { order: "asc" } }, seller: { include: { profile: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(offers);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { listingId, amount, message } = await req.json();

    const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { seller: true } });
    if (!listing) throw new ApiError("Listing not found", 404);
    if (listing.status !== "ACTIVE") throw new ApiError("Listing is not active");
    if (listing.listingType !== "OFFER") throw new ApiError("This listing does not accept offers");
    if (listing.sellerId === user.sub) throw new ApiError("You cannot make an offer on your own listing", 403);

    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const offer = await prisma.offer.create({
      data: { listingId, buyerId: user.sub, amount, message, expiresAt, status: "PENDING" },
      include: { listing: { include: { media: { take: 1 } } }, buyer: { include: { profile: true } } },
    });

    await prisma.notification.create({
      data: {
        userId: listing.sellerId,
        type: "OFFER_RECEIVED",
        title: "New offer received",
        content: `You received an offer of ${amount} on "${listing.title}".`,
        metadata: { offerId: offer.id, listingId },
      },
    });

    return Response.json(offer, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
