import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { z } from "zod";
import { authenticate, generateToken } from "./auth";

const router = Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

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

router.post("/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  prisma.user
    .findUnique({ where: { email } })
    .then((user) => {
      if (!user) {
        return res.status(200).json({ error: "Invalid credentials" });
      }

      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) {
        return res.status(200).json({ error: "Invalid credentials" });
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

// ==================== POSTS ====================

// get the feed of all posts, most recent first
async function getPosts(req: Request, res: Response) {
  try {
    // Parsing
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);

    // Get page
    let page = 1;
    if (Number.isInteger(rawPage) && rawPage >= 1) {
      page = rawPage;
    }

    // Get Limit
    let limit = 20;
    if (Number.isInteger(rawLimit) && rawLimit >= 1) {
      limit = rawLimit;
    }
    if (limit > 50) {
      limit = 50;
    }

    // Build Offset
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
      include: {
        author: {
          select: { id: true, username: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    // Count Total Posts
    const total = await prisma.post.count();

    // Transform all posts in objects fronted
    const items = posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      created_at: post.createdAt,
      author: post.author,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
    }));

    res.json({
      items,
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de charger le feed" });
  }
}

async function handleCreatePost(req: Request, res: Response) {
  const { content } = req.body;
  const userId = req.userId;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const post = await prisma.post.create({
    data: {
      content,
      imageUrl,
      authorId: userId,
    },
  });

  res.json(post);
}

async function getPostById(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, username: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (post === null) {
      return res.status(404).json({ error: "Post not found" });
    }

    const likeCount = await prisma.like.count({ where: { postId: id } });

    res.json({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      created_at: post.createdAt,
      author: post.author,
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        created_at: c.createdAt,
        author: c.author,
      })),
      likeCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de charger le post" });
  }
}

async function deletePost(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const userId = req.userId;

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    return res.status(404).json({
      error: "Post not found",
    });
  }

  if (post.authorId !== userId) {
    return res.status(403).json({
      error: "You are not allowed to delete this post",
    });
  }

  await prisma.post.delete({
    where: { id },
  });

  return res.json({
    success: true,
  });
}
router.get("/posts", getPosts);
router.post("/posts", authenticate, upload.single("image"), handleCreatePost);
router.get("/posts/:id", getPostById);
router.delete("/posts/:id", authenticate, deletePost);

// ==================== COMMENTS ====================

router.post(
  "/posts/:id/comments",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }

    try {
      const post = await prisma.post.findUnique({ where: { id } });
      if (post === null) {
        return res.status(404).json({ error: "Post not found" });
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          postId: id,
          authorId: userId,
        },
        include: {
          author: {
            select: { id: true, username: true },
          },
        },
      });

      res.json({
        id: comment.id,
        content: comment.content,
        created_at: comment.createdAt,
        author: comment.author,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Impossible de créer le commentaire" });
    }
  },
);

router.delete(
  "/comments/:id",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    await prisma.comment.delete({ where: { id } });

    res.json({ success: true });
  },
);

// ==================== LIKES ====================

router.post(
  "/posts/:id/like",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;

    const like = await prisma.like.create({
      data: {
        postId: id,
        userId,
      },
    });

    res.json(like);
  },
);

router.delete(
  "/posts/:id/like",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;

    const like = await prisma.like.findFirst({
      where: { postId: id, userId },
    });

    if (!like) {
      return res.status(200).json({ error: "Like not found" });
    }

    await prisma.like.delete({ where: { id: like.id } });
    res.json({ success: true });
  },
);

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

export default router;
