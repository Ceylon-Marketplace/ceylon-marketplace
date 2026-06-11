"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { timeAgo } from "@/lib/utils";
import {
  Bell,
  Gavel,
  MessageSquare,
  Tag,
  TrendingUp,
  CheckCheck,
} from "lucide-react";

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  MESSAGE: <MessageSquare className="h-5 w-5 text-blue-500" />,
  BID: <Gavel className="h-5 w-5 text-brand-500" />,
  OUTBID: <Gavel className="h-5 w-5 text-orange-500" />,
  AUCTION_WON: <Gavel className="h-5 w-5 text-green-500" />,
  AUCTION_LOST: <Gavel className="h-5 w-5 text-red-400" />,
  LISTING_APPROVED: <Tag className="h-5 w-5 text-green-500" />,
  LISTING_REJECTED: <Tag className="h-5 w-5 text-red-500" />,
  SUBSCRIPTION_EXPIRING: <Bell className="h-5 w-5 text-amber-500" />,
  SUBSCRIPTION_EXPIRED: <Bell className="h-5 w-5 text-red-500" />,
  OFFER_RECEIVED: <TrendingUp className="h-5 w-5 text-brand-500" />,
  OFFER_ACCEPTED: <TrendingUp className="h-5 w-5 text-green-500" />,
  OFFER_REJECTED: <TrendingUp className="h-5 w-5 text-red-400" />,
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-all"],
    queryFn: async () => {
      const { data } = await api.get("/notifications?limit=50");
      return data;
    },
    enabled: !!user,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications-all"] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications-all"] }),
  });

  if (!user) {
    router.push("/login");
    return null;
  }

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="btn-secondary gap-2 text-sm"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Bell className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-medium">No notifications yet</p>
          <p className="mt-1 text-sm">
            You'll see activity here when things happen.
          </p>
        </div>
      ) : (
        <div className="card divide-y">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead.mutate(n.id)}
              className={`flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-gray-50 ${
                !n.isRead ? "bg-blue-50" : ""
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {NOTIF_ICONS[n.type] ?? (
                  <Bell className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{n.content}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
