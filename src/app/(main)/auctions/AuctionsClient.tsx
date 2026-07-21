"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Gavel,
  Layers3,
  RefreshCw,
  Radio,
} from "lucide-react";
import api from "@/lib/api";
import {
  AuctionCard,
  type AuctionSummary,
} from "@/components/auction-card";

type AuctionData = {
  auctions: AuctionSummary[];
  total: number;
  page: number;
  limit: number;
};

type AuctionFilter = "ALL" | "LIVE" | "SCHEDULED";

const FILTERS: { value: AuctionFilter; label: string }[] = [
  { value: "ALL", label: "All lots" },
  { value: "LIVE", label: "Live now" },
  { value: "SCHEDULED", label: "Upcoming" },
];

function AuctionGridSkeleton() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="Loading auctions"
    >
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white"
        >
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 rounded bg-gray-100" />
            <div className="h-5 w-4/5 rounded bg-gray-200" />
            <div className="h-7 w-1/2 rounded bg-gray-100" />
            <div className="h-10 border-t border-gray-100 pt-3">
              <div className="h-3 w-2/3 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuctionsClient({ initialData }: { initialData: AuctionData }) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<AuctionFilter>("ALL");

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["auctions", page],
    queryFn: async () => {
      const { data } = await api.get(`/auctions?page=${page}&limit=20`);
      return data as AuctionData;
    },
    initialData: page === 1 ? initialData : undefined,
    refetchInterval: 15_000,
  });

  const auctions = data?.auctions ?? [];
  const liveCount = auctions.filter((auction) => auction.status === "LIVE").length;
  const upcomingCount = auctions.filter(
    (auction) => auction.status === "SCHEDULED",
  ).length;
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)));

  const filteredAuctions = useMemo(
    () =>
      filter === "ALL"
        ? auctions
        : auctions.filter((auction) => auction.status === filter),
    [auctions, filter],
  );

  const featuredAuction =
    filter !== "SCHEDULED"
      ? filteredAuctions.find((auction) => auction.status === "LIVE")
      : undefined;
  const remainingAuctions = featuredAuction
    ? filteredAuctions.filter((auction) => auction.id !== featuredAuction.id)
    : filteredAuctions;

  const filterCount = (value: AuctionFilter) => {
    if (value === "ALL") return auctions.length;
    if (value === "LIVE") return liveCount;
    return upcomingCount;
  };

  return (
    <div className="space-y-8 pb-8">
      <header className="grid gap-6 border-b border-gray-200 pb-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            Timed marketplace
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-4xl">
            Auctions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Follow live bidding, discover upcoming lots, and act before the clock runs out.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin motion-reduce:animate-none" : ""}`}
          />
          <span>{isFetching ? "Refreshing auctions" : "Updates every 15 seconds"}</span>
        </div>
      </header>

      <section className="grid overflow-hidden rounded-2xl border border-gray-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-gray-200">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Radio className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-gray-950">
              {liveCount}
            </p>
            <p className="text-sm text-gray-500">Live on this page</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-gray-200 px-5 py-4 sm:border-t-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
            <Gavel className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-gray-950">
              {upcomingCount}
            </p>
            <p className="text-sm text-gray-500">Upcoming on this page</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-gray-200 px-5 py-4 sm:border-t-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
            <Layers3 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-gray-950">
              {data?.total ?? 0}
            </p>
            <p className="text-sm text-gray-500">Available lots</p>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Auction status">
        {FILTERS.map((option) => {
          const selected = filter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(option.value)}
              className={`inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-semibold transition active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 ${
                selected
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-950"
              }`}
            >
              {option.label}
              <span
                className={`text-xs ${selected ? "text-brand-600" : "text-gray-400"}`}
              >
                {filterCount(option.value)}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <AuctionGridSkeleton />
      ) : isError ? (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 px-6 py-12 text-center">
          <Gavel className="mx-auto h-8 w-8 text-brand-500" />
          <h2 className="mt-4 text-lg font-semibold text-gray-950">
            Auctions could not be loaded
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Check your connection and try refreshing the auction list.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
          >
            Try again
          </button>
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-gray-200">
            <Gavel className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-gray-950">
            {filter === "LIVE" ? "No auctions are live right now" : "No upcoming auctions found"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            {filter === "LIVE"
              ? "Check upcoming lots or return soon for the next live auction."
              : "New auction lots will appear here when sellers schedule them."}
          </p>
          {filter !== "ALL" && (
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className="mt-5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              View all lots
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {featuredAuction && (
            <section>
              <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em] text-gray-950">
                Live spotlight
              </h2>
              <AuctionCard auction={featuredAuction} featured priority />
            </section>
          )}

          {remainingAuctions.length > 0 && (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-gray-950">
                  {featuredAuction ? "More auctions" : filter === "SCHEDULED" ? "Upcoming lots" : "Available lots"}
                </h2>
                <p className="text-sm text-gray-500">
                  {remainingAuctions.length} {remainingAuctions.length === 1 ? "lot" : "lots"}
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {remainingAuctions.map((auction, index) => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    priority={!featuredAuction && index < 2}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Auction pages"
          className="flex items-center justify-between border-t border-gray-200 pt-6"
        >
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || isFetching}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-sm text-gray-500">
            Page <span className="font-semibold text-gray-900">{page}</span> of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages || isFetching}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
