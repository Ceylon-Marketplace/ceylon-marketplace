"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, User, LogOut, Plus, Gavel } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isSeller =
    user?.role === "SELLER" || user?.role === "BUSINESS_SELLER";
  const isAdmin = [
    "SUPER_ADMIN",
    "OPERATIONS_MANAGER",
    "CONTENT_MODERATOR",
    "FINANCE_MANAGER",
    "SUPPORT_AGENT",
  ].includes(user?.role ?? "");

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-bold text-brand-600"
            >
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

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {isSeller && (
                  <Link href="/listings/create" className="btn-primary gap-1">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">List Item</span>
                  </Link>
                )}
                <Link
                  href="/messages"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <Link
                  href="/notifications"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Bell className="h-5 w-5" />
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                    <User className="h-5 w-5" />
                    <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                      {user.profile?.firstName}
                    </span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 hidden w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg group-hover:block">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
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
