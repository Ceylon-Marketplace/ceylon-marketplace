import { NextRequest } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, signRefreshToken, handleError, ApiError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone, role } = await req.json();
    if (!email || !password || !firstName || !lastName)
      throw new ApiError("Email, password, firstName and lastName are required");

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new ApiError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role ?? "USER",
        verificationLevel: "EMAIL",
        profile: { create: { firstName, lastName, phone } },
      },
      include: { profile: true },
    });

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
    }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
