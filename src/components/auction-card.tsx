"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  Clock,
  Gavel,
  ImageIcon,
  MapPin,
} from "lucide-react";
import { cn, formatPrice, timeUntil } from "@/lib/utils";

export interface AuctionSummary {
  id: string;
  currentPrice: number | string;
  startPrice: number | string;
  startTime: string;
  endTime: string;
  status: string;
  _count: { bids: number };
  listing: {
    id: string;
    title: string;
    location: string;
    media: { url: string }[];
    category: { id: string; name: string };
  };
}

export function AuctionCard({
  auction,
  featured = false,
  priority = false,
}: {
  auction: AuctionSummary;
  featured?: boolean;
  priority?: boolean;
}) {
  const [countdown, setCountdown] = useState("Updating time");
  const [isEndingSoon, setIsEndingSoon] = useState(false);
  const isLive = auction.status === "LIVE";
  const coverImage = auction.listing.media[0];
  const bidCount = auction._count.bids;

  useEffect(() => {
    const updateCountdown = () => {
      const target = isLive ? auction.endTime : auction.startTime;
      const nextCountdown = timeUntil(target);
      setCountdown(!isLive && nextCountdown === "Ended" ? "Awaiting start" : nextCountdown);
      setIsEndingSoon(
        isLive && new Date(auction.endTime).getTime() - Date.now() < 5 * 60 * 1000,
      );
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [auction.endTime, auction.startTime, isLive]);

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className={cn(
        "group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_18px_45px_-28px_rgba(17,24,39,0.35)] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
        featured && "md:grid md:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]",
      )}
    >
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden bg-gray-100",
          featured && "md:aspect-auto md:min-h-[350px]",
        )}
      >
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={auction.listing.title}
            fill
            sizes="(min-width: 1280px) 304px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs font-medium">No image available</span>
          </div>
        )}
      </div>

      <div className={cn("flex min-w-0 flex-col p-4", featured && "p-6 md:p-8")}>
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]",
              isLive ? "text-brand-600" : "text-gray-500",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isLive ? "bg-brand-500" : "bg-gray-300",
              )}
            />
            {isLive ? "Live now" : "Upcoming"}
          </span>
          <span className="truncate text-xs text-gray-400">
            {auction.listing.category.name}
          </span>
        </div>

        <h2
          className={cn(
            "mt-3 line-clamp-2 font-semibold leading-snug tracking-[-0.02em] text-gray-950",
            featured ? "text-2xl md:text-3xl" : "text-base",
          )}
        >
          {auction.listing.title}
        </h2>

        <div className={cn("mt-5", featured && "mt-7")}>
          <p className="text-xs font-medium text-gray-500">
            {isLive ? "Current bid" : "Starting price"}
          </p>
          <p
            className={cn(
              "mt-1 font-semibold tracking-[-0.03em] text-gray-950",
              featured ? "text-3xl" : "text-2xl",
            )}
          >
            {formatPrice(isLive ? auction.currentPrice : auction.startPrice)}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-gray-500">
          <span className="flex min-w-0 items-center gap-2">
            <Gavel className="h-4 w-4 shrink-0" />
            {bidCount} {bidCount === 1 ? "bid" : "bids"}
          </span>
          <span className="flex min-w-0 items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{auction.listing.location}</span>
          </span>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <span
              className={cn(
                "flex items-center gap-2 text-sm font-semibold",
                isEndingSoon ? "text-brand-600" : "text-gray-700",
              )}
            >
              {isLive ? (
                <Clock className="h-4 w-4" />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
              {isLive
                ? `${countdown} left`
                : countdown === "Awaiting start"
                  ? countdown
                  : `Starts in ${countdown}`}
            </span>
            <ArrowUpRight className="h-5 w-5 text-gray-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-500 motion-reduce:transform-none" />
          </div>
        </div>
      </div>
    </Link>
  );
}
