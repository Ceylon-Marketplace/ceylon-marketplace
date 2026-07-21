import { prisma } from "@/lib/prisma";
import { serializeAuction } from "@/lib/auctions";
import { AuctionsClient } from "./AuctionsClient";

export const revalidate = 15;

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
              select: { url: true, type: true },
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

  return {
    auctions: auctions.map(serializeAuction),
    total,
    page: 1,
    limit: 20,
  };
}

export default async function AuctionsPage() {
  const initialData = await getInitialAuctions();
  return <AuctionsClient initialData={initialData} />;
}
