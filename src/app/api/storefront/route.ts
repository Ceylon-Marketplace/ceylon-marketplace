import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError, ApiError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const sf = await prisma.storefront.findFirst({
      where: { sellerId: user.sub },
      include: { seller: { include: { profile: true } } },
    });
    return Response.json(sf);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const data = await req.json();

    const existing = await prisma.storefront.findFirst({
      where: { sellerId: user.sub },
    });
    if (existing) throw new ApiError("You already have a storefront", 409);

    const slugTaken = await prisma.storefront.findUnique({
      where: { slug: data.slug },
    });
    if (slugTaken) throw new ApiError("This slug is already taken", 409);

    const sf = await prisma.storefront.create({
      data: { ...data, sellerId: user.sub, isActive: true },
    });
    return Response.json(sf, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const data = await req.json();
    const sf = await prisma.storefront.findFirst({
      where: { sellerId: user.sub },
    });
    if (!sf) throw new ApiError("Storefront not found", 404);
    return Response.json(
      await prisma.storefront.update({ where: { id: sf.id }, data }),
    );
  } catch (err) {
    return handleError(err);
  }
}
