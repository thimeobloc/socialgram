import { API_URL } from "./config";
import { feedResponseSchema, type FeedResponse } from "./feed.schema";

export async function fetchFeed(
  page: number,
  token: string | null,
  limit = 20,
): Promise<FeedResponse> {
  let res: Response;

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // --- TRY TO CALL NETWORK ---
  try {
    res = await fetch(`${API_URL}/posts?page=${page}&limit=${limit}`, { headers });
  } catch {
    // fetch ne rejette QUE si le serveur est injoignable / pas de réseau
    throw new Error("Impossible de contacter le serveur");
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
