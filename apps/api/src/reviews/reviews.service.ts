import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(
    reviewerId: string,
    data: {
      revieweeId: string;
      listingId: string;
      rating: number;
      comment?: string;
    },
  ) {
    if (data.rating < 1 || data.rating > 5)
      throw new BadRequestException("Rating must be between 1 and 5");
    if (reviewerId === data.revieweeId)
      throw new ForbiddenException("You cannot review yourself");

    const listing = await this.prisma.listing.findUnique({
      where: { id: data.listingId },
    });
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.sellerId !== data.revieweeId)
      throw new BadRequestException("Reviewee is not the seller of this listing");

    const existing = await this.prisma.review.findUnique({
      where: {
        reviewerId_listingId: {
          reviewerId,
          listingId: data.listingId,
        },
      },
    });
    if (existing)
      throw new ConflictException("You have already reviewed this listing");

    return this.prisma.review.create({
      data: {
        reviewerId,
        revieweeId: data.revieweeId,
        listingId: data.listingId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        reviewer: { include: { profile: true } },
      },
    });
  }

  async findByUser(userId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { revieweeId: userId },
        include: {
          reviewer: { include: { profile: true } },
          listing: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where: { revieweeId: userId } }),
    ]);

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    return { reviews, total, page, limit, avgRating };
  }
}
