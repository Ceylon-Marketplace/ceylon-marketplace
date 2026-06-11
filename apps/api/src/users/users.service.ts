import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        storefront: true,
        _count: {
          select: {
            listings: { where: { status: "ACTIVE" } },
            reviewsReceived: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      phone?: string;
      location?: string;
      avatar?: string;
    },
  ) {
    return this.prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
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
    if (!user) throw new NotFoundException("User not found");
    const { passwordHash: _, email: __, ...safeUser } = user;
    return safeUser;
  }

  async blockUser(blockerId: string, blockedId: string) {
    return this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    return this.prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
  }
}
