import {
  profilePostsSchema,
  profileUserSchema,
  updatedProfileSchema,
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

export type UpdateResult =
  | { status: "ok"; username: string; email: string }
  | { status: "taken" }
  | { status: "error" };

export async function updateProfile(
  userId: string,
  token: string,
  username: string,
  email: string,
): Promise<UpdateResult> {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username, email }),
    });

    if (response.status === 409) {
      return { status: "taken" };
    }
    if (!response.ok) {
      return { status: "error" };
    }

    const raw: unknown = await response.json();
    const parsed = updatedProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return { status: "error" };
    }

    return {
      status: "ok",
      username: parsed.data.username,
      email: parsed.data.email,
    };
  } catch {
    return { status: "error" };
  }
}
