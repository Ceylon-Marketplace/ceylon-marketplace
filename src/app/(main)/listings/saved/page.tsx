"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { ListingCard } from "@/components/listing-card";
import { Heart, Package } from "lucide-react";

export default function SavedListingsPage() {
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: saved, isLoading } = useQuery({
    queryKey: ["saved-listings"],
    queryFn: async () => {
      const { data } = await api.get("/listings/saved");
      return data;
    },
    enabled: !!user,
  });

  const unsave = useMutation({
    mutationFn: (listingId: string) =>
      api.delete(`/listings/${listingId}/save`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["saved-listings"] }),
  });

  useEffect(() => {
    if (hasHydrated && !user) router.push("/login");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  const listings = saved?.map((s: any) => s.listing).filter(Boolean) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Heart className="h-6 w-6 fill-red-400 text-red-400" />
        <h1 className="text-2xl font-bold text-gray-900">Saved Listings</h1>
        {!isLoading && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-600">
            {listings.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Package className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-medium">No saved listings yet</p>
          <p className="mt-1 text-sm">
            Tap the heart icon on any listing to save it here.
          </p>
          <Link href="/listings" className="btn-primary mt-4">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing: any) => (
            <div key={listing.id} className="group relative">
              <ListingCard listing={listing} />
              <button
                onClick={() => unsave.mutate(listing.id)}
                className="absolute right-2 top-2 z-10 hidden rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-red-50 group-hover:flex"
                title="Remove from saved"
              >
                <Heart className="h-4 w-4 fill-red-400 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
