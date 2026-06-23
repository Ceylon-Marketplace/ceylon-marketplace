import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const q = req.nextUrl.searchParams;
    const page = Number(q.get("page") || 1);
    const limit = Number(q.get("limit") || 20);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.sub },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.sub } }),
      prisma.notification.count({ where: { userId: user.sub, isRead: false } }),
    ]);
    return Response.json({ notifications, total, unreadCount, page, limit });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { id } = await req.json().catch(() => ({}));
    if (id) {
      await prisma.notification.updateMany({ where: { id, userId: user.sub }, data: { isRead: true } });
    } else {
      await prisma.notification.updateMany({ where: { userId: user.sub, isRead: false }, data: { isRead: true } });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
