import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: offerId } = await params;
    const user = requireAuth(req);
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) throw new ApiError("Offer not found", 404);
    if (offer.buyerId !== user.sub)
      throw new ApiError("You can only withdraw your own offers", 403);
    if (offer.status !== "PENDING")
      throw new ApiError("Offer is no longer pending");
    return Response.json(
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: "WITHDRAWN" },
      }),
    );
  } catch (err) {
    return handleError(err);
  }
}
