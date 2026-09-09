import { useState } from "react";
import { dataPost } from "./posts.api";
import type { Post } from "./posts.types";

const max_length = 500;       
const max_size = 5 * 1024 * 1024; 
const alloweds_types = ["image/jpeg", "image/png", "image/webp"];

type CreatePostProps = {
  token: string;
  onPostCreated: (post: Post) => void; // The parent reacts; we are not dealing with that here.
};

function CreatePost({ token, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    // get files
    const fl = e.target.files?.[0] || null;
    // veryfication of the file (size, type)
    if (fl && (fl.size > max_size || !alloweds_types.includes(fl.type))) {
      setErrorMessage("Fichier invalide");
      return;
    }

    setErrorMessage(null);
    setImageFile(fl);
    setPreview(fl ? URL.createObjectURL(fl) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // client-side content validation (non-empty, max length) 
    if (!content.trim() || content.length > max_length) {
      setErrorMessage("Le contenu est invalide");
      return;
    }

    setStatus("submitting");
    const result = await dataPost(content, imageFile, token);
    // if result.ok reset form (content, imageFile, preview) + onPostCreated(result.data) + setStatus("idle")
    if (result.ok) {
      setContent("");
      setImageFile(null);
      setPreview(null);
      setErrorMessage(null);
      onPostCreated(result.data);
      setStatus("idle");
    }

    else {
      setErrorMessage(result.error);
      setStatus("error");
    }
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
        accept="image/*"
        onChange={handleImageChange}
        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {/* if preview exists : <img src={preview} /> */}
      {preview && <img src={preview} alt="Preview" className="max-w-xs max-h-xs" />}
      {/* if errorMessage exists : display the message (role="alert" for accessibility, cf slide Tests) */}
      {errorMessage && (
        <p role="alert" className="text-red-500">
          {errorMessage}
        </p>
      )}
      {/* submit button, disabled when status === "submitting", text that changes according to status */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
        {status === "submitting" ? "Envoi en cours..." : "Publier"}
      </button>
    </form>
  );
}

export { CreatePost };