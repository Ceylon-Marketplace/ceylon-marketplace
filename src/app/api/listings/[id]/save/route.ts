import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await params;
    const user = requireAuth(req);
    await prisma.savedListing.upsert({
      where: { userId_listingId: { userId: user.sub, listingId } },
      update: {},
      create: { userId: user.sub, listingId },
    });
    await prisma.listing.update({ where: { id: listingId }, data: { saveCount: { increment: 1 } } });
    return Response.json({ saved: true });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await params;
    const user = requireAuth(req);
    await prisma.savedListing.deleteMany({ where: { userId: user.sub, listingId } });
    await prisma.listing.update({ where: { id: listingId }, data: { saveCount: { decrement: 1 } } });
    return Response.json({ saved: false });
  } catch (err) {
    return handleError(err);
  }
}
