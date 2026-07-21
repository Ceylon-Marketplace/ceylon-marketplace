"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gavel,
  ImageIcon,
  Info,
  MapPin,
  Store,
  Tag,
  UserRound,
} from "lucide-react";
import api from "@/lib/api";
import { formatDateTime, formatPrice, timeAgo, timeUntil } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

type AuctionMedia = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  order: number;
};

type AuctionBid = {
  id: string;
  amount: number | string;
  createdAt: string;
  bidder: { id: string; maskedName: string };
};

type AuctionDetail = {
  id: string;
  sellerId: string;
  startPrice: number | string;
  currentPrice: number | string;
  bidIncrement: number | string;
  startTime: string;
  endTime: string;
  status: "DRAFT" | "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  bidCount: number;
  listing: {
    id: string;
    title: string;
    description: string;
    condition: string;
    location: string;
    media: AuctionMedia[];
    category: { id: string; name: string };
    seller: {
      id: string;
      verificationLevel: string;
      profile: {
        firstName: string;
        lastName: string;
        location?: string | null;
      } | null;
    };
  };
  bids: AuctionBid[];
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

const STATUS_LABELS: Record<AuctionDetail["status"], string> = {
  DRAFT: "Draft",
  SCHEDULED: "Upcoming",
  LIVE: "Live auction",
  ENDED: "Auction ended",
  CANCELLED: "Cancelled",
};

function AuctionDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 h-5 w-44 rounded bg-gray-100" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          <div className="aspect-[4/3] rounded-2xl bg-gray-100" />
          <div className="h-8 w-3/4 rounded bg-gray-100" />
          <div className="h-4 w-1/3 rounded bg-gray-100" />
        </div>
        <div className="space-y-4">
          <div className="h-80 rounded-2xl bg-gray-100" />
          <div className="h-40 rounded-2xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hasHydrated } = useAuthStore();
  const [activeImage, setActiveImage] = useState(0);
  const [countdown, setCountdown] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");

  const {
    data: auction,
    isLoading,
    isError,
    refetch,
  } = useQuery<AuctionDetail>({
    queryKey: ["auction", id],
    queryFn: async () => {
      const { data } = await api.get(`/auctions/${id}`);
      return data;
    },
    refetchInterval: (query) =>
      query.state.data?.status === "LIVE" ? 3000 : false,
  });

  useEffect(() => {
    if (!auction) return;
    const target = auction.status === "SCHEDULED" ? auction.startTime : auction.endTime;
    const updateCountdown = () => setCountdown(timeUntil(target));
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [auction]);

  const bidMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { data } = await api.post(`/auctions/${id}/bid`, { amount });
      return data;
    },
    onSuccess: (data) => {
      setBidSuccess(
        data.extended
          ? "Bid placed. The auction was extended by two minutes."
          : "Your bid has been placed.",
      );
      setBidAmount("");
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
    },
    onError: (error: unknown) => {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "message" in error.response.data &&
        typeof error.response.data.message === "string"
          ? error.response.data.message
          : "We could not place your bid. Please try again.";
      setBidError(message);
    },
  });

  if (isLoading) return <AuctionDetailSkeleton />;

  if (isError || !auction) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Gavel className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-gray-950">
          Auction unavailable
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          This auction may have been removed, or the marketplace could not load it.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => refetch()} className="btn-secondary">
            Try again
          </button>
          <Link href="/auctions" className="btn-primary">
            Browse auctions
          </Link>
        </div>
      </div>
    );
  }

  const images = auction.listing.media.filter((media) => media.type === "IMAGE");
  const isLive = auction.status === "LIVE";
  const isScheduled = auction.status === "SCHEDULED";
  const isSeller = user?.id === auction.sellerId;
  const currentPrice = Number(auction.currentPrice);
  const minBid = currentPrice + Number(auction.bidIncrement);
  const sellerName = auction.listing.seller.profile
    ? `${auction.listing.seller.profile.firstName} ${auction.listing.seller.profile.lastName}`
    : "Marketplace seller";
  const scheduledStartHasPassed =
    isScheduled && new Date(auction.startTime).getTime() <= Date.now();

  const handleBid = () => {
    if (!user) {
      router.push(`/login?next=/auctions/${id}`);
      return;
    }
    setBidError("");
    setBidSuccess("");
    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount < minBid) {
      setBidError(`Enter a bid of at least ${formatPrice(minBid)}.`);
      return;
    }
    bidMutation.mutate(amount);
  };

  return (
    <div className="pb-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/auctions" className="inline-flex items-center gap-2 transition hover:text-gray-950">
          <ArrowLeft className="h-4 w-4" />
          Auctions
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
        <span className="max-w-[220px] truncate text-gray-700">{auction.listing.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-14">
        <div className="min-w-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            {images[activeImage] ? (
              <Image
                src={images[activeImage].url}
                alt={auction.listing.title}
                fill
                priority
                sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw"
                className="object-contain p-4 sm:p-8"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                <ImageIcon className="h-10 w-10" />
                <p className="text-sm font-medium">No product image available</p>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Product images">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={activeImage === index}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-gray-50 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 ${
                    activeImage === index
                      ? "border-brand-500"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Tag className="h-4 w-4" />
                {auction.listing.category.name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {auction.listing.location}
              </span>
              <span>{CONDITION_LABELS[auction.listing.condition] ?? auction.listing.condition}</span>
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-gray-950 sm:text-4xl">
              {auction.listing.title}
            </h1>
          </div>

          <section className="border-b border-gray-200 py-8" aria-labelledby="description-title">
            <h2 id="description-title" className="text-lg font-semibold text-gray-950">
              About this item
            </h2>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-gray-600">
              {auction.listing.description || "The seller has not added a description."}
            </p>
          </section>

          <section className="py-8" aria-labelledby="bid-history-title">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Bid activity</p>
                <h2 id="bid-history-title" className="mt-2 text-xl font-semibold tracking-[-0.02em] text-gray-950">
                  Recent bids
                </h2>
              </div>
              <span className="text-sm text-gray-500">{auction.bidCount} total</span>
            </div>

            {auction.bids.length > 0 ? (
              <ol className="mt-5 divide-y divide-gray-200 border-y border-gray-200">
                {auction.bids.map((bid, index) => (
                  <li key={bid.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {bid.bidder.maskedName}
                          {index === 0 && <span className="ml-2 text-xs font-medium text-brand-600">Leading</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">{timeAgo(bid.createdAt)}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-gray-950">{formatPrice(bid.amount)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-5 border-y border-gray-200 py-8 text-center">
                <Gavel className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-700">No bids yet</p>
                <p className="mt-1 text-xs text-gray-400">The first qualifying bid will appear here.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_55px_-38px_rgba(17,24,39,0.35)]">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
              <span className={`inline-flex items-center gap-2 text-sm font-semibold ${isLive ? "text-brand-600" : "text-gray-700"}`}>
                <span className={`h-2 w-2 rounded-full ${isLive ? "bg-brand-500" : "bg-gray-300"}`} />
                {STATUS_LABELS[auction.status]}
              </span>
              <span className="text-xs text-gray-400">{auction.bidCount} bid{auction.bidCount === 1 ? "" : "s"}</span>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-gray-400">
                {auction.bidCount > 0 ? "Current bid" : "Starting price"}
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-gray-950">
                {formatPrice(currentPrice)}
              </p>

              <div className="mt-5 grid grid-cols-2 divide-x divide-gray-200 border-y border-gray-200 py-4">
                <div className="pr-4">
                  <p className="text-xs text-gray-400">{isScheduled ? "Starts in" : "Time left"}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <Clock3 className="h-4 w-4 text-brand-500" />
                    {scheduledStartHasPassed
                      ? "Awaiting start"
                      : isLive || isScheduled
                        ? countdown || "Calculating"
                        : "Closed"}
                  </p>
                </div>
                <div className="pl-4">
                  <p className="text-xs text-gray-400">Bid increment</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatPrice(auction.bidIncrement)}</p>
                </div>
              </div>

              <div className="mt-5">
                {bidError && (
                  <div role="alert" className="mb-4 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{bidError}</span>
                  </div>
                )}
                {bidSuccess && (
                  <div role="status" className="mb-4 flex gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{bidSuccess}</span>
                  </div>
                )}

                {isLive && !isSeller ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleBid();
                    }}
                  >
                    <label htmlFor="bid-amount" className="text-sm font-medium text-gray-900">
                      Your bid
                    </label>
                    <div className="relative mt-2">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-gray-400">LKR</span>
                      <input
                        id="bid-amount"
                        type="number"
                        inputMode="decimal"
                        value={bidAmount}
                        onChange={(event) => setBidAmount(event.target.value)}
                        min={minBid}
                        step={Number(auction.bidIncrement)}
                        placeholder={String(minBid)}
                        className="input h-12 pl-14 text-base font-semibold"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">Minimum {formatPrice(minBid)}</p>
                    <button
                      type="submit"
                      disabled={bidMutation.isPending || !hasHydrated}
                      className="btn-primary mt-4 flex h-12 w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Gavel className="h-4 w-4" />
                      {bidMutation.isPending ? "Placing bid..." : user ? "Place bid" : "Sign in to bid"}
                    </button>
                  </form>
                ) : isLive && isSeller ? (
                  <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                    You are the seller for this auction, so bidding is unavailable.
                  </div>
                ) : (
                  <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                    {isScheduled
                      ? `Bidding opens ${formatDateTime(auction.startTime)}.`
                      : `This auction is ${STATUS_LABELS[auction.status].toLowerCase()}.`}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-start gap-2 border-t border-gray-200 pt-4 text-xs leading-5 text-gray-400">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Bids placed in the final two minutes extend the auction by two minutes.
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <Store className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-gray-400">Seller</p>
                <p className="mt-1 truncate text-sm font-semibold text-gray-950">{sellerName}</p>
                {auction.listing.seller.profile?.location && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {auction.listing.seller.profile.location}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-950">Auction schedule</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-400">Starts</dt>
                  <dd className="mt-0.5 font-medium text-gray-700">{formatDateTime(auction.startTime)}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs text-gray-400">Scheduled end</dt>
                  <dd className="mt-0.5 font-medium text-gray-700">{formatDateTime(auction.endTime)}</dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="text-sm font-semibold text-gray-950">How bidding works</h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-5 text-gray-500">
              <li>Each bid must meet the displayed minimum amount.</li>
              <li>The seller cannot bid on their own auction.</li>
              <li>Late bids can extend the scheduled end time.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
