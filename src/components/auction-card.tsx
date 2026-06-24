"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Gavel } from "lucide-react";
import { formatPrice, timeUntil } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AuctionCardProps {
  auction: {
    id: string;
    currentPrice: number | string;
    startPrice: number | string;
    endTime: string;
    status: string;
    bidCount: number;
    listing: {
      id: string;
      title: string;
      location: string;
      media: { url: string; type: string }[];
    };
  };
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState(timeUntil(auction.endTime));
  const coverImage = auction.listing.media.find((m) => m.type === "IMAGE");

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(timeUntil(auction.endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime]);

  const isLive = auction.status === "LIVE";
  const isEnding =
    isLive && new Date(auction.endTime).getTime() - Date.now() < 5 * 60 * 1000;

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={auction.listing.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-gray-300">
            🔨
          </div>
        )}
        <span
          className={`absolute left-2 top-2 badge ${
            isLive
              ? "bg-green-500 text-white"
              : auction.status === "SCHEDULED"
                ? "bg-blue-500 text-white"
                : "bg-gray-400 text-white"
          }`}
        >
          {isLive ? "● Live" : auction.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-medium text-gray-900">
          {auction.listing.title}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Current Bid</p>
            <p className="text-lg font-bold text-brand-600">
              {formatPrice(auction.currentPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Bids</p>
            <p className="flex items-center gap-1 font-semibold text-gray-700">
              <Gavel className="h-4 w-4" />
              {auction.bidCount}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isEnding ? "text-red-600" : "text-gray-500"
          }`}
        >
          <Clock className="h-4 w-4" />
          {isLive ? timeLeft : "Starts soon"}
        </div>
      </div>
    </Link>
  );
}
