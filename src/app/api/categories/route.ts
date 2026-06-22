import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleError, ApiError } from "@/lib/auth";

export async function GET() {
  try {
    const cats = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: { where: { isActive: true }, include: { attributes: true }, orderBy: { name: "asc" } },
        attributes: true,
      },
      orderBy: { name: "asc" },
    });
    return Response.json(cats);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user, "SUPER_ADMIN", "OPERATIONS_MANAGER");
    const { name, slug, parentId, imageUrl } = await req.json();
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ApiError("Slug already exists");
    const cat = await prisma.category.create({ data: { name, slug, parentId, imageUrl } });
    return Response.json(cat, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
