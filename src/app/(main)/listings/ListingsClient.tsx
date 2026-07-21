"use client";

import { useCallback, useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { ListingCard, type ListingCardData } from "@/components/listing-card";

type Category = {
  id: string;
  name: string;
  children?: { id: string; name: string }[];
};

type ListingsResponse = {
  listings: ListingCardData[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type Filters = {
  categoryId: string;
  condition: string;
  listingType: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  sortBy: string;
};

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like new" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

const LISTING_TYPES = [
  { value: "FIXED_PRICE", label: "Fixed price" },
  { value: "OFFER", label: "Accepts offers" },
  { value: "AUCTION", label: "Auction" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "most_viewed", label: "Most viewed" },
];

const DEFAULT_FILTERS: Filters = {
  categoryId: "",
  condition: "",
  listingType: "",
  minPrice: "",
  maxPrice: "",
  location: "",
  sortBy: "newest",
};

export function ListingsClient({
  initialData,
  initialCategories,
}: {
  initialData: ListingsResponse;
  initialCategories: Category[];
}) {
  const [keyword, setKeyword] = useState("");
  const deferredKeyword = useDeferredValue(keyword);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const isDefaultState =
    !deferredKeyword &&
    page === 1 &&
    JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);

  const setFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setKeyword("");
    setPage(1);
  };

  const activeFilterCount =
    Object.entries(filters).filter(
      ([key, value]) =>
        value && key !== "sortBy" && value !== DEFAULT_FILTERS[key as keyof Filters],
    ).length + (deferredKeyword ? 1 : 0);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<ListingsResponse>({
    queryKey: ["listings", deferredKeyword, filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(deferredKeyword && { keyword: deferredKeyword }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.condition && { condition: filters.condition }),
        ...(filters.listingType && { listingType: filters.listingType }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.location && { location: filters.location }),
        sortBy: filters.sortBy,
        page: String(page),
        limit: "24",
      });
      const response = await api.get(`/listings?${params}`);
      return response.data;
    },
    initialData: isDefaultState ? initialData : undefined,
    staleTime: 30_000,
  });

  const { data: categories = initialCategories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data,
    initialData: initialCategories,
    staleTime: 5 * 60_000,
  });

  return (
    <div className="pb-10">
      <header className="border-b border-gray-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Marketplace discovery
        </p>
        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-gray-950 sm:text-5xl">
              Find your next good find.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Search active listings from sellers across the marketplace, then narrow the results to what matters.
            </p>
          </div>
          <p className="shrink-0 text-sm text-gray-500">
            {data?.total.toLocaleString() ?? initialData.total.toLocaleString()} active listing
            {(data?.total ?? initialData.total) === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {categories.length > 0 && (
        <nav aria-label="Popular categories" className="flex gap-2 overflow-x-auto border-b border-gray-200 py-5">
          <button
            onClick={() => setFilter("categoryId", "")}
            className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition active:translate-y-px ${
              !filters.categoryId
                ? "border-gray-950 bg-gray-950 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
            }`}
          >
            All products
          </button>
          {categories.slice(0, 8).map((category) => (
            <button
              key={category.id}
              onClick={() => setFilter("categoryId", category.id)}
              className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition active:translate-y-px ${
                filters.categoryId === category.id
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
              }`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      )}

      <div className="py-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search listings</span>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search by item or description"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
              className="input h-12 pl-11"
            />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <button
              onClick={() => setShowFilters((visible) => !visible)}
              aria-expanded={showFilters}
              className={`btn-secondary h-12 gap-2 ${
                showFilters ? "border-brand-500 bg-brand-50 text-brand-700" : ""
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <label>
              <span className="sr-only">Sort listings</span>
              <select
                value={filters.sortBy}
                onChange={(event) => setFilter("sortBy", event.target.value)}
                className="input h-12 min-w-0 text-sm sm:w-48"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <FilterSelect label="Category" value={filters.categoryId} onChange={(value) => setFilter("categoryId", value)}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  <option value={category.id}>{category.name}</option>
                  {category.children?.map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </optgroup>
              ))}
            </FilterSelect>
            <FilterSelect label="Condition" value={filters.condition} onChange={(value) => setFilter("condition", value)}>
              <option value="">Any condition</option>
              {CONDITIONS.map((condition) => (
                <option key={condition.value} value={condition.value}>{condition.label}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Listing type" value={filters.listingType} onChange={(value) => setFilter("listingType", value)}>
              <option value="">All types</option>
              {LISTING_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </FilterSelect>
            <FilterInput label="Minimum price (LKR)" value={filters.minPrice} onChange={(value) => setFilter("minPrice", value)} type="number" placeholder="0" />
            <FilterInput label="Maximum price (LKR)" value={filters.maxPrice} onChange={(value) => setFilter("maxPrice", value)} type="number" placeholder="Any amount" />
            <FilterInput label="Location" value={filters.location} onChange={(value) => setFilter("location", value)} placeholder="For example, Colombo" />
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="justify-self-start text-sm font-medium text-brand-600 hover:text-brand-700 sm:col-span-2 lg:col-span-3">
                Clear all filters
              </button>
            )}
          </div>
        )}

        {activeFilterCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400">Active filters</span>
            {deferredKeyword && <FilterChip label={`Search: ${deferredKeyword}`} onRemove={() => setKeyword("")} />}
            {filters.categoryId && <FilterChip label={findCategoryName(categories, filters.categoryId)} onRemove={() => setFilter("categoryId", "")} />}
            {filters.condition && <FilterChip label={CONDITIONS.find((item) => item.value === filters.condition)?.label ?? filters.condition} onRemove={() => setFilter("condition", "")} />}
            {filters.listingType && <FilterChip label={LISTING_TYPES.find((item) => item.value === filters.listingType)?.label ?? filters.listingType} onRemove={() => setFilter("listingType", "")} />}
            {(filters.minPrice || filters.maxPrice) && <FilterChip label={`LKR ${filters.minPrice || "0"} to ${filters.maxPrice || "any"}`} onRemove={() => setFilters((current) => ({ ...current, minPrice: "", maxPrice: "" }))} />}
            {filters.location && <FilterChip label={filters.location} onRemove={() => setFilter("location", "")} />}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-5">
        <p className="text-sm text-gray-500">
          {isLoading ? "Finding listings" : `${data?.total.toLocaleString() ?? 0} result${data?.total === 1 ? "" : "s"}`}
        </p>
        {isFetching && !isLoading && <span className="text-xs text-gray-400">Updating results</span>}
      </div>

      {isError ? (
        <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
          <PackageSearch className="h-9 w-9 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-950">Listings could not load</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">Try the request again or return to the full marketplace.</p>
          <button onClick={() => refetch()} className="btn-primary mt-5">Try again</button>
        </div>
      ) : isLoading ? (
        <ListingGridSkeleton />
      ) : data?.listings.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
          <PackageSearch className="h-9 w-9 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-950">No matching listings</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">Try a broader search, another location, or fewer filters.</p>
          {activeFilterCount > 0 && <button onClick={clearFilters} className="btn-secondary mt-5">Clear all filters</button>}
        </div>
      ) : (
        <>
          <div className={`mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isFetching ? "opacity-60" : ""}`}>
            {data?.listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
          {data && data.pages > 1 && (
            <nav aria-label="Listing pages" className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6">
              <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {data.pages}</span>
              <button onClick={() => setPage((current) => Math.min(data.pages, current + 1))} disabled={page === data.pages} className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-40">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function ListingGridSkeleton() {
  return (
    <div className="mt-5 grid animate-pulse gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="aspect-[4/3] bg-gray-100" />
          <div className="space-y-3 p-4"><div className="h-3 w-2/5 rounded bg-gray-100" /><div className="h-5 w-4/5 rounded bg-gray-100" /><div className="h-6 w-1/2 rounded bg-gray-100" /></div>
        </div>
      ))}
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label><span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="input text-sm">{children}</select></label>;
}

function FilterInput({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder: string }) {
  return <label><span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span><input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="input text-sm" /></label>;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700">{label}<button onClick={onRemove} aria-label={`Remove ${label} filter`} className="rounded p-0.5 hover:bg-brand-100"><X className="h-3 w-3" /></button></span>;
}

function findCategoryName(categories: Category[], id: string) {
  for (const category of categories) {
    if (category.id === id) return category.name;
    const child = category.children?.find((item) => item.id === id);
    if (child) return child.name;
  }
  return "Category";
}
