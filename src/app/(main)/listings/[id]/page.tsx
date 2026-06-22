"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { formatPrice, timeAgo } from "@/lib/utils";
import {
  MapPin,
  Tag,
  Eye,
  MessageSquare,
  ArrowLeft,
  TrendingUp,
  ExternalLink,
  Heart,
  Star,
  Edit,
  Package,
} from "lucide-react";
import { useState } from "react";

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

const TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  FIXED_PRICE: { label: "Fixed Price", cls: "bg-gray-100 text-gray-600" },
  OFFER: { label: "Accepts Offers", cls: "bg-blue-50 text-blue-600" },
  AUCTION: { label: "Auction", cls: "bg-brand-50 text-brand-600" },
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeImage, setActiveImage] = useState(0);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await api.get(`/listings/${id}`);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      listing?.isSaved
        ? api.delete(`/listings/${id}/save`)
        : api.post(`/listings/${id}/save`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["listing", id] }),
  });

  const submitOffer = useMutation({
    mutationFn: (data: { listingId: string; amount: number; message?: string }) =>
      api.post("/offers", data),
    onSuccess: () => {
      setOfferSuccess(true);
      setShowOfferForm(false);
      setOfferAmount("");
      setOfferMessage("");
    },
    onError: (err: any) => {
      setOfferError(err?.response?.data?.message || "Failed to submit offer");
    },
  });

  const submitReview = useMutation({
    mutationFn: (data: {
      revieweeId: string;
      listingId: string;
      rating: number;
      comment?: string;
    }) => api.post("/reviews", data),
    onSuccess: () => {
      setReviewSuccess(true);
      setShowReviewForm(false);
    },
    onError: (err: any) => {
      setReviewError(err?.response?.data?.message || "Failed to submit review");
    },
  });

  const handleContact = async () => {
    if (!user) { router.push("/login"); return; }
    try {
      const { data } = await api.post(`/conversations/listing/${id}`);
      router.push(`/messages?conversationId=${data.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Could not start conversation");
    }
  };

  const handleSubmitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    setOfferError("");
    submitOffer.mutate({ listingId: id, amount: parseFloat(offerAmount), message: offerMessage || undefined });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    setReviewError("");
    submitReview.mutate({
      revieweeId: listing.seller.id,
      listingId: id,
      rating: reviewRating,
      comment: reviewComment || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-80 rounded-xl bg-gray-100" />
        <div className="h-8 w-1/2 rounded bg-gray-100" />
        <div className="h-4 w-1/4 rounded bg-gray-100" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Package className="mb-4 h-12 w-12 text-gray-300" />
        <p>Listing not found.</p>
        <Link href="/listings" className="btn-primary mt-4">Browse Listings</Link>
      </div>
    );
  }

  const images = listing.media.filter((m: any) => m.type === "IMAGE");
  const isOwnListing = user?.id === listing.seller.id;
  const typeInfo = TYPE_LABELS[listing.listingType] ?? TYPE_LABELS.FIXED_PRICE;
  const isSold = listing.status === "SOLD";
  const isActive = listing.status === "ACTIVE";

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
            {isSold && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
                <span className="rounded-lg bg-black/70 px-4 py-2 text-lg font-bold text-white">SOLD</span>
              </div>
            )}
            {images[activeImage] ? (
              <Image
                src={images[activeImage].url}
                alt={listing.title}
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">📦</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === activeImage ? "border-brand-500" : "border-transparent"
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details panel */}
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
              <div className="flex gap-1.5">
                {listing.isFeatured && (
                  <span className="badge bg-brand-500 text-white">Featured</span>
                )}
                <span className={`badge ${typeInfo.cls}`}>{typeInfo.label}</span>
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-brand-600">
              {formatPrice(listing.price)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {listing.location}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" /> {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {listing.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" /> {listing.saveCount}
            </span>
          </div>

          {/* Meta */}
          <div className="card p-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">Category</span>
                <p className="font-medium text-gray-900">
                  {listing.category.parent
                    ? `${listing.category.parent.name} › ${listing.category.name}`
                    : listing.category.name}
                </p>
              </div>
              {listing.quantity > 1 && (
                <div>
                  <span className="text-gray-500">Quantity</span>
                  <p className="font-medium text-gray-900">{listing.quantity}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Listed</span>
                <p className="font-medium text-gray-900">{timeAgo(listing.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Category attributes */}
          {listing.attributeValues?.length > 0 && (
            <div className="card p-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">Specifications</p>
              <dl className="grid grid-cols-2 gap-1 text-sm">
                {listing.attributeValues.map((av: any) => (
                  <div key={av.id}>
                    <dt className="text-gray-500">{av.attribute?.name}</dt>
                    <dd className="font-medium text-gray-900">{av.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Seller */}
          <div className="card p-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">Seller</p>
            <Link href={`/profile/${listing.seller.id}`} className="flex items-center gap-3 hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600">
                {listing.seller.profile?.firstName?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {listing.seller.profile?.firstName} {listing.seller.profile?.lastName}
                </p>
                {listing.seller.storefront && (
                  <p className="flex items-center gap-1 text-xs text-brand-600">
                    <ExternalLink className="h-3 w-3" /> {listing.seller.storefront.name}
                  </p>
                )}
              </div>
            </Link>
            {listing.seller.storefront && (
              <Link
                href={`/store/${listing.seller.storefront.slug}`}
                className="mt-2 block text-center text-xs text-brand-600 hover:underline"
              >
                View store →
              </Link>
            )}
          </div>

          {/* Feedback messages */}
          {offerSuccess && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Offer submitted! The seller will respond within 3 days.
            </div>
          )}
          {reviewSuccess && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Review submitted. Thank you!
            </div>
          )}

          {/* Action buttons */}
          {!isOwnListing && !isSold && isActive && (
            <div className="space-y-2">
              <button onClick={handleContact} className="btn-primary w-full gap-2">
                <MessageSquare className="h-4 w-4" /> Contact Seller
              </button>

              {/* Save button */}
              {user && (
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className={`w-full gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    listing.isSaved
                      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Heart
                    className={`inline h-4 w-4 ${listing.isSaved ? "fill-red-500 text-red-500" : ""}`}
                  />
                  {listing.isSaved ? " Saved" : " Save listing"}
                </button>
              )}

              {/* Offer flow */}
              {listing.listingType === "OFFER" && !offerSuccess && (
                <>
                  <button
                    onClick={() => { if (!user) { router.push("/login"); return; } setShowOfferForm((v) => !v); }}
                    className="btn-secondary w-full gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    {showOfferForm ? "Cancel Offer" : "Make an Offer"}
                  </button>
                  {showOfferForm && (
                    <form onSubmit={handleSubmitOffer} className="card space-y-3 p-4">
                      {offerError && <p className="text-xs text-red-600">{offerError}</p>}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Your offer (LKR)
                        </label>
                        <input
                          type="number"
                          value={offerAmount}
                          onChange={(e) => setOfferAmount(e.target.value)}
                          className="input text-sm"
                          placeholder={`Listed at ${formatPrice(listing.price)}`}
                          min={1}
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Message (optional)
                        </label>
                        <textarea
                          value={offerMessage}
                          onChange={(e) => setOfferMessage(e.target.value)}
                          className="input min-h-[60px] text-sm"
                          placeholder="Add a note to your offer…"
                          maxLength={300}
                        />
                      </div>
                      <button type="submit" disabled={submitOffer.isPending} className="btn-primary w-full text-sm">
                        {submitOffer.isPending ? "Submitting…" : "Submit Offer"}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* Auction link */}
              {listing.listingType === "AUCTION" && listing.auction && (
                <Link href={`/auctions/${listing.auction.id}`} className="btn-secondary w-full text-center">
                  View Auction
                </Link>
              )}

              {/* Review form for completed transactions */}
              {!reviewSuccess && listing.status !== "ACTIVE" && (
                <>
                  <button
                    onClick={() => { if (!user) { router.push("/login"); return; } setShowReviewForm((v) => !v); }}
                    className="btn-secondary w-full gap-2 text-sm"
                  >
                    <Star className="h-4 w-4" />
                    {showReviewForm ? "Cancel" : "Leave a Review"}
                  </button>
                  {showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="card space-y-3 p-4">
                      {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="text-xl"
                            >
                              <Star
                                className={`h-6 w-6 ${star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Comment (optional)</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="input min-h-[60px] text-sm"
                          placeholder="Share your experience…"
                          maxLength={500}
                        />
                      </div>
                      <button type="submit" disabled={submitReview.isPending} className="btn-primary w-full text-sm">
                        {submitReview.isPending ? "Submitting…" : "Submit Review"}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}

          {/* Own listing actions */}
          {isOwnListing && (
            <div className="space-y-2">
              <Link href={`/listings/${id}/edit`} className="btn-secondary w-full gap-2 text-center">
                <Edit className="inline h-4 w-4" /> Edit Listing
              </Link>
            </div>
          )}

          {/* Saved but not logged in nudge */}
          {!user && !isOwnListing && (
            <Link href="/login" className="btn-secondary w-full gap-2 text-center text-sm">
              <Heart className="inline h-4 w-4" /> Login to save
            </Link>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Description</h2>
        <div className="card p-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {listing.description}
          </p>
        </div>
      </div>
    </div>
  );
}
