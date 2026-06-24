import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGES_PER_LISTING = 10;

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const listingId = formData.get("listingId") as string | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message:
            "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File size exceeds 10MB limit." },
        { status: 400 },
      );
    }

    // If listingId provided, check image count limit
    if (listingId) {
      const mediaCount = await prisma.listingMedia.count({
        where: { listingId },
      });

      if (mediaCount >= MAX_IMAGES_PER_LISTING) {
        return NextResponse.json(
          {
            message: `Maximum ${MAX_IMAGES_PER_LISTING} images per listing allowed.`,
          },
          { status: 400 },
        );
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const ext = file.name.split(".").pop();
    const filename = `listings/${user.id}/${timestamp}-${randomStr}.${ext}`;

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload image. Please try again." },
      { status: 500 },
    );
  }
}
