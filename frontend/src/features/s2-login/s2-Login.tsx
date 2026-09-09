import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../shared/auth/useAuth";
import { CredentialsSchema } from "./auth.schema";

// The four screen states of this form:
// - "idle"    : nothing has happened yet
// - "loading" : request in flight, the button is disabled
// - "error"   : validation or the API failed, we show `message`
// There is no "success" state to render: on success we leave this page
// (redirect to /feed), so the form is unmounted.
type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validate what the user typed before touching the network.
    const parsed = CredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setState({ status: "error", message: parsed.error.issues[0].message });
      return;
    }

    setState({ status: "loading" });
    const result = await login(parsed.data.email, parsed.data.password);
    if (result.ok) {
      navigate("/feed", { replace: true });
      return;
    }
    setState({ status: "error", message: result.error });
  }

  const isLoading = state.status === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-20 flex max-w-sm flex-col gap-4 rounded-2xl bg-white p-8 shadow-lg"
    >
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
        Se connecter
      </h1>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Mot de passe
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Connexion…" : "Se connecter"}
      </button>

      <Link
        to="/register"
        className="mt-2 text-center text-sm text-blue-600 hover:underline"
      >
        S'inscrire
      </Link>
    </form>
  );
}
