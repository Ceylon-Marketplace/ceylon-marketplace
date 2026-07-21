import { Prisma } from "@prisma/client";

type SerializableAuction = {
  startPrice: Prisma.Decimal;
  currentPrice: Prisma.Decimal;
  reservePrice: Prisma.Decimal | null;
  endTime: Date;
  startTime: Date;
  _count: { bids: number };
};

export function serializeAuction<T extends SerializableAuction>(auction: T) {
  const { _count, ...rest } = auction;
  return {
    ...rest,
    startPrice: Number(auction.startPrice),
    currentPrice: Number(auction.currentPrice),
    reservePrice: auction.reservePrice ? Number(auction.reservePrice) : null,
    endTime: auction.endTime.toISOString(),
    startTime: auction.startTime.toISOString(),
    bidCount: _count.bids,
  };
}
