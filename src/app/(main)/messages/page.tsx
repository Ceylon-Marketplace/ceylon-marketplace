"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  ImageIcon,
  Inbox,
  MessageCircle,
  PackageSearch,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import api from "@/lib/api";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

type Person = {
  id: string;
  profile: { firstName: string; lastName: string; avatar?: string | null } | null;
};

type Message = {
  id: string;
  senderId: string;
  content: string;
  mediaUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: Person;
  deliveryState?: "sending" | "failed";
};

type SendMessageInput = {
  content: string;
  conversationId: string;
  retryId?: string;
};

const CHAT_IDLE_TIMEOUT_MS = 2 * 60 * 1000;

function useChatActivity() {
  const lastActivityRef = useRef(Date.now());
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const markActive = () => {
      lastActivityRef.current = Date.now();
      if (document.visibilityState === "visible") setIsActive(true);
    };
    const updateActivity = () => {
      setIsActive(
        document.visibilityState === "visible" &&
          Date.now() - lastActivityRef.current < CHAT_IDLE_TIMEOUT_MS,
      );
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") markActive();
      else setIsActive(false);
    };

    window.addEventListener("pointerdown", markActive);
    window.addEventListener("keydown", markActive);
    window.addEventListener("focus", markActive);
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = window.setInterval(updateActivity, 15_000);

    return () => {
      window.removeEventListener("pointerdown", markActive);
      window.removeEventListener("keydown", markActive);
      window.removeEventListener("focus", markActive);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(interval);
    };
  }, []);

  return isActive;
}

