import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// generate a token for a user, no expiration
export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET);
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];

    try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string") {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = decoded.userId;
    const userRole = decoded.role;

    if (typeof userId !== "string" || typeof userRole !== "string") {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.userId = userId;
    req.userRole = userRole;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
