"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

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

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/listings/categories");
      return data;
    },
  });

  if (!user) {
    router.push("/login");
    return null;
  }

  const isSeller =
    user.role === "SELLER" || user.role === "BUSINESS_SELLER";
  if (!isSeller) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-gray-600">
          You need a seller subscription to create listings.
        </p>
        <a href="/subscriptions" className="btn-primary">
          View Plans
        </a>
      </div>
    );
  }

  const set = (field: string) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.length < 10 || form.title.length > 120) {
      setError("Title must be between 10 and 120 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/listings", {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
      });
      router.push(`/listings/${data.id}`);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to create listing. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Listing</h1>

      <form onSubmit={handleSubmit} className="card space-y-5 p-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Title <span className="text-gray-400">(10–120 chars)</span>
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
          <p className="mt-1 text-right text-xs text-gray-400">
            {form.title.length}/120
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={set("description")}
            className="input min-h-32 resize-y"
            placeholder="Describe your item in detail…"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={set("categoryId")}
              className="input"
              required
            >
              <option value="">Select category</option>
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
              Condition
            </label>
            <select
              value={form.condition}
              onChange={set("condition")}
              className="input"
            >
              <option value="NEW">New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Price (LKR)
            </label>
            <input
              type="number"
              value={form.price}
              onChange={set("price")}
              className="input"
              placeholder="0"
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
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            value={form.location}
            onChange={set("location")}
            className="input"
            placeholder="e.g. Colombo 03"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Listing Type
          </label>
          <select
            value={form.listingType}
            onChange={set("listingType")}
            className="input"
          >
            <option value="FIXED_PRICE">Fixed Price</option>
            <option value="OFFER">Accept Offers</option>
            <option value="AUCTION">Auction</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Creating…" : "Create Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
