import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class MessagingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getOrCreateConversation(
    buyerId: string,
    listingId: string,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.sellerId === buyerId)
      throw new ForbiddenException("Cannot message yourself");

    return this.prisma.conversation.upsert({
      where: { listingId_buyerId: { listingId, buyerId } },
      update: {},
      create: {
        listingId,
        buyerId,
        sellerId: listing.sellerId,
      },
      include: {
        listing: { include: { media: { take: 1 } } },
        buyer: { include: { profile: true } },
        seller: { include: { profile: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        listing: { include: { media: { take: 1 } } },
        buyer: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        seller: { include: { profile: { select: { firstName: true, lastName: true, avatar: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getMessages(
    conversationId: string,
    userId: string,
    params: { page?: number; limit?: number },
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (
      conversation.buyerId !== userId &&
      conversation.sellerId !== userId
    ) {
      throw new ForbiddenException("Access denied");
    }

    // Mark messages as read
    await this.prisma.message.updateMany({
      where: { conversationId, isRead: false, senderId: { not: userId } },
      data: { isRead: true },
    });

    const { page = 1, limit = 50 } = params;
    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          include: {
            profile: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    mediaUrl?: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (
      conversation.buyerId !== senderId &&
      conversation.sellerId !== senderId
    ) {
      throw new ForbiddenException("Access denied");
    }

    // Check if sender is blocked by the other party
    const otherId =
      conversation.buyerId === senderId
        ? conversation.sellerId
        : conversation.buyerId;

    const blocked = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: otherId, blockedId: senderId } },
    });
    if (blocked) throw new ForbiddenException("You cannot message this user");

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId, content, mediaUrl },
        include: {
          sender: { include: { profile: true } },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Notify recipient
    await this.notifications.create({
      userId: otherId,
      type: "MESSAGE",
      title: "New message",
      content: content.slice(0, 80),
      metadata: { conversationId },
    });

    return message;
  }
}
