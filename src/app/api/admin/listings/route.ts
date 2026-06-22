import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, "SUPER_ADMIN", "OPERATIONS_MANAGER", "CONTENT_MODERATOR");

    const q = req.nextUrl.searchParams;
    const page = Number(q.get("page") || 1);
    const limit = Number(q.get("limit") || 20);

    const listings = await prisma.listing.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        media: { take: 3 },
        category: true,
        seller: { include: { profile: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return Response.json(listings);
  } catch (err) {
    return handleError(err);
  }
}
