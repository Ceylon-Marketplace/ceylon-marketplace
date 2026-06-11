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
} from "lucide-react";
import { useState } from "react";

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

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await api.get(`/listings/${id}`);
      return data;
    },
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

  const handleContact = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
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
    submitOffer.mutate({
      listingId: id,
      amount: parseFloat(offerAmount),
      message: offerMessage || undefined,
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

  if (!listing) return <div>Listing not found</div>;

  const images = listing.media.filter((m: any) => m.type === "IMAGE");
  const isOwnListing = user?.id === listing.seller.id;

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
            {images[activeImage] ? (
              <Image
                src={images[activeImage].url}
                alt={listing.title}
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">
                📦
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === activeImage
                      ? "border-brand-500"
                      : "border-transparent"
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {listing.title}
              </h1>
              {listing.isFeatured && (
                <span className="badge bg-brand-500 text-white">Featured</span>
              )}
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
              <Tag className="h-4 w-4" /> {listing.condition}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {listing.viewCount} views
            </span>
          </div>

          <div className="card p-4">
            <p className="text-sm font-medium text-gray-700">
              Category:{" "}
              <span className="text-gray-500">{listing.category.name}</span>
            </p>
            {listing.quantity > 1 && (
              <p className="mt-1 text-sm font-medium text-gray-700">
                Quantity:{" "}
                <span className="text-gray-500">{listing.quantity}</span>
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Listed {timeAgo(listing.createdAt)}
            </p>
          </div>

          {/* Seller */}
          <div className="card p-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">Seller</p>
            <Link
              href={`/profile/${listing.seller.id}`}
              className="flex items-center gap-3 hover:opacity-80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600">
                {listing.seller.profile?.firstName?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {listing.seller.profile?.firstName}{" "}
                  {listing.seller.profile?.lastName}
                </p>
                {listing.seller.storefront && (
                  <p className="text-xs text-brand-600 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {listing.seller.storefront.name}
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

          {offerSuccess && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Your offer was submitted successfully!
            </div>
          )}

          {!isOwnListing && (
            <div className="space-y-2">
              <button onClick={handleContact} className="btn-primary w-full gap-2">
                <MessageSquare className="h-4 w-4" /> Contact Seller
              </button>
              {listing.listingType === "OFFER" && !offerSuccess && (
                <>
                  <button
                    onClick={() => {
                      if (!user) { router.push("/login"); return; }
                      setShowOfferForm((v) => !v);
                    }}
                    className="btn-secondary w-full gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    {showOfferForm ? "Cancel Offer" : "Make an Offer"}
                  </button>
                  {showOfferForm && (
                    <form
                      onSubmit={handleSubmitOffer}
                      className="card space-y-3 p-4"
                    >
                      {offerError && (
                        <p className="text-xs text-red-600">{offerError}</p>
                      )}
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
                          placeholder="Add a message to your offer..."
                          maxLength={300}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitOffer.isPending}
                        className="btn-primary w-full text-sm"
                      >
                        {submitOffer.isPending ? "Submitting..." : "Submit Offer"}
                      </button>
                    </form>
                  )}
                </>
              )}
              {listing.listingType === "AUCTION" && listing.auction && (
                <Link
                  href={`/auctions/${listing.auction.id}`}
                  className="btn-secondary w-full text-center"
                >
                  View Auction
                </Link>
              )}
            </div>
          )}
          {isOwnListing && (
            <Link
              href={`/listings/${id}/edit`}
              className="btn-secondary w-full text-center"
            >
              Edit Listing
            </Link>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Description
        </h2>
        <div className="card p-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {listing.description}
          </p>
        </div>
      </div>
    </div>
  );
}
