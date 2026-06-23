"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import {
  getApiErrorMessage,
  type AdminStats,
  type AdminUserSummary,
  type AppQueryClient,
  type AuthUser,
  type CategorySummary,
  type ListingSummary,
  type ReportSummary,
} from "@/lib/types";
import {
  Users,
  Package,
  Flag,
  ClipboardList,
  Tag,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";

type Tab = "overview" | "pending" | "users" | "reports" | "categories";
type CategoryFormValues = { name: string; slug: string; imageUrl?: string; parentId?: string };
type AttributeFormValues = { name: string; type: string; required: boolean; options: string[] };
type CategoryUpdateValues = CategoryFormValues & { id: string };
type AttributeCreateValues = AttributeFormValues & { id: string };
type AttributeDeleteValues = { catId: string; attrId: string };

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

  useEffect(() => {
    if (!user || !isAdmin) router.push("/");
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) return null;

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
            { key: "categories", label: "Categories", icon: Tag },
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
      {tab === "categories" && <CategoriesPanel />}
    </div>
  );
}

function StatsPanel() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/stats");
      return data as AdminStats;
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

function PendingListings({ qc }: { qc: AppQueryClient }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-listings"],
    queryFn: async () => {
      const { data } = await api.get("/admin/listings");
      return data as ListingSummary[];
    },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/listings/${id}/moderate`, { action: "approve" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending-listings"] }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/listings/${id}/moderate`, { action: "reject", reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pending-listings"] }),
  });

  const handleReject = (id: string) => {
    const reason = prompt("Rejection reason:");
    if (reason !== null) rejectMut.mutate({ id, reason });
  };

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        Failed to load pending listings:{" "}
        {getApiErrorMessage(error, "Unknown error")}
      </div>
    );

  return (
    <div className="space-y-3">
      {!data?.length && (
        <p className="text-sm text-gray-400">No listings pending review.</p>
      )}
      {data?.map((listing) => (
        <div key={listing.id} className="card flex items-start gap-4 p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-900">{listing.title}</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                {listing.listingType}
              </span>
              {listing.category && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {listing.category.name}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500 truncate">
              {(listing.description ?? "").slice(0, 120)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              by {listing.seller?.profile?.firstName ?? "Unknown"}{" "}
              {listing.seller?.profile?.lastName ?? ""} · {timeAgo(listing.createdAt)}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            <button
              onClick={() => approveMut.mutate(listing.id)}
              disabled={approveMut.isPending}
              className="btn-primary text-xs disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(listing.id)}
              disabled={rejectMut.isPending}
              className="btn-secondary text-xs text-red-600 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersPanel({ user: admin, qc }: { user: AuthUser; qc: AppQueryClient }) {
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/users?search=${search}&limit=30`,
      );
      return data as { users: AdminUserSummary[] };
    },
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/admin/users/${id}`, { action: "suspend", reason: "Admin action" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const reinstateMut = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/admin/users/${id}`, { action: "reinstate" }),
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
            {data?.users?.map((u) => (
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

function CategoriesPanel() {
  const qc = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addingParent, setAddingParent] = useState(false);
  const [addingSubOf, setAddingSubOf] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingAttrOf, setAddingAttrOf] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data as CategorySummary[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-categories"] });

  const createMut = useMutation({
    mutationFn: (body: CategoryFormValues) => api.post("/categories", body),
    onSuccess: () => { invalidate(); setAddingParent(false); setAddingSubOf(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: CategoryUpdateValues) => api.patch(`/categories/${id}`, body),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: invalidate,
  });

  const addAttrMut = useMutation({
    mutationFn: ({ id, ...body }: AttributeCreateValues) => api.post(`/categories/${id}/attributes`, body),
    onSuccess: () => { invalidate(); setAddingAttrOf(null); },
  });

  const delAttrMut = useMutation({
    mutationFn: ({ catId, attrId }: AttributeDeleteValues) =>
      api.delete(`/categories/${catId}/attributes/${attrId}`),
    onSuccess: invalidate,
  });

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const slugify = (s: string) =>
    s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {categories?.length ?? 0} top-level categories
        </p>
        <button
          onClick={() => { setAddingParent(true); setAddingSubOf(null); }}
          className="btn-primary gap-1 text-sm"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {addingParent && (
        <CategoryForm
          onSave={(vals) => createMut.mutate(vals)}
          onCancel={() => setAddingParent(false)}
          pending={createMut.isPending}
          slugify={slugify}
        />
      )}

      <div className="space-y-3">
        {categories?.map((cat) => {
          const expanded = expandedIds.has(cat.id);
          const isEditing = editingId === cat.id;
          const children = cat.children ?? [];
          const attributes = cat.attributes ?? [];
          const childCount = children.length;
          const attrCount = attributes.length;
          return (
            <div key={cat.id} className="card overflow-hidden">
              {/* Category header */}
              {isEditing ? (
                <div className="p-4">
                  <CategoryForm
                    initial={{ name: cat.name, slug: cat.slug, imageUrl: cat.imageUrl ?? "" }}
                    onSave={(vals) => updateMut.mutate({ id: cat.id, ...vals })}
                    onCancel={() => setEditingId(null)}
                    pending={updateMut.isPending}
                    slugify={slugify}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    <span className="ml-2 text-xs text-gray-400">/{cat.slug}</span>
                    {(childCount > 0 || attrCount > 0) && (
                      <span className="ml-2 text-xs text-gray-400">
                        {childCount > 0 && `${childCount} sub`}
                        {childCount > 0 && attrCount > 0 && " · "}
                        {attrCount > 0 && `${attrCount} attrs`}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingId(cat.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setAddingSubOf(cat.id);
                        setAddingParent(false);
                        if (!expanded) toggleExpand(cat.id);
                      }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Add subcategory"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${cat.name}"? This hides it from listings.`))
                          deleteMut.mutate(cat.id);
                      }}
                      className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded body */}
              {expanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-4">
                  {/* Subcategory add form */}
                  {addingSubOf === cat.id && (
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="mb-2 text-xs font-semibold text-gray-500">
                        NEW SUBCATEGORY OF {cat.name.toUpperCase()}
                      </p>
                      <CategoryForm
                        onSave={(vals) =>
                          createMut.mutate({ ...vals, parentId: cat.id })
                        }
                        onCancel={() => setAddingSubOf(null)}
                        pending={createMut.isPending}
                        slugify={slugify}
                      />
                    </div>
                  )}

                  {/* Subcategories */}
                  {childCount > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Subcategories
                      </p>
                      <div className="space-y-1">
                        {children.map((sub) => {
                          const isEditingSub = editingId === sub.id;
                          const subAttrCount = sub.attributes?.length ?? 0;
                          return (
                            <div key={sub.id} className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                              {isEditingSub ? (
                                <CategoryForm
                                  initial={{ name: sub.name, slug: sub.slug, imageUrl: sub.imageUrl ?? "" }}
                                  onSave={(vals) => updateMut.mutate({ id: sub.id, ...vals })}
                                  onCancel={() => setEditingId(null)}
                                  pending={updateMut.isPending}
                                  slugify={slugify}
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="ml-2 text-sm font-medium text-gray-800">
                                    {sub.name}
                                  </span>
                                  <span className="text-xs text-gray-400">/{sub.slug}</span>
                                  {subAttrCount > 0 && (
                                    <span className="text-xs text-gray-400">
                                      · {subAttrCount} attrs
                                    </span>
                                  )}
                                  <div className="ml-auto flex gap-1">
                                    <button
                                      onClick={() => setEditingId(sub.id)}
                                      className="rounded p-1 text-gray-400 hover:text-gray-700"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Delete "${sub.name}"?`))
                                          deleteMut.mutate(sub.id);
                                      }}
                                      className="rounded p-1 text-red-400 hover:text-red-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Attributes */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Attributes
                      </p>
                      <button
                        onClick={() =>
                          setAddingAttrOf(addingAttrOf === cat.id ? null : cat.id)
                        }
                        className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                      >
                        <Plus className="h-3 w-3" /> Add attribute
                      </button>
                    </div>

                    {addingAttrOf === cat.id && (
                      <AttributeForm
                        onSave={(vals) => addAttrMut.mutate({ id: cat.id, ...vals })}
                        onCancel={() => setAddingAttrOf(null)}
                        pending={addAttrMut.isPending}
                      />
                    )}

                    {attrCount > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {attributes.map((attr) => {
                          const options = attr.options ?? [];
                          return (
                            <span
                              key={attr.id}
                              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700"
                            >
                              <span className="font-medium">{attr.name}</span>
                              <span className="text-gray-400">
                                {attr.type}
                                {attr.required ? " *" : ""}
                              </span>
                              {options.length > 0 && (
                                <span className="text-gray-300">
                                  [{options.slice(0, 2).join(", ")}
                                  {options.length > 2 ? "…" : ""}]
                                </span>
                              )}
                              <button
                                onClick={() =>
                                  delAttrMut.mutate({ catId: cat.id, attrId: attr.id })
                                }
                                className="ml-0.5 text-gray-300 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      !addingAttrOf && (
                        <p className="text-xs text-gray-400">No attributes defined.</p>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryForm({
  initial,
  onSave,
  onCancel,
  pending,
  slugify,
}: {
  initial?: { name: string; slug: string; imageUrl: string };
  onSave: (vals: { name: string; slug: string; imageUrl?: string }) => void;
  onCancel: () => void;
  pending: boolean;
  slugify: (s: string) => string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [slugEdited, setSlugEdited] = useState(!!initial);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const handleSubmit = () => {
    if (!name.trim() || !slug.trim()) return;
    onSave({ name: name.trim(), slug: slug.trim(), imageUrl: imageUrl.trim() || undefined });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="input text-sm"
            placeholder="e.g. Electronics"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Slug *</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
            className="input text-sm font-mono"
            placeholder="e.g. electronics"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">Image URL (optional)</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="input text-sm"
          placeholder="https://…"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={pending || !name.trim() || !slug.trim()}
          className="btn-primary gap-1 text-sm disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          {pending ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

function AttributeForm({
  onSave,
  onCancel,
  pending,
}: {
  onSave: (vals: { name: string; type: string; required: boolean; options: string[] }) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("TEXT");
  const [required, setRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    const options = type === "SELECT"
      ? optionsStr.split(",").map((o) => o.trim()).filter(Boolean)
      : [];
    onSave({ name: name.trim(), type, required, options });
  };

  return (
    <div className="mb-3 rounded-lg border border-brand-100 bg-brand-50 p-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input text-sm"
            placeholder="e.g. Brand"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input text-sm">
            <option value="TEXT">Text</option>
            <option value="NUMBER">Number</option>
            <option value="SELECT">Select (options)</option>
            <option value="BOOLEAN">Boolean</option>
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="rounded"
            />
            Required
          </label>
        </div>
      </div>
      {type === "SELECT" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Options <span className="text-gray-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={optionsStr}
            onChange={(e) => setOptionsStr(e.target.value)}
            className="input text-sm"
            placeholder="e.g. Apple, Samsung, Sony"
          />
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={pending || !name.trim()}
          className="btn-primary gap-1 text-sm disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          {pending ? "Saving…" : "Add"}
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReportsPanel({ user: _admin, qc }: { user: AuthUser; qc: AppQueryClient }) {
  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data } = await api.get("/reports?status=PENDING");
      return data as { reports: ReportSummary[] };
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
      {data?.reports?.map((r) => (
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
