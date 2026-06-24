import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { revieweeId, listingId, rating, comment } = await req.json();

    if (rating < 1 || rating > 5)
      throw new ApiError("Rating must be between 1 and 5");
    if (user.sub === revieweeId)
      throw new ApiError("You cannot review yourself", 403);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new ApiError("Listing not found", 404);
    if (listing.sellerId !== revieweeId)
      throw new ApiError("Reviewee is not the seller of this listing");

    const existing = await prisma.review.findUnique({
      where: { reviewerId_listingId: { reviewerId: user.sub, listingId } },
    });
    if (existing)
      throw new ApiError("You have already reviewed this listing", 409);

    const review = await prisma.review.create({
      data: { reviewerId: user.sub, revieweeId, listingId, rating, comment },
      include: { reviewer: { include: { profile: true } } },
    });
    return Response.json(review, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
