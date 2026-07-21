"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCheck,
  CircleDollarSign,
  Gavel,
  Inbox,
  MessageSquare,
  PackageCheck,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

type NotificationMetadata = {
  conversationId?: string;
  listingId?: string;
  auctionId?: string;
  offerId?: string;
};

type MarketplaceNotification = {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  metadata?: NotificationMetadata | null;
};

type NotificationsResponse = {
  notifications: MarketplaceNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
};

const NOTIFICATION_QUERY_KEY = ["notifications", "all"] as const;

function notificationIcon(type: string) {
  if (type === "MESSAGE") return MessageSquare;
  if (type.includes("AUCTION") || type === "BID" || type === "OUTBID") return Gavel;
  if (type.includes("OFFER")) return CircleDollarSign;
  if (type.includes("LISTING")) return PackageCheck;
  return Bell;
}

function notificationHref(notification: MarketplaceNotification) {
  const metadata = notification.metadata;
  if (notification.type === "MESSAGE" && metadata?.conversationId) {
    return `/messages?conversationId=${metadata.conversationId}`;
  }
  if ((notification.type.includes("AUCTION") || notification.type === "BID" || notification.type === "OUTBID") && metadata?.auctionId) {
    return `/auctions/${metadata.auctionId}`;
  }
  if (notification.type.includes("LISTING") && metadata?.listingId) {
    return `/listings/${metadata.listingId}`;
  }
  if (notification.type.includes("OFFER")) return "/offers";
  return null;
}

