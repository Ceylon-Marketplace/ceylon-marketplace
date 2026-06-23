import { NextRequest } from "next/server";
import type { ListingCondition, ListingStatus, ListingType, MediaType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

type ListingMediaInput = { url: string; type: MediaType; order: number };
type ListingAttributeInput = { attributeId: string; value: string };
type CreateListingDto = {
  title: string;
  description: string;
  categoryId: string;
  condition: ListingCondition;
  price: number;
  quantity?: number;
  location: string;
  listingType?: ListingType;
  status?: ListingStatus;
  media?: ListingMediaInput[];
  attributes?: ListingAttributeInput[];
};

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams;
    const page = Number(q.get("page") || 1);
    const limit = Math.min(Number(q.get("limit") || 24), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: "ACTIVE",
    };
    const keyword = q.get("keyword");
    const categoryId = q.get("categoryId");
    const sellerId = q.get("sellerId");
    const location = q.get("location");
    const condition = q.get("condition");
    const listingType = q.get("listingType");
    const minPrice = q.get("minPrice");
    const maxPrice = q.get("maxPrice");

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (sellerId) where.sellerId = sellerId;
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (condition) where.condition = condition as ListingCondition;
    if (listingType) where.listingType = listingType as ListingType;
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      };
    }

    const sortBy = q.get("sortBy");
    const orderBy =
      sortBy === "price_asc" ? [{ price: "asc" as const }]
      : sortBy === "price_desc" ? [{ price: "desc" as const }]
      : sortBy === "oldest" ? [{ createdAt: "asc" as const }]
      : sortBy === "most_viewed" ? [{ viewCount: "desc" as const }]
      : [{ isFeatured: "desc" as const }, { createdAt: "desc" as const }];

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          media: { orderBy: { order: "asc" }, take: 1 },
          category: true,
          seller: { include: { profile: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return Response.json({ listings, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const dto = (await req.json()) as CreateListingDto;

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) throw new ApiError("User not found", 404);
    if (dbUser.role !== "SELLER" && dbUser.role !== "BUSINESS_SELLER")
      throw new ApiError("Only sellers can create listings", 403);

    const existing = await prisma.listing.findFirst({
      where: { sellerId: user.sub, title: { equals: dto.title, mode: "insensitive" }, status: { notIn: ["ARCHIVED", "SOLD"] } },
    });
    if (existing) throw new ApiError("A listing with this title already exists");

    const listing = await prisma.listing.create({
      data: {
        sellerId: user.sub,
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        condition: dto.condition,
        price: dto.price,
        quantity: dto.quantity ?? 1,
        location: dto.location,
        listingType: dto.listingType ?? "FIXED_PRICE",
        status: dto.status ?? "PENDING_REVIEW",
        media: dto.media ? { create: dto.media.map((m) => ({ url: m.url, type: m.type, order: m.order })) } : undefined,
        attributeValues: dto.attributes ? { create: dto.attributes.map((a) => ({ attributeId: a.attributeId, value: a.value })) } : undefined,
      },
      include: {
        media: { orderBy: { order: "asc" } },
        category: true,
        attributeValues: { include: { attribute: true } },
      },
    });
    return Response.json(listing, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
