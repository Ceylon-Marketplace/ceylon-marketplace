"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { formatDate, timeAgo } from "@/lib/utils";
import { ListingCard } from "@/components/listing-card";
import {
  MapPin,
  Star,
  Shield,
  Package,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

const VERIFICATION_LABELS: Record<string, string> = {
  NONE: "Unverified",
  EMAIL: "Email verified",
  PHONE: "Phone verified",
  IDENTITY: "ID verified",
  BUSINESS: "Business verified",
};

const VERIFICATION_COLORS: Record<string, string> = {
  NONE: "text-gray-400",
  EMAIL: "text-blue-500",
  PHONE: "text-blue-600",
  IDENTITY: "text-green-600",
  BUSINESS: "text-brand-600",
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["user-reviews", id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: listings } = useQuery({
    queryKey: ["user-listings", id],
    queryFn: async () => {
      const { data } = await api.get(`/listings?sellerId=${id}&limit=8`);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 rounded-xl bg-gray-100" />
        <div className="h-8 w-1/3 rounded bg-gray-100" />
        <div className="h-4 w-1/2 rounded bg-gray-100" />
      </div>
    );
  }

  if (!profile) return <div className="text-gray-500">User not found.</div>;

  const isOwnProfile = currentUser?.id === id;
  const fullName =
    `${profile.profile?.firstName ?? ""} ${profile.profile?.lastName ?? ""}`.trim() ||
    "Anonymous";
  const verificationLabel =
    VERIFICATION_LABELS[profile.verificationLevel ?? "NONE"];
  const verificationColor =
    VERIFICATION_COLORS[profile.verificationLevel ?? "NONE"];

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-3xl font-bold text-gray-500">
              {profile.profile?.avatar ? (
                <Image
                  src={profile.profile.avatar}
                  alt={fullName}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                fullName[0]?.toUpperCase() ?? "?"
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <div className={`flex items-center gap-1 text-sm ${verificationColor}`}>
                <Shield className="h-4 w-4" />
                {verificationLabel}
              </div>
              {profile.profile?.location && (
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {profile.profile.location}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwnProfile ? (
              <Link href="/profile/edit" className="btn-secondary">
                Edit Profile
              </Link>
            ) : (
              currentUser && (
                <Link
                  href={`/messages?userId=${id}`}
                  className="btn-secondary gap-2"
                >
                  <MessageSquare className="h-4 w-4" /> Message
                </Link>
              )
            )}
            {profile.storefront && (
              <Link
                href={`/store/${profile.storefront.slug}`}
                className="btn-primary gap-2"
              >
                <ExternalLink className="h-4 w-4" /> View Store
              </Link>
            )}
          </div>
        </div>

        {profile.profile?.bio && (
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            {profile.profile.bio}
          </p>
        )}

        <div className="mt-4 flex gap-6 text-sm">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">
              {profile._count?.listings ?? 0}
            </p>
            <p className="text-gray-500">Listings</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">
              {profile._count?.reviewsReceived ?? 0}
            </p>
            <p className="text-gray-500">Reviews</p>
          </div>
          {reviews?.avgRating && (
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-xl font-bold text-gray-900">
                {reviews.avgRating.toFixed(1)}
              </span>
              <span className="text-gray-500">avg rating</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Listings */}
      {listings?.listings?.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Package className="h-5 w-5 text-brand-500" /> Active Listings
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {listings.listings.slice(0, 8).map((l: any) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews?.reviews?.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Star className="h-5 w-5 text-yellow-400" /> Reviews
          </h2>
          <div className="space-y-3">
            {reviews.reviews.map((r: any) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                      {r.reviewer?.profile?.firstName?.[0] ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.reviewer?.profile?.firstName}{" "}
                        {r.reviewer?.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < r.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
                )}
                {r.listing && (
                  <Link
                    href={`/listings/${r.listing.id}`}
                    className="mt-2 block text-xs text-brand-600 hover:underline"
                  >
                    Re: {r.listing.title}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
