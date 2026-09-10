import { CreatePostResponseSchema, type CreatedPost } from "./posts.types";
import { notifyUnauthorized } from "../../shared/auth/unauthorized";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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

async function dataPost(
  content: string,
  img: File | null,
  token: string,
): Promise<ApiResult<CreatedPost>> {
  const API_URL = import.meta.env.VITE_API_URL;
  const formData = new FormData();

  formData.append("content", content);
  if (img) {
    formData.append("image", img);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }

  if (res.status === 401) {
    notifyUnauthorized();
    return { ok: false, error: "Session expirée, reconnecte-toi." };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "Réponse du serveur invalide" };
  }

  if (!res.ok) {
    // Surface the backend message (content too long, image too big, …).
    return {
      ok: false,
      error: readErrorMessage(data, "Erreur lors de la création du post"),
    };
  }

  const result = CreatePostResponseSchema.safeParse(data);
  if (!result.success) {
    return { ok: false, error: "Réponse du serveur invalide" };
  }

  return { ok: true, data: result.data };
}

export { dataPost };
