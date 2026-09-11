import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../shared/auth/useAuth";
import { CredentialsSchema } from "./auth.schema";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Check the fields before calling the API.
    const parsed = CredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0].message);
      return;
    }

    setErrorMessage("");
    setLoading(true);
    const result = await login(parsed.data.email, parsed.data.password);
    setLoading(false);

    if (result.ok) {
      navigate("/feed", { replace: true });
      return;
    }
    setErrorMessage(result.error);
  }

  return (
    <div className="mx-auto mt-16 flex max-w-sm flex-col items-center px-4">
      <p className="font-display text-4xl uppercase text-brand">Groupy</p>
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-slate">
        Find your group
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-4 rounded-2xl border border-cream bg-white p-8 shadow-sm"
      >
        <h1 className="mb-2 text-center font-display text-2xl uppercase text-ink">
          Se connecter
        </h1>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-cream bg-paper px-4 py-2 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-cream bg-paper px-4 py-2 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        {errorMessage !== "" && (
          <p role="alert" className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-full bg-brand py-2.5 font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>

        <Link
          to="/register"
          className="mt-1 text-center text-sm font-medium text-brand hover:underline"
        >
          S'inscrire
        </Link>
      </form>
    </div>
  );
}
