import { postDetailSchema, type PostDetail, type Comment, commentSchema } from "./postDetail.schema";
import { notifyUnauthorized } from "../../shared/auth/unauthorized";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const API_BASE = import.meta.env.VITE_API_URL; 

// Fetches a post and validates the server response
export async function getPostById(
  id: string,
  signal?: AbortSignal
): Promise<ApiResult<PostDetail>> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}`, { signal });

    if (!res.ok) {
      if (res.status === 404) {
        return { ok: false, error: "NOT_FOUND" };
      }
      return { ok: false, error: "Impossible de charger le post" };
    }

    const raw = await res.json();
    const parsed = postDetailSchema.safeParse(raw);

    if (!parsed.success) {
      console.error(parsed.error);
      return { ok: false, error: "Réponse invalide du serveur" };
    }

    return { ok: true, data: parsed.data };
  } catch (e) {
    // Abort errors are handled by the caller
    if (e instanceof DOMException && e.name === "AbortError") {
      throw e; 
    }
    return { ok: false, error: "Erreur réseau" };
  }
}

// Publishes a comment for a post using the user's authentication token
export async function postComment(
  postId: string,
  content: string,
  token: string
): Promise<ApiResult<Comment>> {
  try {
    // Send the comment with the user's authentication token
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    // Handle unsuccessful HTTP responses
    if (res.status === 401) {
      notifyUnauthorized();
      return { ok: false, error: "Session expirée, reconnecte-toi" };
    }

    if (!res.ok) {
      return { ok: false, error: "Impossible de publier le commentaire" };
    }

    // Validate the server response before returning it
    const raw = await res.json();
    const parsed = commentSchema.safeParse(raw);

    if (!parsed.success) {
      console.error(parsed.error);
      return { ok: false, error: "Réponse invalide du serveur" };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, error: "Erreur réseau" };
  }
}