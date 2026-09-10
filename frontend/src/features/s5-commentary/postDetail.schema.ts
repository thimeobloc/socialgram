import z from "zod";
import { authorSchema } from "../s3-feed/feed.schema";

// --- Comment ---
export const commentSchema = z.object({
  id: z.string(),
  content: z.string(),
  created_at: z.string(),        
  author: authorSchema,
});

// --- Post Detail ---
export const postDetailSchema = z.object({
  id: z.string(),
  content: z.string(),
  imageUrl: z.string().nullable(),
  created_at: z.string(),       
  author: authorSchema,
  comments: z.array(commentSchema),
  likeCount: z.number(),
});

export type Comment = z.infer<typeof commentSchema>;
export type PostDetail = z.infer<typeof postDetailSchema>;