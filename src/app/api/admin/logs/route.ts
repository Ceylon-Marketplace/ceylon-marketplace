import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, "SUPER_ADMIN", "OPERATIONS_MANAGER");

    const q = req.nextUrl.searchParams;
    const page = Number(q.get("page") || 1);
    const limit = Number(q.get("limit") || 50);

    const logs = await prisma.auditLog.findMany({
      include: { admin: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return Response.json(logs);
  } catch (err) {
    return handleError(err);
  }
}
