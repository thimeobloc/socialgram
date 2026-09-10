import { z } from "zod";

export const profileUserSchema = z.object({
  id: z.string(),
  username: z.string(),
});

export const profilePostSchema = z.object({
  id: z.string(),
  content: z.string(),
});

export const profilePostsSchema = z.array(profilePostSchema);

export type ProfileUser = z.infer<typeof profileUserSchema>;
export type ProfilePost = z.infer<typeof profilePostSchema>;
