"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import {
  Users,
  Package,
  Gavel,
  Flag,
  ClipboardList,
} from "lucide-react";

type Tab = "overview" | "pending" | "users" | "reports";

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");

  const isAdmin = [
    "SUPER_ADMIN",
    "OPERATIONS_MANAGER",
    "CONTENT_MODERATOR",
    "FINANCE_MANAGER",
    "SUPPORT_AGENT",
  ].includes(user?.role ?? "");

  if (!user || !isAdmin) {
    router.push("/");
    return null;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Panel</h1>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(
          [
            { key: "overview", label: "Overview", icon: ClipboardList },
            { key: "pending", label: "Pending Listings", icon: Package },
            { key: "users", label: "Users", icon: Users },
            { key: "reports", label: "Reports", icon: Flag },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <StatsPanel />}
      {tab === "pending" && <PendingListings qc={qc} />}
      {tab === "users" && <UsersPanel user={user} qc={qc} />}
      {tab === "reports" && <ReportsPanel user={user} qc={qc} />}
    </div>
  );
}

function StatsPanel() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/stats");
      return data;
    },
  });

  const cards = [
    { label: "Total Users", value: stats?.totalUsers, icon: "👥" },
    { label: "Active Listings", value: stats?.activeListings, icon: "📦" },
    { label: "Live Auctions", value: stats?.liveAuctions, icon: "🔨" },
    { label: "Pending Review", value: stats?.pendingReview, icon: "⏳" },
    { label: "Open Reports", value: stats?.openReports, icon: "🚩" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="card p-5">
          <p className="text-2xl">{c.icon}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {c.value ?? "—"}
          </p>
          <p className="text-xs text-gray-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function PendingListings({ qc }: { qc: any }) {
  const { data } = useQuery({
    queryKey: ["pending-listings"],
    queryFn: async () => {
      const { data } = await api.get("/admin/listings/pending");
      return data;
    },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/listings/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending-listings"] }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/listings/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending-listings"] }),
  });

  const handleReject = (id: string) => {
    const reason = prompt("Rejection reason:");
    if (reason !== null) rejectMut.mutate({ id, reason });
  };

  return (
    <div className="space-y-3">
      {!data?.length && (
        <p className="text-sm text-gray-400">No listings pending review.</p>
      )}
      {data?.map((listing: any) => (
        <div key={listing.id} className="card flex items-start gap-4 p-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{listing.title}</p>
            <p className="text-sm text-gray-500 truncate">
              {listing.description.slice(0, 100)}
            </p>
            <p className="text-xs text-gray-400">
              by {listing.seller.profile?.firstName} · {timeAgo(listing.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => approveMut.mutate(listing.id)}
              className="btn-primary text-xs"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(listing.id)}
              className="btn-secondary text-xs text-red-600"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersPanel({ user: admin, qc }: { user: any; qc: any }) {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/users?search=${search}&limit=30`,
      );
      return data;
    },
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/admin/users/${id}/suspend`, { reason: "Admin action" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const reinstateMut = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/admin/users/${id}/reinstate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search users…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input mb-4 max-w-sm"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500">
              <th className="pb-2 pr-4 font-medium">Name</th>
              <th className="pb-2 pr-4 font-medium">Email</th>
              <th className="pb-2 pr-4 font-medium">Role</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.users?.map((u: any) => (
              <tr key={u.id} className="text-gray-700">
                <td className="py-3 pr-4">
                  {u.profile?.firstName} {u.profile?.lastName}
                </td>
                <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                <td className="py-3 pr-4">
                  <span className="badge bg-gray-100 text-gray-700">
                    {u.role}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`badge ${
                      u.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="py-3">
                  {u.id !== admin.id &&
                    (u.isActive ? (
                      <button
                        onClick={() => suspendMut.mutate(u.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => reinstateMut.mutate(u.id)}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Reinstate
                      </button>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsPanel({ user: admin, qc }: { user: any; qc: any }) {
  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data } = await api.get("/reports?status=PENDING");
      return data;
    },
  });

  const resolveMut = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "resolve" | "dismiss";
    }) => api.patch(`/reports/${id}/resolve`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  return (
    <div className="space-y-3">
      {!data?.reports?.length && (
        <p className="text-sm text-gray-400">No open reports.</p>
      )}
      {data?.reports?.map((r: any) => (
        <div key={r.id} className="card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">
                {r.targetType}: {r.reason}
              </p>
              <p className="text-sm text-gray-500">{r.description}</p>
              <p className="text-xs text-gray-400">
                Reported by {r.reporter.profile?.firstName} ·{" "}
                {timeAgo(r.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => resolveMut.mutate({ id: r.id, action: "resolve" })}
                className="btn-primary text-xs"
              >
                Resolve
              </button>
              <button
                onClick={() =>
                  resolveMut.mutate({ id: r.id, action: "dismiss" })
                }
                className="btn-secondary text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
