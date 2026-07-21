"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  CheckCheck,
  ChevronRight,
  CircleDollarSign,
  Gavel,
  Inbox,
  MessageSquare,
  PackageCheck,
  RefreshCw,
  X,
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

function notificationVisual(type: string) {
  if (type === "MESSAGE") return { icon: MessageSquare, label: "Message" };
  if (type.includes("AUCTION") || type === "BID" || type === "OUTBID") {
    return { icon: Gavel, label: "Auction" };
  }
  if (type.includes("OFFER")) return { icon: CircleDollarSign, label: "Offer" };
  if (type.includes("LISTING")) return { icon: PackageCheck, label: "Listing" };
  return { icon: Bell, label: "Marketplace" };
}

function notificationHref(notification: MarketplaceNotification) {
  const metadata = notification.metadata;
  if (notification.type === "MESSAGE" && metadata?.conversationId) {
    return `/messages?conversationId=${metadata.conversationId}`;
  }
  if (
    (notification.type.includes("AUCTION") ||
      notification.type === "BID" ||
      notification.type === "OUTBID") &&
    metadata?.auctionId
  ) {
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
  const [readError, setReadError] = useState(false);

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
      setReadError(false);
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationsResponse>(
        NOTIFICATION_QUERY_KEY,
      );
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
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATION_QUERY_KEY, context.previous);
      }
      setReadError(true);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/notifications"),
    onMutate: async () => {
      setReadError(false);
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationsResponse>(
        NOTIFICATION_QUERY_KEY,
      );
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
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATION_QUERY_KEY, context.previous);
      }
      setReadError(true);
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
  const notificationGroups = useMemo(() => {
    if (filter === "unread") {
      return visibleNotifications.length
        ? [{ label: "Unread", notifications: visibleNotifications }]
        : [];
    }
    const unread = visibleNotifications.filter((notification) => !notification.isRead);
    const earlier = visibleNotifications.filter((notification) => notification.isRead);
    return [
      { label: "New", notifications: unread },
      { label: unread.length ? "Earlier" : "Recent", notifications: earlier },
    ].filter((group) => group.notifications.length > 0);
  }, [filter, visibleNotifications]);

  const openNotification = (notification: MarketplaceNotification) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    const href = notificationHref(notification);
    if (href) router.push(href);
  };

  if (!hasHydrated || !user) return <NotificationsSkeleton />;

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <header className="flex items-start justify-between gap-5 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-4xl">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Keep up with your marketplace activity.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="mt-1 flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 active:scale-[0.98] disabled:opacity-60"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">
              {markAllRead.isPending ? "Updating..." : "Mark all as read"}
            </span>
            <span className="sm:hidden">Read all</span>
          </button>
        )}
      </header>

      <div
        className="flex gap-2 border-b border-gray-200 py-3"
        role="tablist"
        aria-label="Filter notifications"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98]",
            filter === "all"
              ? "bg-brand-50 text-brand-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-950",
          )}
        >
          All
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "unread"}
          onClick={() => setFilter("unread")}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98]",
            filter === "unread"
              ? "bg-brand-50 text-brand-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-950",
          )}
        >
          Unread
          {unreadCount > 0 && (
            <span className="flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] leading-4 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {readError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">Read status could not be updated. Your previous state has been restored.</span>
          <button
            type="button"
            onClick={() => setReadError(false)}
            aria-label="Dismiss notification error"
            className="rounded p-0.5 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {notificationsQuery.isLoading ? (
        <NotificationsSkeleton compact />
      ) : notificationsQuery.isError ? (
        <NotificationState
          icon={AlertCircle}
          title="Activity unavailable"
          body="Your notifications could not be loaded."
          action={
            <button
              type="button"
              onClick={() => notificationsQuery.refetch()}
              className="btn-primary mt-5 gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          }
        />
      ) : notifications.length === 0 ? (
        <NotificationState
          icon={Inbox}
          title="Nothing here yet"
          body="Messages, offers, auction updates, and listing activity will appear here."
        />
      ) : visibleNotifications.length === 0 ? (
        <NotificationState
          icon={CheckCheck}
          title="You are all caught up"
          body="There are no unread notifications right now."
          action={
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="btn-secondary mt-5"
            >
              View all notifications
            </button>
          }
        />
      ) : (
        <div className="pt-2">
          {notificationGroups.map((group) => (
            <section key={group.label} aria-labelledby={`notification-group-${group.label}`}>
              <h2
                id={`notification-group-${group.label}`}
                className="px-2 pb-1 pt-5 text-base font-semibold text-gray-950"
              >
                {group.label}
              </h2>
              <div>
                {group.notifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onOpen={() => openNotification(notification)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: MarketplaceNotification;
  onOpen: () => void;
}) {
  const { icon: Icon, label } = notificationVisual(notification.type);
  const href = notificationHref(notification);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group grid w-full grid-cols-[56px_minmax(0,1fr)_20px] items-center gap-3 rounded-xl px-2 py-3 text-left transition sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:px-3",
        notification.isRead
          ? "hover:bg-gray-50"
          : "bg-brand-50/60 hover:bg-brand-50",
      )}
      aria-label={`${notification.isRead ? "Read" : "Unread"} notification: ${notification.title}`}
    >
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-700">
        <Bell className="h-6 w-6" strokeWidth={1.75} />
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white",
            notification.isRead
              ? "bg-gray-600 text-white"
              : "bg-brand-600 text-white",
          )}
          aria-hidden="true"
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </span>

      <span className="min-w-0 py-0.5">
        <span className="block text-sm leading-5 text-gray-800">
          <span className={cn(notification.isRead ? "font-semibold" : "font-bold text-gray-950")}>
            {notification.title}
          </span>{" "}
          <span className="text-gray-600">{notification.content}</span>
        </span>
        <span
          className={cn(
            "mt-1 block text-xs font-medium",
            notification.isRead ? "text-gray-400" : "text-brand-600",
          )}
        >
          {timeAgo(notification.createdAt)} · {label}
        </span>
      </span>

      <span className="flex items-center justify-end gap-2">
        {!notification.isRead && (
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />
        )}
        {href && (
          <ChevronRight className="hidden h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-500 sm:block" />
        )}
      </span>
    </button>
  );
}

function NotificationState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Bell;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-gray-950">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">{body}</p>
      {action}
    </div>
  );
}

function NotificationsSkeleton({ compact = false }: { compact?: boolean }) {
  if (!compact) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse pb-12">
        <div className="h-10 w-52 rounded bg-gray-100" />
        <div className="mt-3 h-4 w-72 rounded bg-gray-100" />
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="h-9 w-40 rounded-full bg-gray-100" />
        </div>
        <NotificationsSkeleton compact />
      </div>
    );
  }

  return (
    <div className="animate-pulse pt-6">
      <div className="mb-3 h-5 w-16 rounded bg-gray-100" />
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex gap-3 px-2 py-3">
          <div className="h-14 w-14 shrink-0 rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-4/5 rounded bg-gray-100" />
            <div className="h-4 w-3/5 rounded bg-gray-100" />
            <div className="h-3 w-28 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
