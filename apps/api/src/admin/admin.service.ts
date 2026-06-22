import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ListingStatus } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalListings,
      activeListings,
      totalAuctions,
      liveAuctions,
      pendingReview,
      openReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: "ACTIVE" } }),
      this.prisma.auction.count(),
      this.prisma.auction.count({ where: { status: "LIVE" } }),
      this.prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
      this.prisma.report.count({ where: { status: "PENDING" } }),
    ]);

    return {
      totalUsers,
      totalListings,
      activeListings,
      totalAuctions,
      liveAuctions,
      pendingReview,
      openReports,
    };
  }

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const { page = 1, limit = 20 } = params;
    const where: any = {
      ...(params.search && {
        OR: [
          { email: { contains: params.search, mode: "insensitive" } },
          {
            profile: {
              OR: [
                { firstName: { contains: params.search, mode: "insensitive" } },
                { lastName: { contains: params.search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
      ...(params.role && { role: params.role }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
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
      this.prisma.user.count({ where }),
    ]);

    const safeUsers = users.map(({ passwordHash: _, ...u }) => u);
    return { users: safeUsers, total, page, limit };
  }

  async moderateListing(
    listingId: string,
    action: "approve" | "reject",
    adminId: string,
    reason?: string,
  ) {
    const status: ListingStatus =
      action === "approve" ? "ACTIVE" : "REJECTED";

    const listing = await this.prisma.listing.update({
      where: { id: listingId },
      data: { status, ...(reason && { rejectionReason: reason }) },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: `listing_${action}`,
        targetType: "Listing",
        targetId: listingId,
        details: { reason },
      },
    });

    // Notify the seller
    await this.notifications.create({
      userId: listing.sellerId,
      type: action === "approve" ? "LISTING_APPROVED" : "LISTING_REJECTED",
      title: action === "approve" ? "Listing approved!" : "Listing rejected",
      content:
        action === "approve"
          ? `Your listing "${listing.title}" has been approved and is now live.`
          : `Your listing "${listing.title}" was rejected${reason ? `: ${reason}` : "."}`,
      metadata: { listingId },
    });

    return listing;
  }

  async suspendUser(userId: string, adminId: string, reason?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: "user_suspended",
        targetType: "User",
        targetId: userId,
        details: { reason },
      },
    });

    return user;
  }

  async reinstateUser(userId: string, adminId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: "user_reinstated",
        targetType: "User",
        targetId: userId,
      },
    });

    return user;
  }

  async getPendingListings(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    return this.prisma.listing.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        media: { take: 3 },
        category: true,
        seller: { include: { profile: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getAuditLogs(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = params;
    return this.prisma.auditLog.findMany({
      include: { admin: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
