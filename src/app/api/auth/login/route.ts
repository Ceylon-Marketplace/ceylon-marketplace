import { NextRequest } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, signRefreshToken, handleError, ApiError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) throw new ApiError("Email and password required");

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (!user) throw new ApiError("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new ApiError("Invalid credentials", 401);

    if (!user.isActive) throw new ApiError("Account is suspended", 401);

    const payload = { sub: user.id, email: user.email, role: user.role };
    return Response.json({
      accessToken: signToken(payload),
      refreshToken: signRefreshToken(payload),
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
