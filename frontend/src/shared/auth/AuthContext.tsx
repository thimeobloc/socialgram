import { createContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { login as loginRequest } from "../../features/s2-login/auth.api";
import { AuthUserSchema, type AuthUser } from "../../features/s2-login/auth.schema";

// We keep the token in localStorage (not a cookie) because the API is a
// separate origin and expects a `Bearer` header. It is readable by JS, so
// it is only acceptable here because the app has no XSS surface of its own.
const TOKEN_KEY = "socialgram.token";
const API_URL = import.meta.env.VITE_API_URL;

// The three states the session can be in:
// - "loading"        : a token exists, we are asking the API if it is still valid
// - "authenticated"  : token is valid, `user` is known
// - "unauthenticated": no token, or the token was refused
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type LoginOutcome = { ok: true } | { ok: false; error: string };

type AuthValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  logout: () => void;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // On first load, re-read the token and ask the API who we are.
  // This is why the session "survives a page reload".
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken === null) {
      setStatus("unauthenticated");
      return;
    }

    // Guards against a state update if the component unmounts (or React
    // StrictMode re-runs the effect) before the request resolves.
    let cancelled = false;

    function forgetToken() {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }

    async function checkToken() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (cancelled) return;

        // 401 => token expired or invalid. Clean logout, no redirect loop:
        // we only land back on "unauthenticated", the router does the rest.
        if (!response.ok) {
          forgetToken();
          return;
        }

        const data: unknown = await response.json();
        const parsed = AuthUserSchema.safeParse(data);
        if (cancelled) return;
        if (!parsed.success) {
          forgetToken();
          return;
        }

        setToken(savedToken);
        setUser(parsed.data);
        setStatus("authenticated");
      } catch {
        if (!cancelled) forgetToken();
      }
    }

    checkToken();
    return () => {
      cancelled = true;
    };
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

  const value: AuthValue = { status, user, token, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
