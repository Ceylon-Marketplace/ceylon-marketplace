import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import ListingDetailClient, { type ListingDetail } from "./ListingDetailClient";

export const revalidate = 30;

const getPublicListing = unstable_cache(
  async (id: string): Promise<ListingDetail | undefined> => {
    const listing = await prisma.listing.findFirst({
      where: { id, status: "ACTIVE" },
      select: {
        id: true,
        sellerId: true,
        title: true,
        description: true,
        price: true,
        quantity: true,
        location: true,
        condition: true,
        listingType: true,
        status: true,
        viewCount: true,
        saveCount: true,
        createdAt: true,
        media: {
          orderBy: { order: "asc" },
          select: { id: true, url: true, type: true },
        },
        category: {
          select: {
            name: true,
            parent: { select: { name: true } },
          },
        },
        seller: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                location: true,
              },
            },
            storefront: { select: { slug: true, name: true } },
          },
        },
        auction: { select: { id: true } },
        attributeValues: {
          select: {
            id: true,
            value: true,
            attribute: { select: { name: true } },
          },
        },
      },
    });

    if (!listing) return undefined;

    return JSON.parse(
      JSON.stringify({ ...listing, isSaved: false }),
    ) as ListingDetail;
  },
  ["public-listing-detail"],
  { revalidate: 30 },
);

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getPublicListing(id);

  return <ListingDetailClient initialListing={listing} />;
}
