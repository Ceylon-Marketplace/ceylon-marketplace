import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const jwt = requireAuth(req);
    const user = await prisma.user.findUnique({
      where: { id: jwt.sub },
      include: {
        profile: true,
        subscription: { include: { plan: true } },
        storefront: true,
      },
    });
    if (!user) return Response.json({ message: "Not found" }, { status: 404 });
    const { passwordHash: _, ...safeUser } = user;
    return Response.json(safeUser);
  } catch (err) {
    return handleError(err);
  }
}
