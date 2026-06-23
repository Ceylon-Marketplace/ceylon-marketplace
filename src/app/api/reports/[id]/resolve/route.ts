import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError, ApiError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reportId } = await params;
    const user = requireAuth(req);
    requireRole(user, "SUPER_ADMIN", "OPERATIONS_MANAGER", "CONTENT_MODERATOR", "SUPPORT_AGENT");

    const { action } = await req.json();
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new ApiError("Report not found", 404);
    if (report.status !== "PENDING") throw new ApiError("Report is already resolved");

    const newStatus = action === "resolve" ? "RESOLVED" : "DISMISSED";
    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status: newStatus, resolvedById: user.sub, resolvedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        adminId: user.sub,
        action: `report_${action}d`,
        targetType: "Report",
        targetId: reportId,
        details: { originalReason: report.reason },
      },
    });

    return Response.json(updated);
  } catch (err) {
    return handleError(err);
  }
}
