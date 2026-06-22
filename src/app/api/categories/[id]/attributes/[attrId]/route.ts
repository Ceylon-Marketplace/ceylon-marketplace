import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError, ApiError } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; attrId: string }> }) {
  try {
    const { id: categoryId, attrId } = await params;
    const user = requireAuth(req);
    requireRole(user, "SUPER_ADMIN", "OPERATIONS_MANAGER");
    const attr = await prisma.categoryAttribute.findFirst({ where: { id: attrId, categoryId } });
    if (!attr) throw new ApiError("Attribute not found", 404);
    return Response.json(await prisma.categoryAttribute.delete({ where: { id: attrId } }));
  } catch (err) {
    return handleError(err);
  }
}
