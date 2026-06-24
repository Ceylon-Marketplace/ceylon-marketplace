import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId: blockedId } = await params;
    const user = requireAuth(req);
    const block = await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.sub, blockedId } },
      update: {},
      create: { blockerId: user.sub, blockedId },
    });
    return Response.json(block);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId: blockedId } = await params;
    const user = requireAuth(req);
    await prisma.block.deleteMany({
      where: { blockerId: user.sub, blockedId },
    });
    return Response.json({ unblocked: true });
  } catch (err) {
    return handleError(err);
  }
}
