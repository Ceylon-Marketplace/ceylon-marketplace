import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.listing.updateMany({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
