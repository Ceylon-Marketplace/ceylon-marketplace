import Link from "next/link";
import Image from "next/image";
import { MapPin, Eye, Heart } from "lucide-react";
import { formatPrice, timeAgo, cn } from "@/lib/utils";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number | string;
    location: string;
    condition: string;
    status: string;
    viewCount: number;
    saveCount: number;
    isFeatured: boolean;
    createdAt: string;
    media: { url: string; type: string }[];
    category: { name: string };
    seller: {
      id: string;
      profile: { firstName: string; lastName: string } | null;
    };
  };
}

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

export function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.media.find((m) => m.type === "IMAGE");

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        "card group flex flex-col overflow-hidden transition-shadow hover:shadow-md",
        listing.isFeatured && "ring-2 ring-brand-500",
      )}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={listing.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300 text-4xl">
            📦
          </div>
        )}
        {listing.isFeatured && (
          <span className="absolute left-2 top-2 badge bg-brand-500 text-white">
            Featured
          </span>
        )}
        <span className="absolute right-2 top-2 badge bg-white text-gray-700 shadow">
          {CONDITION_LABELS[listing.condition] ?? listing.condition}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-gray-900">
          {listing.title}
        </p>
        <p className="text-lg font-bold text-brand-600">
          {formatPrice(listing.price)}
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin className="h-3 w-3" />
          {listing.location}
        </div>
        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-gray-400">
          <span>{timeAgo(listing.createdAt)}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              <Eye className="h-3 w-3" /> {listing.viewCount}
            </span>
            <span className="flex items-center gap-0.5">
              <Heart className="h-3 w-3" /> {listing.saveCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
