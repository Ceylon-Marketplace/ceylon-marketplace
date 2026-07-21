"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Bell,
  Bookmark,
  ChevronDown,
  Gavel,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  ShoppingBag,
  Store,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const primaryLinks = [
  { href: "/listings", label: "Listings" },
  { href: "/auctions", label: "Auctions" },
];

export function Navbar() {
  const { user, logout, mode, setMode } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

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

  const { data: notificationData } = useQuery({
    queryKey: ["notifications", "summary"],
    queryFn: async () => (await api.get("/notifications?limit=1")).data,
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });

  const unreadCount = notificationData?.unreadCount ?? 0;
  const initials = `${user?.profile?.firstName?.[0] ?? ""}${user?.profile?.lastName?.[0] ?? ""}` || "A";

  useEffect(() => {
    setAccountOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleLogout = () => {
    setAccountOpen(false);
    setMobileOpen(false);
    logout();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/90 bg-white/95 backdrop-blur-md" aria-label="Primary navigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-8">
            <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Ceylon Marketplace home">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(224,70,55,0.2)]">C</span>
              <span className="hidden text-[17px] font-semibold tracking-[-0.03em] text-gray-950 sm:block">Ceylon</span>
            </Link>

            <div className="hidden h-8 w-px bg-gray-200 md:block" />
            <div className="hidden items-center gap-1 md:flex">
              {primaryLinks.map((link) => <DesktopNavLink key={link.href} {...link} active={isRouteActive(pathname, link.href)} />)}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {user ? (
              <>
                {inSellerMode && (
                  <Link href="/listings/create" className="mr-1 hidden h-10 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98] sm:flex">
                    <Plus className="h-4 w-4" /> List an item
                  </Link>
                )}

                <div className="hidden items-center gap-1 md:flex">
                  <IconLink href="/messages" label="Messages" active={isRouteActive(pathname, "/messages")} icon={MessageSquare} />
                  <IconLink href="/offers" label="Offers" active={isRouteActive(pathname, "/offers")} icon={TrendingUp} />
                  <IconLink href="/notifications" label="Notifications" active={isRouteActive(pathname, "/notifications")} icon={Bell} count={unreadCount} />
                </div>

                <div ref={accountRef} className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((open) => !open)}
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    className={cn("ml-1 flex h-10 items-center gap-2 rounded-xl border px-2 pr-3 text-sm font-medium transition", accountOpen ? "border-gray-300 bg-gray-50 text-gray-950" : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50")}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-950 text-[11px] font-semibold uppercase text-white">{initials}</span>
                    <span className="max-w-24 truncate">{user.profile?.firstName ?? "Account"}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", accountOpen && "rotate-180")} />
                  </button>
                  {accountOpen && <AccountMenu user={user} isAdmin={isAdmin} isSeller={isSeller} isBuyerOnly={isBuyerOnly} inSellerMode={inSellerMode} mode={mode} setMode={setMode} onClose={() => setAccountOpen(false)} onLogout={handleLogout} />}
                </div>

                <Link href="/notifications" aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 md:hidden">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <NotificationCount count={unreadCount} />}
                </Link>
                <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label={mobileOpen ? "Close menu" : "Open menu"} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 md:hidden">
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden h-10 items-center px-3 text-sm font-semibold text-gray-700 hover:text-gray-950 sm:flex">Log in</Link>
                <Link href="/register" className="flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98]">Sign up</Link>
                <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label={mobileOpen ? "Close menu" : "Open menu"} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 md:hidden">
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && <MobileMenu user={user} pathname={pathname} isSeller={isSeller} isBuyerOnly={isBuyerOnly} isAdmin={isAdmin} inSellerMode={inSellerMode} mode={mode} setMode={setMode} onLogout={handleLogout} />}
    </nav>
  );
}

function DesktopNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={cn("rounded-xl px-3.5 py-2.5 text-sm font-medium transition", active ? "bg-gray-100 text-gray-950" : "text-gray-500 hover:bg-gray-50 hover:text-gray-950")}>{label}</Link>;
}

function IconLink({ href, label, active, icon: Icon, count = 0 }: { href: string; label: string; active: boolean; icon: typeof Bell; count?: number }) {
  return <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} title={label} className={cn("relative flex h-10 w-10 items-center justify-center rounded-xl transition", active ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-950")}><Icon className="h-[19px] w-[19px]" />{count > 0 && <NotificationCount count={count} />}</Link>;
}

function NotificationCount({ count }: { count: number }) {
  return <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">{count > 9 ? "9+" : count}</span>;
}

function AccountMenu({ user, isAdmin, isSeller, isBuyerOnly, inSellerMode, mode, setMode, onClose, onLogout }: { user: any; isAdmin: boolean; isSeller: boolean; isBuyerOnly: boolean; inSellerMode: boolean; mode: "buyer" | "seller" | null; setMode: (mode: "buyer" | "seller") => void; onClose: () => void; onLogout: () => void }) {
  return (
    <div role="menu" className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_22px_60px_rgba(17,24,39,0.14)]">
      <div className="border-b border-gray-100 px-4 py-4">
        <p className="truncate text-sm font-semibold text-gray-950">{user.profile?.firstName} {user.profile?.lastName}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
        {(isSeller || isAdmin) && <p className="mt-2 text-xs font-medium text-brand-600">{isAdmin ? user.role.replace(/_/g, " ").toLowerCase() : inSellerMode ? "Selling mode" : "Buying mode"}</p>}
      </div>

      <div className="p-2">
        <AccountLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} onClick={onClose} />
        <AccountLink href={`/profile/${user.id}`} label="Profile" icon={UserRound} onClick={onClose} />
        <AccountLink href="/listings/saved" label="Saved listings" icon={Bookmark} onClick={onClose} />
        {inSellerMode && <AccountLink href="/listings/mine" label="My listings" icon={Store} onClick={onClose} />}
        {isAdmin && <AccountLink href="/admin" label="Admin panel" icon={Grid2X2} onClick={onClose} />}
      </div>

      {isSeller && <ModeSwitcher mode={mode} setMode={setMode} onChange={onClose} />}
      {isBuyerOnly && <div className="border-t border-gray-100 p-2"><AccountLink href="/become-seller" label="Start selling" icon={ArrowLeftRight} onClick={onClose} accent /></div>}

      <div className="border-t border-gray-100 p-2">
        <AccountLink href="/profile/edit" label="Account settings" icon={Settings} onClick={onClose} />
        <button type="button" onClick={onLogout} role="menuitem" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"><LogOut className="h-4 w-4" /> Sign out</button>
      </div>
    </div>
  );
}

function AccountLink({ href, label, icon: Icon, onClick, accent = false }: { href: string; label: string; icon: typeof Bell; onClick?: () => void; accent?: boolean }) {
  return <Link href={href} onClick={onClick} role="menuitem" className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-gray-50", accent ? "text-brand-600" : "text-gray-600 hover:text-gray-950")}><Icon className="h-4 w-4" />{label}</Link>;
}

function ModeSwitcher({ mode, setMode, onChange }: { mode: "buyer" | "seller" | null; setMode: (mode: "buyer" | "seller") => void; onChange?: () => void }) {
  return <div className="border-t border-gray-100 px-4 py-4"><p className="mb-2 text-xs font-medium text-gray-500">Marketplace mode</p><div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1"><button type="button" onClick={() => { setMode("buyer"); onChange?.(); }} className={cn("flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition", mode === "buyer" ? "bg-white text-gray-950 shadow-sm" : "text-gray-500 hover:text-gray-800")}><ShoppingBag className="h-3.5 w-3.5" /> Buy</button><button type="button" onClick={() => { setMode("seller"); onChange?.(); }} className={cn("flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition", mode === "seller" ? "bg-brand-500 text-white" : "text-gray-500 hover:text-gray-800")}><Store className="h-3.5 w-3.5" /> Sell</button></div></div>;
}

function MobileMenu({ user, pathname, isSeller, isBuyerOnly, isAdmin, inSellerMode, mode, setMode, onLogout }: { user: any; pathname: string; isSeller: boolean; isBuyerOnly: boolean; isAdmin: boolean; inSellerMode: boolean; mode: "buyer" | "seller" | null; setMode: (mode: "buyer" | "seller") => void; onLogout: () => void }) {
  return (
    <div id="mobile-navigation" className="border-t border-gray-200 bg-white px-4 pb-5 pt-3 md:hidden">
      <div className="mx-auto max-w-7xl space-y-1">
        {primaryLinks.map((link) => <MobileLink key={link.href} {...link} active={isRouteActive(pathname, link.href)} />)}
        {user ? <>
          <MobileLink href="/messages" label="Messages" active={isRouteActive(pathname, "/messages")} icon={MessageSquare} />
          <MobileLink href="/offers" label="Offers" active={isRouteActive(pathname, "/offers")} icon={TrendingUp} />
          <MobileLink href="/dashboard" label="Dashboard" active={isRouteActive(pathname, "/dashboard")} icon={LayoutDashboard} />
          <MobileLink href="/listings/saved" label="Saved listings" active={isRouteActive(pathname, "/listings/saved")} icon={Bookmark} />
          {inSellerMode && <MobileLink href="/listings/mine" label="My listings" active={isRouteActive(pathname, "/listings/mine")} icon={Store} />}
          {isAdmin && <MobileLink href="/admin" label="Admin panel" active={isRouteActive(pathname, "/admin")} icon={Grid2X2} />}
          {inSellerMode && <Link href="/listings/create" className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> List an item</Link>}
          {isSeller && <ModeSwitcher mode={mode} setMode={setMode} />}
          {isBuyerOnly && <MobileLink href="/become-seller" label="Start selling" active={false} icon={ArrowLeftRight} accent />}
          <div className="mt-3 border-t border-gray-100 pt-3"><button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600"><LogOut className="h-4 w-4" /> Sign out</button></div>
        </> : <Link href="/login" className="mt-2 flex h-11 items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">Log in</Link>}
      </div>
    </div>
  );
}

function MobileLink({ href, label, active, icon: Icon, accent = false }: { href: string; label: string; active: boolean; icon?: typeof Bell; accent?: boolean }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium", active ? "bg-brand-50 text-brand-600" : accent ? "text-brand-600" : "text-gray-600")} >{Icon && <Icon className="h-4 w-4" />}{label}</Link>;
}

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
