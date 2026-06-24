import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError, ApiError } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;
    const adminUser = requireAuth(req);
    requireRole(adminUser, "SUPER_ADMIN", "OPERATIONS_MANAGER");

    const { action, reason } = await req.json();
    const isActive = action === "reinstate";

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    await prisma.auditLog.create({
      data: {
        adminId: adminUser.sub,
        action: action === "reinstate" ? "user_reinstated" : "user_suspended",
        targetType: "User",
        targetId: userId,
        details: { reason },
      },
    });

    const { passwordHash: _, ...safe } = user;
    return Response.json(safe);
  } catch (err) {
    return handleError(err);
  }
}
