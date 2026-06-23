"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { AuctionCard } from "@/components/auction-card";
import { useState } from "react";
import type { AuctionSummary } from "@/lib/types";

export default function AuctionsPage() {
  const [page, _setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["auctions", page],
    queryFn: async () => {
      const { data } = await api.get(`/auctions?page=${page}&limit=20`);
      return data as { auctions: AuctionSummary[] };
    },
    refetchInterval: 10_000, // refresh every 10s
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Live Auctions</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {data?.auctions?.filter((a) => a.status === "LIVE").length ?? 0}{" "}
          Live
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="card aspect-[3/4] animate-pulse bg-gray-100"
            />
          ))}
        </div>
      ) : data?.auctions?.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          No auctions currently running.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data?.auctions?.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
