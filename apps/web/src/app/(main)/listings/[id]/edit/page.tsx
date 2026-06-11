"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { ChevronLeft } from "lucide-react";

const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"] as const;

export default function EditListingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await api.get(`/listings/${id}`);
      return data;
    },
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    condition: "GOOD",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (listing) {
      setForm({
        title: listing.title ?? "",
        description: listing.description ?? "",
        price: String(listing.price ?? ""),
        location: listing.location ?? "",
        condition: listing.condition ?? "GOOD",
      });
    }
  }, [listing]);

  // Redirect if not own listing
  useEffect(() => {
    if (listing && user && listing.seller?.id !== user.id) {
      router.push(`/listings/${id}`);
    }
  }, [listing, user, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/listings/${id}`, {
        ...form,
        price: parseFloat(form.price),
      });
      router.push(`/listings/${id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-gray-100" />
        <div className="h-64 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!listing) return <div className="text-gray-500">Listing not found.</div>;

  const canEdit = !["SOLD", "ARCHIVED"].includes(listing.status);

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Listing</h1>

      {!canEdit && (
        <div className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
          This listing is {listing.status.toLowerCase()} and cannot be edited.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input"
            placeholder="e.g. Sony PlayStation 5 Console"
            minLength={10}
            maxLength={120}
            required
            disabled={!canEdit}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {form.title.length}/120
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="input min-h-[140px]"
            placeholder="Describe your item in detail..."
            required
            disabled={!canEdit}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Price (LKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              className="input"
              min={0}
              step={0.01}
              required
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Condition <span className="text-red-500">*</span>
            </label>
            <select
              value={form.condition}
              onChange={(e) =>
                setForm((f) => ({ ...f, condition: e.target.value }))
              }
              className="input"
              required
              disabled={!canEdit}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
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
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
            className="input"
            placeholder="e.g. Colombo, Sri Lanka"
            required
            disabled={!canEdit}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push(`/listings/${id}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !canEdit}
            className="btn-primary"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
