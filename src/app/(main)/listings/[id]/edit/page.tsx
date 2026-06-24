"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { ImageUploader } from "@/components/image-uploader";
import { ChevronLeft, Trash2 } from "lucide-react";

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

type ExistingMedia = { id: string; url: string; type: string; order: number };
type UploadedImage = { url: string; order: number; isUploading?: boolean; uploadProgress?: number; error?: string };
type AttributeValue = { attributeId: string; value: string };

export default function EditListingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing-edit", id],
    queryFn: async () => {
      const { data } = await api.get(`/listings/${id}`);
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    },
  });

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

  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);
  const [attributes, setAttributes] = useState<AttributeValue[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!listing) return;
    setForm({
      title: listing.title ?? "",
      description: listing.description ?? "",
      categoryId: listing.categoryId ?? "",
      condition: listing.condition ?? "GOOD",
      price: String(listing.price ?? ""),
      quantity: String(listing.quantity ?? 1),
      location: listing.location ?? "",
      listingType: listing.listingType ?? "FIXED_PRICE",
    });
    setExistingMedia(listing.media ?? []);
    const existingAttrs = listing.attributeValues?.map((av: any) => ({
      attributeId: av.attributeId,
      value: av.value,
    })) ?? [];
    setAttributes(existingAttrs);
  }, [listing]);

  useEffect(() => {
    if (listing && user && listing.seller?.id !== user.id) {
      router.push(`/listings/${id}`);
    }
  }, [listing, user, id, router]);

  const selectedCategory = categories
    ?.flatMap((c: any) => [c, ...(c.children ?? [])])
    .find((c: any) => c.id === form.categoryId);

  const categoryAttributes: any[] = selectedCategory?.attributes ?? [];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 mx-auto max-w-2xl">
        <div className="h-8 w-1/3 rounded bg-gray-100" />
        <div className="h-64 rounded-xl bg-gray-100" />
        <div className="h-48 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!listing) return <div className="text-gray-500">Listing not found.</div>;

  const canEdit = listing.status !== "SOLD" && listing.status !== "ARCHIVED";

  const set = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const removeExisting = (mediaId: string) => {
    setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
    setRemovedMediaIds((prev) => [...prev, mediaId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.length < 10 || form.title.length > 120) {
      setError("Title must be 10–120 characters.");
      return;
    }

    // Filter out errored and uploading images
    const validNewImages = newImages.filter((img) => !img.error && img.url && !img.isUploading);

    setSaving(true);
    setError("");
    try {
      await api.patch(`/listings/${id}`, {
        ...form,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
        mediaToAdd: validNewImages.map((img) => ({
          url: img.url,
          type: "IMAGE",
          order: existingMedia.length + newImages.indexOf(img),
        })),
        mediaToRemove: removedMediaIds,
        attributes: attributes.filter((a) => a.value.trim()),
      });
      router.push(`/listings/${id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Archive this listing? It will no longer appear in search results.")) return;
    setDeleting(true);
    try {
      await api.delete(`/listings/${id}`);
      router.push("/listings/mine");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to archive listing.");
    } finally {
      setDeleting(false);
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

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || !canEdit}
          className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Archiving…" : "Archive"}
        </button>
      </div>

      {!canEdit && (
        <div className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
          This listing is <strong>{listing.status.replace("_", " ")}</strong> and cannot be
          edited. Archive it to remove from search.
        </div>
      )}

      {listing.status === "ACTIVE" && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>This listing is live.</strong> Saving any changes will take it offline and resubmit it for admin review. It will not be visible to buyers until approved again.
        </div>
      )}

      {listing.status === "PENDING_REVIEW" && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          This listing is pending review. Changes will keep it in the review queue.
        </div>
      )}

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
              minLength={10}
              maxLength={120}
              required
              disabled={!canEdit}
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
              required
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Condition</label>
              <select
                value={form.condition}
                onChange={set("condition")}
                className="input"
                disabled={!canEdit}
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Listing Type</label>
              <select
                value={form.listingType}
                onChange={set("listingType")}
                className="input"
                disabled={!canEdit}
              >
                <option value="FIXED_PRICE">Fixed Price</option>
                <option value="OFFER">Accept Offers</option>
                <option value="AUCTION">Auction</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price (LKR)</label>
              <input
                type="number"
                value={form.price}
                onChange={set("price")}
                className="input"
                min={0}
                step={0.01}
                required
                disabled={!canEdit}
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
                disabled={!canEdit}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={set("location")}
              className="input"
              required
              disabled={!canEdit}
            />
          </div>
        </section>

        {/* Category attributes */}
        {categoryAttributes.length > 0 && (
          <section className="card space-y-4 p-6">
            <h2 className="font-semibold text-gray-900">{selectedCategory?.name} Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {categoryAttributes.map((attr: any) => {
                const current = attributes.find((a) => a.attributeId === attr.id);
                return (
                  <div key={attr.id}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {attr.name}
                      {attr.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                    {attr.options?.length > 0 ? (
                      <select
                        value={current?.value ?? ""}
                        onChange={(e) =>
                          setAttributes((prev) => {
                            const exists = prev.find((a) => a.attributeId === attr.id);
                            if (exists) return prev.map((a) => a.attributeId === attr.id ? { ...a, value: e.target.value } : a);
                            return [...prev, { attributeId: attr.id, value: e.target.value }];
                          })
                        }
                        className="input"
                        disabled={!canEdit}
                      >
                        <option value="">Select…</option>
                        {attr.options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={current?.value ?? ""}
                        onChange={(e) =>
                          setAttributes((prev) => {
                            const exists = prev.find((a) => a.attributeId === attr.id);
                            if (exists) return prev.map((a) => a.attributeId === attr.id ? { ...a, value: e.target.value } : a);
                            return [...prev, { attributeId: attr.id, value: e.target.value }];
                          })
                        }
                        className="input"
                        disabled={!canEdit}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Photos */}
        <section className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Photos</h2>
            <span className="text-xs text-gray-400">
              {existingMedia.filter((m) => m.type === "IMAGE").length + newImages.filter((m) => !m.error && m.url).length}/10
            </span>
          </div>

          {/* Existing images */}
          {existingMedia.filter((m) => m.type === "IMAGE").length > 0 && (
            <>
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Existing Images</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {existingMedia.filter((m) => m.type === "IMAGE").map((m, i) => (
                    <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt="" className="h-full w-full object-cover" />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => removeExisting(m.id)}
                          className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:flex"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {canEdit && (
            <>
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Add New Images</p>
                <ImageUploader
                  images={newImages}
                  onImagesChange={setNewImages}
                  maxImages={10 - existingMedia.filter((m) => m.type === "IMAGE").length}
                  listingId={id}
                />
              </div>
            </>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push(`/listings/${id}`)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving || !canEdit} className="btn-primary">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
