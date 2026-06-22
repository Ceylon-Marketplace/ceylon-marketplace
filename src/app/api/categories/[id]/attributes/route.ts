import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError, ApiError } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: categoryId } = await params;
    const user = requireAuth(req);
    requireRole(user, "SUPER_ADMIN", "OPERATIONS_MANAGER");
    const dto = await req.json();
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) throw new ApiError("Category not found", 404);
    const attr = await prisma.categoryAttribute.create({
      data: { ...dto, categoryId, options: dto.options ?? [] },
    });
    return Response.json(attr, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
