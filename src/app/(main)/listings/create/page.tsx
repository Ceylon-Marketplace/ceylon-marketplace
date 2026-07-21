"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { ImageUploader } from "@/components/image-uploader";
import {
  AlertCircle,
  ChevronLeft,
  Info,
  CheckCircle,
  Clock,
  CircleDollarSign,
  Gavel,
  FileText,
  Image as ImageIcon,
  MapPin,
  Package,
  ShieldCheck,
  Store,
  Tag,
} from "lucide-react";

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

type UploadedImage = {
  url: string;
  order: number;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
};
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
    <div className="mx-auto max-w-2xl py-12 text-center sm:py-20">
      <div className="mb-7 flex justify-center">
        {isDraft ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <FileText className="h-6 w-6 text-gray-500" />
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
            <CheckCircle className="h-6 w-6 text-brand-600" />
          </div>
        )}
      </div>

      <h1 className="text-3xl font-semibold tracking-[-0.035em] text-gray-950 sm:text-4xl">
        {isDraft ? "Draft saved" : "Listing submitted"}
      </h1>

      {isDraft ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
          Continue editing from My listings and submit it whenever it is ready.
        </p>
      ) : (
        <div className="mx-auto mt-3 max-w-lg">
          <p className="text-sm leading-6 text-gray-500">
            Your listing is awaiting marketplace review. We will notify you when its status changes.
          </p>
          {hasAuction && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-left text-sm text-gray-600">
              <Gavel className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <div>
                <p className="font-semibold text-gray-900">Auction schedule saved</p>
                <p className="mt-1 leading-6">Your auction settings are connected to this listing.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={() => router.push(`/listings/${listingId}`)}
          className="btn-primary"
        >
          View listing
        </button>
        <button
          onClick={() => router.push("/listings/mine")}
          className="btn-secondary"
        >
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
  const { user, mode, setMode, hasHydrated } = useAuthStore();
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
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [attributes, setAttributes] = useState<AttributeValue[]>([]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    },
  });

  const selectedCategory = categories
    ?.flatMap((c: any) => [c, ...(c.children ?? [])])
    .find((c: any) => c.id === form.categoryId);

  const categoryAttributes: any[] = selectedCategory?.attributes ?? [];

  useEffect(() => {
    setAttributes(
      categoryAttributes.map((a: any) => ({ attributeId: a.id, value: "" })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.categoryId]);

  useEffect(() => {
    if (hasHydrated && !user) {
      router.replace(`/login?next=${encodeURIComponent("/listings/create")}`);
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return <CreateListingSkeleton />;

  const isSeller = user.role === "SELLER" || user.role === "BUSINESS_SELLER";

  // Pure buyer needs to upgrade account first
  if (!isSeller) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <Store className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Seller account required
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          You need a seller account to create listings. Upgrading is free. You
          only pay for a subscription plan when you&apos;re ready to list.
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
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          You're in buyer mode
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Switch to seller mode to create and manage your listings.
        </p>
        <button
          onClick={() => {
            setMode("seller");
            router.push("/listings/create");
          }}
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
          setUploadedImages([]);
          setAttributes([]);
          setError("");
        }}
      />
    );
  }

  const set =
    (field: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const setAuction =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setAuctionForm((f) => ({ ...f, [field]: e.target.value }));

  const setAuctionStartPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAuctionForm((current) => ({ ...current, startPrice: value }));
    setForm((current) => ({ ...current, price: value }));
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

    // Convert uploaded images to media items
    const validImages = uploadedImages.filter((img) => !img.error && img.url);
    if (validImages.length === 0) {
      setError("Please upload at least one image.");
      return;
    }

    const mediaItems: MediaItem[] = validImages.map((img, idx) => ({
      url: img.url,
      type: "IMAGE" as const,
      order: idx,
    }));

    if (submitStatus !== "DRAFT" && form.listingType === "AUCTION") {
      const auctionError = validateAuction();
      if (auctionError) {
        setError(auctionError);
        return;
      }
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
            reservePrice: auctionForm.reservePrice
              ? Number(auctionForm.reservePrice)
              : undefined,
            bidIncrement: auctionForm.bidIncrement
              ? Number(auctionForm.bidIncrement)
              : 100,
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

      setSuccess({
        listingId: data.id,
        isDraft: submitStatus === "DRAFT",
        hasAuction,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to create listing. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isAuction = form.listingType === "AUCTION";
  const validImageCount = uploadedImages.filter(
    (image) => image.url && !image.error && !image.isUploading,
  ).length;
  const completedEssentials = [
    form.title.length >= 10,
    Boolean(form.categoryId),
    Boolean(form.location.trim()),
    validImageCount > 0,
    isAuction
      ? Boolean(auctionForm.startPrice && auctionForm.startTime && auctionForm.endTime)
      : Boolean(form.price),
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-950">
        <ChevronLeft className="h-4 w-4" /> Back to listings
      </button>

      <header className="border-b border-gray-200 pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Seller workspace</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-gray-950 sm:text-5xl">Create a listing</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">Give buyers the details they need to understand your item and decide with confidence.</p>
      </header>

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          <FormSection icon={Tag} title="What are you selling?" description="Start with the details buyers scan first.">
            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label htmlFor="listing-title" className="text-sm font-medium text-gray-800">Listing title <span className="text-brand-600">*</span></label>
                <span className="text-xs tabular-nums text-gray-400">{form.title.length}/120</span>
              </div>
              <input id="listing-title" type="text" value={form.title} onChange={set("title")} className="input h-12" placeholder="iPhone 14 Pro Max, 256GB, Space Black" maxLength={120} />
              <p className="mt-2 text-xs text-gray-500">Use 10-120 characters. Include the brand, model, and defining detail.</p>
            </div>
            <div>
              <label htmlFor="listing-description" className="mb-2 block text-sm font-medium text-gray-800">Description <span className="text-brand-600">*</span></label>
              <textarea id="listing-description" value={form.description} onChange={set("description")} className="input min-h-[160px] resize-y py-3" placeholder="Describe the condition, history, included accessories, and anything a buyer should know." />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category" required>
                <select value={form.categoryId} onChange={set("categoryId")} className="input h-12">
                  <option value="">Choose a category</option>
                  {categories?.map((category: any) => (
                    <optgroup key={category.id} label={category.name}>
                      <option value={category.id}>{category.name}</option>
                      {category.children?.map((child: any) => <option key={child.id} value={child.id}>{child.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label="Condition" required>
                <select value={form.condition} onChange={set("condition")} className="input h-12">
                  {CONDITIONS.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection icon={CircleDollarSign} title="Choose how to sell" description="Pick one format. You can save the listing as a draft at any time.">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "FIXED_PRICE", title: "Fixed price", body: "Sell at one set price.", icon: Tag },
                { value: "OFFER", title: "Accept offers", body: "Let buyers negotiate.", icon: CircleDollarSign },
                { value: "AUCTION", title: "Auction", body: "Let buyers compete.", icon: Gavel },
              ].map((option) => {
                const OptionIcon = option.icon;
                const selected = form.listingType === option.value;
                return <label key={option.value} className={`cursor-pointer rounded-2xl border p-4 transition ${selected ? "border-brand-500 bg-brand-50/60" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="listingType" value={option.value} checked={selected} onChange={set("listingType")} className="sr-only" />
                  <OptionIcon className={`h-5 w-5 ${selected ? "text-brand-600" : "text-gray-400"}`} />
                  <span className="mt-4 block text-sm font-semibold text-gray-950">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-gray-500">{option.body}</span>
                </label>;
              })}
            </div>

            {!isAuction && <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Price (LKR)" required><input type="number" value={form.price} onChange={set("price")} className="input h-12" placeholder="0.00" min={0} step={0.01} /></Field>
              <Field label="Quantity"><input type="number" value={form.quantity} onChange={set("quantity")} className="input h-12" min={1} /></Field>
            </div>}

            <Field label="Item location" required icon={MapPin}><input type="text" value={form.location} onChange={set("location")} className="input h-12" placeholder="Colombo 03, Sri Lanka" /></Field>
          </FormSection>

          <FormSection icon={ImageIcon} title="Add clear photos" description="The first image becomes the cover. Add up to 10 images from different angles.">
            <ImageUploader images={uploadedImages} onImagesChange={setUploadedImages} maxImages={10} />
          </FormSection>

          {categoryAttributes.length > 0 && (
            <FormSection icon={Package} title={`${selectedCategory?.name} details`} description="These details help buyers compare similar listings.">
              <div className="grid gap-5 sm:grid-cols-2">
                {categoryAttributes.map((attribute: any, index: number) => (
                  <Field key={attribute.id} label={attribute.name} required={attribute.required}>
                    {attribute.options?.length > 0 ? (
                      <select value={attributes[index]?.value ?? ""} onChange={(event) => setAttributes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} className="input h-12">
                        <option value="">Choose {attribute.name.toLowerCase()}</option>
                        {attribute.options.map((option: string) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={attributes[index]?.value ?? ""} onChange={(event) => setAttributes((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} className="input h-12" placeholder={attribute.name} />
                    )}
                  </Field>
                ))}
              </div>
            </FormSection>
          )}

          {isAuction && (
            <FormSection icon={Gavel} title="Configure the auction" description="Set the opening bid and schedule before submitting for review.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Opening bid (LKR)" required hint="The first accepted bid."><input type="number" value={auctionForm.startPrice} onChange={setAuctionStartPrice} className="input h-12" placeholder="0.00" min={1} step={0.01} /></Field>
                <Field label="Reserve price (LKR)" hint="Optional hidden minimum."><input type="number" value={auctionForm.reservePrice} onChange={setAuction("reservePrice")} className="input h-12" placeholder="Optional" min={0} step={0.01} /></Field>
                <Field label="Bid increment (LKR)" required hint="Minimum increase for each bid."><input type="number" value={auctionForm.bidIncrement} onChange={setAuction("bidIncrement")} className="input h-12" min={1} step={1} /></Field>
                <div className="hidden sm:block" />
                <Field label="Starts" required><input type="datetime-local" value={auctionForm.startTime} onChange={setAuction("startTime")} className="input h-12" /></Field>
                <Field label="Ends" required><input type="datetime-local" value={auctionForm.endTime} onChange={setAuction("endTime")} className="input h-12" min={auctionForm.startTime || undefined} /></Field>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4 text-sm leading-6 text-gray-600">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <p>Bids placed in the final two minutes extend the auction by two minutes.</p>
              </div>
            </FormSection>
          )}
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(17,24,39,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-gray-950">Ready to publish?</p>
              <span className="text-xs font-medium tabular-nums text-gray-400">{completedEssentials}/5 ready</span>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <SummaryCheck done={form.title.length >= 10} label="A descriptive title" />
              <SummaryCheck done={Boolean(form.categoryId)} label="Category selected" />
              <SummaryCheck done={Boolean(form.location.trim())} label="Location added" />
              <SummaryCheck done={validImageCount > 0} label="At least one photo" />
              <SummaryCheck done={isAuction ? Boolean(auctionForm.startPrice && auctionForm.startTime && auctionForm.endTime) : Boolean(form.price)} label={isAuction ? "Auction schedule set" : "Price added"} />
            </div>
            <div className="mt-6 space-y-3 border-t border-gray-200 pt-5">
              <button type="button" onClick={() => doSubmit("PENDING_REVIEW")} disabled={submitting} className="btn-primary h-12 w-full gap-2 whitespace-nowrap disabled:opacity-50">
                <CheckCircle className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit for review"}
              </button>
              <button type="button" onClick={() => doSubmit("DRAFT")} disabled={submitting} className="btn-secondary h-12 w-full gap-2 whitespace-nowrap disabled:opacity-50">
                <FileText className="h-4 w-4" /> {submitting ? "Saving..." : "Save as draft"}
              </button>
            </div>
            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-gray-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              Submitted listings are reviewed before they appear publicly.
            </div>
          </div>
          <button type="button" onClick={() => router.back()} disabled={submitting} className="mt-4 w-full text-center text-sm font-medium text-gray-500 hover:text-gray-950">Cancel listing</button>
        </aside>
      </div>
    </div>
  );
}

function FormSection({ icon: Icon, title, description, children }: { icon: typeof Tag; title: string; description: string; children: React.ReactNode }) {
  return <section className="border-b border-gray-200 pb-10 last:border-b-0"><div className="mb-6 flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500"><Icon className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold text-gray-950">{title}</h2><p className="mt-1 text-sm leading-6 text-gray-500">{description}</p></div></div><div className="space-y-5 sm:pl-14">{children}</div></section>;
}

function Field({ label, required = false, hint, icon: Icon, children }: { label: string; required?: boolean; hint?: string; icon?: typeof MapPin; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">{Icon && <Icon className="h-4 w-4 text-gray-400" />}{label}{required && <span className="text-brand-600">*</span>}</span>{children}{hint && <span className="mt-2 block text-xs text-gray-500">{hint}</span>}</label>;
}

function SummaryCheck({ done, label }: { done: boolean; label: string }) {
  return <div className="flex items-center gap-3"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-brand-500 text-white" : "border border-gray-300 text-transparent"}`}><CheckCircle className="h-3.5 w-3.5" /></span><span className={done ? "text-gray-800" : "text-gray-500"}>{label}</span></div>;
}

function CreateListingSkeleton() {
  return <div className="mx-auto max-w-6xl animate-pulse pb-12"><div className="h-5 w-32 rounded bg-gray-100" /><div className="mt-8 border-b border-gray-200 pb-7"><div className="h-3 w-28 rounded bg-gray-100" /><div className="mt-4 h-11 w-72 rounded bg-gray-100" /><div className="mt-4 h-4 max-w-lg rounded bg-gray-100" /></div><div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-10"><div className="h-80 rounded-2xl bg-gray-100" /><div className="h-64 rounded-2xl bg-gray-100" /><div className="h-72 rounded-2xl bg-gray-100" /></div><div className="hidden h-80 rounded-2xl bg-gray-100 lg:block" /></div></div>;
}
