import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, signRefreshToken, verifyRefreshToken, handleError, ApiError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) throw new ApiError("Refresh token required");

    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError("Invalid refresh token", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true },
    });
    if (!user || !user.isActive) throw new ApiError("Unauthorized", 401);

    const newPayload = { sub: user.id, email: user.email, role: user.role };
    return Response.json({
      accessToken: signToken(newPayload),
      refreshToken: signRefreshToken(newPayload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verificationLevel: user.verificationLevel,
        profile: user.profile,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
