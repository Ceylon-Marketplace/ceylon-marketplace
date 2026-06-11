import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StorefrontService {
  constructor(private prisma: PrismaService) {}

  async create(
    sellerId: string,
    data: {
      name: string;
      description?: string;
      logo?: string;
      banner?: string;
      slug: string;
    },
  ) {
    const existing = await this.prisma.storefront.findFirst({
      where: { sellerId },
    });
    if (existing)
      throw new ConflictException("You already have a storefront");

    const slugTaken = await this.prisma.storefront.findUnique({
      where: { slug: data.slug },
    });
    if (slugTaken)
      throw new ConflictException("This slug is already taken");

    return this.prisma.storefront.create({
      data: { ...data, sellerId, isActive: true },
    });
  }

  async update(
    sellerId: string,
    data: {
      name?: string;
      description?: string;
      logo?: string;
      banner?: string;
    },
  ) {
    const storefront = await this.prisma.storefront.findFirst({
      where: { sellerId },
    });
    if (!storefront)
      throw new NotFoundException("Storefront not found");

    return this.prisma.storefront.update({
      where: { id: storefront.id },
      data,
    });
  }

  async getMine(sellerId: string) {
    const storefront = await this.prisma.storefront.findFirst({
      where: { sellerId },
      include: { seller: { include: { profile: true } } },
    });
    return storefront;
  }

  async findBySlug(slug: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 24 } = params;
    const storefront = await this.prisma.storefront.findUnique({
      where: { slug, isActive: true },
      include: { seller: { include: { profile: true } } },
    });
    if (!storefront)
      throw new NotFoundException("Storefront not found");

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: { sellerId: storefront.sellerId, status: "ACTIVE" },
        include: {
          media: { orderBy: { order: "asc" }, take: 1 },
          category: true,
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.listing.count({
        where: { sellerId: storefront.sellerId, status: "ACTIVE" },
      }),
    ]);

    const avgRating = await this.prisma.review.aggregate({
      where: { revieweeId: storefront.sellerId },
      _avg: { rating: true },
      _count: true,
    });

    return {
      storefront,
      listings,
      total,
      page,
      limit,
      avgRating: avgRating._avg.rating,
      reviewCount: avgRating._count,
    };
  }
}
