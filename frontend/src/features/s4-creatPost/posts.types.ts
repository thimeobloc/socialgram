import { z } from "zod";

export const CreatePostResponseSchema  = z.object({
  id: z.string(),
  content: z.string(),
  imageUrl: z.string().nullable(),
  authorId: z.string(),
  createdAt: z.string(),
});

export type CreatedPost = z.infer<typeof CreatePostResponseSchema>;