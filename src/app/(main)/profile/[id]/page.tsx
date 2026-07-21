"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { ListingCard, type ListingCardData } from "@/components/listing-card";

type PublicProfile = {
  id: string;
  role: string;
  verificationLevel: string;
  createdAt: string;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
    bio?: string | null;
    location?: string | null;
  } | null;
  storefront?: { slug: string; name?: string | null } | null;
  _count?: { listings?: number; reviewsReceived?: number };
};

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer?: { profile?: { firstName?: string | null; lastName?: string | null } | null } | null;
  listing?: { id: string; title: string } | null;
};

type ReviewsResponse = {
  reviews: Review[];
  total: number;
  avgRating: number | null;
};

type ListingsResponse = {
  listings: ListingCardData[];
  total: number;
};

const VERIFICATION_LABELS: Record<string, string> = {
  NONE: "Not verified",
  EMAIL: "Email verified",
  PHONE: "Phone verified",
  IDENTITY: "Identity verified",
  BUSINESS: "Business verified",
};

const ROLE_LABELS: Record<string, string> = {
  USER: "Marketplace member",
  SELLER: "Marketplace seller",
  BUSINESS_SELLER: "Business seller",
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();

  const profileQuery = useQuery<PublicProfile>({
    queryKey: ["public-profile", id],
    queryFn: async () => (await api.get(`/users/${id}`)).data,
  });
  const reviewsQuery = useQuery<ReviewsResponse>({
    queryKey: ["user-reviews", id],
    queryFn: async () => (await api.get(`/reviews/${id}`)).data,
    enabled: Boolean(id),
  });
  const listingsQuery = useQuery<ListingsResponse>({
    queryKey: ["user-listings", id],
    queryFn: async () => (await api.get(`/listings?sellerId=${id}&limit=8`)).data,
    enabled: Boolean(id),
  });

  if (profileQuery.isLoading) return <ProfileSkeleton />;
  if (profileQuery.isError || !profileQuery.data) {
    return <ProfileUnavailable onRetry={() => profileQuery.refetch()} />;
  }

  const profile = profileQuery.data;
  const fullName = `${profile.profile?.firstName ?? ""} ${profile.profile?.lastName ?? ""}`.trim() || "Marketplace member";
  const initials = `${profile.profile?.firstName?.[0] ?? ""}${profile.profile?.lastName?.[0] ?? ""}` || "M";
  const verificationLevel = profile.verificationLevel ?? "NONE";
  const isVerified = verificationLevel !== "NONE";
  const verificationLabel = VERIFICATION_LABELS[verificationLevel] ?? "Verification unavailable";
  const roleLabel = ROLE_LABELS[profile.role] ?? "Marketplace member";
  const isOwnProfile = currentUser?.id === id;
  const activeListings = listingsQuery.data?.listings ?? [];
  const listingCount = profile._count?.listings ?? listingsQuery.data?.total ?? 0;
  const reviewCount = reviewsQuery.data?.total ?? profile._count?.reviewsReceived ?? 0;
  const averageRating = reviewsQuery.data?.avgRating ?? null;

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <section className="border-b border-gray-200 pb-8">
        <div className="grid items-start gap-7 md:grid-cols-[128px_minmax(0,1fr)_auto]">
          <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-gray-100 sm:h-32 sm:w-32">
            {profile.profile?.avatar ? (
              <img src={profile.profile.avatar} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-950 text-3xl font-semibold uppercase tracking-[-0.04em] text-white">{initials}</div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{roleLabel}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-gray-950 sm:text-5xl">{fullName}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
              <span className={isVerified ? "flex items-center gap-2 font-medium text-brand-600" : "flex items-center gap-2"}><ShieldCheck className="h-4 w-4" />{verificationLabel}</span>
              {profile.profile?.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{profile.profile.location}</span>}
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Member since {formatDate(profile.createdAt)}</span>
            </div>
            {profile.profile?.bio && <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600">{profile.profile.bio}</p>}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-stretch">
            {isOwnProfile && <Link href="/profile/edit" className="btn-secondary h-11 whitespace-nowrap">Edit profile</Link>}
            {profile.storefront ? (
              <Link href={`/store/${profile.storefront.slug}`} className="btn-primary h-11 gap-2 whitespace-nowrap"><Store className="h-4 w-4" />View storefront</Link>
            ) : listingCount > 0 ? (
              <Link href="#listings" className="btn-primary h-11 gap-2 whitespace-nowrap">Browse listings <ArrowRight className="h-4 w-4" /></Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 border-b border-gray-200" aria-label="Profile summary">
        <ProfileMetric value={listingCount} label="Active listings" />
        <ProfileMetric value={reviewCount} label="Reviews" bordered />
        <ProfileMetric value={averageRating === null ? "New" : averageRating.toFixed(1)} label={averageRating === null ? "No rating yet" : "Average rating"} />
      </section>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-12">
          <section id="listings" className="scroll-mt-28">
            <SectionHeading title="Active listings" body="Items this member currently has available in the marketplace." />
            {listingsQuery.isLoading ? (
              <ListingSkeleton />
            ) : listingsQuery.isError ? (
              <InlineError body="Listings could not be loaded." onRetry={() => listingsQuery.refetch()} />
            ) : activeListings.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {activeListings.slice(0, 6).map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            ) : (
              <EmptySection icon={Package} title="No active listings" body="This member does not have any active listings right now." />
            )}
          </section>

          <section>
            <SectionHeading title="Buyer feedback" body="Reviews connected to marketplace listings and completed transactions." />
            {reviewsQuery.isLoading ? (
              <ReviewSkeleton />
            ) : reviewsQuery.isError ? (
              <InlineError body="Reviews could not be loaded." onRetry={() => reviewsQuery.refetch()} />
            ) : reviewsQuery.data?.reviews.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {reviewsQuery.data.reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
              </div>
            ) : (
              <EmptySection icon={Star} title="No reviews yet" body="Feedback will appear here after eligible marketplace transactions." />
            )}
          </section>
        </div>

        <aside className="rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-gray-950">Marketplace profile</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">Profile information, verification status, listings, and reviews are shown from this member&apos;s marketplace activity.</p>
          <div className="mt-5 border-t border-gray-200 pt-5 text-sm">
            <InfoRow label="Account type" value={roleLabel} />
            <InfoRow label="Verification" value={verificationLabel} />
            {profile.profile?.location && <InfoRow label="Location" value={profile.profile.location} />}
          </div>
          {!isOwnProfile && activeListings.length > 0 && <p className="mt-5 border-t border-gray-200 pt-5 text-xs leading-5 text-gray-500">To contact this member, open one of their listings and use the seller contact action.</p>}
          {profile.storefront && <Link href={`/store/${profile.storefront.slug}`} className="mt-5 flex items-center justify-between border-t border-gray-200 pt-5 text-sm font-semibold text-brand-600">Open storefront <ExternalLink className="h-4 w-4" /></Link>}
        </aside>
      </div>
    </div>
  );
}

function ProfileMetric({ value, label, bordered = false }: { value: string | number; label: string; bordered?: boolean }) {
  return <div className={`py-5 text-center sm:py-6 ${bordered ? "border-x border-gray-200" : ""}`}><p className="text-2xl font-semibold tracking-[-0.04em] text-gray-950">{value}</p><p className="mt-1 text-xs text-gray-500">{label}</p></div>;
}

function SectionHeading({ title, body }: { title: string; body: string }) {
  return <div><h2 className="text-2xl font-semibold tracking-[-0.035em] text-gray-950">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">{body}</p></div>;
}

function ReviewCard({ review }: { review: Review }) {
  const reviewerName = `${review.reviewer?.profile?.firstName ?? ""} ${review.reviewer?.profile?.lastName ?? ""}`.trim() || "Marketplace member";
  const initials = `${review.reviewer?.profile?.firstName?.[0] ?? ""}${review.reviewer?.profile?.lastName?.[0] ?? ""}` || "M";
  return <article className="rounded-2xl border border-gray-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold uppercase text-gray-600">{initials}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-950">{reviewerName}</p><p className="mt-0.5 text-xs text-gray-400">{timeAgo(review.createdAt)}</p></div></div><div className="flex shrink-0 items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? "fill-brand-500 text-brand-500" : "text-gray-200"}`} />)}</div></div>{review.comment && <p className="mt-4 text-sm leading-6 text-gray-600">{review.comment}</p>}{review.listing && <Link href={`/listings/${review.listing.id}`} className="mt-4 block truncate border-t border-gray-100 pt-4 text-xs font-medium text-brand-600">For {review.listing.title}</Link>}</article>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="mb-3 last:mb-0"><p className="text-xs text-gray-400">{label}</p><p className="mt-1 font-medium text-gray-800">{value}</p></div>;
}

function EmptySection({ icon: Icon, title, body }: { icon: typeof Star; title: string; body: string }) {
  return <div className="mt-6 rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center"><Icon className="mx-auto h-5 w-5 text-gray-400" /><h3 className="mt-4 text-sm font-semibold text-gray-950">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">{body}</p></div>;
}

function InlineError({ body, onRetry }: { body: string; onRetry: () => void }) {
  return <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 p-5"><p className="text-sm text-gray-600">{body}</p><button type="button" onClick={onRetry} className="btn-secondary h-10 gap-2"><RefreshCw className="h-4 w-4" />Retry</button></div>;
}

function ProfileUnavailable({ onRetry }: { onRetry: () => void }) {
  return <div className="mx-auto max-w-lg py-20 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><ShieldCheck className="h-5 w-5" /></div><h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-gray-950">Profile unavailable</h1><p className="mt-2 text-sm leading-6 text-gray-500">This member could not be found or the profile is no longer available.</p><div className="mt-6 flex justify-center gap-3"><button type="button" onClick={onRetry} className="btn-secondary gap-2"><RefreshCw className="h-4 w-4" />Try again</button><Link href="/listings" className="btn-primary">Browse listings</Link></div></div>;
}

function ProfileSkeleton() {
  return <div className="mx-auto max-w-6xl animate-pulse pb-12"><div className="grid gap-7 border-b border-gray-200 pb-8 md:grid-cols-[128px_minmax(0,1fr)_160px]"><div className="h-32 w-32 rounded-2xl bg-gray-100" /><div><div className="h-3 w-28 rounded bg-gray-100" /><div className="mt-4 h-12 max-w-sm rounded bg-gray-100" /><div className="mt-4 h-4 max-w-lg rounded bg-gray-100" /><div className="mt-5 h-16 max-w-2xl rounded bg-gray-100" /></div><div className="h-11 rounded-xl bg-gray-100" /></div><div className="grid grid-cols-3 border-b border-gray-200 py-5"><div className="mx-auto h-10 w-20 rounded bg-gray-100" /><div className="mx-auto h-10 w-20 rounded bg-gray-100" /><div className="mx-auto h-10 w-20 rounded bg-gray-100" /></div><div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="h-96 rounded-2xl bg-gray-100" /><div className="h-72 rounded-2xl bg-gray-100" /></div></div>;
}

function ListingSkeleton() {
  return <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="animate-pulse"><div className="aspect-[4/3] rounded-2xl bg-gray-100" /><div className="mt-3 h-4 w-3/4 rounded bg-gray-100" /><div className="mt-2 h-5 w-1/3 rounded bg-gray-100" /></div>)}</div>;
}

function ReviewSkeleton() {
  return <div className="mt-6 grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-gray-100" />)}</div>;
}
