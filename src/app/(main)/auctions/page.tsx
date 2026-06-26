import { prisma } from "@/lib/prisma";
import { AuctionsClient } from "./AuctionsClient";

async function getInitialAuctions() {
  const [auctions, total] = await Promise.all([
    prisma.auction.findMany({
      where: { status: { in: ["LIVE", "SCHEDULED"] } },
      select: {
        id: true,
        startPrice: true,
        currentPrice: true,
        reservePrice: true,
        endTime: true,
        startTime: true,
        status: true,
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            media: {
              select: { url: true },
              orderBy: { order: "asc" },
              take: 1,
            },
            category: { select: { id: true, name: true } },
          },
        },
        _count: { select: { bids: true } },
      },
      orderBy: { endTime: "asc" },
      take: 20,
    }),
    prisma.auction.count({ where: { status: { in: ["LIVE", "SCHEDULED"] } } }),
  ]);

  // Serialize dates for client transfer
  return {
    auctions: auctions.map((a) => ({
      ...a,
      endTime: a.endTime.toISOString(),
      startTime: a.startTime.toISOString(),
    })),
    total,
    page: 1,
    limit: 20,
  };
}

export default async function AuctionsPage() {
  const initialData = await getInitialAuctions();
  return <AuctionsClient initialData={initialData} />;
}
