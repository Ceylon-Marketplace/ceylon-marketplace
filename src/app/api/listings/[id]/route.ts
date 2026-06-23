import { NextRequest } from "next/server";
import type { ListingCondition, ListingType, MediaType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, getAuthUser, handleError, ApiError } from "@/lib/auth";

type ListingMediaInput = { url: string; type: MediaType; order: number };
type ListingAttributeInput = { attributeId: string; value: string };
type UpdateListingDto = {
  title?: string;
  description?: string;
  price?: number;
  quantity?: number;
  location?: string;
  condition?: ListingCondition;
  listingType?: ListingType;
  mediaToAdd?: ListingMediaInput[];
  mediaToRemove?: string[];
  attributes?: ListingAttributeInput[];
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const jwtUser = getAuthUser(req);
    const userId = jwtUser?.sub;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        media: { orderBy: { order: "asc" } },
        category: { include: { parent: true, attributes: true } },
        seller: { include: { profile: true, storefront: true } },
        auction: true,
        attributeValues: { include: { attribute: true } },
      },
    });
    if (!listing) throw new ApiError("Listing not found", 404);
    if (listing.status !== "ACTIVE" && listing.sellerId !== userId)
      throw new ApiError("Listing not found", 404);

    await prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    let isSaved = false;
    if (userId) {
      const saved = await prisma.savedListing.findUnique({
        where: { userId_listingId: { userId, listingId: id } },
      });
      isSaved = !!saved;
    }

    return Response.json({ ...listing, isSaved });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = requireAuth(req);
    const body = (await req.json()) as UpdateListingDto;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new ApiError("Listing not found", 404);
    if (listing.sellerId !== user.sub) throw new ApiError("Forbidden", 403);
    if (listing.status === "SOLD" || listing.status === "ARCHIVED")
      throw new ApiError("Cannot edit a sold or archived listing", 403);

    if (body.mediaToRemove?.length) {
      await prisma.listingMedia.deleteMany({ where: { id: { in: body.mediaToRemove }, listingId: id } });
    }
    if (body.attributes !== undefined) {
      await prisma.listingAttributeValue.deleteMany({ where: { listingId: id } });
    }

    // Any edit to an approved listing requires re-approval
    const needsReview = listing.status === "ACTIVE";

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.location && { location: body.location }),
        ...(body.condition && { condition: body.condition }),
        ...(body.listingType && { listingType: body.listingType }),
        ...(needsReview && { status: "PENDING_REVIEW" }),
        media: body.mediaToAdd?.length ? { create: body.mediaToAdd.map((m) => ({ url: m.url, type: m.type, order: m.order })) } : undefined,
        attributeValues: body.attributes?.length ? { create: body.attributes.map((a) => ({ attributeId: a.attributeId, value: a.value })) } : undefined,
      },
      include: { media: { orderBy: { order: "asc" } }, category: true, attributeValues: { include: { attribute: true } } },
    });
    return Response.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = requireAuth(req);

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new ApiError("Listing not found", 404);
    if (listing.sellerId !== user.sub) throw new ApiError("Forbidden", 403);

    const updated = await prisma.listing.update({ where: { id }, data: { status: "ARCHIVED" } });
    return Response.json(updated);
  } catch (err) {
    return handleError(err);
  }
}
