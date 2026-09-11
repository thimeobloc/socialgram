import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { authenticate, optionalAuthenticate } from "../auth";
import { prisma, router } from "./config.route";

const MAX_POST_LENGTH = 500;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    // Random name: never trust `file.originalname` (it can contain "../").
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("INVALID_FILE_TYPE"));
    }
  },
});

// Wraps multer so upload errors become clean 400s instead of crashing the route.
function uploadImage(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "L'image dépasse 5 Mo" });
      }
      return res.status(400).json({ error: "Fichier invalide" });
    }
    if (err instanceof Error) {
      const message =
        err.message === "INVALID_FILE_TYPE"
          ? "Format d'image non supporté (JPEG, PNG ou WebP)"
          : "Fichier invalide";
      return res.status(400).json({ error: message });
    }
    next();
  });
}

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

  // multer has already written any upload to disk at this point, so a
  // validation failure must remove the orphan file.
  function discardUpload() {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  }

  if (typeof content !== "string" || content.trim().length === 0) {
    discardUpload();
    return res.status(400).json({ error: "Le contenu est obligatoire" });
  }

  if (content.length > MAX_POST_LENGTH) {
    discardUpload();
    return res
      .status(400)
      .json({ error: `Le contenu dépasse ${MAX_POST_LENGTH} caractères` });
  }

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

    // Same like state as the feed, so a post looks identical in both places.
    let likedByMe = false;
    if (currentUserId) {
      const myLike = await prisma.like.findFirst({
        where: { postId: id, userId: currentUserId },
      });
      likedByMe = myLike !== null;
    }

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
      likedByMe,
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
// The feed stays behind `authenticate`: reading it requires an account.
// `optionalAuthenticate` on the detail route never blocks anonymous readers,
// it only identifies the visitor so `likedByMe` can be filled in.
router.get("/posts", authenticate, getPosts);
router.post("/posts", authenticate, uploadImage, handleCreatePost);
router.get("/posts/:id", optionalAuthenticate, getPostById);
router.delete("/posts/:id", authenticate, deletePost);
