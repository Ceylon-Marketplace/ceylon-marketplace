import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const jwt = requireAuth(req);
    const user = await prisma.user.findUnique({ where: { id: jwt.sub } });
    if (!user) throw new ApiError("User not found", 404);
    if (user.role !== "USER")
      throw new ApiError("Only buyer accounts can upgrade to seller");
    const updated = await prisma.user.update({
      where: { id: jwt.sub },
      data: { role: "SELLER" },
      include: { profile: true },
    });
    const { passwordHash: _, ...safe } = updated;
    return Response.json(safe);
  } catch (err) {
    return handleError(err);
  }
}
