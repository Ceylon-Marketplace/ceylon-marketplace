"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ListingCard } from "@/components/listing-card";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

const LISTING_TYPES = [
  { value: "FIXED_PRICE", label: "Fixed Price" },
  { value: "OFFER", label: "Accepts Offers" },
  { value: "AUCTION", label: "Auction" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "most_viewed", label: "Most Viewed" },
];

type Filters = {
  categoryId: string;
  condition: string;
  listingType: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  sortBy: string;
};

const DEFAULT_FILTERS: Filters = {
  categoryId: "",
  condition: "",
  listingType: "",
  minPrice: "",
  maxPrice: "",
  location: "",
  sortBy: "newest",
};

export default function ListingsPage() {
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const setFilter = useCallback(
    (key: keyof Filters, value: string) => {
      setFilters((f) => ({ ...f, [key]: value }));
      setPage(1);
    },
    [],
  );

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setKeyword("");
    setPage(1);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== "sortBy" && v !== DEFAULT_FILTERS[k as keyof Filters],
  ).length + (keyword ? 1 : 0);

  const { data, isLoading } = useQuery({
    queryKey: ["listings", keyword, filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(keyword && { keyword }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.condition && { condition: filters.condition }),
        ...(filters.listingType && { listingType: filters.listingType }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.location && { location: filters.location }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        page: String(page),
        limit: "24",
      });
      const { data } = await api.get(`/listings?${params}`);
      return data;
    },
    staleTime: 30_000,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    },
    staleTime: 5 * 60_000,
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Browse Listings</h1>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilter("sortBy", e.target.value)}
          className="input w-44 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search bar */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings…"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`btn-secondary gap-2 ${showFilters ? "bg-brand-50 text-brand-600 border-brand-300" : ""}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="btn-secondary gap-1 text-sm">
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Category
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilter("categoryId", e.target.value)}
              className="input text-sm"
            >
              <option value="">All Categories</option>
              {categories?.map((c: any) => (
                <optgroup key={c.id} label={c.name}>
                  <option value={c.id}>{c.name} (All)</option>
                  {c.children?.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      — {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Condition
            </label>
            <select
              value={filters.condition}
              onChange={(e) => setFilter("condition", e.target.value)}
              className="input text-sm"
            >
              <option value="">Any Condition</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Listing Type
            </label>
            <select
              value={filters.listingType}
              onChange={(e) => setFilter("listingType", e.target.value)}
              className="input text-sm"
            >
              <option value="">All Types</option>
              {LISTING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Min Price (LKR)
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilter("minPrice", e.target.value)}
              className="input text-sm"
              placeholder="0"
              min={0}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Max Price (LKR)
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilter("maxPrice", e.target.value)}
              className="input text-sm"
              placeholder="Any"
              min={0}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilter("location", e.target.value)}
              className="input text-sm"
              placeholder="e.g. Colombo"
            />
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {keyword && (
            <span className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700">
              "{keyword}"
              <button onClick={() => { setKeyword(""); setPage(1); }}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.categoryId && categories && (
            <FilterChip
              label={findCategoryName(categories, filters.categoryId)}
              onRemove={() => setFilter("categoryId", "")}
            />
          )}
          {filters.condition && (
            <FilterChip
              label={CONDITIONS.find((c) => c.value === filters.condition)?.label ?? filters.condition}
              onRemove={() => setFilter("condition", "")}
            />
          )}
          {filters.listingType && (
            <FilterChip
              label={LISTING_TYPES.find((t) => t.value === filters.listingType)?.label ?? filters.listingType}
              onRemove={() => setFilter("listingType", "")}
            />
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <FilterChip
              label={`LKR ${filters.minPrice || "0"} – ${filters.maxPrice || "∞"}`}
              onRemove={() => { setFilter("minPrice", ""); setFilter("maxPrice", ""); }}
            />
          )}
          {filters.location && (
            <FilterChip label={filters.location} onRemove={() => setFilter("location", "")} />
          )}
        </div>
      )}

      {/* Results count */}
      {!isLoading && data && (
        <p className="mb-4 text-sm text-gray-500">
          {data.total.toLocaleString()} listing{data.total !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : data?.listings?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Search className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-medium">No listings found</p>
          <p className="mt-1 text-sm">Try adjusting your search or filters.</p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-secondary mt-4">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data?.listings?.map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {data?.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
                  const p = Math.max(1, Math.min(data.pages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-brand-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700">
      {label}
      <button onClick={onRemove}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function findCategoryName(categories: any[], id: string): string {
  for (const c of categories) {
    if (c.id === id) return c.name;
    const sub = c.children?.find((s: any) => s.id === id);
    if (sub) return sub.name;
  }
  return id;
}
