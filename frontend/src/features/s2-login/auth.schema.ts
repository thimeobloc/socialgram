import { z } from "zod";

// What the login form collects. We validate it before calling the API,
// so an empty field never reaches the network.
export const CredentialsSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

// Shape of a user as returned by the API. Defining it once here gives us
// both the runtime check (safeParse) and the TypeScript type (z.infer).
export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

// What POST /auth/login is expected to return on success.
export const LoginResponseSchema = z.object({
  token: z.string(),
  user: AuthUserSchema,
});
