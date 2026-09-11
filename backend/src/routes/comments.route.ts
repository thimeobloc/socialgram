import { Request, Response } from "express";
import { authenticate } from "../auth";
import { prisma, router } from "./config.route";

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

async function deleteComment(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;
  const userId = req.userId;

  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  // c'est ici que se joue "auteur uniquement, vérifié côté backend"
  if (comment.authorId !== userId) {
    return res.status(403).json({
      error: "You are not allowed to delete this comment",
    });
  }

  await prisma.comment.delete({ where: { id } });

  return res.json({ success: true });
}
router.delete("/comments/:id", authenticate, deleteComment);

