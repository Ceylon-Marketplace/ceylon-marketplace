import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, "SUPER_ADMIN", "OPERATIONS_MANAGER");

    const q = req.nextUrl.searchParams;
    const page = Number(q.get("page") || 1);
    const limit = Number(q.get("limit") || 20);
    const search = q.get("search");
    const role = q.get("role");

    const where: any = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          {
            profile: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
      ...(role && { role }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          subscription: { include: { plan: true } },
          _count: { select: { listings: true, bids: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const safeUsers = users.map(({ passwordHash: _, ...u }) => u);
    return Response.json({ users: safeUsers, total, page, limit });
  } catch (err) {
    return handleError(err);
  }
}
