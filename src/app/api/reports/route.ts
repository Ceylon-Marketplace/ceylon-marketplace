import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(
      user,
      "SUPER_ADMIN",
      "OPERATIONS_MANAGER",
      "CONTENT_MODERATOR",
      "SUPPORT_AGENT",
    );

    const q = req.nextUrl.searchParams;
    const status = q.get("status") ?? undefined;
    const page = Number(q.get("page") || 1);
    const limit = Math.min(Number(q.get("limit") || 20), 100);

    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            include: {
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return Response.json({ reports, total, page, limit });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { targetType, targetId, reason, description, listingId } =
      await req.json();

    const report = await prisma.report.create({
      data: {
        reporterId: user.sub,
        targetType,
        targetId,
        reason,
        description,
        listingId,
      },
    });

    return Response.json(report, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
