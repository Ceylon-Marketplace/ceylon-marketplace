import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, "SUPER_ADMIN", "OPERATIONS_MANAGER", "CONTENT_MODERATOR");

    const [
      totalUsers,
      totalListings,
      activeListings,
      totalAuctions,
      liveAuctions,
      pendingReview,
      openReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.auction.count(),
      prisma.auction.count({ where: { status: "LIVE" } }),
      prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.report.count({ where: { status: "PENDING" } }),
    ]);

    return Response.json({
      totalUsers,
      totalListings,
      activeListings,
      totalAuctions,
      liveAuctions,
      pendingReview,
      openReports,
    });
  } catch (err) {
    return handleError(err);
  }
}
