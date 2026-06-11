"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { formatDate } from "@/lib/utils";
import { Plus, Package, Gavel, Bell } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const isSeller =
    user?.role === "SELLER" || user?.role === "BUSINESS_SELLER";

  const { data: myListings } = useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const { data } = await api.get("/listings/mine");
      return data;
    },
    enabled: !!user && isSeller,
  });

  const { data: subscription } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: async () => {
      const { data } = await api.get("/subscriptions/mine");
      return data;
    },
    enabled: !!user,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications?limit=5");
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.profile?.firstName}
          </h1>
          <p className="text-sm text-gray-500">
            Manage your listings, bids, and messages
          </p>
        </div>
        {isSeller && (
          <Link href="/listings/create" className="btn-primary gap-2">
            <Plus className="h-4 w-4" /> New Listing
          </Link>
        )}
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
              <p className="text-xs text-gray-500">Unread Notifications</p>
            </div>
          </div>
        </div>
        <div className="card p-5 col-span-2">
          {subscription ? (
            <div>
              <p className="text-xs text-gray-500 mb-1">Subscription</p>
              <p className="font-semibold text-gray-900">
                {subscription.plan.name} Plan
              </p>
              <p className="text-xs text-gray-400">
                {subscription.status === "ACTIVE"
                  ? `Expires ${formatDate(subscription.endDate)}`
                  : subscription.status === "GRACE_PERIOD"
                    ? "Grace period — renew to create listings"
                    : subscription.status}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Subscribe to start selling
              </p>
              <Link href="/subscriptions" className="btn-primary">
                View Plans
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notifications?.notifications?.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Recent Notifications
          </h2>
          <div className="card divide-y">
            {notifications.notifications.map((n: any) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 ${!n.isRead ? "bg-blue-50" : ""}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500">{n.content}</p>
                </div>
                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Listings */}
      {isSeller && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              My Listings
            </h2>
            <Link
              href="/listings/mine"
              className="text-sm text-brand-600 hover:underline"
            >
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
              {myListings.slice(0, 4).map((l: any) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
