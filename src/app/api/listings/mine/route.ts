import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const status = req.nextUrl.searchParams.get("status") as any;
    const listings = await prisma.listing.findMany({
      where: { sellerId: user.sub, ...(status && { status }) },
      include: {
        media: { orderBy: { order: "asc" }, take: 1 },
        category: true,
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(listings);
  } catch (err) {
    return handleError(err);
  }
}
