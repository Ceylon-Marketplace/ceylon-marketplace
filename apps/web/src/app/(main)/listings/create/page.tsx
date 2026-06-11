"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Plus, X, ImageIcon, ChevronLeft, Info } from "lucide-react";

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

type MediaItem = { url: string; type: "IMAGE" | "VIDEO"; order: number };
type AttributeValue = { attributeId: string; value: string };

export default function CreateListingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  // Find selected category (including subcategories) to get its attributes
  const selectedCategory = categories
    ?.flatMap((c: any) => [c, ...(c.children ?? [])])
    .find((c: any) => c.id === form.categoryId);

  const categoryAttributes: any[] = selectedCategory?.attributes ?? [];

  // Reset attributes when category changes
  useEffect(() => {
    setAttributes(categoryAttributes.map((a: any) => ({ attributeId: a.id, value: "" })));
  }, [form.categoryId]);

  if (!user) { router.push("/login"); return null; }

  const isSeller = user.role === "SELLER" || user.role === "BUSINESS_SELLER";
  if (!isSeller) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <Info className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Seller account required</h2>
        <p className="mb-4 text-sm text-gray-500">
          You need a seller subscription to create listings.
        </p>
        <Link href="/subscriptions" className="btn-primary">
          View Subscription Plans
        </Link>
      </div>
    );
  }

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.length < 10 || form.title.length > 120) {
      setError("Title must be between 10 and 120 characters.");
      return;
    }
    if (!form.categoryId) {
      setError("Please select a category.");
      return;
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
      });
      router.push(`/listings/${data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create listing. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              minLength={10}
              maxLength={120}
              required
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
              required
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
                required
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
                Price (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.price}
                onChange={set("price")}
                className="input"
                placeholder="0.00"
                min={0}
                step={0.01}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Quantity
              </label>
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
              required
            />
          </div>
        </section>

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
                          prev.map((a, i) =>
                            i === idx ? { ...a, value: e.target.value } : a,
                          ),
                        )
                      }
                      className="input"
                      required={attr.required}
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
                          prev.map((a, i) =>
                            i === idx ? { ...a, value: e.target.value } : a,
                          ),
                        )
                      }
                      className="input"
                      placeholder={attr.name}
                      required={attr.required}
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
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={`Image ${i + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
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
              disabled={!newImageUrl.trim() || mediaItems.filter((m) => m.type === "IMAGE").length >= 10}
              className="btn-secondary gap-1 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Paste direct image URLs (e.g. from Imgur, CDN). First image is the cover photo.
          </p>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Creating…" : "Submit Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
