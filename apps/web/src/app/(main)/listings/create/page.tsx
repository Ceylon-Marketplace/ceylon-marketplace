"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import {
  Plus,
  X,
  ImageIcon,
  ChevronLeft,
  Info,
  CheckCircle,
  Clock,
  Gavel,
  FileText,
  Store,
} from "lucide-react";

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

type MediaItem = { url: string; type: "IMAGE" | "VIDEO"; order: number };
type AttributeValue = { attributeId: string; value: string };

const EMPTY_AUCTION = {
  startPrice: "",
  reservePrice: "",
  bidIncrement: "100",
  startTime: "",
  endTime: "",
};

function SuccessScreen({
  listingId,
  isDraft,
  hasAuction,
  onCreateAnother,
}: {
  listingId: string;
  isDraft: boolean;
  hasAuction: boolean;
  onCreateAnother: () => void;
}) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mb-6 flex justify-center">
        {isDraft ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        )}
      </div>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        {isDraft ? "Draft saved!" : "Listing submitted!"}
      </h1>

      {isDraft ? (
        <p className="mb-6 text-gray-500">
          Your listing has been saved as a draft. You can edit and submit it for
          review whenever you&apos;re ready.
        </p>
      ) : (
        <>
          <p className="mb-4 text-gray-500">
            Your listing is now under review by our team. This usually takes{" "}
            <strong>1–2 business days</strong>.
          </p>
          {hasAuction && (
            <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50 p-4 text-left text-sm text-brand-800">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Gavel className="h-4 w-4" /> Auction configured
              </div>
              Your auction will go live automatically once the listing is approved.
              You&apos;ll receive a notification when it&apos;s active.
            </div>
          )}
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4" /> What happens next?
            </div>
            <ul className="ml-4 list-disc space-y-1">
              <li>Our moderators will review your listing for quality and compliance.</li>
              <li>You&apos;ll be notified once it&apos;s approved or if changes are needed.</li>
              <li>Approved listings become visible to all buyers immediately.</li>
            </ul>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button onClick={() => router.push(`/listings/${listingId}`)} className="btn-primary">
          View listing
        </button>
        <button onClick={() => router.push("/listings/mine")} className="btn-secondary">
          My listings
        </button>
        <button onClick={onCreateAnother} className="btn-secondary">
          Create another
        </button>
      </div>
    </div>
  );
}

