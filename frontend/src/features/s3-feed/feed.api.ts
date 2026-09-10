import { API_URL } from "./config";
import { feedResponseSchema, type FeedResponse } from "./feed.schema";
import { notifyUnauthorized } from "../../shared/auth/unauthorized";

export async function fetchFeed(
  page: number,
  token: string | null,
  limit = 20,
): Promise<FeedResponse> {
  let res: Response;

  // --- TRY TO CALL NETWORK ---
  try {
    res = await fetch(`${API_URL}/posts?page=${page}&limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    // fetch ne rejette QUE si le serveur est injoignable / pas de réseau
    throw new Error("Impossible de contacter le serveur");
  }

  // --- SESSION EXPIRÉE ---
  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error("Session expirée, reconnecte-toi");
  }

  // --- HTTP STATUS (404 or 500) ---
  if (!res.ok) {
    throw new Error("Le serveur a renvoyé une erreur");
  }

  // --- VALIDATION JSON ---
  const json: unknown = await res.json();
  const parsed = feedResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error(parsed.error);
    throw new Error("Réponse du serveur inattendue");
  }

  return parsed.data;
}
