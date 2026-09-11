import { postDetailSchema, type PostDetail, type Comment, commentSchema } from "./postDetail.schema";
import { notifyUnauthorized } from "../../shared/auth/unauthorized";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const API_BASE = import.meta.env.VITE_API_URL;

function readErrorMessage(data: unknown, fallback: string): string {
  if (
    data !== null &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }
  return fallback;
}

// Fetches a post and validates the server response
export async function getPostById(
  id: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<ApiResult<PostDetail>> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.status === 401) {
      notifyUnauthorized();
      return { ok: false, error: "Session expirée, reconnecte-toi" };
    }

    if (res.status === 404) {
      return { ok: false, error: "NOT_FOUND" };
    }

    if (!res.ok) {
      return { ok: false, error: "Impossible de charger le post" };
    }

    const raw: unknown = await res.json();
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
  token: string,
): Promise<ApiResult<Comment>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
  } catch {
    return { ok: false, error: "Erreur réseau" };
  }

  if (res.status === 401) {
    notifyUnauthorized();
    return { ok: false, error: "Session expirée, reconnecte-toi" };
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    return { ok: false, error: "Réponse invalide du serveur" };
  }

  if (!res.ok) {
    // Surface the backend message (comment too long, post deleted, …).
    return {
      ok: false,
      error: readErrorMessage(raw, "Impossible de publier le commentaire"),
    };
  }

  const parsed = commentSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(parsed.error);
    return { ok: false, error: "Réponse invalide du serveur" };
  }

  return { ok: true, data: parsed.data };
}
