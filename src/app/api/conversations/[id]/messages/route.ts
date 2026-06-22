import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const user = requireAuth(req);
    const q = req.nextUrl.searchParams;
    const page = Number(q.get("page") || 1);
    const limit = Number(q.get("limit") || 50);

    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new ApiError("Conversation not found", 404);
    if (conv.buyerId !== user.sub && conv.sellerId !== user.sub) throw new ApiError("Forbidden", 403);

    await prisma.message.updateMany({
      where: { conversationId, isRead: false, senderId: { not: user.sub } },
      data: { isRead: true },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { sender: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return Response.json(messages);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: conversationId } = await params;
    const user = requireAuth(req);
    const { content, mediaUrl } = await req.json();

    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new ApiError("Conversation not found", 404);
    if (conv.buyerId !== user.sub && conv.sellerId !== user.sub) throw new ApiError("Forbidden", 403);

    const otherId = conv.buyerId === user.sub ? conv.sellerId : conv.buyerId;
    const blocked = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: otherId, blockedId: user.sub } },
    });
    if (blocked) throw new ApiError("You cannot message this user", 403);

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId, senderId: user.sub, content, mediaUrl },
        include: { sender: { include: { profile: true } } },
      }),
      prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    ]);

    await prisma.notification.create({
      data: { userId: otherId, type: "MESSAGE", title: "New message", content: content.slice(0, 80), metadata: { conversationId } },
    });

    return Response.json(message, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