export default function NotificationsPage() {
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notificationsQuery = useQuery<NotificationsResponse>({
    queryKey: NOTIFICATION_QUERY_KEY,
    queryFn: async () => (await api.get("/notifications?limit=50")).data,
    enabled: !!user,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch("/notifications", { id }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_QUERY_KEY });
      queryClient.setQueryData<NotificationsResponse>(
        NOTIFICATION_QUERY_KEY,
        (current) => {
          if (!current) return current;
          const wasUnread = current.notifications.some(
            (notification) => notification.id === id && !notification.isRead,
          );
          return {
            ...current,
            unreadCount: Math.max(0, current.unreadCount - (wasUnread ? 1 : 0)),
            notifications: current.notifications.map((notification) =>
              notification.id === id
                ? { ...notification, isRead: true }
                : notification,
            ),
          };
        },
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/notifications"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_QUERY_KEY });
      queryClient.setQueryData<NotificationsResponse>(
        NOTIFICATION_QUERY_KEY,
        (current) =>
          current
            ? {
                ...current,
                unreadCount: 0,
                notifications: current.notifications.map((notification) => ({
                  ...notification,
                  isRead: true,
                })),
              }
            : current,
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    if (hasHydrated && !user) {
      router.replace(`/login?next=${encodeURIComponent("/notifications")}`);
    }
  }, [hasHydrated, router, user]);

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const visibleNotifications = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((notification) => !notification.isRead)
        : notifications,
    [filter, notifications],
  );

  const openNotification = (notification: MarketplaceNotification) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    const href = notificationHref(notification);
    if (href) router.push(href);
  };

  if (!hasHydrated || !user) return <NotificationsSkeleton />;

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <header className="border-b border-gray-200 pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Marketplace activity
        </p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-gray-950 sm:text-5xl">
              Notifications
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
              Follow messages, offers, listings, and auction activity in one place.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="btn-secondary h-11 shrink-0 gap-2 disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              {markAllRead.isPending ? "Updating..." : "Mark all as read"}
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 border-b border-gray-200 sm:grid-cols-[180px_180px_1fr]" aria-label="Notification summary">
        <div className="border-r border-gray-200 py-5 pr-5">
          <p className="text-xs text-gray-400">All activity</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-gray-950">
            {notificationsQuery.data?.total ?? 0}
          </p>
        </div>
        <div className="py-5 pl-5 sm:border-r sm:border-gray-200 sm:pr-5">
          <p className="text-xs text-gray-400">Unread</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-brand-600">
            {unreadCount}
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-start border-t border-gray-200 py-4 sm:col-span-1 sm:justify-end sm:border-t-0 sm:pl-5">
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1" role="tablist" aria-label="Filter notifications">
            <button role="tab" aria-selected={filter === "all"} onClick={() => setFilter("all")} className={cn("rounded-lg px-4 py-2 text-sm font-medium transition", filter === "all" ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-800")}>All</button>
            <button role="tab" aria-selected={filter === "unread"} onClick={() => setFilter("unread")} className={cn("rounded-lg px-4 py-2 text-sm font-medium transition", filter === "unread" ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-800")}>Unread</button>
          </div>
        </div>
      </section>

      {notificationsQuery.isLoading ? (
        <NotificationsSkeleton compact />
      ) : notificationsQuery.isError ? (
        <NotificationState icon={AlertCircle} title="Activity unavailable" body="Your notifications could not be loaded." action={<button onClick={() => notificationsQuery.refetch()} className="btn-primary mt-5 gap-2"><RefreshCw className="h-4 w-4" /> Try again</button>} />
      ) : notifications.length === 0 ? (
        <NotificationState icon={Inbox} title="Nothing here yet" body="New marketplace activity will appear here when it happens." />
      ) : visibleNotifications.length === 0 ? (
        <NotificationState icon={CheckCheck} title="You are all caught up" body="There are no unread notifications right now." action={<button onClick={() => setFilter("all")} className="btn-secondary mt-5">View all activity</button>} />
      ) : (
        <div className="divide-y divide-gray-200 border-b border-gray-200">
          {visibleNotifications.map((notification) => {
            const Icon = notificationIcon(notification.type);
            const href = notificationHref(notification);
            return (
              <button
                key={notification.id}
                onClick={() => openNotification(notification)}
                className={cn(
                  "group grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-4 px-1 py-5 text-left transition sm:px-4",
                  notification.isRead ? "hover:bg-gray-50" : "bg-brand-50/45 hover:bg-brand-50/75",
                )}
              >
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl border", notification.isRead ? "border-gray-200 bg-white text-gray-400" : "border-brand-100 bg-white text-brand-600")}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className={cn("truncate text-sm text-gray-950", notification.isRead ? "font-medium" : "font-semibold")}>{notification.title}</span>
                    {!notification.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-gray-500">{notification.content}</span>
                  <span className="mt-2 block text-xs text-gray-400">{timeAgo(notification.createdAt)}</span>
                </span>
                <span className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-400 transition group-hover:text-brand-600">
                  {href ? "Open" : notification.isRead ? "Read" : "Mark read"}
                  {href && <ArrowRight className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotificationState({ icon: Icon, title, body, action }: { icon: typeof Bell; title: string; body: string; action?: React.ReactNode }) {
  return <div className="flex flex-col items-center py-20 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400"><Icon className="h-5 w-5" /></span><h2 className="mt-5 text-lg font-semibold text-gray-950">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">{body}</p>{action}</div>;
}

function NotificationsSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={cn("animate-pulse", compact ? "divide-y divide-gray-200" : "mx-auto max-w-4xl space-y-5 py-4")}>{compact ? Array.from({ length: 7 }).map((_, index) => <div key={index} className="flex gap-4 py-5"><div className="h-11 w-11 rounded-xl bg-gray-100" /><div className="flex-1 space-y-2"><div className="h-4 w-2/5 rounded bg-gray-100" /><div className="h-3 w-4/5 rounded bg-gray-100" /><div className="h-3 w-24 rounded bg-gray-100" /></div></div>) : <><div className="h-8 w-48 rounded bg-gray-100" /><div className="h-20 rounded-2xl bg-gray-100" /><div className="h-72 rounded-2xl bg-gray-100" /></>}</div>;
}
