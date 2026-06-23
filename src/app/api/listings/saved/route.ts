import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const saved = await prisma.savedListing.findMany({
      where: { userId: user.sub },
      include: {
        listing: {
          include: {
            media: { orderBy: { order: "asc" }, take: 1 },
            category: true,
            seller: { include: { profile: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(saved);
  } catch (err) {
    return handleError(err);
  }
}
