import { z } from "zod";

// --- Author ---
export const authorSchema = z.object({
  id: z.string(),
  username: z.string(),
});

// --- Post ---
export const postSchema = z.object({
  id: z.string(),
  content: z.string(),
  imageUrl: z.string().nullable(),      
  created_at: z.string(),               
  author: authorSchema.nullable(), 
  likeCount: z.number(),
  commentCount: z.number(),
});

// --- Response ---
export const feedResponseSchema = z.object({
  items: z.array(postSchema),       
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
});

export type Author = z.infer<typeof authorSchema>;
export type Post = z.infer<typeof postSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;
