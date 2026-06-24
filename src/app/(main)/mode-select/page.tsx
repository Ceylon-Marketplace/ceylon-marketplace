"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { ShoppingBag, Store, ArrowRight } from "lucide-react";

export default function ModeSelectPage() {
  const { user, mode, setMode } = useAuthStore();
  const router = useRouter();

  const isSeller = user?.role === "SELLER" || user?.role === "BUSINESS_SELLER";

  // Non-sellers have no choice — redirect straight away
  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isSeller) {
      router.replace("/dashboard");
      return;
    }
    // Already chosen — go to dashboard
    if (mode !== null) {
      router.replace("/dashboard");
      return;
    }
  }, [user, isSeller, mode, router]);

  if (!user || !isSeller || mode !== null) return null;

  const choose = (chosen: "buyer" | "seller") => {
    setMode(chosen);
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            How would you like to continue?
          </h1>
          <p className="mt-2 text-gray-500">
            You can switch modes any time from your account menu.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Buyer card */}
          <button
            onClick={() => choose("buyer")}
            className="group relative flex flex-col rounded-2xl border-2 border-gray-200 bg-white p-8 text-left transition-all hover:border-brand-400 hover:shadow-md"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Browse &amp; Buy
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Discover listings, make offers, bid on auctions, and message
              sellers.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-gray-500">
              {[
                "Search all listings",
                "Save favourites",
                "Place bids &amp; offers",
                "Track purchases",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-1 text-sm font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
              Continue as buyer <ArrowRight className="h-4 w-4" />
            </div>
          </button>

          {/* Seller card */}
          <button
            onClick={() => choose("seller")}
            className="group relative flex flex-col rounded-2xl border-2 border-gray-200 bg-white p-8 text-left transition-all hover:border-brand-400 hover:shadow-md"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
              <Store className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">List &amp; Sell</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your listings, run auctions, handle offers and grow your
              storefront.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-gray-500">
              {[
                "Create &amp; manage listings",
                "Run auctions",
                "Respond to offers",
                "Seller dashboard",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-1 text-sm font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
              Continue as seller <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
