import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleError } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const data = await req.json();
    const profile = await prisma.profile.update({ where: { userId: user.sub }, data });
    return Response.json(profile);
  } catch (err) {
    return handleError(err);
  }
}
