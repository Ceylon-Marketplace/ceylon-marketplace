import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ReportTargetType } from "@prisma/client";

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(
    reporterId: string,
    data: {
      targetType: ReportTargetType;
      targetId: string;
      reason: string;
      description?: string;
      listingId?: string;
    },
  ) {
    return this.prisma.report.create({
      data: { reporterId, ...data },
    });
  }

  async findAll(params: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20 } = params;
    const where: any = params.status ? { status: params.status } : {};

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: { include: { profile: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return { reports, total, page, limit };
  }

  async resolve(
    reportId: string,
    adminId: string,
    action: "resolve" | "dismiss",
  ) {
    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: action === "resolve" ? "RESOLVED" : "DISMISSED",
        resolvedById: adminId,
        resolvedAt: new Date(),
      },
    });
  }

  async createDispute(
    buyerId: string,
    data: {
      listingId: string;
      reason: string;
      description: string;
    },
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: data.listingId },
    });
    if (!listing) throw new Error("Listing not found");

    return this.prisma.dispute.create({
      data: {
        listingId: data.listingId,
        buyerId,
        sellerId: listing.sellerId,
        reason: data.reason,
        description: data.description,
      },
    });
  }
}
