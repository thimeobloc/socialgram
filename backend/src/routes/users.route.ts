import { Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../auth";
import { prisma, router } from "./config.route";

// ==================== USERS ====================

async function fetchUser(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
}

async function getUserPosts(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const posts = await prisma.post.findMany({
    where: { authorId: id },
    orderBy: { createdAt: "desc" },
  });

  res.json(posts);
}

const UpdateUserSchema = z.object({
  username: z.string().min(1),
  email: z.email(),
});

async function updateUser(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (req.userId !== id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const parsed = UpdateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const takenUsername = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (takenUsername && takenUsername.id !== id) {
    return res.status(409).json({ error: "Username already used" });
  }

  const takenEmail = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (takenEmail && takenEmail.id !== id) {
    return res.status(409).json({ error: "Email already used" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { username: parsed.data.username, email: parsed.data.email },
  });

  res.json({ id: user.id, username: user.username, email: user.email });
}

router.get("/users/:id", fetchUser);
router.get("/users/:id/posts", getUserPosts);
router.patch("/users/:id", authenticate, updateUser);
