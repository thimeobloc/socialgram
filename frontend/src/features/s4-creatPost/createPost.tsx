import { useState, useEffect } from "react";
import { dataPost } from "./posts.api";
import type { CreatedPost } from "./posts.types";

const max_length = 500;
const max_size = 5 * 1024 * 1024;
const alloweds_types = ["image/jpeg", "image/png", "image/webp"];

type CreatePostProps = {
  token: string;
  onPostCreated: (post: CreatedPost) => void; // The parent reacts; we are not dealing with that here.
};

function CreatePost({ token, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Build the preview from the selected file and always revoke the blob URL
  // afterwards. Driving it from `imageFile` keeps it correct under React
  // StrictMode (each run creates and revokes its own URL).
  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    // Size / format check (front-side; the API enforces it again).
    if (file && (file.size > max_size || !alloweds_types.includes(file.type))) {
      setErrorMessage(
        "Image invalide : formats acceptés JPEG, PNG, WebP — 5 Mo maximum",
      );
      setImageFile(null);
      e.target.value = ""; // allow re-picking the same file later
      return;
    }

    setErrorMessage(null);
    setImageFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return; // not spammable

    // client-side content validation (non-empty, max length)
    if (!content.trim() || content.length > max_length) {
      setErrorMessage("Le contenu est invalide");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    const result = await dataPost(content, imageFile, token);

    if (result.ok) {
      setContent("");
      setImageFile(null);
      setErrorMessage(null);
      setStatus("idle");
      onPostCreated(result.data);
      return;
    }

    // failure: keep the form intact, just show the error
    setErrorMessage(result.error);
    setStatus("error");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={max_length}
        placeholder="Quoi de neuf ?"
        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageChange}
        disabled={status === "submitting"}
        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {preview && (
        <img
          src={preview}
          alt="Aperçu"
          className="max-w-xs max-h-64 rounded-md object-cover"
        />
      )}

      {errorMessage && (
        <p role="alert" className="text-red-500">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {status === "submitting" ? "Envoi en cours..." : "Publier"}
      </button>
    </form>
  );
}

export { CreatePost };
