import { LoginResponseSchema, type AuthUser } from "./auth.schema";

const API_URL = import.meta.env.VITE_API_URL;

// The caller must check `ok` before reading `token` / `user`.
export type LoginResult =
  | { ok: true; token: string; user: AuthUser }
  | { ok: false; error: string };

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    // 401 here means "wrong email or password".
    if (response.status === 401) {
      return { ok: false, error: "Email ou mot de passe incorrect" };
    }
    if (!response.ok) {
      return { ok: false, error: "Le serveur a renvoyé une erreur" };
    }

    // We only trust the body once Zod has checked its shape.
    const data: unknown = await response.json();
    const parsed = LoginResponseSchema.safeParse(data);
    if (!parsed.success) {
      return { ok: false, error: "Réponse inattendue du serveur" };
    }

    return { ok: true, token: parsed.data.token, user: parsed.data.user };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur" };
  }
}
