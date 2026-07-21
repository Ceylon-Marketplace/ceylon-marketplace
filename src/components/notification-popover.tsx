"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
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

type NotificationSummary = {
  unreadCount: number;
};

type NotificationGroup = {
  key: string;
  latest: MarketplaceNotification;
  notifications: MarketplaceNotification[];
  unreadCount: number;
};

const POPOVER_QUERY_KEY = ["notifications", "popover"] as const;
const SUMMARY_QUERY_KEY = ["notifications", "summary"] as const;

export function NotificationPopover({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const summaryQuery = useQuery<NotificationSummary>({
    queryKey: SUMMARY_QUERY_KEY,
    queryFn: async () => (await api.get("/notifications?summary=1")).data,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const notificationsQuery = useQuery<NotificationsResponse>({
    queryKey: POPOVER_QUERY_KEY,
    queryFn: async () => (await api.get("/notifications?limit=50")).data,
    enabled: open,
    refetchInterval: open ? 30_000 : false,
    refetchOnWindowFocus: open,
  });

  const unreadCount =
    summaryQuery.data?.unreadCount ?? notificationsQuery.data?.unreadCount ?? 0;
  const notificationGroups = useMemo(
    () => groupNotifications(notificationsQuery.data?.notifications ?? []),
    [notificationsQuery.data?.notifications],
  );

  const markGroupRead = useMutation({
    mutationFn: (ids: string[]) => api.patch("/notifications", { ids }),
    onMutate: async (ids) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: POPOVER_QUERY_KEY }),
        queryClient.cancelQueries({ queryKey: SUMMARY_QUERY_KEY }),
      ]);
      const previous = queryClient.getQueryData<NotificationsResponse>(
        POPOVER_QUERY_KEY,
      );
      const previousSummary =
        queryClient.getQueryData<NotificationSummary>(SUMMARY_QUERY_KEY);
      const idSet = new Set(ids);
      const groupUnreadCount =
        previous?.notifications.filter(
          (notification) => idSet.has(notification.id) && !notification.isRead,
        ).length ?? 0;
      queryClient.setQueryData<NotificationsResponse>(
        POPOVER_QUERY_KEY,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            unreadCount: Math.max(0, current.unreadCount - groupUnreadCount),
            notifications: current.notifications.map((notification) =>
              idSet.has(notification.id)
                ? { ...notification, isRead: true }
                : notification,
            ),
          };
        },
      );
      queryClient.setQueryData<NotificationSummary>(
        SUMMARY_QUERY_KEY,
        (current) =>
          current
            ? {
                unreadCount: Math.max(0, current.unreadCount - groupUnreadCount),
              }
            : current,
      );
      return { previous, previousSummary };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(POPOVER_QUERY_KEY, context.previous);
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(SUMMARY_QUERY_KEY, context.previousSummary);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/notifications"),
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: POPOVER_QUERY_KEY }),
        queryClient.cancelQueries({ queryKey: SUMMARY_QUERY_KEY }),
      ]);
      const previous = queryClient.getQueryData<NotificationsResponse>(
        POPOVER_QUERY_KEY,
      );
      const previousSummary =
        queryClient.getQueryData<NotificationSummary>(SUMMARY_QUERY_KEY);
      queryClient.setQueryData<NotificationsResponse>(
        POPOVER_QUERY_KEY,
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
      queryClient.setQueryData<NotificationSummary>(SUMMARY_QUERY_KEY, {
        unreadCount: 0,
      });
      return { previous, previousSummary };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(POPOVER_QUERY_KEY, context.previous);
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(SUMMARY_QUERY_KEY, context.previousSummary);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const openNotificationGroup = (group: NotificationGroup) => {
    const unreadIds = group.notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);
    if (unreadIds.length > 0) markGroupRead.mutate(unreadIds);
    const href = notificationHref(group.latest);
    onClose();
    if (href) router.push(href);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl transition",
          open
            ? "bg-brand-50 text-brand-600"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-950",
        )}
      >
        <Bell className="h-[19px] w-[19px]" />
        {unreadCount > 0 && <NotificationCount count={unreadCount} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed left-3 right-3 top-[68px] z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_22px_60px_rgba(17,24,39,0.16)] md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-[410px]"
        >
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3.5">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.025em] text-gray-950">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} unread ${unreadCount === 1 ? "update" : "updates"}`
                  : "You are all caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 active:scale-[0.98] disabled:opacity-60"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {markAllRead.isPending ? "Updating..." : "Mark all read"}
              </button>
            )}
          </div>

          <div className="max-h-[min(68dvh,560px)] overflow-y-auto overscroll-contain p-2">
            {notificationsQuery.isLoading ? (
              <NotificationPopoverSkeleton />
            ) : notificationsQuery.isError ? (
              <PopoverState
                icon={AlertCircle}
                title="Could not load notifications"
                action={
                  <button
                    type="button"
                    onClick={() => notificationsQuery.refetch()}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-600"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Try again
                  </button>
                }
              />
            ) : notificationGroups.length ? (
              notificationGroups.map((group) => (
                <NotificationRow
                  key={group.key}
                  group={group}
                  onOpen={() => openNotificationGroup(group)}
                />
              ))
            ) : (
              <PopoverState
                icon={Inbox}
                title="Nothing here yet"
                body="New marketplace activity will appear here."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  group,
  onOpen,
}: {
  group: NotificationGroup;
  onOpen: () => void;
}) {
  const notification = group.latest;
  const isRead = group.unreadCount === 0;
  const additionalCount = group.notifications.length - 1;
  const { icon: Icon, label } = notificationVisual(notification.type);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "grid w-full grid-cols-[48px_minmax(0,1fr)_10px] items-center gap-3 rounded-xl px-2 py-2.5 text-left transition",
        isRead ? "hover:bg-gray-50" : "bg-brand-50/60 hover:bg-brand-50",
      )}
      aria-label={`${isRead ? "Read" : "Unread"} notification group: ${notification.title}${additionalCount > 0 ? ` and ${additionalCount} more` : ""}`}
    >
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700">
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-white",
            isRead ? "bg-gray-600" : "bg-brand-600",
          )}
          aria-hidden="true"
        >
          <Icon className="h-3 w-3" strokeWidth={2} />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-sm leading-[1.35] text-gray-700">
          <span className={isRead ? "font-semibold" : "font-bold text-gray-950"}>
            {notification.title}
          </span>{" "}
          <span className="text-gray-600">{notification.content}</span>
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium">
          <span className={isRead ? "text-gray-400" : "text-brand-600"}>
            {timeAgo(notification.createdAt)} · {label}
          </span>
          {additionalCount > 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
              +{additionalCount} more
            </span>
          )}
        </span>
      </span>
      {!isRead && (
        <span className="h-2.5 w-2.5 rounded-full bg-brand-600" aria-label="Unread" />
      )}
    </button>
  );
}

function groupNotifications(
  notifications: MarketplaceNotification[],
): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();

  for (const notification of notifications) {
    const key = notificationGroupKey(notification);
    const existing = groups.get(key);
    if (existing) {
      existing.notifications.push(notification);
      if (!notification.isRead) existing.unreadCount += 1;
      continue;
    }
    groups.set(key, {
      key,
      latest: notification,
      notifications: [notification],
      unreadCount: notification.isRead ? 0 : 1,
    });
  }

  return Array.from(groups.values());
}

function notificationGroupKey(notification: MarketplaceNotification) {
  const metadata = notification.metadata;
  if (metadata?.conversationId) return `conversation:${metadata.conversationId}`;
  if (metadata?.auctionId) return `auction:${metadata.auctionId}`;
  if (metadata?.listingId) return `listing:${metadata.listingId}`;
  if (metadata?.offerId) return `offer:${metadata.offerId}`;
  return `notification:${notification.id}`;
}

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

function NotificationCount({ count }: { count: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function NotificationPopoverSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-3 px-2 py-2.5">
          <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3.5 w-5/6 rounded bg-gray-100" />
            <div className="h-3.5 w-2/3 rounded bg-gray-100" />
            <div className="h-2.5 w-24 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PopoverState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Bell;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-gray-950">{title}</p>
      {body && <p className="mt-1 text-xs leading-5 text-gray-500">{body}</p>}
      {action}
    </div>
  );
}
