import jwt from "jsonwebtoken";

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
    expiresIn: (process.env.JWT_EXPIRES_IN || "15m") as any,
  });
}

export function signRefreshToken(payload: object) {
  if (!process.env.JWT_REFRESH_SECRET)
    throw new Error("JWT_REFRESH_SECRET is not set");
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as any,
  });
}

function verifyToken(token: string): any {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function verifyRefreshToken(token: string): any {
  if (!process.env.JWT_REFRESH_SECRET)
    throw new Error("JWT_REFRESH_SECRET is not set");
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export function getAuthUser(req: Request): any | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

export function requireAuth(req: Request): any {
  const user = getAuthUser(req);
  if (!user) throw new ApiError("Unauthorized", 401);
  return user;
}

export function requireRole(user: any, ...roles: string[]): void {
  if (!roles.includes(user.role)) throw new ApiError("Forbidden", 403);
}

export function handleError(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ message: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ message: "Internal server error" }, { status: 500 });
}
