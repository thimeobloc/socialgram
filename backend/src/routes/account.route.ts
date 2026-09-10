import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authenticate, generateToken } from "../auth";
import { prisma, router } from "./config.route";

// ==================== AUTH ====================

// The request body is external input (typed `any` by Express), so we
// validate its shape before using it.
const LoginBodySchema = z.object({
  email: z.string(),
  password: z.string(),
});

router.post("/auth/register", async (req: Request, res: Response) => {
  //fetch email and name from front
  const { email, username, password } = req.body;

  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      error: "Invalid data",
    });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return res.status(400).json({
      error:
        "Password must contain at least 8 characters, 1 uppercase letter, 1 number and 1 special character",
    });
  }

  //send error if email already existing
  if (existingEmail) {
    return res.status(409).json({ error: "Email already used" });
  }

  //send error if email already existing
  if (existingUsername) {
    return res.status(409).json({ error: "Username already used" });
  }
  const hashed = bcrypt.hashSync(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashed,
    },
  });

  const token = generateToken(user.id, user.role);

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, username: user.username },
  });
});

router.get("/auth/me", authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, username: true },
  });
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  res.json(user);
});

router.post("/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  prisma.user
    .findUnique({ where: { email } })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id, user.role);
      res.json({
        token,
        user: { id: user.id, email: user.email, username: user.username },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    });
});
