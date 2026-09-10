import {
  profilePostsSchema,
  profileUserSchema,
  type ProfilePost,
  type ProfileUser,
} from "./profile.schema";

const API_URL = import.meta.env.VITE_API_URL;

export type ProfileResult =
  | { status: "ok"; user: ProfileUser; posts: ProfilePost[] }
  | { status: "not-found" }
  | { status: "error" };

export async function fetchProfile(userId: string): Promise<ProfileResult> {
  try {
    const userResponse = await fetch(`${API_URL}/users/${userId}`);
    if (userResponse.status === 404) {
      return { status: "not-found" };
    }

    const postsResponse = await fetch(`${API_URL}/users/${userId}/posts`);
    if (!userResponse.ok || !postsResponse.ok) {
      return { status: "error" };
    }

    const rawUser: unknown = await userResponse.json();
    const rawPosts: unknown = await postsResponse.json();

    const user = profileUserSchema.safeParse(rawUser);
    const posts = profilePostsSchema.safeParse(rawPosts);
    if (!user.success || !posts.success) {
      return { status: "error" };
    }

    return { status: "ok", user: user.data, posts: posts.data };
  } catch {
    return { status: "error" };
  }
}
