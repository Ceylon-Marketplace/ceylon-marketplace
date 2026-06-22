import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError } from "@/lib/auth";
import { ListingStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await params;
    const adminUser = requireAuth(req);
    requireRole(adminUser, "SUPER_ADMIN", "OPERATIONS_MANAGER", "CONTENT_MODERATOR");

    const { action, reason } = await req.json();
    const status: ListingStatus = action === "approve" ? "ACTIVE" : "REJECTED";

    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: { status, ...(reason && { rejectionReason: reason }) },
    });

    await prisma.auditLog.create({
      data: { adminId: adminUser.sub, action: `listing_${action}`, targetType: "Listing", targetId: listingId, details: { reason } },
    });

    await prisma.notification.create({
      data: {
        userId: listing.sellerId,
        type: action === "approve" ? "LISTING_APPROVED" : "LISTING_REJECTED",
        title: action === "approve" ? "Listing approved!" : "Listing rejected",
        content: action === "approve"
          ? `Your listing "${listing.title}" has been approved and is now live.`
          : `Your listing "${listing.title}" was rejected${reason ? `: ${reason}` : "."}`,
        metadata: { listingId },
      },
    });

    return Response.json(listing);
  } catch (err) {
    return handleError(err);
  }
}
