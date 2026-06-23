"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { ListingCard } from "@/components/listing-card";
import { MapPin, Star, Shield, Package, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import type { ListingSummary, StorefrontSummary } from "@/lib/types";

type StorefrontResponse = {
  storefront: StorefrontSummary;
  listings: ListingSummary[];
  total: number;
  avgRating?: number | null;
  reviewCount: number;
};

const VERIFICATION_COLORS: Record<string, string> = {
  NONE: "text-gray-400",
  EMAIL: "text-blue-500",
  PHONE: "text-blue-600",
  IDENTITY: "text-green-600",
  BUSINESS: "text-brand-600",
};

export default function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["storefront", slug],
    queryFn: async () => {
      const { data } = await api.get(`/storefront/${slug}`);
      return data as StorefrontResponse;
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 rounded-xl bg-gray-100" />
        <div className="h-8 w-1/3 rounded bg-gray-100" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Package className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium">Storefront not found</p>
        <Link href="/listings" className="btn-primary mt-4">
          Browse Listings
        </Link>
      </div>
    );
  }

  const { storefront, listings, total, avgRating, reviewCount } = data;
  const seller = storefront.seller;
  const fullName =
    `${seller?.profile?.firstName ?? ""} ${seller?.profile?.lastName ?? ""}`.trim();
  const verificationColor =
    VERIFICATION_COLORS[seller?.verificationLevel ?? "NONE"];

  return (
    <div className="space-y-8">
      {/* Banner */}
      {storefront.banner && (
        <div className="relative h-48 overflow-hidden rounded-xl">
          <Image
            src={storefront.banner}
            alt={storefront.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Store header */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {storefront.logo ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-gray-100">
                <Image
                  src={storefront.logo}
                  alt={storefront.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-50 text-2xl font-bold text-brand-600">
                {storefront.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {storefront.name}
              </h1>
              <div
                className={`flex items-center gap-1 text-sm ${verificationColor}`}
              >
                <Shield className="h-4 w-4" />
                {fullName}
              </div>
              {seller?.profile?.location && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" />
                  {seller.profile.location}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {user && user.id !== seller?.id && (
              <Link
                href={`/profile/${seller?.id}`}
                className="btn-secondary gap-2"
              >
                <MessageSquare className="h-4 w-4" /> Contact
              </Link>
            )}
          </div>
        </div>

        {storefront.description && (
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            {storefront.description}
          </p>
        )}

        <div className="mt-4 flex gap-6 text-sm">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{total}</p>
            <p className="text-gray-500">Active Listings</p>
          </div>
          {reviewCount > 0 && (
            <>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{reviewCount}</p>
                <p className="text-gray-500">Reviews</p>
              </div>
              {avgRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-bold text-gray-900">
                    {Number(avgRating).toFixed(1)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Listings grid */}
      {listings.length > 0 ? (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            All Listings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Package className="mb-3 h-10 w-10 text-gray-300" />
          <p>No active listings in this store yet.</p>
        </div>
      )}
    </div>
  );
}
