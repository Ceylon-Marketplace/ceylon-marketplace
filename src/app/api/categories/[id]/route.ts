import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError, ApiError } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = requireAuth(req);
    requireRole(user, "SUPER_ADMIN", "OPERATIONS_MANAGER");
    const dto = await req.json();
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new ApiError("Category not found", 404);
    if (dto.slug && dto.slug !== cat.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) throw new ApiError("Slug already exists");
    }
    return Response.json(
      await prisma.category.update({ where: { id }, data: dto }),
    );
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = requireAuth(req);
    requireRole(user, "SUPER_ADMIN", "OPERATIONS_MANAGER");
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new ApiError("Category not found", 404);
    return Response.json(
      await prisma.category.update({
        where: { id },
        data: { isActive: false },
      }),
    );
  } catch (err) {
    return handleError(err);
  }
}
