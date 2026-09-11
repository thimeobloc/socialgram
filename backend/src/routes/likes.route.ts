import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { authenticate } from "../auth";
import { prisma, router } from "./config.route";

// ==================== LIKES ====================

// Liking twice must not create a second row nor a second point in the
// counter: the unique index on (postId, userId) is what guarantees it,
// and a duplicate is treated as a success since the wanted state is reached.
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

    // `deleteMany` ne lève pas si le like n'existe pas : unliker deux fois
    // donne le même résultat qu'une fois.
    await prisma.like.deleteMany({ where: { postId: id, userId } });

    const likeCount = await prisma.like.count({ where: { postId: id } });
    return res.json({ liked: false, likeCount });
  },
);
