"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Eye,
  Gavel,
  Heart,
  ImageIcon,
  MapPin,
  MessageSquare,
  PackageSearch,
  Store,
  Tag,
  TrendingUp,
} from "lucide-react";
import api from "@/lib/api";
import { formatPrice, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

type ListingDetail = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number | string;
  quantity: number;
  location: string;
  condition: string;
  listingType: "FIXED_PRICE" | "OFFER" | "AUCTION";
  status: string;
  viewCount: number;
  saveCount: number;
  createdAt: string;
  isSaved: boolean;
  media: { id: string; url: string; type: string }[];
  category: { name: string; parent?: { name: string } | null };
  seller: {
    id: string;
    profile: { firstName: string; lastName: string; location?: string | null } | null;
    storefront?: { slug: string; name: string } | null;
  };
  auction?: { id: string } | null;
  attributeValues?: { id: string; value: string; attribute?: { name: string } | null }[];
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

const TYPE_LABELS = {
  FIXED_PRICE: "Fixed price",
  OFFER: "Offers considered",
  AUCTION: "Auction listing",
};

function ListingDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-7 h-5 w-48 rounded bg-gray-100" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5"><div className="aspect-[4/3] rounded-2xl bg-gray-100" /><div className="h-8 w-3/4 rounded bg-gray-100" /><div className="h-4 w-1/3 rounded bg-gray-100" /></div>
        <div className="space-y-4"><div className="h-72 rounded-2xl bg-gray-100" /><div className="h-40 rounded-2xl bg-gray-100" /></div>
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hasHydrated } = useAuthStore();
  const [activeImage, setActiveImage] = useState(0);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const { data: listing, isLoading, isError, refetch } = useQuery<ListingDetail>({
    queryKey: ["listing", id],
    queryFn: async () => (await api.get(`/listings/${id}`)).data,
  });

  const saveMutation = useMutation({
    mutationFn: () => listing?.isSaved ? api.delete(`/listings/${id}/save`) : api.post(`/listings/${id}/save`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["listing", id] }),
    onError: () => setActionError("We could not update your saved listings."),
  });

  const contactMutation = useMutation({
    mutationFn: async () => (await api.post("/conversations", { listingId: id })).data,
    onSuccess: (conversation) => router.push(`/messages?conversationId=${conversation.id}`),
    onError: () => setActionError("We could not start a conversation with this seller."),
  });

  const offerMutation = useMutation({
    mutationFn: (payload: { listingId: string; amount: number; message?: string }) => api.post("/offers", payload),
    onSuccess: () => {
      setActionSuccess("Your offer has been sent to the seller.");
      setShowOfferForm(false);
      setOfferAmount("");
      setOfferMessage("");
    },
    onError: (error: unknown) => {
      const message = typeof error === "object" && error !== null && "response" in error && typeof error.response === "object" && error.response !== null && "data" in error.response && typeof error.response.data === "object" && error.response.data !== null && "message" in error.response.data && typeof error.response.data.message === "string" ? error.response.data.message : "We could not submit your offer.";
      setActionError(message);
    },
  });

  if (isLoading) return <ListingDetailSkeleton />;

  if (isError || !listing) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <PackageSearch className="h-10 w-10 text-gray-300" />
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-gray-950">Listing unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">This listing may have been removed, or the marketplace could not load it.</p>
        <div className="mt-6 flex gap-3"><button onClick={() => refetch()} className="btn-secondary">Try again</button><Link href="/listings" className="btn-primary">Browse listings</Link></div>
      </div>
    );
  }

  const images = listing.media.filter((media) => media.type === "IMAGE");
  const isOwnListing = user?.id === listing.seller.id;
  const isSold = listing.status === "SOLD";
  const isActive = listing.status === "ACTIVE";
  const sellerName = listing.seller.profile ? `${listing.seller.profile.firstName} ${listing.seller.profile.lastName}` : "Marketplace seller";
  const categoryPath = listing.category.parent ? `${listing.category.parent.name} / ${listing.category.name}` : listing.category.name;

  const requireUser = (action: () => void) => {
    if (!user) {
      router.push(`/login?next=/listings/${id}`);
      return;
    }
    setActionError("");
    setActionSuccess("");
    action();
  };

  return (
    <div className="pb-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/listings" className="inline-flex items-center gap-2 transition hover:text-gray-950"><ArrowLeft className="h-4 w-4" /> Listings</Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
        <span className="max-w-[220px] truncate text-gray-700">{listing.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-14">
        <div className="min-w-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            {isSold && <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/45"><span className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-950">Sold</span></div>}
            {images[activeImage] ? (
              <Image src={images[activeImage].url} alt={listing.title} fill priority sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw" className="object-contain p-4 sm:p-8" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400"><ImageIcon className="h-10 w-10" /><p className="text-sm font-medium">No product image available</p></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Product images">
              {images.map((image, index) => (
                <button key={image.id} onClick={() => setActiveImage(index)} aria-label={`View image ${index + 1}`} aria-pressed={activeImage === index} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-gray-50 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 ${activeImage === index ? "border-brand-500" : "border-gray-200 hover:border-gray-400"}`}>
                  <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 border-b border-gray-200 pb-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5"><Tag className="h-4 w-4" />{categoryPath}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{listing.location}</span>
              <span>{CONDITION_LABELS[listing.condition] ?? listing.condition}</span>
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-gray-950 sm:text-4xl">{listing.title}</h1>
          </div>

          <section className="border-b border-gray-200 py-8" aria-labelledby="description-title">
            <h2 id="description-title" className="text-lg font-semibold text-gray-950">About this item</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-gray-600">{listing.description || "The seller has not added a description."}</p>
          </section>

          {listing.attributeValues && listing.attributeValues.length > 0 && (
            <section className="py-8" aria-labelledby="specifications-title">
              <h2 id="specifications-title" className="text-lg font-semibold text-gray-950">Specifications</h2>
              <dl className="mt-5 grid gap-x-8 border-y border-gray-200 sm:grid-cols-2">
                {listing.attributeValues.map((value) => <div key={value.id} className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 text-sm"><dt className="text-gray-500">{value.attribute?.name}</dt><dd className="font-medium text-gray-950">{value.value}</dd></div>)}
              </dl>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_55px_-38px_rgba(17,24,39,0.35)]">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 text-xs">
              <span className="font-medium text-brand-600">{TYPE_LABELS[listing.listingType]}</span>
              <span className="text-gray-400">Listed {timeAgo(listing.createdAt)}</span>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-gray-400">Price</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-gray-950">{formatPrice(listing.price)}</p>
              <div className="mt-5 grid grid-cols-2 divide-x divide-gray-200 border-y border-gray-200 py-4 text-sm">
                <div className="pr-4"><p className="text-xs text-gray-400">Condition</p><p className="mt-1 font-semibold text-gray-900">{CONDITION_LABELS[listing.condition] ?? listing.condition}</p></div>
                <div className="pl-4"><p className="text-xs text-gray-400">Availability</p><p className="mt-1 font-semibold text-gray-900">{isSold ? "Sold" : listing.quantity > 1 ? `${listing.quantity} available` : "Available"}</p></div>
              </div>

              {actionError && <div role="alert" className="mt-5 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{actionError}</div>}
              {actionSuccess && <div role="status" className="mt-5 flex gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{actionSuccess}</div>}

              <div className="mt-5 space-y-3">
                {isOwnListing ? (
                  <Link href={`/listings/${id}/edit`} className="btn-primary flex h-12 w-full items-center justify-center gap-2"><Edit3 className="h-4 w-4" /> Edit listing</Link>
                ) : isSold || !isActive ? (
                  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">This listing is no longer available.</div>
                ) : listing.listingType === "AUCTION" && listing.auction ? (
                  <Link href={`/auctions/${listing.auction.id}`} className="btn-primary flex h-12 w-full items-center justify-center gap-2"><Gavel className="h-4 w-4" /> View auction</Link>
                ) : (
                  <>
                    <button onClick={() => requireUser(() => contactMutation.mutate())} disabled={contactMutation.isPending || !hasHydrated} className="btn-primary flex h-12 w-full items-center justify-center gap-2 disabled:opacity-60"><MessageSquare className="h-4 w-4" />{contactMutation.isPending ? "Opening conversation..." : user ? "Contact seller" : "Sign in to contact"}</button>
                    {listing.listingType === "OFFER" && !actionSuccess && (
                      <button onClick={() => requireUser(() => setShowOfferForm((visible) => !visible))} className="btn-secondary flex h-12 w-full items-center justify-center gap-2"><TrendingUp className="h-4 w-4" />{showOfferForm ? "Close offer form" : "Make an offer"}</button>
                    )}
                    <button onClick={() => requireUser(() => saveMutation.mutate())} disabled={saveMutation.isPending || !hasHydrated} className="btn-secondary flex h-12 w-full items-center justify-center gap-2 disabled:opacity-60"><Heart className={`h-4 w-4 ${listing.isSaved ? "fill-brand-500 text-brand-500" : ""}`} />{listing.isSaved ? "Saved" : "Save listing"}</button>
                  </>
                )}
              </div>

              {showOfferForm && (
                <form onSubmit={(event) => { event.preventDefault(); setActionError(""); const amount = Number(offerAmount); if (!Number.isFinite(amount) || amount <= 0) { setActionError("Enter a valid offer amount."); return; } offerMutation.mutate({ listingId: id, amount, message: offerMessage || undefined }); }} className="mt-5 space-y-4 border-t border-gray-200 pt-5">
                  <label className="block"><span className="text-sm font-medium text-gray-900">Your offer</span><div className="relative mt-2"><span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-gray-400">LKR</span><input type="number" min={1} inputMode="decimal" value={offerAmount} onChange={(event) => setOfferAmount(event.target.value)} className="input h-12 pl-14" required /></div></label>
                  <label className="block"><span className="text-sm font-medium text-gray-900">Message <span className="font-normal text-gray-400">optional</span></span><textarea value={offerMessage} onChange={(event) => setOfferMessage(event.target.value)} maxLength={300} rows={3} placeholder="Add a note for the seller" className="input mt-2 resize-none" /></label>
                  <button type="submit" disabled={offerMutation.isPending} className="btn-primary h-12 w-full disabled:opacity-60">{offerMutation.isPending ? "Sending offer..." : "Send offer"}</button>
                </form>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-gray-400">Seller</p>
            <Link href={`/profile/${listing.seller.id}`} className="mt-3 flex items-center gap-3 group">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">{listing.seller.profile?.firstName?.[0] ?? "?"}</span>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-950 group-hover:text-brand-600">{sellerName}</p>{listing.seller.profile?.location && <p className="mt-1 flex items-center gap-1 text-xs text-gray-400"><MapPin className="h-3 w-3" />{listing.seller.profile.location}</p>}</div>
            </Link>
            {listing.seller.storefront && <Link href={`/store/${listing.seller.storefront.slug}`} className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-sm font-medium text-gray-700 hover:text-brand-600"><span className="flex items-center gap-2"><Store className="h-4 w-4" />{listing.seller.storefront.name}</span><ChevronRight className="h-4 w-4" /></Link>}
          </section>

          <div className="flex items-center justify-between px-1 text-xs text-gray-400"><span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{listing.viewCount} views</span><span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" />{listing.saveCount} saves</span></div>
        </aside>
      </div>
    </div>
  );
}
