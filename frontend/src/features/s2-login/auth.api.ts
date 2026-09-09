import { LoginResponseSchema, type AuthUser } from "./auth.schema";

const API_URL = import.meta.env.VITE_API_URL;

// The caller must check `ok` before reading `token`/`user`. This makes it
// impossible to forget the error case (TypeScript won't let you).
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

    // 401 here means "wrong email/password", not "session expired".
    if (response.status === 401) {
      return { ok: false, error: "Email ou mot de passe incorrect" };
    }
    if (!response.ok) {
      return { ok: false, error: "Le serveur a renvoyé une erreur" };
    }

    // The response is `unknown` until Zod has checked its shape.
    const data: unknown = await response.json();
    const parsed = LoginResponseSchema.safeParse(data);
    if (!parsed.success) {
      return { ok: false, error: "Réponse inattendue du serveur" };
    }

    return { ok: true, token: parsed.data.token, user: parsed.data.user };
  } catch (error: unknown) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Erreur inconnue";
}
