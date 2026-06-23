"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { formatPrice, timeAgo } from "@/lib/utils";
import { TrendingUp, Package, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-gray-50 text-gray-500",
};

export default function OffersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"received" | "sent">("received");

  const { data: received, isLoading: receivedLoading } = useQuery({
    queryKey: ["offers-received"],
    queryFn: async () => {
      const { data } = await api.get("/offers?type=received");
      return data;
    },
    enabled: !!user,
  });

  const { data: sent, isLoading: sentLoading } = useQuery({
    queryKey: ["offers-sent"],
    queryFn: async () => {
      const { data } = await api.get("/offers");
      return data;
    },
    enabled: !!user,
  });

  const respondOffer = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) =>
      api.patch(`/offers/${id}/respond`, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers-received"] }),
  });

  const withdrawOffer = useMutation({
    mutationFn: (id: string) => api.patch(`/offers/${id}/withdraw`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers-sent"] }),
  });

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user) return null;

  const offers = tab === "received" ? received : sent;
  const isLoading = tab === "received" ? receivedLoading : sentLoading;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-brand-500" />
        <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1">
        {(["received", "sent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "received" ? "Received" : "Sent"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !offers?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Package className="mb-3 h-10 w-10 text-gray-300" />
          <p>No {tab} offers yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer: any) => {
            const listing = offer.listing;
            const thumb = listing?.media?.[0]?.url;
            return (
              <div key={offer.id} className="card p-4">
                <div className="flex items-start gap-4">
                  <Link href={`/listings/${listing.id}`} className="flex-shrink-0">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                      {thumb ? (
                        <Image src={thumb} alt={listing.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">📦</div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="block truncate text-sm font-medium text-gray-900 hover:text-brand-600"
                    >
                      {listing.title}
                    </Link>
                    <p className="mt-1 text-lg font-bold text-brand-600">
                      {formatPrice(offer.amount)}
                    </p>
                    {offer.message && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        "{offer.message}"
                      </p>
                    )}
                    {tab === "received" && offer.buyer && (
                      <p className="mt-1 text-xs text-gray-400">
                        From:{" "}
                        <Link
                          href={`/profile/${offer.buyer.id}`}
                          className="text-brand-600 hover:underline"
                        >
                          {offer.buyer.profile?.firstName}{" "}
                          {offer.buyer.profile?.lastName}
                        </Link>
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {timeAgo(offer.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[offer.status] ?? ""
                      }`}
                    >
                      {offer.status}
                    </span>

                    {tab === "received" && offer.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            respondOffer.mutate({ id: offer.id, action: "accept" })
                          }
                          disabled={respondOffer.isPending}
                          className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                        >
                          <CheckCircle className="h-3 w-3" /> Accept
                        </button>
                        <button
                          onClick={() =>
                            respondOffer.mutate({ id: offer.id, action: "reject" })
                          }
                          disabled={respondOffer.isPending}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    )}

                    {tab === "sent" && offer.status === "PENDING" && (
                      <button
                        onClick={() => withdrawOffer.mutate(offer.id)}
                        disabled={withdrawOffer.isPending}
                        className="flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                      >
                        <Clock className="h-3 w-3" /> Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
