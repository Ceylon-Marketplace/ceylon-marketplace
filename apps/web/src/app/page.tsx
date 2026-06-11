import Link from "next/link";
import { Navbar } from "@/components/navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Sri Lanka&apos;s Premier Marketplace
            </h1>
            <p className="mt-4 text-lg text-brand-100">
              Buy, sell, and bid on thousands of items. Find deals on
              electronics, vehicles, real estate, and more.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/listings"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-600 hover:bg-brand-50"
              >
                Browse Listings
              </Link>
              <Link
                href="/auctions"
                className="rounded-lg border border-white px-6 py-3 font-semibold text-white hover:bg-brand-600"
              >
                View Auctions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: "🏷️",
              title: "Fixed Price Listings",
              desc: "List your items at a fixed price and reach thousands of buyers.",
            },
            {
              icon: "🔨",
              title: "Live Auctions",
              desc: "Bid in real-time auctions. Anti-sniping protection ensures fair bidding.",
            },
            {
              icon: "🏪",
              title: "Business Storefronts",
              desc: "Business sellers get their own branded storefront on the platform.",
            },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className="mb-3 text-4xl">{f.icon}</div>
              <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Ready to start selling?</h2>
          <p className="mt-3 text-gray-400">
            Subscribe to a seller plan and list your first item in minutes.
          </p>
          <Link
            href="/subscriptions"
            className="mt-6 inline-block rounded-lg bg-brand-500 px-8 py-3 font-semibold hover:bg-brand-600"
          >
            View Plans
          </Link>
        </div>
      </section>
    </div>
  );
}