export default function CreateListingPage() {
  const { user, mode, setMode } = useAuthStore();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    listingId: string;
    isDraft: boolean;
    hasAuction: boolean;
  } | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    condition: "GOOD",
    price: "",
    quantity: "1",
    location: "",
    listingType: "FIXED_PRICE",
  });

  const [auctionForm, setAuctionForm] = useState(EMPTY_AUCTION);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [attributes, setAttributes] = useState<AttributeValue[]>([]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/listings/categories");
      return data;
    },
  });

  const selectedCategory = categories
    ?.flatMap((c: any) => [c, ...(c.children ?? [])])
    .find((c: any) => c.id === form.categoryId);

  const categoryAttributes: any[] = selectedCategory?.attributes ?? [];

  useEffect(() => {
    setAttributes(categoryAttributes.map((a: any) => ({ attributeId: a.id, value: "" })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.categoryId]);

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user) return null;

  const isSeller = user.role === "SELLER" || user.role === "BUSINESS_SELLER";

  // Pure buyer — needs to upgrade account first
  if (!isSeller) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <Store className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Seller account required</h2>
        <p className="mb-4 text-sm text-gray-500">
          You need a seller account to create listings. Upgrading is free — you
          only pay for a subscription plan when you're ready to list.
        </p>
        <Link href="/become-seller" className="btn-primary">
          Become a Seller
        </Link>
      </div>
    );
  }

  // Seller but currently in buyer mode
  if (mode !== "seller") {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <Info className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h2 className="mb-2 text-lg font-semibold text-gray-900">You're in buyer mode</h2>
        <p className="mb-4 text-sm text-gray-500">
          Switch to seller mode to create and manage your listings.
        </p>
        <button
          onClick={() => { setMode("seller"); router.push("/listings/create"); }}
          className="btn-primary"
        >
          Switch to Seller Mode
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <SuccessScreen
        listingId={success.listingId}
        isDraft={success.isDraft}
        hasAuction={success.hasAuction}
        onCreateAnother={() => {
          setSuccess(null);
          setForm({
            title: "",
            description: "",
            categoryId: "",
            condition: "GOOD",
            price: "",
            quantity: "1",
            location: "",
            listingType: "FIXED_PRICE",
          });
          setAuctionForm(EMPTY_AUCTION);
          setMediaItems([]);
          setAttributes([]);
          setError("");
        }}
      />
    );
  }

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const setAuction =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setAuctionForm((f) => ({ ...f, [field]: e.target.value }));

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    if (mediaItems.filter((m) => m.type === "IMAGE").length >= 10) {
      setError("Maximum 10 images allowed.");
      return;
    }
    setMediaItems((prev) => [...prev, { url, type: "IMAGE", order: prev.length }]);
    setNewImageUrl("");
  };

  const removeMedia = (index: number) => {
    setMediaItems((prev) =>
      prev.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i })),
    );
  };

  const validateAuction = (): string | null => {
    if (!auctionForm.startPrice || Number(auctionForm.startPrice) <= 0)
      return "Auction start price must be greater than 0.";
    if (!auctionForm.startTime) return "Auction start time is required.";
    if (!auctionForm.endTime) return "Auction end time is required.";
    const start = new Date(auctionForm.startTime);
    const end = new Date(auctionForm.endTime);
    if (start >= end) return "Auction end time must be after start time.";
    if (start <= new Date()) return "Auction start time must be in the future.";
    if (
      auctionForm.reservePrice &&
      Number(auctionForm.reservePrice) < Number(auctionForm.startPrice)
    )
      return "Reserve price must be at least equal to the start price.";
    return null;
  };

  const doSubmit = async (submitStatus: "DRAFT" | "PENDING_REVIEW") => {
    if (form.title.length < 10 || form.title.length > 120) {
      setError("Title must be between 10 and 120 characters.");
      return;
    }
    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }
    if (submitStatus !== "DRAFT" && form.listingType === "AUCTION") {
      const auctionError = validateAuction();
      if (auctionError) { setError(auctionError); return; }
    }

    setSubmitting(true);
    setError("");
    try {
      const filteredAttributes = attributes.filter((a) => a.value.trim());
      const { data } = await api.post("/listings", {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
        media: mediaItems,
        attributes: filteredAttributes,
        status: submitStatus,
      });

      let hasAuction = false;
      if (submitStatus !== "DRAFT" && form.listingType === "AUCTION") {
        try {
          await api.post("/auctions", {
            listingId: data.id,
            startPrice: Number(auctionForm.startPrice),
            reservePrice: auctionForm.reservePrice ? Number(auctionForm.reservePrice) : undefined,
            bidIncrement: auctionForm.bidIncrement ? Number(auctionForm.bidIncrement) : 100,
            startTime: auctionForm.startTime,
            endTime: auctionForm.endTime,
          });
          hasAuction = true;
        } catch (auctionErr: any) {
          setError(
            `Listing created but auction setup failed: ${auctionErr?.response?.data?.message ?? "unknown error"}. You can configure the auction from the edit page.`,
          );
          setSubmitting(false);
          router.push(`/listings/${data.id}/edit`);
          return;
        }
      }

      setSuccess({ listingId: data.id, isDraft: submitStatus === "DRAFT", hasAuction });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAuction = form.listingType === "AUCTION";

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Listing</h1>

      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {/* Basic details */}
        <section className="card space-y-5 p-6">
          <h2 className="font-semibold text-gray-900">Basic Details</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
              <span className="ml-1 text-xs text-gray-400">(10–120 characters)</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              className="input"
              placeholder="e.g. iPhone 14 Pro Max 256GB Space Black"
              maxLength={120}
            />
            <p className="mt-1 text-right text-xs text-gray-400">{form.title.length}/120</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={set("description")}
              className="input min-h-[140px] resize-y"
              placeholder="Describe your item in detail — condition, history, included accessories…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.categoryId}
                onChange={set("categoryId")}
                className="input"
              >
                <option value="">Select category…</option>
                {categories?.map((c: any) => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.name}</option>
                    {c.children?.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        — {sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Condition <span className="text-red-500">*</span>
              </label>
              <select value={form.condition} onChange={set("condition")} className="input">
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {isAuction ? "Starting Bid (LKR)" : "Price (LKR)"}
                <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.price}
                onChange={set("price")}
                className="input"
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={set("quantity")}
                className="input"
                min={1}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Listing Type
              </label>
              <select value={form.listingType} onChange={set("listingType")} className="input">
                <option value="FIXED_PRICE">Fixed Price</option>
                <option value="OFFER">Accept Offers</option>
                <option value="AUCTION">Auction</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={set("location")}
              className="input"
              placeholder="e.g. Colombo 03, Sri Lanka"
            />
          </div>
        </section>

        {/* Auction settings — shown only when type is AUCTION */}
        {isAuction && (
          <section className="card space-y-5 p-6">
            <div className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold text-gray-900">Auction Settings</h2>
            </div>
            <p className="text-sm text-gray-500">
              Configure your auction. It will go live automatically once your listing is approved.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Price (LKR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={auctionForm.startPrice}
                  onChange={setAuction("startPrice")}
                  className="input"
                  placeholder="0.00"
                  min={1}
                  step={0.01}
                />
                <p className="mt-1 text-xs text-gray-400">Minimum opening bid</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Reserve Price (LKR)
                  <span className="ml-1 text-xs text-gray-400">(optional)</span>
                </label>
                <input
                  type="number"
                  value={auctionForm.reservePrice}
                  onChange={setAuction("reservePrice")}
                  className="input"
                  placeholder="Hidden minimum"
                  min={0}
                  step={0.01}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Auction completes only if bidding exceeds this
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bid Increment (LKR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={auctionForm.bidIncrement}
                  onChange={setAuction("bidIncrement")}
                  className="input"
                  placeholder="100"
                  min={1}
                  step={1}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Each new bid must exceed current by at least this amount
                </p>
              </div>

              <div />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={auctionForm.startTime}
                  onChange={setAuction("startTime")}
                  className="input"
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={auctionForm.endTime}
                  onChange={setAuction("endTime")}
                  className="input"
                  min={
                    auctionForm.startTime ||
                    new Date(Date.now() + 60000).toISOString().slice(0, 16)
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
              <strong>Anti-sniping:</strong> Bids placed in the last 2 minutes automatically
              extend the auction by 2 minutes.
            </div>
          </section>
        )}

        {/* Category attributes */}
        {categoryAttributes.length > 0 && (
          <section className="card space-y-4 p-6">
            <h2 className="font-semibold text-gray-900">
              {selectedCategory?.name} Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {categoryAttributes.map((attr: any, idx: number) => (
                <div key={attr.id}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {attr.name}
                    {attr.required && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  {attr.options?.length > 0 ? (
                    <select
                      value={attributes[idx]?.value ?? ""}
                      onChange={(e) =>
                        setAttributes((prev) =>
                          prev.map((a, i) => i === idx ? { ...a, value: e.target.value } : a),
                        )
                      }
                      className="input"
                    >
                      <option value="">Select…</option>
                      {attr.options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={attributes[idx]?.value ?? ""}
                      onChange={(e) =>
                        setAttributes((prev) =>
                          prev.map((a, i) => i === idx ? { ...a, value: e.target.value } : a),
                        )
                      }
                      className="input"
                      placeholder={attr.name}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Photos */}
        <section className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Photos</h2>
            <span className="text-xs text-gray-400">
              {mediaItems.filter((m) => m.type === "IMAGE").length}/10 images
            </span>
          </div>

          {mediaItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {mediaItems.map((m, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={`Image ${i + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:flex"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
                className="input pl-9"
                placeholder="Paste image URL and press Add…"
              />
            </div>
            <button
              type="button"
              onClick={addImage}
              disabled={
                !newImageUrl.trim() ||
                mediaItems.filter((m) => m.type === "IMAGE").length >= 10
              }
              className="btn-secondary gap-1 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Paste direct image URLs. The first image becomes the cover photo.
          </p>
        </section>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => doSubmit("DRAFT")}
            disabled={submitting}
            className="btn-secondary gap-1.5 disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            {submitting ? "Saving…" : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={() => doSubmit("PENDING_REVIEW")}
            disabled={submitting}
            className="btn-primary gap-1.5 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {submitting ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
