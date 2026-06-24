"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import {
  Store,
  Package,
  Gavel,
  TrendingUp,
  Star,
  ChevronRight,
  Check,
} from "lucide-react";

const PERKS = [
  {
    icon: <Package className="h-5 w-5" />,
    title: "List items for sale",
    body: "Create detailed listings with photos, descriptions, and category attributes.",
  },
  {
    icon: <Gavel className="h-5 w-5" />,
    title: "Run auctions",
    body: "Set a start price, reserve price, and schedule your auction to maximise bids.",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Receive offers",
    body: "Buyers can negotiate directly with you — accept, reject, or counter.",
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: "Build your reputation",
    body: "Collect reviews and earn verification badges to boost buyer trust.",
  },
];

export default function BecomeSellerPage() {
  const { user, becomeSeller, setMode } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSeller = user?.role === "SELLER" || user?.role === "BUSINESS_SELLER";

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/become-seller");
      return;
    }
    if (isSeller) {
      router.replace("/dashboard");
    }
  }, [user, isSeller, router]);

  if (!user || isSeller) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");
    try {
      await becomeSeller();
      setMode("seller");
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-12">
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Store className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Start selling on Ceylon
        </h1>
        <p className="mt-2 text-gray-500">
          Upgrade your account to start listing items and selling on Ceylon
          Marketplace.
        </p>
      </div>

      {/* What you get */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {PERKS.map((p) => (
          <div key={p.title} className="card p-5 flex gap-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              {p.icon}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{p.title}</p>
              <p className="mt-0.5 text-sm text-gray-500">{p.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 font-semibold text-gray-900">How it works</h2>
        <ol className="space-y-3">
          {[
            'Click "Upgrade to Seller" below — your account is upgraded instantly.',
            "Switch to seller mode using the toggle in the navbar.",
            "Start creating listings and selling right away.",
          ].map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-gray-600"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Buying stays free callout */}
      <div className="mb-8 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
        <span>
          <strong>Buying remains free.</strong> Upgrading to a seller account
          does not affect your ability to browse, bid on auctions, or make
          offers — those are always free.
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="btn-primary flex-1 gap-2 justify-center"
        >
          {loading ? "Upgrading…" : "Upgrade to Seller"}
          {!loading && <ChevronRight className="h-4 w-4" />}
        </button>
        <Link href="/dashboard" className="btn-secondary flex-1 text-center">
          Maybe later
        </Link>
      </div>
    </div>
  );
}
