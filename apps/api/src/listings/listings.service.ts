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
    await this.checkCanCreateListing(sellerId, dto.status === "DRAFT");
    await this.checkDuplicate(sellerId, dto.title);

    const imageCount = dto.media?.filter((m) => m.type === "IMAGE").length ?? 0;
    const videoCount = dto.media?.filter((m) => m.type === "VIDEO").length ?? 0;
    if (imageCount > 20) throw new BadRequestException("Maximum 20 images allowed");
    if (videoCount > 3) throw new BadRequestException("Maximum 3 videos allowed");

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
        status: dto.status ?? "PENDING_REVIEW",
        media: dto.media
          ? { create: dto.media.map((m) => ({ url: m.url, type: m.type, order: m.order })) }
          : undefined,
        attributeValues: dto.attributes
          ? { create: dto.attributes.map((a) => ({ attributeId: a.attributeId, value: a.value })) }
          : undefined,
      },
      include: {
        media: { orderBy: { order: "asc" } },
        category: true,
        attributeValues: { include: { attribute: true } },
      },
    });
  }

  async search(params: {
    keyword?: string;
    categoryId?: string;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    condition?: string;
    listingType?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 24 } = params;
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
      ...(params.sellerId && { sellerId: params.sellerId }),
      ...(params.minPrice !== undefined && { price: { gte: params.minPrice } }),
      ...(params.maxPrice !== undefined && { price: { lte: params.maxPrice } }),
      ...(params.minPrice !== undefined && params.maxPrice !== undefined && {
        price: { gte: params.minPrice, lte: params.maxPrice },
      }),
      ...(params.location && {
        location: { contains: params.location, mode: "insensitive" },
      }),
      ...(params.condition && { condition: params.condition }),
      ...(params.listingType && { listingType: params.listingType }),
    };

    const orderBy = this.buildOrderBy(params.sortBy);

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          media: { orderBy: { order: "asc" }, take: 1 },
          category: true,
          seller: { include: { profile: true } },
        },
        orderBy,
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
        category: { include: { parent: true, attributes: true } },
        seller: { include: { profile: true, storefront: true } },
        auction: true,
        attributeValues: { include: { attribute: true } },
      },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    if (listing.status !== "ACTIVE" && listing.sellerId !== userId)
      throw new NotFoundException("Listing not found");

    await this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    let isSaved = false;
    if (userId) {
      const saved = await this.prisma.savedListing.findUnique({
        where: { userId_listingId: { userId, listingId: id } },
      });
      isSaved = !!saved;
    }

    return { ...listing, isSaved };
  }

  async update(
    id: string,
    sellerId: string,
    data: Partial<CreateListingDto> & {
      mediaToAdd?: { url: string; type: "IMAGE" | "VIDEO"; order: number }[];
      mediaToRemove?: string[];
    },
  ) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.sellerId !== sellerId) throw new ForbiddenException();
    if (listing.status === "SOLD" || listing.status === "ARCHIVED")
      throw new ForbiddenException("Cannot edit a sold or archived listing");

    if (data.title && (data.title.length < 10 || data.title.length > 120))
      throw new BadRequestException("Title must be 10–120 characters");

    // Handle media removals
    if (data.mediaToRemove?.length) {
      await this.prisma.listingMedia.deleteMany({
        where: { id: { in: data.mediaToRemove }, listingId: id },
      });
    }

    // Handle attribute updates: delete existing and recreate
    if (data.attributes !== undefined) {
      await this.prisma.listingAttributeValue.deleteMany({ where: { listingId: id } });
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.location && { location: data.location }),
        ...(data.condition && { condition: data.condition }),
        ...(data.listingType && { listingType: data.listingType }),
        status: "PENDING_REVIEW",
        media: data.mediaToAdd?.length
          ? { create: data.mediaToAdd.map((m) => ({ url: m.url, type: m.type, order: m.order })) }
          : undefined,
        attributeValues: data.attributes?.length
          ? { create: data.attributes.map((a) => ({ attributeId: a.attributeId, value: a.value })) }
          : undefined,
      },
      include: {
        media: { orderBy: { order: "asc" } },
        category: true,
        attributeValues: { include: { attribute: true } },
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
            seller: { include: { profile: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getMyListings(sellerId: string, status?: ListingStatus) {
    return this.prisma.listing.findMany({
      where: { sellerId, ...(status && { status }) },
      include: {
        media: { orderBy: { order: "asc" }, take: 1 },
        category: true,
        _count: { select: { offers: true } },
      },
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

  private buildOrderBy(sortBy?: string) {
    switch (sortBy) {
      case "price_asc":
        return [{ price: "asc" as const }];
      case "price_desc":
        return [{ price: "desc" as const }];
      case "oldest":
        return [{ createdAt: "asc" as const }];
      case "most_viewed":
        return [{ viewCount: "desc" as const }];
      default:
        return [{ isFeatured: "desc" as const }, { createdAt: "desc" as const }];
    }
  }

  private async checkCanCreateListing(sellerId: string, isDraft = false) {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: { subscription: { include: { plan: true } } },
    });
    if (!user) throw new NotFoundException("User not found");

    if (user.role !== "SELLER" && user.role !== "BUSINESS_SELLER")
      throw new ForbiddenException("Only sellers can create listings. Please upgrade your account.");

    if (!user.subscription)
      throw new ForbiddenException("An active subscription is required to create listings.");

    if (user.subscription.status !== "ACTIVE" && user.subscription.status !== "GRACE_PERIOD")
      throw new ForbiddenException("Your subscription has expired. Renew to create new listings.");

    if (user.subscription.status === "GRACE_PERIOD")
      throw new ForbiddenException("Subscription expired. Renew to create new listings.");

    if (!isDraft) {
      const activeCount = await this.prisma.listing.count({
        where: { sellerId, status: { in: ["ACTIVE", "PENDING_REVIEW", "APPROVED"] } },
      });
      if (activeCount >= user.subscription.plan.maxListings)
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
    if (existing) throw new BadRequestException("A listing with this title already exists.");
  }
}
