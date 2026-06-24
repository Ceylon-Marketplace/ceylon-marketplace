import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ApiError } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const q = req.nextUrl.searchParams;
    const page = Number(q.get("page") || 1);
    const limit = Number(q.get("limit") || 24);

    const sf = await prisma.storefront.findUnique({
      where: { slug, isActive: true },
      include: { seller: { include: { profile: true } } },
    });
    if (!sf) throw new ApiError("Storefront not found", 404);

    const [listings, total, avgRating] = await Promise.all([
      prisma.listing.findMany({
        where: { sellerId: sf.sellerId, status: "ACTIVE" },
        include: {
          media: { orderBy: { order: "asc" }, take: 1 },
          category: true,
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({
        where: { sellerId: sf.sellerId, status: "ACTIVE" },
      }),
      prisma.review.aggregate({
        where: { revieweeId: sf.sellerId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return Response.json({
      storefront: sf,
      listings,
      total,
      page,
      limit,
      avgRating: avgRating._avg.rating,
      reviewCount: avgRating._count,
    });
  } catch (err) {
    return handleError(err);
  }
}
