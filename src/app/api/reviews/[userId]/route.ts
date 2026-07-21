import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const q = req.nextUrl.searchParams;
    const page = Number(q.get("page") || 1);
    const limit = Number(q.get("limit") || 20);

    const [reviews, total, ratingAggregate] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId },
        include: {
          reviewer: { include: { profile: true } },
          listing: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { revieweeId: userId } }),
      prisma.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
      }),
    ]);

    const avgRating = ratingAggregate._avg.rating;
    return Response.json({ reviews, total, page, limit, avgRating });
  } catch (err) {
    return handleError(err);
  }
}
