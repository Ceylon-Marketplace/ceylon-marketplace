import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole | string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
  }
}

export function signToken(payload: object) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "15m") as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: object) {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is not set");
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
  });
}

function isAuthTokenPayload(payload: string | jwt.JwtPayload): payload is AuthTokenPayload {
  return typeof payload !== "string" && typeof payload.sub === "string";
}

function verifyToken(token: string): AuthTokenPayload {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (!isAuthTokenPayload(payload)) throw new ApiError("Invalid token", 401);
  return payload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is not set");
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  if (!isAuthTokenPayload(payload)) throw new ApiError("Invalid token", 401);
  return payload;
}

export function getAuthUser(req: Request): AuthTokenPayload | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

export function requireAuth(req: Request): AuthTokenPayload {
  const user = getAuthUser(req);
  if (!user) throw new ApiError("Unauthorized", 401);
  return user;
}

export function requireRole(user: AuthTokenPayload, ...roles: string[]): void {
  if (!roles.includes(user.role)) throw new ApiError("Forbidden", 403);
}

export function handleError(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ message: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ message: "Internal server error" }, { status: 500 });
}
