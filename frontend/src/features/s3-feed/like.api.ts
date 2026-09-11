import { z } from "zod";
import { API_URL } from "./config";

// Le backend renvoie l'état final du like et le compteur à jour.
// On valide comme le reste du projet : jamais confiance aveugle.
const likeResponseSchema = z.object({
  liked: z.boolean(),
  likeCount: z.number(),
});

export type LikeResponse = z.infer<typeof likeResponseSchema>;

async function sendLike(
  postId: string,
  token: string,
  method: "POST" | "DELETE",
): Promise<LikeResponse> {
  let res: Response;

  // --- TRY TO CALL NETWORK ---
  try {
    res = await fetch(`${API_URL}/posts/${postId}/like`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("Impossible de contacter le serveur");
  }

  // --- HTTP STATUS ---
  // Chaque code a un message clair : l'utilisateur doit comprendre
  // ce qui s'est passé, pas voir un message générique.
  if (res.status === 401) {
    throw new Error("Session expirée, reconnectez-vous");
  }
  if (res.status === 404) {
    throw new Error("Ce post n'existe plus");
  }
  if (!res.ok) {
    throw new Error("Le serveur a renvoyé une erreur");
  }

  // --- VALIDATION JSON ---
  const json: unknown = await res.json();
  const parsed = likeResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error(parsed.error);
    throw new Error("Réponse du serveur inattendue");
  }

  return parsed.data;
}

export function likePost(postId: string, token: string): Promise<LikeResponse> {
  return sendLike(postId, token, "POST");
}

export function unlikePost(
  postId: string,
  token: string,
): Promise<LikeResponse> {
  return sendLike(postId, token, "DELETE");
}