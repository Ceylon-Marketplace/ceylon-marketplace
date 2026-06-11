import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateListingDto } from "./dto/create-listing.dto";
import { ListingStatus } from "@prisma/client";

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async create(sellerId: string, dto: CreateListingDto) {
    await this.checkCanCreateListing(sellerId);
    await this.checkDuplicate(sellerId, dto.title);

    const mediaCount =
      (dto.media?.filter((m) => m.type === "IMAGE").length ?? 0) +
      (dto.media?.filter((m) => m.type === "VIDEO").length ?? 0);
    const imageCount = dto.media?.filter((m) => m.type === "IMAGE").length ?? 0;
    const videoCount = dto.media?.filter((m) => m.type === "VIDEO").length ?? 0;

    if (imageCount > 20)
      throw new BadRequestException("Maximum 20 images allowed");
    if (videoCount > 3)
      throw new BadRequestException("Maximum 3 videos allowed");

    return this.prisma.listing.create({
      data: {
        sellerId,
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        condition: dto.condition,
        price: dto.price,
        quantity: dto.quantity ?? 1,
        location: dto.location,
        listingType: dto.listingType ?? "FIXED_PRICE",
        status: "PENDING_REVIEW",
        media: dto.media
          ? {
              create: dto.media.map((m) => ({
                url: m.url,
                type: m.type,
                order: m.order,
              })),
            }
          : undefined,
      },
      include: { media: true, category: true },
    });
  }

  async search(params: {
    keyword?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    condition?: string;
    listingType?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      status: "ACTIVE",
      ...(params.keyword && {
        OR: [
          { title: { contains: params.keyword, mode: "insensitive" } },
          { description: { contains: params.keyword, mode: "insensitive" } },
        ],
      }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.minPrice !== undefined && {
        price: { gte: params.minPrice },
      }),
      ...(params.maxPrice !== undefined && {
        price: { lte: params.maxPrice },
      }),
      ...(params.location && {
        location: { contains: params.location, mode: "insensitive" },
      }),
      ...(params.condition && { condition: params.condition }),
      ...(params.listingType && { listingType: params.listingType }),
    };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          media: { orderBy: { order: "asc" }, take: 1 },
          category: true,
          seller: { include: { profile: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { listings, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(id: string, userId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        media: { orderBy: { order: "asc" } },
        category: { include: { parent: true } },
        seller: { include: { profile: true, storefront: true } },
        auction: true,
      },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    if (listing.status !== "ACTIVE" && listing.sellerId !== userId)
      throw new NotFoundException("Listing not found");

    // Increment view count
    await this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return listing;
  }

  async update(id: string, sellerId: string, data: Partial<CreateListingDto>) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.sellerId !== sellerId) throw new ForbiddenException();

    if (listing.status === "ACTIVE" || listing.status === "SOLD")
      throw new ForbiddenException("Cannot edit an active or sold listing");

    if (data.title && (data.title.length < 10 || data.title.length > 120))
      throw new BadRequestException("Title must be 10-120 characters");

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.location && { location: data.location }),
        ...(data.condition && { condition: data.condition }),
        status: "PENDING_REVIEW",
      },
    });
  }

  async delete(id: string, sellerId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.sellerId !== sellerId) throw new ForbiddenException();

    return this.prisma.listing.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }

  async saveListing(userId: string, listingId: string) {
    await this.prisma.savedListing.upsert({
      where: { userId_listingId: { userId, listingId } },
      update: {},
      create: { userId, listingId },
    });
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { saveCount: { increment: 1 } },
    });
    return { saved: true };
  }

  async unsaveListing(userId: string, listingId: string) {
    await this.prisma.savedListing.deleteMany({ where: { userId, listingId } });
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { saveCount: { decrement: 1 } },
    });
    return { saved: false };
  }

  async getSavedListings(userId: string) {
    return this.prisma.savedListing.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            media: { orderBy: { order: "asc" }, take: 1 },
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getMyListings(sellerId: string, status?: ListingStatus) {
    return this.prisma.listing.findMany({
      where: { sellerId, ...(status && { status }) },
      include: { media: { take: 1 }, category: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: { where: { isActive: true }, include: { attributes: true } },
        attributes: true,
      },
    });
  }

  private async checkCanCreateListing(sellerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { subscription: { include: { plan: true } } },
    });

    if (!user) throw new NotFoundException("User not found");

    if (user.role !== "SELLER" && user.role !== "BUSINESS_SELLER") {
      throw new ForbiddenException(
        "Only sellers can create listings. Please upgrade your account.",
      );
    }

    if (!user.subscription) {
      throw new ForbiddenException(
        "An active subscription is required to create listings.",
      );
    }

    if (
      user.subscription.status !== "ACTIVE" &&
      user.subscription.status !== "GRACE_PERIOD"
    ) {
      throw new ForbiddenException(
        "Your subscription has expired. Renew to create new listings.",
      );
    }

    if (user.subscription.status === "GRACE_PERIOD") {
      throw new ForbiddenException(
        "Subscription expired. Existing listings remain active during grace period but you cannot create new ones.",
      );
    }

    // Check listing count against plan limit
    const activeCount = await this.prisma.listing.count({
      where: {
        sellerId,
        status: { in: ["ACTIVE", "PENDING_REVIEW", "APPROVED"] },
      },
    });

    if (activeCount >= user.subscription.plan.maxListings) {
      throw new ForbiddenException(
        `Your plan allows a maximum of ${user.subscription.plan.maxListings} active listings.`,
      );
    }
  }

  private async checkDuplicate(sellerId: string, title: string) {
    const existing = await this.prisma.listing.findFirst({
      where: {
        sellerId,
        title: { equals: title, mode: "insensitive" },
        status: { notIn: ["ARCHIVED", "SOLD"] },
      },
    });
    if (existing)
      throw new BadRequestException(
        "A listing with this title already exists.",
      );
  }
}
