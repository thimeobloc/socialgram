import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePostDetail } from "./usePostDetail";
import { postComment } from "./postComment.api";
import type { Comment } from "./postDetail.schema";
import { useAuth } from "../../shared/auth/useAuth";

export function PostDetail() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <p role="alert">Post introuvable</p>;
  }

  const state = usePostDetail(id);

  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState<Comment[]>([]);

  const { token } = useAuth();

// Sends a new comment to the API
async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Prevent empty submissions or multiple requests
    if (content.trim().length === 0 || submitting || !token) return;

    setSubmitting(true);
    setSubmitError(null);

    const result = await postComment(id!, content, token);

    setSubmitting(false);

    if (!result.ok) {
        setSubmitError(result.error);
        return;
    }
    
    // Add the new comment locally and clear the input
    setLocalComments((prev) => [...prev, result.data]);
    setContent("");
}

  switch (state.status) {
  case "loading":
    return (
      <div className="flex justify-center items-center py-20 text-gray-500">
        Chargement...
      </div>
    );

  case "not_found":
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white rounded-2xl shadow-lg p-6 text-center text-gray-600" role="alert">
        Ce post n'existe pas.
      </div>
    );

  case "error":
    return (
      <div className="max-w-xl mx-auto mt-10 bg-red-50 text-red-700 rounded-2xl shadow p-6 text-center" role="alert">
        {state.message}
      </div>
    );

  case "success": {
    const post = state.data;
    const allComments = [...post.comments, ...localComments];

    return (
      <article className="max-w-xl mx-auto mt-6 bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <span className="font-semibold text-gray-800">{post.author.username}</span>
          <time className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleString("fr-FR")}
          </time>
        </header>

        <p className="text-gray-700 whitespace-pre-line">{post.content}</p>

        {post.imageUrl && (
          <img src={post.imageUrl} alt="" className="w-full rounded-lg object-cover" />
        )}

        <p className="text-sm text-gray-500">
          ❤️ {post.likeCount} like{post.likeCount !== 1 ? "s" : ""}
        </p>

        <section aria-label="Commentaires" className="border-t pt-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800">
            Commentaires ({allComments.length})
          </h2>

          <ul className="flex flex-col gap-2">
            {allComments.map((c) => (
              <li key={c.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                <strong className="text-gray-800">{c.author.username}</strong> : {c.content}
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmit} className="flex gap-2 items-start mt-2">
            <div className="flex-1">
              <label htmlFor="comment-content" className="sr-only">
                Ajouter un commentaire
              </label>
              <input
                id="comment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={submitting}
                placeholder="Ajouter un commentaire..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
              />
              {submitError && (
                <p role="alert" className="text-red-600 text-sm mt-1">
                  {submitError}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || content.trim().length === 0}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {submitting ? "Envoi..." : "Publier"}
            </button>
          </form>
        </section>
      </article>
    );
  }

  default: {
    const _exhaustive: never = state;
    return _exhaustive;
  }
}
}