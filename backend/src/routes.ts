import { Router, Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { z } from "zod";
import { authenticate, optionalAuthenticate, generateToken } from "./auth";

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
  //On récupere l'email l'username et le password envoyé par le front
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

  //On vérifie si l'email existe déja
  const existingEmail = await prisma.user.findUnique({ where: { email } });

  //On vérifie si l'email existe déja
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

  //On renvoie une erreur si elle existe
  if (existingEmail) {
    return res.status(409).json({ error: "Email already used" });
  }

  //On renvoie une erreur si elle existe
  if (existingUsername) {
    return res.status(409).json({ error: "Username already used" });
  }

  //On hashe le password
  const hashed = bcrypt.hashSync(password, 10);

  //On crée le user avec une data
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashed,
    },
  });

  //On génére le token
  const token = generateToken(user.id, user.role);
  //On envoie en réponse le token et le user

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, username: user.username },
  });
});

router.post("/auth/login", (req: Request, res: Response) => {
  //On envoie l'email et le password du front
  const { email, password } = req.body;

  //Vérification
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
  const currentUserId = req.userId;

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
        // Only the current user's like on each post, so we can tell the
        // front whether to show a filled heart. An empty id matches no
        // user, which keeps the query identical for anonymous visitors.
        likes: {
          where: { userId: currentUserId ?? "" },
          select: { id: true },
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
      likedByMe: post.likes.length > 0,
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
  const currentUserId = req.userId;

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

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const likeCount = await prisma.like.count({ where: { postId: id } });

  let likedByMe = false;
  if (currentUserId) {
    const myLike = await prisma.like.findFirst({
      where: { postId: id, userId: currentUserId },
    });
    likedByMe = myLike !== null;
  }

  return res.json({
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    author: post.author,
    comments: post.comments,
    likeCount,
    likedByMe,
  });
}

async function deletePost(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  await prisma.post.delete({ where: { id } });

  res.json({ success: true });
}

router.get("/posts", optionalAuthenticate, getPosts);
router.post("/posts", authenticate, upload.single("image"), handleCreatePost);
router.get("/posts/:id", optionalAuthenticate, getPostById);
router.delete("/posts/:id", authenticate, deletePost);

// ==================== COMMENTS ====================

router.post(
  "/posts/:id/comments",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: id,
        authorId: userId,
      },
      include: { author: true },
    });

    res.json(comment);
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
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    try {
      await prisma.like.create({ data: { postId: id, userId } });
    } catch (error) {
      const isDuplicate =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (!isDuplicate) {
        console.error(error);
        return res.status(500).json({ error: "Could not like this post" });
      }
      // Doublon : le like existe déjà, c'est le résultat voulu. On continue.
    }

    const likeCount = await prisma.like.count({ where: { postId: id } });
    return res.json({ liked: true, likeCount });
  },
);

router.delete(
  "/posts/:id/like",
  authenticate,
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await prisma.like.deleteMany({ where: { postId: id, userId } });

    const likeCount = await prisma.like.count({ where: { postId: id } });
    return res.json({ liked: false, likeCount });
  },
);

// ==================== USERS ====================

// fetch a user by id
function fetch_user(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  prisma.user.findUnique({ where: { id } }).then((user) => {
    res.json(user);
  });
}

async function getUserPosts(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  const posts = await prisma.post.findMany({
    where: { authorId: id },
    orderBy: { createdAt: "desc" },
  });

  res.json(posts);
}

router.get("/users/:id", fetch_user);
router.get("/users/:id/posts", getUserPosts);

export default router;