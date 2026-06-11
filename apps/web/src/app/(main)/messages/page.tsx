"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { timeAgo, cn } from "@/lib/utils";
import { Send } from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("conversationId");

  const [activeConvId, setActiveConvId] = useState<string | null>(
    initialConvId,
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get("/conversations");
      return data;
    },
    enabled: !!user,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const socket = io(
      `${process.env.NEXT_PUBLIC_WS_URL}/messaging`,
      {
        auth: { token },
        transports: ["websocket"],
      },
    );
    socketRef.current = socket;

    socket.on("newMessage", (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => { socket.disconnect(); };
  }, [user, router]);

  useEffect(() => {
    if (!activeConvId) return;

    // Join conversation room
    socketRef.current?.emit("joinConversation", {
      conversationId: activeConvId,
    });

    // Load messages
    api.get(`/conversations/${activeConvId}/messages`).then(({ data }) => {
      setMessages([...data].reverse());
    });
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !activeConvId) return;
    socketRef.current?.emit("sendMessage", {
      conversationId: activeConvId,
      content: newMessage,
    });
    setNewMessage("");
  };

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Conversation list */}
      <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-200">
        <div className="sticky top-0 border-b bg-white px-4 py-3">
          <h2 className="font-semibold text-gray-900">Messages</h2>
        </div>
        {!conversations?.length ? (
          <p className="p-6 text-sm text-gray-400">No conversations yet.</p>
        ) : (
          conversations.map((conv: any) => {
            const other =
              conv.buyerId === user.id ? conv.seller : conv.buyer;
            const lastMsg = conv.messages[0];
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50",
                  activeConvId === conv.id && "bg-blue-50",
                )}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600">
                  {other?.profile?.firstName?.[0] ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {other?.profile?.firstName} {other?.profile?.lastName}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {conv.listing.title}
                  </p>
                  {lastMsg && (
                    <p className="truncate text-xs text-gray-400">
                      {lastMsg.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Chat window */}
      {activeConvId ? (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg: any) => {
              const isMe = msg.senderId === user.id;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isMe ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs rounded-2xl px-4 py-2 text-sm",
                      isMe
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-900",
                    )}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-right text-xs",
                        isMe ? "text-brand-100" : "text-gray-400",
                      )}
                    >
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-3 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message…"
              className="input flex-1"
            />
            <button onClick={sendMessage} className="btn-primary px-3">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-gray-400">
          Select a conversation
        </div>
      )}
    </div>
  );
}
