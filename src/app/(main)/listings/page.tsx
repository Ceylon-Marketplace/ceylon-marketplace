import { prisma } from "@/lib/prisma";
import { ListingsClient } from "./ListingsClient";

async function getInitialData() {
  const [listings, total, categories] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        title: true,
        price: true,
        location: true,
        condition: true,
        listingType: true,
        viewCount: true,
        createdAt: true,
        media: {
          select: { url: true, type: true },
          orderBy: { order: "asc" },
          take: 1,
        },
        category: { select: { id: true, name: true } },
        seller: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 24,
    }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: { where: { isActive: true }, orderBy: { name: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    listings: listings.map((l) => ({
      ...l,
      price: Number(l.price),
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    page: 1,
    limit: 24,
    pages: Math.ceil(total / 24),
    categories,
  };
}

export default async function ListingsPage() {
  const { categories, ...initialData } = await getInitialData();
  return <ListingsClient initialData={initialData} initialCategories={categories} />;
}
