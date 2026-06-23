"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import type {
  AuthUser,
  ListingSummary,
  NotificationSummary,
  SavedListingSummary,
} from "@/lib/types";
import {
  Plus,
  Package,
  Bell,
  Heart,
  TrendingUp,
  ShoppingBag,
  Store,
} from "lucide-react";

function SellerDashboard({ user: _user }: { user: AuthUser }) {
  const { data: myListings } = useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const { data } = await api.get("/listings/mine");
      return data as ListingSummary[];
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications?limit=5");
      return data as { notifications: NotificationSummary[]; unreadCount: number };
    },
  });
  const recentNotifications = notifications?.notifications ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Seller Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Manage your listings and offers
          </p>
        </div>
        <Link href="/listings/create" className="btn-primary gap-2">
          <Plus className="h-4 w-4" /> New Listing
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-brand-500" />
            <div>
              <p className="text-2xl font-bold">{myListings?.length ?? 0}</p>
              <p className="text-xs text-gray-500">My Listings</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {notifications?.unreadCount ?? 0}
              </p>
              <p className="text-xs text-gray-500">Notifications</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">Free</p>
              <p className="text-xs text-gray-500">Listing is free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {recentNotifications.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Recent Notifications
          </h2>
          <div className="card divide-y">
            {recentNotifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 ${!n.isRead ? "bg-blue-50" : ""}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.content}</p>
                </div>
                {!n.isRead && (
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Listings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">My Listings</h2>
          <Link href="/listings/mine" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {!myListings?.length ? (
          <div className="card p-8 text-center text-gray-500">
            <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p>No listings yet.</p>
            <Link href="/listings/create" className="btn-primary mt-4">
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {myListings.slice(0, 4).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BuyerDashboard({ user }: { user: AuthUser }) {
  const { data: saved } = useQuery({
    queryKey: ["saved-listings"],
    queryFn: async () => {
      const { data } = await api.get("/listings/saved");
      return data as SavedListingSummary[];
    },
  });

  const { data: offers } = useQuery({
    queryKey: ["offers-sent"],
    queryFn: async () => {
      const { data } = await api.get("/offers/sent");
      return data as unknown[];
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications?limit=5");
      return data as { notifications: NotificationSummary[]; unreadCount: number };
    },
  });

  const savedListings = saved?.map((s) => s.listing).filter((listing): listing is ListingSummary => Boolean(listing)) ?? [];
  const recentNotifications = notifications?.notifications ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.profile?.firstName}
        </h1>
        <p className="text-sm text-gray-500">
          Browse listings, track your offers, and manage saved items
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold">{savedListings.length}</p>
              <p className="text-xs text-gray-500">Saved Listings</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{offers?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Offers Sent</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">
                {notifications?.unreadCount ?? 0}
              </p>
              <p className="text-xs text-gray-500">Notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/listings"
          className="card flex items-center gap-4 p-5 hover:shadow-md transition-shadow"
        >
          <ShoppingBag className="h-8 w-8 text-brand-500" />
          <div>
            <p className="font-semibold text-gray-900">Browse Listings</p>
            <p className="text-sm text-gray-500">Find your next great deal</p>
          </div>
        </Link>
        <Link
          href="/auctions"
          className="card flex items-center gap-4 p-5 hover:shadow-md transition-shadow"
        >
          <Store className="h-8 w-8 text-brand-500" />
          <div>
            <p className="font-semibold text-gray-900">Live Auctions</p>
            <p className="text-sm text-gray-500">Bid on items ending soon</p>
          </div>
        </Link>
      </div>

      {/* Saved listings */}
      {savedListings.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Saved Listings</h2>
            <Link href="/listings/saved" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {savedListings.slice(0, 4).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {recentNotifications.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Recent Notifications
          </h2>
          <div className="card divide-y">
            {recentNotifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 ${!n.isRead ? "bg-blue-50" : ""}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.content}</p>
                </div>
                {!n.isRead && (
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, mode } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user) return null;

  const isSeller = user.role === "SELLER" || user.role === "BUSINESS_SELLER";
  const showSellerDashboard = isSeller && mode === "seller";

  return showSellerDashboard
    ? <SellerDashboard user={user} />
    : <BuyerDashboard user={user} />;
}
