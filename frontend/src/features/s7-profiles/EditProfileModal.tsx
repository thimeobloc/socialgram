import { useEffect, useState, type FormEvent } from "react";

import { updateProfile } from "./profile.api";

type Props = {
  userId: string;
  token: string;
  currentUsername: string;
  currentEmail: string;
  onClose: () => void;
  onSaved: (updated: { username: string; email: string }) => void;
};

export default function EditProfileModal({
  userId,
  token,
  currentUsername,
  currentEmail,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(currentUsername);
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Close on the Escape key.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.trim().length === 0) {
      setError("Le nom d'utilisateur est obligatoire");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email invalide");
      return;
    }

    setSaving(true);
    setError("");

    const result = await updateProfile(userId, token, name, email);
    setSaving(false);

    if (result.status === "taken") {
      setError("Ce nom ou cet email est déjà pris");
    } else if (result.status === "error") {
      setError("Impossible d'enregistrer");
    } else {
      onClose();
      onSaved({ username: result.username, email: result.email });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="w-full max-w-md rounded-2xl border border-cream bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="edit-profile-title"
            className="font-display text-lg uppercase text-ink"
          >
            Modifier le profil
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-slate hover:bg-cream"
          >
            ✕
          </button>
        </div>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate">
            Nom d'utilisateur
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-cream bg-paper px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-cream bg-paper px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>

          {error !== "" && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand px-4 py-1.5 text-sm font-semibold text-brand hover:bg-cream"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
