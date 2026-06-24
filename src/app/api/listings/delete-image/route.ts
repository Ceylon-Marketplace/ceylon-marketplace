import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");
    const mediaId = searchParams.get("mediaId");

    if (!listingId || !mediaId) {
      return NextResponse.json(
        { message: "Missing listingId or mediaId" },
        { status: 400 }
      );
    }

    // Verify user owns the listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    });

    if (!listing || listing.sellerId !== user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get media details
    const media = await prisma.listingMedia.findUnique({
      where: { id: mediaId },
      select: { url: true, listingId: true },
    });

    if (!media || media.listingId !== listingId) {
      return NextResponse.json(
        { message: "Media not found" },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob using URL
    try {
      await del(media.url);
    } catch (blobError) {
      console.error("Error deleting from blob storage:", blobError);
      // Continue anyway - the record will be deleted from DB
    }

    // Delete from database
    await prisma.listingMedia.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Image deletion error:", error);
    return NextResponse.json(
      { message: "Failed to delete image" },
      { status: 500 }
    );
  }
}
