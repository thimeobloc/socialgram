import { createContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { login as loginRequest } from "../../features/s2-login/auth.api";
import { AuthUserSchema, type AuthUser } from "../../features/s2-login/auth.schema";
import { setUnauthorizedHandler } from "./unauthorized";

// The token lives in localStorage so the session survives a page reload.
const TOKEN_KEY = "socialgram.token";
const API_URL = import.meta.env.VITE_API_URL;

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type LoginOutcome = { ok: true } | { ok: false; error: string };

type AuthValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  logout: () => void;
  updateUser: (changes: Partial<AuthUser>) => void;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // On page load: if a token is stored, ask the API who we are.
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setStatus("unauthenticated");
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((response) => {
        // A 401 means the token is expired or invalid.
        if (!response.ok) {
          throw new Error("token refused");
        }
        return response.json();
      })
      .then((data: unknown) => {
        const parsed = AuthUserSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error("unexpected shape");
        }
        setToken(savedToken);
        setUser(parsed.data);
        setStatus("authenticated");
      })
      .catch(() => {
        // Any failure: drop the bad token, land on "unauthenticated".
        localStorage.removeItem(TOKEN_KEY);
        setStatus("unauthenticated");
      });
  }, []);

  async function login(
    email: string,
    password: string,
  ): Promise<LoginOutcome> {
    const result = await loginRequest(email, password);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
    navigate("/login", { replace: true });
  }

  // Keeps the stored user in sync after a profile edit (S7).
  function updateUser(changes: Partial<AuthUser>) {
    setUser((current) =>
      current === null ? current : { ...current, ...changes },
    );
  }

  // Let the API layer trigger a logout when it gets a 401 mid-session.
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, []);

  const value: AuthValue = { status, user, token, login, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
