import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");
    const mediaId = searchParams.get("mediaId");

    if (!listingId || !mediaId) {
      return NextResponse.json(
        { message: "Missing listingId or mediaId" },
        { status: 400 },
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    });

    if (!listing || listing.sellerId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const media = await prisma.listingMedia.findUnique({
      where: { id: mediaId },
      select: { url: true, listingId: true },
    });

    if (!media || media.listingId !== listingId) {
      return NextResponse.json({ message: "Media not found" }, { status: 404 });
    }

    // Extract file path from Supabase public URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{filepath}
    try {
      const url = new URL(media.url);
      const marker = `/object/public/${STORAGE_BUCKET}/`;
      const filepath = url.pathname.split(marker)[1];
      if (filepath) {
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filepath]);
      }
    } catch (storageError) {
      console.error("Error deleting from storage:", storageError);
      // Continue anyway - the record will be deleted from DB
    }

    await prisma.listingMedia.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Image deletion error:", error);
    return NextResponse.json(
      { message: "Failed to delete image" },
      { status: 500 },
    );
  }
}
