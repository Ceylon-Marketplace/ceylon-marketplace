import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Gavel,
  ImageIcon,
  MapPin,
  PackageOpen,
  Search,
  Store,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { AuctionCard, type AuctionSummary } from "@/components/auction-card";
import { prisma } from "@/lib/prisma";
import { formatPrice, timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ceylon Marketplace | Buy, Sell and Bid in Sri Lanka",
  description:
    "Discover listings, follow auctions, and sell products across Sri Lanka on Ceylon Marketplace.",
};

export const dynamic = "force-dynamic";

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

async function getHomeData() {
  const [listings, categories, auctions] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        title: true,
        price: true,
        location: true,
        condition: true,
        createdAt: true,
        media: {
          where: { type: "IMAGE" },
          select: { url: true },
          orderBy: { order: "asc" },
          take: 1,
        },
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { name: "asc" },
      take: 6,
    }),
    prisma.auction.findMany({
      where: { status: { in: ["LIVE", "SCHEDULED"] } },
      select: {
        id: true,
        startPrice: true,
        currentPrice: true,
        startTime: true,
        endTime: true,
        status: true,
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            media: {
              select: { url: true },
              orderBy: { order: "asc" },
              take: 1,
            },
            category: { select: { id: true, name: true } },
          },
        },
        _count: { select: { bids: true } },
      },
      orderBy: [{ status: "asc" }, { endTime: "asc" }],
      take: 3,
    }),
  ]);

  return {
    listings: listings.map((listing) => ({
      ...listing,
      price: Number(listing.price),
      createdAt: listing.createdAt.toISOString(),
    })),
    categories,
    auctions: auctions.map((auction) => ({
      ...auction,
      startPrice: Number(auction.startPrice),
      currentPrice: Number(auction.currentPrice),
      startTime: auction.startTime.toISOString(),
      endTime: auction.endTime.toISOString(),
    })) as AuctionSummary[],
  };
}

type HomeListing = Awaited<ReturnType<typeof getHomeData>>["listings"][number];

function HomeListingCard({ listing }: { listing: HomeListing }) {
  const image = listing.media[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_18px_45px_-28px_rgba(17,24,39,0.35)] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {image ? (
          <Image
            src={image.url}
            alt={listing.title}
            fill
            sizes="(min-width: 1280px) 290px, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs font-medium">No image available</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
          <span className="truncate">{listing.category.name}</span>
          <span className="shrink-0">
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-gray-950">
          {listing.title}
        </h3>
        <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-gray-950">
          {formatPrice(listing.price)}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-gray-400">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </span>
          <span className="shrink-0">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const { listings, categories, auctions } = await getHomeData();
  const heroImages = listings.flatMap((listing) =>
    listing.media[0]
      ? [{ url: listing.media[0].url, alt: listing.title }]
      : [],
  );
  const mainHeroImage = heroImages[0] ?? {
    url: "/images/auth/marketplace-collection.jpg",
    alt: "A collection of products available through an online marketplace",
  };
  const secondaryHeroImages = heroImages.slice(1, 3);

  return (
    <div className="min-h-[100dvh] bg-white text-gray-950">
      <Navbar />

      <main>
        <section className="overflow-hidden border-b border-gray-200">
          <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,0.86fr)_minmax(520px,1.14fr)] lg:items-center lg:px-8 lg:py-16">
            <div className="max-w-xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                Sri Lanka&apos;s online marketplace
              </p>
              <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-gray-950 sm:text-6xl lg:text-7xl">
                Find what fits your life.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-gray-600 sm:text-lg">
                Discover local listings, follow timed auctions, or turn the things you sell into your own storefront.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/listings"
                  className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-600 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                >
                  <Search className="h-4 w-4" />
                  Browse marketplace
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                >
                  Start selling
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid h-[440px] grid-cols-[minmax(0,1.35fr)_minmax(160px,0.65fr)] gap-3 sm:h-[520px]">
              <div className="relative overflow-hidden rounded-3xl bg-gray-100">
                <Image
                  src={mainHeroImage.url}
                  alt={mainHeroImage.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 42vw, 66vw"
                  className="object-cover"
                />
              </div>
              <div className="grid min-h-0 gap-3">
                {secondaryHeroImages.length > 0 ? (
                  secondaryHeroImages.map((image, index) => (
                    <div
                      key={image.url}
                      className="relative min-h-0 overflow-hidden rounded-3xl bg-gray-100"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        priority={index === 0}
                        sizes="(min-width: 1024px) 20vw, 30vw"
                        className="object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="flex min-h-0 flex-col justify-end rounded-3xl bg-brand-50 p-5 sm:p-7">
                    <Store className="h-7 w-7 text-brand-600" />
                    <p className="mt-4 text-lg font-semibold leading-snug tracking-[-0.02em] text-gray-950">
                      One place to buy, sell, and bid.
                    </p>
                  </div>
                )}
                {secondaryHeroImages.length === 1 && (
                  <div className="flex min-h-0 flex-col justify-end rounded-3xl bg-gray-950 p-5 text-white sm:p-7">
                    <Gavel className="h-7 w-7 text-brand-500" />
                    <p className="mt-4 text-lg font-semibold leading-snug tracking-[-0.02em]">
                      Follow every bid as the clock moves.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-gray-950">Browse categories</h2>
              <Link
                href="/listings"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View everything <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex h-12 shrink-0 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800"
                  >
                    {category.imageUrl ? (
                      <span className="relative h-7 w-7 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={category.imageUrl}
                          alt=""
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <PackageOpen className="h-4 w-4 text-brand-500" />
                    )}
                    {category.name}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Categories will appear as the marketplace grows.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-4xl">
              Fresh from the marketplace
            </h2>
            <p className="mt-3 text-base leading-7 text-gray-600">
              Recently added products from sellers across the platform.
            </p>
          </div>

          {listings.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.slice(0, 8).map((listing) => (
                <HomeListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <PackageOpen className="mx-auto h-8 w-8 text-brand-500" />
              <h3 className="mt-4 text-lg font-semibold text-gray-950">
                The marketplace is ready for its first listings
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Create an account to add an item, or return when new products have been published.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-start">
            <Link
              href="/listings"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
            >
              Explore all listings <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="border-y border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-4xl">
                  Watch the clock. Make your move.
                </h2>
                <p className="mt-3 text-base leading-7 text-gray-600">
                  Follow available auction lots and see bidding activity as it changes.
                </p>
              </div>
              <Link
                href="/auctions"
                className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View all auctions <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {auctions.length > 0 ? (
              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {auctions.map((auction, index) => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    priority={index === 0}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                <Gavel className="mx-auto h-8 w-8 text-brand-500" />
                <h3 className="mt-4 text-lg font-semibold text-gray-950">
                  No auction lots are available yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  New live and scheduled auctions will appear here when sellers publish them.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
            <div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
              <Store className="h-8 w-8 text-brand-600" />
              <h2 className="mt-6 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-4xl">
                Give your products a place to be found.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
                Create listings, receive offers, run auctions, and build a public storefront for your business.
              </p>
            </div>
            <div className="flex items-center border-t border-brand-100 px-6 py-8 sm:px-10 lg:border-l lg:border-t-0 lg:px-12">
              <Link
                href="/register"
                className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-600 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
              >
                Open a seller account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-semibold text-gray-900">Ceylon Marketplace</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/listings" className="hover:text-gray-900">Listings</Link>
            <Link href="/auctions" className="hover:text-gray-900">Auctions</Link>
            <Link href="/login" className="hover:text-gray-900">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
