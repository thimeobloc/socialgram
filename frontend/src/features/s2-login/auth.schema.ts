import { z } from "zod";

// What the login form collects, checked before we call the API.
export const CredentialsSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

// A user as returned by the API. One schema gives us both the runtime
// check (safeParse) and the TypeScript type (z.infer).
export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

// What POST /auth/login returns on success.
export const LoginResponseSchema = z.object({
  token: z.string(),
  user: AuthUserSchema,
});
