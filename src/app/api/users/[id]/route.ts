import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ApiError } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id, isActive: true },
      include: {
        profile: true,
        storefront: true,
        reviewsReceived: {
          include: { reviewer: { include: { profile: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            listings: { where: { status: "ACTIVE" } },
            reviewsReceived: true,
          },
        },
      },
    });
    if (!user) throw new ApiError("User not found", 404);
    const { passwordHash: _, email: __, ...safeUser } = user;
    return Response.json(safeUser);
  } catch (err) {
    return handleError(err);
  }
}
