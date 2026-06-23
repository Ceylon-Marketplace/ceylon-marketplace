"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { formatPrice, formatDateTime, timeUntil } from "@/lib/utils";
import { Gavel, Clock, AlertTriangle, ArrowLeft } from "lucide-react";

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [timeLeft, setTimeLeft] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");

  const { data: auction, isLoading } = useQuery({
    queryKey: ["auction", id],
    queryFn: async () => {
      const { data } = await api.get(`/auctions/${id}`);
      return data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "LIVE" ? 3000 : false;
    },
  });

  useEffect(() => {
    if (!auction?.endTime) return;
    const end = new Date(auction.endTime);
    const interval = setInterval(() => setTimeLeft(timeUntil(end)), 1000);
    return () => clearInterval(interval);
  }, [auction?.endTime]);

  const bidMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { data } = await api.post(`/auctions/${id}/bid`, { amount });
      return data;
    },
    onSuccess: (data) => {
      setBidSuccess(`Bid placed!${data.extended ? " Auction extended by 2 minutes." : ""}`);
      setBidAmount("");
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
    },
    onError: (err: any) => {
      setBidError(err.response?.data?.message || "Failed to place bid");
    },
  });

  const handleBid = () => {
    if (!user) { router.push("/login"); return; }
    setBidError("");
    setBidSuccess("");
    const amount = Number(bidAmount);
    if (!amount || amount <= 0) { setBidError("Enter a valid bid amount"); return; }
    bidMutation.mutate(amount);
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-80 rounded-xl bg-gray-100" /></div>;
  }

  if (!auction) return <div>Auction not found</div>;

  const isLive = auction.status === "LIVE";
  const isSeller = user?.id === auction.sellerId;
  const currentPrice = Number(auction.currentPrice);
  const minBid = currentPrice + Number(auction.bidIncrement);
  const coverImage = auction.listing.media.find((m: any) => m.type === "IMAGE");

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr,420px]">
        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
            {coverImage ? (
              <Image src={coverImage.url} alt={auction.listing.title} fill className="object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">🔨</div>
            )}
            <span className={`absolute left-3 top-3 badge text-white ${isLive ? "bg-green-500" : "bg-gray-400"}`}>
              {isLive ? "● Live" : auction.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{auction.listing.title}</h1>
          <p className="text-sm text-gray-500">{auction.listing.category.name}</p>

          {auction.bids?.length > 0 && (
            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Recent Bids</h3>
              <ul className="space-y-2">
                {auction.bids.map((b: any, i: number) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{b.bidder.maskedName}</span>
                    <span className="font-semibold text-brand-600">{formatPrice(b.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Price</span>
              <span className="text-3xl font-bold text-brand-600">{formatPrice(currentPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center gap-1"><Gavel className="h-4 w-4" /> {auction.bidCount} bid{auction.bidCount !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{isLive ? timeLeft : formatDateTime(auction.endTime)}</span>
            </div>

            <div className="border-t pt-4">
              <p className="mb-1 text-xs text-gray-400">Minimum bid: {formatPrice(minBid)}</p>
              {bidError && <p className="mb-2 text-sm text-red-600">{bidError}</p>}
              {bidSuccess && <p className="mb-2 text-sm text-green-600">{bidSuccess}</p>}

              {isLive && !isSeller ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={String(minBid)}
                    min={minBid}
                    className="input flex-1"
                  />
                  <button onClick={handleBid} disabled={bidMutation.isPending} className="btn-primary">
                    Bid
                  </button>
                </div>
              ) : isLive && isSeller ? (
                <p className="text-sm text-gray-400">You cannot bid on your own auction.</p>
              ) : (
                <p className="text-sm text-gray-400">This auction is {auction.status.toLowerCase()}.</p>
              )}
            </div>
          </div>

          <div className="card p-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">Seller</p>
            <p className="text-gray-700">{auction.listing.seller.profile?.firstName} {auction.listing.seller.profile?.lastName}</p>
            <p className="text-xs text-gray-400">Starts: {formatDateTime(auction.startTime)}</p>
            <p className="text-xs text-gray-400">Ends: {formatDateTime(new Date(auction.endTime))}</p>
          </div>

          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Auction Rules</h3>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>• All bids are binding</li>
              <li>• Reserve price may apply (hidden)</li>
              <li>• Anti-sniping: bids in the last 2 min extend the auction</li>
              <li>• Winner contacted after auction closes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
