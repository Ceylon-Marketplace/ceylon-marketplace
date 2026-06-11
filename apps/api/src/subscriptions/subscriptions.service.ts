import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const GRACE_PERIOD_DAYS = 7;

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  }

  async subscribe(userId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException("Plan not found");

    const now = new Date();
    const endDate = new Date(
      now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
    );
    const gracePeriodEnd = new Date(
      endDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    const subscription = await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        planId,
        status: "ACTIVE",
        startDate: now,
        endDate,
        gracePeriodEnd,
      },
      create: {
        userId,
        planId,
        status: "ACTIVE",
        startDate: now,
        endDate,
        gracePeriodEnd,
      },
      include: { plan: true },
    });

    // Upgrade user role to SELLER if not already a seller
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role:
          plan.name === "Business"
            ? "BUSINESS_SELLER"
            : "SELLER",
      },
    });

    return subscription;
  }

  async getMySubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async cancel(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!sub) throw new NotFoundException("No active subscription");

    return this.prisma.subscription.update({
      where: { userId },
      data: { status: "CANCELLED" },
    });
  }

  // Called by a cron job to expire subscriptions
  async expireOverdue() {
    const now = new Date();

    // Move ACTIVE past endDate to GRACE_PERIOD
    await this.prisma.subscription.updateMany({
      where: { status: "ACTIVE", endDate: { lt: now } },
      data: { status: "GRACE_PERIOD" },
    });

    // Move GRACE_PERIOD past gracePeriodEnd to EXPIRED
    await this.prisma.subscription.updateMany({
      where: { status: "GRACE_PERIOD", gracePeriodEnd: { lt: now } },
      data: { status: "EXPIRED" },
    });
  }
}
