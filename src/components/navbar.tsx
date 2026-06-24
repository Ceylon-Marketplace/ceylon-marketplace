"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import {
  Bell,
  MessageSquare,
  User,
  LogOut,
  Plus,
  Gavel,
  TrendingUp,
  ChevronDown,
  ShoppingBag,
  Store,
  ArrowLeftRight,
} from "lucide-react";

export function Navbar() {
  const { user, logout, mode, setMode } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push("/");
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [router]);

  const isSeller = user?.role === "SELLER" || user?.role === "BUSINESS_SELLER";
  const isBuyerOnly = user?.role === "USER";
  const inSellerMode = isSeller && mode === "seller";
  const isAdmin = [
    "SUPER_ADMIN",
    "OPERATIONS_MANAGER",
    "CONTENT_MODERATOR",
    "FINANCE_MANAGER",
    "SUPPORT_AGENT",
  ].includes(user?.role ?? "");

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications?limit=1");
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-brand-600">
              Ceylon
            </Link>
            <div className="hidden items-center gap-6 sm:flex">
              <Link
                href="/listings"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Listings
              </Link>
              <Link
                href="/auctions"
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <Gavel className="h-4 w-4" />
                Auctions
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {inSellerMode && (
                  <Link href="/listings/create" className="btn-primary gap-1">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">List Item</span>
                  </Link>
                )}

                <Link
                  href="/messages"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Messages"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>

                <Link
                  href="/offers"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Offers"
                >
                  <TrendingUp className="h-5 w-5" />
                </Link>

                <Link
                  href="/notifications"
                  className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {(notifData?.unreadCount ?? 0) > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {notifData.unreadCount > 9 ? "9+" : notifData.unreadCount}
                    </span>
                  )}
                </Link>

                {/* User menu — click-toggled */}
                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                      menuOpen
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline">
                      {user.profile?.firstName ?? "Account"}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                      {/* User info header */}
                      <div className="border-b border-gray-100 px-4 py-2.5">
                        <p className="text-sm font-semibold text-gray-900">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {user.email}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {isAdmin && (
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                              {user.role.replace(/_/g, " ")}
                            </span>
                          )}
                          {isSeller && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                inSellerMode
                                  ? "bg-green-50 text-green-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {inSellerMode ? "Seller mode" : "Buyer mode"}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href={`/profile/${user.id}`}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/profile/edit"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Edit Profile
                      </Link>
                      <Link
                        href="/listings/saved"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Saved Listings
                      </Link>
                      {inSellerMode && (
                        <Link
                          href="/listings/mine"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          My Listings
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Admin Panel
                        </Link>
                      )}

                      {/* Mode switcher for sellers */}
                      {isSeller && (
                        <>
                          <hr className="my-1 border-gray-100" />
                          <div className="px-4 py-2">
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              Switch mode
                            </p>
                            <div className="flex rounded-lg border border-gray-200 p-0.5">
                              <button
                                onClick={() => {
                                  setMode("buyer");
                                  setMenuOpen(false);
                                }}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                                  mode === "buyer"
                                    ? "bg-blue-500 text-white"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                <ShoppingBag className="h-3.5 w-3.5" />
                                Buyer
                              </button>
                              <button
                                onClick={() => {
                                  setMode("seller");
                                  setMenuOpen(false);
                                }}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                                  mode === "seller"
                                    ? "bg-green-500 text-white"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                <Store className="h-3.5 w-3.5" />
                                Seller
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Upgrade prompt for buyer-only accounts */}
                      {isBuyerOnly && (
                        <>
                          <hr className="my-1 border-gray-100" />
                          <Link
                            href="/become-seller"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                            Start selling
                          </Link>
                        </>
                      )}

                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
