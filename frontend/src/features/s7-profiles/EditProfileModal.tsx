import { useState, type FormEvent } from "react";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="edit-profile-title"
            className="text-lg font-semibold text-gray-900"
          >
            Modifier le profil
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Nom d'utilisateur
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
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
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
