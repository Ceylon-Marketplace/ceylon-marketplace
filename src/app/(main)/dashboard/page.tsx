"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  Gavel,
  Heart,
  MessageSquare,
  Package,
  Plus,
  Search,
  Store,
  Tag,
} from "lucide-react";
import api from "@/lib/api";
import { ListingCard } from "@/components/listing-card";
import { useAuthStore } from "@/store/auth.store";

type Notification = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
};

type NotificationData = {
  notifications: Notification[];
  unreadCount: number;
};

function DashboardHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-gray-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-gray-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

function MetricStrip({
  items,
}: {
  items: { label: string; value: React.ReactNode; href: string }[];
}) {
  return (
    <div className="grid overflow-hidden rounded-2xl border border-gray-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-gray-200">
      {items.map((item, index) => (
        <Link
          key={item.label}
          href={item.href}
          className={`group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50 active:bg-gray-100 ${
            index > 0 ? "border-t border-gray-200 sm:border-t-0" : ""
          }`}
        >
          <div>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-gray-950">
              {item.value}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">{item.label}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
        </Link>
      ))}
    </div>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-gray-950">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function NotificationPanel({
  data,
  isLoading,
}: {
  data?: NotificationData;
  isLoading: boolean;
}) {
  const notifications = data?.notifications ?? [];

  return (
    <section>
      <SectionHeader title="Recent activity" href="/notifications" />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="space-y-5 p-5" aria-label="Loading recent activity">
            {[0, 1, 2].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="h-4 w-2/5 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 px-5 py-4"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    notification.isRead ? "bg-gray-200" : "bg-brand-500"
                  }`}
                  aria-label={notification.isRead ? "Read" : "Unread"}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500">
                    {notification.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
              <Bell className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              You&apos;re all caught up
            </p>
            <p className="mt-1 text-sm text-gray-500">
              New offers, bids, and messages will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function QuickActions({ seller = false }: { seller?: boolean }) {
  const actions = seller
    ? [
        {
          href: "/listings/create",
          label: "Create a listing",
          description: "Add an item for sale",
          icon: Plus,
        },
        {
          href: "/offers",
          label: "Review offers",
          description: "Respond to interested buyers",
          icon: Tag,
        },
        {
          href: "/messages",
          label: "Open messages",
          description: "Continue buyer conversations",
          icon: MessageSquare,
        },
      ]
    : [
        {
          href: "/listings",
          label: "Browse listings",
          description: "Explore the latest items",
          icon: Search,
        },
        {
          href: "/auctions",
          label: "Explore auctions",
          description: "See live and upcoming bids",
          icon: Gavel,
        },
        {
          href: "/messages",
          label: "Open messages",
          description: "Talk directly with sellers",
          icon: MessageSquare,
        },
      ];

  return (
    <section>
      <SectionHeader title="Quick actions" />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`group flex items-center gap-3 px-4 py-4 transition hover:bg-gray-50 active:bg-gray-100 ${
                index > 0 ? "border-t border-gray-100" : ""
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900">
                  {action.label}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {action.description}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ListingGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading listings">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-4/5 rounded bg-gray-200" />
            <div className="h-5 w-2/5 rounded bg-gray-100" />
            <div className="h-3 w-3/5 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SellerDashboard({ user }: { user: any }) {
  const { data: myListings, isLoading: listingsLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const { data } = await api.get("/listings/mine");
      return data;
    },
  });

  const { data: notifications, isLoading: notificationsLoading } =
    useQuery<NotificationData>({
      queryKey: ["notifications"],
      queryFn: async () => {
        const { data } = await api.get("/notifications?limit=5");
        return data;
      },
    });

  const listingCount = myListings?.length ?? 0;

  return (
    <div className="space-y-8 pb-8">
      <DashboardHeader
        eyebrow="Seller workspace"
        title={`Welcome, ${user.profile?.firstName ?? "seller"}`}
        description="Manage your catalogue, respond to buyers, and keep your storefront moving."
        action={
          <Link
            href="/listings/create"
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
          >
            <Plus className="h-4 w-4" />
            New listing
          </Link>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Your listings",
            value: listingsLoading ? "..." : listingCount,
            href: "/listings/mine",
          },
          {
            label: "Unread updates",
            value: notificationsLoading ? "..." : notifications?.unreadCount ?? 0,
            href: "/notifications",
          },
          {
            label: "Storefront",
            value: user.storefront ? "Active" : "Not set up",
            href: user.storefront ? `/store/${user.storefront.slug}` : "/profile/edit",
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        <section>
          <SectionHeader title="Your latest listings" href="/listings/mine" />
          {listingsLoading ? (
            <ListingGridSkeleton />
          ) : listingCount > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {myListings.slice(0, 3).map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-gray-200">
                <Package className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-gray-950">
                Add your first listing
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Create a clear listing with good photos, a useful description, and your asking price.
              </p>
              <Link
                href="/listings/create"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Create a listing <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        <div className="space-y-8">
          <QuickActions seller />
          <NotificationPanel
            data={notifications}
            isLoading={notificationsLoading}
          />
        </div>
      </div>
    </div>
  );
}

function BuyerDashboard({ user }: { user: any }) {
  const { data: saved, isLoading: savedLoading } = useQuery({
    queryKey: ["saved-listings"],
    queryFn: async () => {
      const { data } = await api.get("/listings/saved");
      return data;
    },
  });

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ["offers-sent"],
    queryFn: async () => {
      const { data } = await api.get("/offers");
      return data;
    },
  });

  const { data: notifications, isLoading: notificationsLoading } =
    useQuery<NotificationData>({
      queryKey: ["notifications"],
      queryFn: async () => {
        const { data } = await api.get("/notifications?limit=5");
        return data;
      },
    });

  const savedListings = saved?.map((item: any) => item.listing).filter(Boolean) ?? [];

  return (
    <div className="space-y-8 pb-8">
      <DashboardHeader
        eyebrow="Your marketplace"
        title={`Good to see you, ${user.profile?.firstName ?? "there"}`}
        description="Continue browsing, revisit saved finds, and keep track of conversations and offers."
        action={
          <Link
            href="/listings"
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
          >
            <Search className="h-4 w-4" />
            Browse marketplace
          </Link>
        }
      />

      <MetricStrip
        items={[
          {
            label: "Saved listings",
            value: savedLoading ? "..." : savedListings.length,
            href: "/listings/saved",
          },
          {
            label: "Offers sent",
            value: offersLoading ? "..." : offers?.length ?? 0,
            href: "/offers",
          },
          {
            label: "Unread updates",
            value: notificationsLoading ? "..." : notifications?.unreadCount ?? 0,
            href: "/notifications",
          },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <NotificationPanel
          data={notifications}
          isLoading={notificationsLoading}
        />
        <QuickActions />
      </div>

      <section>
        <SectionHeader title="Saved for later" href="/listings/saved" />
        {savedLoading ? (
          <ListingGridSkeleton />
        ) : savedListings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {savedListings.slice(0, 4).map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="grid overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 md:grid-cols-[1fr_auto]">
            <div className="px-6 py-9 sm:px-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-gray-200">
                <Heart className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-950">
                Save the things you like
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
                Keep interesting listings close by so you can compare them or return when you are ready.
              </p>
            </div>
            <div className="flex items-center border-t border-gray-200 px-6 py-6 md:border-l md:border-t-0 sm:px-8">
              <Link
                href="/listings"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Find something to save <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { user, mode, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !user) router.push("/login");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) {
    return (
      <div className="space-y-7 animate-pulse" aria-label="Loading dashboard">
        <div className="h-28 rounded-2xl bg-gray-100" />
        <div className="h-24 rounded-2xl bg-gray-100" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 rounded-2xl bg-gray-100 lg:col-span-2" />
          <div className="h-72 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  const isSeller = user.role === "SELLER" || user.role === "BUSINESS_SELLER";
  const showSellerDashboard = isSeller && mode === "seller";

  return showSellerDashboard ? (
    <SellerDashboard user={user} />
  ) : (
    <BuyerDashboard user={user} />
  );
}
