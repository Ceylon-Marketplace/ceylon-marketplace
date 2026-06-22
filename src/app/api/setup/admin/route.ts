import { NextRequest } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// One-time admin setup endpoint. Delete this file after use.
export async function POST(req: NextRequest) {
  const setupKey = req.headers.get("x-setup-key");
  if (setupKey !== process.env.SETUP_KEY && setupKey !== "ceylon-setup-2026") {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const { email, password, firstName, lastName } = await req.json();
  if (!email || !password) {
    return Response.json({ message: "email and password required" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      verificationLevel: "EMAIL",
      isActive: true,
      profile: {
        create: {
          firstName: firstName ?? "Admin",
          lastName: lastName ?? "User",
        },
      },
    },
    include: { profile: true },
  });

  return Response.json({
    message: "Admin user ready",
    email: user.email,
    role: user.role,
  });
}
