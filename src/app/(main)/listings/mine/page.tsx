"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { formatPrice, timeAgo } from "@/lib/utils";
import { Plus, Package, Edit, Eye, Store, Info } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  PENDING_REVIEW: "bg-yellow-50 text-yellow-700",
  DRAFT: "bg-gray-50 text-gray-600",
  SOLD: "bg-blue-50 text-blue-700",
  ARCHIVED: "bg-gray-50 text-gray-400",
  REJECTED: "bg-red-50 text-red-700",
};

const STATUS_OPTIONS = [
  "ALL",
  "ACTIVE",
  "PENDING_REVIEW",
  "DRAFT",
  "SOLD",
  "ARCHIVED",
  "REJECTED",
];

export default function MyListingsPage() {
  const { user, mode, setMode, hasHydrated } = useAuthStore();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["my-listings", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const { data } = await api.get(`/listings/mine${params}`);
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (hasHydrated && !user) router.push("/login");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  const isSeller = user.role === "SELLER" || user.role === "BUSINESS_SELLER";

  if (!isSeller) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
        <Store className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium text-gray-900">
          Seller account required
        </p>
        <p className="mt-1 mb-4 text-sm">
          Upgrade your account to list and manage items for sale.
        </p>
        <Link href="/become-seller" className="btn-primary">
          Become a Seller
        </Link>
      </div>
    );
  }

  if (mode !== "seller") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
        <Info className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium text-gray-900">
          You're in buyer mode
        </p>
        <p className="mt-1 mb-4 text-sm">
          Switch to seller mode to view and manage your listings.
        </p>
        <button
          onClick={() => {
            setMode("seller");
            router.push("/listings/mine");
          }}
          className="btn-primary"
        >
          Switch to Seller Mode
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Link href="/listings/create" className="btn-primary gap-2">
          <Plus className="h-4 w-4" /> New Listing
        </Link>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "ALL" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : !listings?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Package className="mb-3 h-10 w-10 text-gray-300" />
          <p>
            No listings
            {statusFilter !== "ALL" ? ` with status ${statusFilter}` : ""} yet.
          </p>
          <Link href="/listings/create" className="btn-primary mt-4">
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l: any) => {
            const thumb = l.media?.[0]?.url;
            return (
              <div key={l.id} className="card p-4">
                <div className="flex items-center gap-4">
                  <Link href={`/listings/${l.id}`} className="flex-shrink-0">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={l.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">
                          📦
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/listings/${l.id}`}
                        className="block truncate font-medium text-gray-900 hover:text-brand-600"
                      >
                        {l.title}
                      </Link>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[l.status] ?? ""
                        }`}
                      >
                        {l.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-brand-600">
                      {formatPrice(l.price)}
                    </p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {l.viewCount ?? 0} views
                      </span>
                      <span>{timeAgo(l.createdAt)}</span>
                    </div>
                    {l.rejectionReason && (
                      <p className="mt-1 text-xs text-red-600">
                        Rejected: {l.rejectionReason}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/listings/${l.id}/edit`}
                    className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
