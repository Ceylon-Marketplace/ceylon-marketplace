"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Trash2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { ListingCard, type ListingCardData } from "@/components/listing-card";

type SavedListing = {
  id: string;
  listingId: string;
  createdAt: string;
  listing: ListingCardData | null;
};

const SAVED_QUERY_KEY = ["saved-listings"] as const;

export default function SavedListingsPage() {
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const savedQuery = useQuery<SavedListing[]>({
    queryKey: SAVED_QUERY_KEY,
    queryFn: async () => (await api.get("/listings/saved")).data,
    enabled: Boolean(user),
    refetchOnWindowFocus: true,
  });

  const removeSaved = useMutation({
    mutationFn: (listingId: string) => api.delete(`/listings/${listingId}/save`),
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: SAVED_QUERY_KEY });
      const previous = queryClient.getQueryData<SavedListing[]>(SAVED_QUERY_KEY);
      queryClient.setQueryData<SavedListing[]>(SAVED_QUERY_KEY, (current) => current?.filter((saved) => saved.listingId !== listingId) ?? []);
      return { previous };
    },
    onError: (_error, _listingId, context) => {
      if (context?.previous) queryClient.setQueryData(SAVED_QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: SAVED_QUERY_KEY }),
  });

  useEffect(() => {
    if (hasHydrated && !user) {
      router.replace(`/login?next=${encodeURIComponent("/listings/saved")}`);
    }
  }, [hasHydrated, router, user]);

  if (!hasHydrated || !user) return <SavedListingsSkeleton />;

  const savedListings = (savedQuery.data ?? []).filter((saved): saved is SavedListing & { listing: ListingCardData } => Boolean(saved.listing));

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <header className="border-b border-gray-200 pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Your collection</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-gray-950 sm:text-5xl">Saved listings</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">Keep interesting marketplace finds together and return when you are ready.</p>
          </div>
          <Link href="/listings" className="btn-primary h-11 shrink-0 gap-2 whitespace-nowrap">Browse listings <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </header>

      {removeSaved.isError && (
        <div role="alert" className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />That listing could not be removed. It has been restored to your collection.</span>
          <button type="button" onClick={() => removeSaved.reset()} className="shrink-0 font-semibold">Dismiss</button>
        </div>
      )}

      {savedQuery.isLoading ? (
        <SavedListingsSkeleton compact />
      ) : savedQuery.isError ? (
        <SavedError onRetry={() => savedQuery.refetch()} />
      ) : savedListings.length === 0 ? (
        <SavedEmpty />
      ) : (
        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <p className="text-sm font-medium text-gray-800">{savedListings.length} {savedListings.length === 1 ? "saved item" : "saved items"}</p>
            <p className="text-xs text-gray-400">Recently saved first</p>
          </div>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {savedListings.map((saved) => (
              <article key={saved.id} className="min-w-0">
                <ListingCard listing={saved.listing} />
                <div className="mt-3 flex items-center justify-between gap-3 px-1">
                  <span className="flex items-center gap-2 text-xs text-gray-400"><BookmarkCheck className="h-3.5 w-3.5 text-brand-500" />Saved for later</span>
                  <button
                    type="button"
                    onClick={() => removeSaved.mutate(saved.listingId)}
                    disabled={removeSaved.isPending && removeSaved.variables === saved.listingId}
                    aria-label={`Remove ${saved.listing.title} from saved listings`}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 active:scale-[0.98] disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {removeSaved.isPending && removeSaved.variables === saved.listingId ? "Removing..." : "Remove"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SavedEmpty() {
  return <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><Bookmark className="h-6 w-6" /></span><h2 className="mt-5 text-xl font-semibold tracking-[-0.025em] text-gray-950">Start your collection</h2><p className="mt-2 text-sm leading-6 text-gray-500">Save listings while you browse and they will appear here for easy comparison later.</p><Link href="/listings" className="btn-primary mt-6 gap-2">Explore listings <ArrowRight className="h-4 w-4" /></Link></div>;
}

function SavedError({ onRetry }: { onRetry: () => void }) {
  return <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><AlertCircle className="h-6 w-6" /></span><h2 className="mt-5 text-xl font-semibold text-gray-950">Collection unavailable</h2><p className="mt-2 text-sm leading-6 text-gray-500">Your saved listings could not be loaded right now.</p><button type="button" onClick={onRetry} className="btn-secondary mt-6 gap-2"><RefreshCw className="h-4 w-4" />Try again</button></div>;
}

function SavedListingsSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mt-8" : "mx-auto max-w-6xl pb-12"}>
      <div className="animate-pulse">
        {!compact && (
          <>
            <div className="h-3 w-28 rounded bg-gray-100" />
            <div className="mt-4 h-11 w-72 rounded bg-gray-100" />
            <div className="mt-4 h-4 max-w-lg rounded bg-gray-100" />
          </>
        )}
        <div
          className={`${compact ? "" : "mt-10"} grid gap-5 sm:grid-cols-2 lg:grid-cols-3`}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index}>
              <div className="aspect-[4/3] rounded-2xl bg-gray-100" />
              <div className="mt-4 h-4 w-3/4 rounded bg-gray-100" />
              <div className="mt-3 h-6 w-1/3 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
