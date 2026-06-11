import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class OffersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(
    buyerId: string,
    data: { listingId: string; amount: number; message?: string },
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: data.listingId },
      include: { seller: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");
    if (listing.status !== "ACTIVE")
      throw new BadRequestException("Listing is not active");
    if (listing.listingType !== "OFFER")
      throw new BadRequestException("This listing does not accept offers");
    if (listing.sellerId === buyerId)
      throw new ForbiddenException("You cannot make an offer on your own listing");

    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    const offer = await this.prisma.offer.create({
      data: {
        listingId: data.listingId,
        buyerId,
        amount: data.amount,
        message: data.message,
        expiresAt,
        status: "PENDING",
      },
      include: {
        listing: { include: { media: { take: 1 } } },
        buyer: { include: { profile: true } },
      },
    });

    await this.notifications.create({
      userId: listing.sellerId,
      type: "OFFER_RECEIVED",
      title: "New offer received",
      content: `You received an offer of ${data.amount} on "${listing.title}".`,
      metadata: { offerId: offer.id, listingId: data.listingId },
    });

    return offer;
  }

  async getSentOffers(buyerId: string) {
    return this.prisma.offer.findMany({
      where: { buyerId },
      include: {
        listing: {
          include: {
            media: { take: 1, orderBy: { order: "asc" } },
            seller: { include: { profile: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getReceivedOffers(sellerId: string) {
    return this.prisma.offer.findMany({
      where: { listing: { sellerId } },
      include: {
        listing: { include: { media: { take: 1, orderBy: { order: "asc" } } } },
        buyer: { include: { profile: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async respond(
    offerId: string,
    userId: string,
    action: "accept" | "reject",
  ) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer) throw new NotFoundException("Offer not found");
    if (offer.listing.sellerId !== userId)
      throw new ForbiddenException("Only the seller can respond to this offer");
    if (offer.status !== "PENDING")
      throw new BadRequestException("Offer is no longer pending");

    const status = action === "accept" ? "ACCEPTED" : "REJECTED";
    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: { status },
    });

    const notifType =
      action === "accept" ? "OFFER_ACCEPTED" : "OFFER_REJECTED";
    const notifTitle =
      action === "accept" ? "Your offer was accepted!" : "Your offer was rejected";
    const notifContent =
      action === "accept"
        ? `The seller accepted your offer of ${offer.amount} on "${offer.listing.title}".`
        : `The seller rejected your offer on "${offer.listing.title}".`;

    await this.notifications.create({
      userId: offer.buyerId,
      type: notifType,
      title: notifTitle,
      content: notifContent,
      metadata: { offerId, listingId: offer.listingId },
    });

    return updated;
  }

  async withdraw(offerId: string, buyerId: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException("Offer not found");
    if (offer.buyerId !== buyerId)
      throw new ForbiddenException("You can only withdraw your own offers");
    if (offer.status !== "PENDING")
      throw new BadRequestException("Offer is no longer pending");

    return this.prisma.offer.update({
      where: { id: offerId },
      data: { status: "WITHDRAWN" },
    });
  }
}