type Conversation = {
  id: string;
  buyerId: string;
  sellerId: string;
  updatedAt: string;
  buyer: Person;
  seller: Person;
  listing: {
    id: string;
    title: string;
    price: number | string;
    status: string;
    media: { id: string; url: string; type: string }[];
  };
  messages: Message[];
};

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesSkeleton />}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isChatActive = useChatActivity();
  const initialConversationId = searchParams.get("conversationId");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const wasChatActiveRef = useRef(isChatActive);

  const conversationsQuery = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => (await api.get("/conversations")).data,
    enabled: !!user,
    refetchInterval: isChatActive ? 15_000 : false,
    refetchOnWindowFocus: true,
  });

  const messagesQuery = useQuery<Message[]>({
    queryKey: ["messages", activeConversationId],
    queryFn: async () => {
      const response = await api.get(`/conversations/${activeConversationId}/messages`);
      return [...response.data].reverse();
    },
    enabled: !!user && !!activeConversationId,
    refetchInterval: isChatActive ? 3_000 : false,
    refetchOnWindowFocus: true,
  });

  const sendMutation = useMutation({
    mutationFn: async ({ content, conversationId }: SendMessageInput) =>
      (await api.post(`/conversations/${conversationId}/messages`, { content })).data,
    onMutate: ({ content, conversationId, retryId }: SendMessageInput) => {
      const queryKey = ["messages", conversationId];
      void queryClient.cancelQueries({ queryKey });
      const optimisticId = retryId ?? `optimistic-${crypto.randomUUID()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        senderId: user!.id,
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
        deliveryState: "sending",
      };

      queryClient.setQueryData<Message[]>(queryKey, (current = []) =>
        retryId
          ? current.map((message) =>
              message.id === retryId ? optimisticMessage : message,
            )
          : [...current, optimisticMessage],
      );
      if (!retryId) setNewMessage("");
      setSendError("");
      return { optimisticId, queryKey, conversationId };
    },
    onSuccess: (message: Message, _input, context) => {
      queryClient.setQueryData<Message[]>(context.queryKey, (current = []) =>
        current.map((currentMessage) =>
          currentMessage.id === context.optimisticId ? message : currentMessage,
        ),
      );
      setSendError("");
      queryClient.invalidateQueries({ queryKey: context.queryKey });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: unknown, _input, context) => {
      if (context) {
        queryClient.setQueryData<Message[]>(
          context.queryKey,
          (current = []) =>
            current.map((message) =>
              message.id === context.optimisticId
                ? { ...message, deliveryState: "failed" }
                : message,
            ),
        );
      }
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "message" in error.response.data &&
        typeof error.response.data.message === "string"
          ? error.response.data.message
          : "Your message could not be sent. Please try again.";
      setSendError(message);
    },
  });

  useEffect(() => {
    if (hasHydrated && !user) {
      const destination = `/messages${initialConversationId ? `?conversationId=${initialConversationId}` : ""}`;
      router.replace(`/login?next=${encodeURIComponent(destination)}`);
    }
  }, [hasHydrated, initialConversationId, router, user]);

  useEffect(() => {
    if (isChatActive && !wasChatActiveRef.current) {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (activeConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["messages", activeConversationId],
        });
      }
    }
    wasChatActiveRef.current = isChatActive;
  }, [activeConversationId, isChatActive, queryClient]);

  useEffect(() => {
    if (messagesQuery.data && messagesQuery.data.length > previousMessageCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      previousMessageCountRef.current = messagesQuery.data.length;
    }
  }, [messagesQuery.data]);

  const conversations = conversationsQuery.data ?? [];
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
  const otherPerson = activeConversation
    ? activeConversation.buyerId === user?.id
      ? activeConversation.seller
      : activeConversation.buyer
    : null;
  const filteredConversations = conversations.filter((conversation) => {
    const person = conversation.buyerId === user?.id ? conversation.seller : conversation.buyer;
    const haystack = `${person.profile?.firstName ?? ""} ${person.profile?.lastName ?? ""} ${conversation.listing.title}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setSendError("");
    previousMessageCountRef.current = 0;
    router.replace(`/messages?conversationId=${conversationId}`, { scroll: false });
  };

  const closeConversation = () => {
    setActiveConversationId(null);
    router.replace("/messages", { scroll: false });
  };

  const sendMessage = () => {
    const content = newMessage.trim();
    if (!content || !activeConversationId) return;
    setSendError("");
    sendMutation.mutate({ content, conversationId: activeConversationId });
  };

  if (!hasHydrated || !user) return <MessagesSkeleton />;

  return (
    <div className="-my-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_70px_-52px_rgba(17,24,39,0.4)]">
      <div className="grid h-[calc(100dvh-8.5rem)] min-h-[560px] md:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={cn("min-h-0 border-r border-gray-200 bg-white", activeConversationId ? "hidden md:flex md:flex-col" : "flex flex-col")}>
          <div className="border-b border-gray-200 p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Marketplace inbox</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-gray-950">Messages</h1>
              </div>
              <span className="text-xs text-gray-400">{conversations.length} conversation{conversations.length === 1 ? "" : "s"}</span>
            </div>
            <label className="relative mt-4 block">
              <span className="sr-only">Search conversations</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people or listings" className="input h-10 pl-9 text-sm" />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversationsQuery.isLoading ? (
              <ConversationListSkeleton />
            ) : conversationsQuery.isError ? (
              <StatePanel icon={AlertCircle} title="Inbox unavailable" body="Your conversations could not be loaded." action={<button onClick={() => conversationsQuery.refetch()} className="btn-secondary mt-4 gap-2"><RefreshCw className="h-4 w-4" /> Try again</button>} />
            ) : conversations.length === 0 ? (
              <StatePanel icon={Inbox} title="No conversations yet" body="Start from a listing to message its seller." action={<Link href="/listings" className="btn-primary mt-4">Browse listings</Link>} />
            ) : filteredConversations.length === 0 ? (
              <StatePanel icon={Search} title="No matching conversations" body="Try another person or listing name." />
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conversation) => {
                  const person = conversation.buyerId === user.id ? conversation.seller : conversation.buyer;
                  const latestMessage = conversation.messages[0];
                  const isUnread = latestMessage && !latestMessage.isRead && latestMessage.senderId !== user.id;
                  const coverImage = conversation.listing.media.find((media) => media.type === "IMAGE");
                  return (
                    <button key={conversation.id} onClick={() => selectConversation(conversation.id)} className={cn("group flex w-full gap-3 border-l-2 px-4 py-4 text-left transition hover:bg-gray-50", activeConversationId === conversation.id ? "border-l-brand-500 bg-brand-50/60" : "border-l-transparent")}>
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                        {coverImage ? <Image src={coverImage.url} alt="" fill sizes="48px" className="object-cover" /> : <span className="flex h-full items-center justify-center"><ImageIcon className="h-5 w-5 text-gray-300" /></span>}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={cn("truncate text-sm text-gray-950", isUnread ? "font-semibold" : "font-medium")}>{person.profile?.firstName} {person.profile?.lastName}</span>
                          {latestMessage && <span className="shrink-0 text-[11px] text-gray-400">{timeAgo(latestMessage.createdAt)}</span>}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium text-gray-500">{conversation.listing.title}</span>
                        <span className="mt-1 flex items-center gap-2">
                          <span className={cn("block flex-1 truncate text-xs", isUnread ? "font-medium text-gray-700" : "text-gray-400")}>{latestMessage?.content ?? "Conversation started"}</span>
                          {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className={cn("min-h-0 min-w-0 bg-gray-50", activeConversationId ? "flex flex-col" : "hidden md:flex md:flex-col")}>
          {!activeConversationId ? (
            <div className="flex flex-1 items-center justify-center p-8"><StatePanel icon={MessageCircle} title="Choose a conversation" body="Select a person from your inbox to read and reply." /></div>
          ) : !activeConversation && !conversationsQuery.isLoading ? (
            <div className="flex flex-1 items-center justify-center p-8"><StatePanel icon={AlertCircle} title="Conversation unavailable" body="It may have been removed or is no longer available." action={<button onClick={closeConversation} className="btn-secondary mt-4">Back to inbox</button>} /></div>
          ) : activeConversation && otherPerson ? (
            <>
              <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
                <button onClick={closeConversation} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 md:hidden" aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></button>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">{otherPerson.profile?.firstName?.[0] ?? "?"}</span>
                <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-gray-950">{otherPerson.profile?.firstName} {otherPerson.profile?.lastName}</h2><p className="mt-0.5 truncate text-xs text-gray-400">Conversation about {activeConversation.listing.title}</p></div>
                <Link href={`/listings/${activeConversation.listing.id}`} className="hidden items-center gap-1.5 text-xs font-medium text-gray-600 transition hover:text-brand-600 sm:flex">View listing <ChevronRight className="h-3.5 w-3.5" /></Link>
              </header>

              <Link href={`/listings/${activeConversation.listing.id}`} className="group flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 transition hover:bg-gray-50 sm:px-5">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {activeConversation.listing.media[0] ? <Image src={activeConversation.listing.media[0].url} alt="" fill sizes="48px" className="object-cover" /> : <span className="flex h-full items-center justify-center"><PackageSearch className="h-5 w-5 text-gray-300" /></span>}
                </span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-gray-950">{activeConversation.listing.title}</span><span className="mt-0.5 block text-xs text-gray-500">{formatPrice(activeConversation.listing.price)} · {activeConversation.listing.status.toLowerCase()}</span></span>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-brand-500" />
              </Link>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                {messagesQuery.isLoading ? (
                  <MessageThreadSkeleton />
                ) : messagesQuery.isError ? (
                  <div className="flex h-full items-center justify-center"><StatePanel icon={AlertCircle} title="Messages unavailable" body="The conversation could not be loaded." action={<button onClick={() => messagesQuery.refetch()} className="btn-secondary mt-4">Try again</button>} /></div>
                ) : messagesQuery.data?.length === 0 ? (
                  <div className="flex h-full items-center justify-center"><StatePanel icon={MessageCircle} title="Start the conversation" body={`Send ${otherPerson.profile?.firstName ?? "this seller"} a message about the listing.`} /></div>
                ) : (
                  <div className="mx-auto max-w-3xl space-y-4">
                    {messagesQuery.data?.map((message) => {
                      const isMine = message.senderId === user.id;
                      return (
                        <div key={message.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[82%] sm:max-w-[70%]", isMine ? "items-end" : "items-start")}>
                            <div className={cn("rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm", isMine ? "rounded-br-md bg-brand-500 text-white" : "rounded-bl-md border border-gray-200 bg-white text-gray-800")}>
                              {message.mediaUrl && <div className="relative mb-2 aspect-video overflow-hidden rounded-xl"><Image src={message.mediaUrl} alt="Shared attachment" fill sizes="400px" className="object-cover" /></div>}
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            <p className={cn("mt-1.5 flex items-center gap-1 text-[11px] text-gray-400", isMine && "justify-end")}>
                              {message.deliveryState === "sending" ? (
                                "Sending..."
                              ) : message.deliveryState === "failed" ? (
                                <>
                                  <span className="text-red-600">Not sent</span>
                                  <button
                                    onClick={() =>
                                      sendMutation.mutate({
                                        content: message.content,
                                        conversationId: activeConversation.id,
                                        retryId: message.id,
                                      })
                                    }
                                    className="font-medium text-red-600 underline underline-offset-2"
                                  >
                                    Retry
                                  </button>
                                </>
                              ) : (
                                <>
                                  {timeAgo(message.createdAt)}
                                  {isMine && message.isRead ? (
                                    <><Check className="h-3 w-3" /> Read</>
                                  ) : isMine ? (
                                    <><Check className="h-3 w-3" /> Sent</>
                                  ) : null}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
                <div className="mx-auto max-w-3xl">
                  {sendError && <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{sendError}</div>}
                  <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 focus-within:border-gray-400 focus-within:ring-4 focus-within:ring-brand-50">
                    <label className="min-w-0 flex-1"><span className="sr-only">Message</span><textarea value={newMessage} onChange={(event) => setNewMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} rows={1} maxLength={2000} placeholder={`Message ${otherPerson.profile?.firstName ?? "seller"}`} className="max-h-32 min-h-10 w-full resize-none border-0 bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400" /></label>
                    <button onClick={sendMessage} disabled={!newMessage.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 active:translate-y-px disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400" aria-label="Send message"><Send className="h-4 w-4" /></button>
                  </div>
                  <p className="mt-2 px-1 text-[11px] text-gray-400">Enter to send · Shift + Enter for a new line</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center"><MessagesSkeleton compact /></div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatePanel({ icon: Icon, title, body, action }: { icon: typeof Inbox; title: string; body: string; action?: React.ReactNode }) {
  return <div className="p-8 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400"><Icon className="h-5 w-5" /></span><h2 className="mt-4 text-sm font-semibold text-gray-950">{title}</h2><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-gray-500">{body}</p>{action}</div>;
}

function ConversationListSkeleton() {
  return <div className="animate-pulse divide-y divide-gray-100">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="flex gap-3 p-4"><div className="h-12 w-12 rounded-xl bg-gray-100" /><div className="flex-1 space-y-2 py-1"><div className="h-3 w-2/3 rounded bg-gray-100" /><div className="h-3 w-full rounded bg-gray-100" /><div className="h-3 w-4/5 rounded bg-gray-100" /></div></div>)}</div>;
}

function MessageThreadSkeleton() {
  return <div className="mx-auto max-w-3xl animate-pulse space-y-5"><div className="h-16 w-2/3 rounded-2xl bg-white" /><div className="ml-auto h-20 w-3/5 rounded-2xl bg-brand-50" /><div className="h-12 w-1/2 rounded-2xl bg-white" /></div>;
}

function MessagesSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={cn("animate-pulse rounded-2xl border border-gray-200 bg-white", compact ? "h-32 w-64" : "h-[calc(100dvh-8.5rem)] min-h-[560px] w-full")} />;
}
