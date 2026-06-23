import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: offerId } = await params;
    const user = requireAuth(req);
    const { action } = await req.json();

    const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { listing: true } });
    if (!offer) throw new ApiError("Offer not found", 404);
    if (offer.listing.sellerId !== user.sub) throw new ApiError("Only the seller can respond", 403);
    if (offer.status !== "PENDING") throw new ApiError("Offer is no longer pending");

    const status = action === "accept" ? "ACCEPTED" : "REJECTED";
    const updated = await prisma.offer.update({ where: { id: offerId }, data: { status } });

    await prisma.notification.create({
      data: {
        userId: offer.buyerId,
        type: action === "accept" ? "OFFER_ACCEPTED" : "OFFER_REJECTED",
        title: action === "accept" ? "Your offer was accepted!" : "Your offer was rejected",
        content: action === "accept"
          ? `The seller accepted your offer of ${offer.amount} on "${offer.listing.title}".`
          : `The seller rejected your offer on "${offer.listing.title}".`,
        metadata: { offerId, listingId: offer.listingId },
      },
    });

    return Response.json(updated);
  } catch (err) {
    return handleError(err);
  }
}
