import Image from "next/image";
import Link from "next/link";
import { Gavel, ImageIcon, MapPin } from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/utils";

export type ListingCardData = {
  id: string;
  title: string;
  price: number | string;
  location: string;
  condition: string;
  listingType?: string;
  createdAt: string;
  media: { url: string; type: string }[];
  category: { name: string };
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const coverImage = listing.media.find((media) => media.type === "IMAGE");

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_18px_45px_-28px_rgba(17,24,39,0.35)] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={listing.title}
            fill
            sizes="(min-width: 1280px) 280px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs font-medium">No image available</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
          <span className="truncate">{listing.category.name}</span>
          <span className="shrink-0">
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </span>
        </div>
        <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-gray-950">
          {listing.title}
        </h2>
        <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-gray-950">
          {formatPrice(listing.price)}
        </p>
        {listing.listingType === "AUCTION" && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-600">
            <Gavel className="h-3.5 w-3.5" />
            Auction listing
          </p>
        )}
        {listing.listingType === "OFFER" && (
          <p className="mt-2 text-xs font-medium text-brand-600">Offers considered</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-gray-400">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </span>
          <span className="shrink-0">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
