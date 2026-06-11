import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const ANTI_SNIPE_EXTENSION_MS = 2 * 60 * 1000;

@Injectable()
export class AuctionsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(
    sellerId: string,
    data: {
      listingId: string;
      startPrice: number;
      reservePrice?: number;
      bidIncrement?: number;
      startTime: Date;
      endTime: Date;
    },
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: data.listingId },
      include: { auction: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.sellerId !== sellerId) throw new ForbiddenException();
    if (listing.auction)
      throw new BadRequestException("Auction already exists for this listing");

    return this.prisma.auction.create({
      data: {
        listingId: data.listingId,
        sellerId,
        startPrice: data.startPrice,
        currentPrice: data.startPrice,
        reservePrice: data.reservePrice,
        bidIncrement: data.bidIncrement ?? 1,
        startTime: data.startTime,
        endTime: data.endTime,
        status: "SCHEDULED",
      },
      include: { listing: { include: { media: { take: 1 } } } },
    });
  }

  async findActive(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const [auctions, total] = await Promise.all([
      this.prisma.auction.findMany({
        where: { status: { in: ["LIVE", "SCHEDULED"] } },
        include: {
          listing: {
            include: {
              media: { orderBy: { order: "asc" }, take: 1 },
              category: true,
            },
          },
          _count: { select: { bids: true } },
        },
        orderBy: { endTime: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auction.count({
        where: { status: { in: ["LIVE", "SCHEDULED"] } },
      }),
    ]);

    return { auctions, total, page, limit };
  }

  async findById(id: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            media: { orderBy: { order: "asc" } },
            category: true,
            seller: { include: { profile: true } },
          },
        },
        bids: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            bidder: {
              select: {
                id: true,
                profile: { select: { firstName: true } },
              },
            },
          },
        },
      },
    });
    if (!auction) throw new NotFoundException("Auction not found");

    // Mask bidder names: show only first 2 chars + ***
    return {
      ...auction,
      bids: auction.bids.map((bid) => ({
        ...bid,
        bidder: {
          id: bid.bidder.id,
          maskedName:
            (bid.bidder.profile?.firstName?.slice(0, 2) ?? "??") + "***",
        },
      })),
    };
  }

  async placeBid(
    auctionId: string,
    bidderId: string,
    amount: number,
  ): Promise<{
    auction: any;
    bid: any;
    extended: boolean;
  }> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!auction) throw new NotFoundException("Auction not found");
    if (auction.status !== "LIVE")
      throw new BadRequestException("Auction is not live");
    if (auction.sellerId === bidderId)
      throw new ForbiddenException("Sellers cannot bid on their own auction");

    const now = new Date();
    if (now >= auction.endTime)
      throw new BadRequestException("Auction has already ended");

    const minBid =
      Number(auction.currentPrice) + Number(auction.bidIncrement);
    if (amount < minBid)
      throw new BadRequestException(
        `Minimum bid is ${minBid}. Current price: ${auction.currentPrice}`,
      );

    // Anti-sniping: extend end time if bid placed in last 2 minutes
    const timeLeft = auction.endTime.getTime() - now.getTime();
    const extended = timeLeft <= ANTI_SNIPE_WINDOW_MS;
    const newEndTime = extended
      ? new Date(auction.endTime.getTime() + ANTI_SNIPE_EXTENSION_MS)
      : auction.endTime;

    const previousHighBidderId = auction.bids[0]?.bidderId;

    const [bid, updatedAuction] = await this.prisma.$transaction([
      this.prisma.bid.create({
        data: { auctionId, bidderId, amount },
      }),
      this.prisma.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: amount,
          bidCount: { increment: 1 },
          ...(extended && { endTime: newEndTime }),
        },
      }),
    ]);

    // Notify previous high bidder they were outbid
    if (previousHighBidderId && previousHighBidderId !== bidderId) {
      await this.notifications.create({
        userId: previousHighBidderId,
        type: "OUTBID",
        title: "You've been outbid!",
        content: `Someone placed a higher bid of ${amount} on an auction you were winning.`,
        metadata: { auctionId },
      });
    }

    return { auction: updatedAuction, bid, extended };
  }

  async closeAuction(auctionId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: { orderBy: { amount: "desc" }, take: 1 },
      },
    });
    if (!auction) throw new NotFoundException("Auction not found");

    const highestBid = auction.bids[0];
    const winnerId = highestBid?.bidderId ?? null;

    const reserveMet =
      !auction.reservePrice ||
      (highestBid && Number(highestBid.amount) >= Number(auction.reservePrice));

    const status = winnerId && reserveMet ? "COMPLETED" : "ENDED";

    const updated = await this.prisma.auction.update({
      where: { id: auctionId },
      data: { status, winnerId: reserveMet ? winnerId : null },
    });

    if (winnerId && reserveMet) {
      await this.notifications.create({
        userId: winnerId,
        type: "AUCTION_WON",
        title: "You won the auction!",
        content: `Congratulations! You won the auction with a bid of ${highestBid.amount}.`,
        metadata: { auctionId },
      });

      await this.notifications.create({
        userId: auction.sellerId,
        type: "AUCTION_WON",
        title: "Your auction ended",
        content: `Your auction ended. Winning bid: ${highestBid.amount}.`,
        metadata: { auctionId },
      });
    }

    return updated;
  }
}
