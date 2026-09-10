import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET;

// The server must refuse to start without a real secret. A hard-coded
// fallback would let anyone forge a valid token.
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from the environment");
}

// A decoded token is external input: we check its shape before trusting it.
const TokenPayloadSchema = z.object({
  userId: z.string(),
  role: z.string(),
});

// Tokens expire so a stolen token does not stay valid forever.
export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const payload = TokenPayloadSchema.safeParse(decoded);
  if (!payload.success) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.userId = payload.data.userId;
  req.userRole = payload.data.role;
  next();
}

// Same checks as authenticate, but never blocks: an anonymous visitor
// must still be able to read the feed.
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header) {
    return next();
  }

  const token = header.split(" ")[1];
  if (!token) {
    return next();
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return next();
  }

  const payload = TokenPayloadSchema.safeParse(decoded);
  if (payload.success) {
    req.userId = payload.data.userId;
    req.userRole = payload.data.role;
  }

  return next();
}
