import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePostDetail } from "./usePostDetail";
import { postComment } from "./postComment.api";
import type { Comment } from "./postDetail.schema";
import { useAuth } from "../../shared/auth/useAuth";
import { API_URL } from "../s3-feed/config";
import { CommentItem } from "./CommentItem";

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();

  const state = usePostDetail(id ?? "", token);

  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Navigating between posts keeps this component mounted, so the per-post
  // local state must be cleared when the id changes.
  useEffect(() => {
    setContent("");
    setSubmitError(null);
    setLocalComments([]);
    setDeletedIds(new Set());
  }, [id]);

  // Sends a new comment to the API
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Prevent empty submissions or multiple requests
    if (!id || content.trim().length === 0 || submitting || !token) return;

    setSubmitting(true);
    setSubmitError(null);

    const result = await postComment(id, content, token);

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
        <div className="flex justify-center items-center py-20 text-slate">
          Chargement...
        </div>
      );

    case "not_found":
      return (
        <div className="max-w-xl mx-auto mt-10 bg-white border border-cream rounded-2xl shadow-sm p-6 text-center text-slate" role="alert">
          Ce post n'existe pas.
        </div>
      );

    case "error":
      return (
        <div className="max-w-xl mx-auto mt-10 bg-red-50 text-red-700 rounded-2xl shadow-sm p-6 text-center" role="alert">
          {state.message}
        </div>
      );

    case "success": {
      const post = state.data;
      const allComments = [...post.comments, ...localComments].filter(
        (c) => !deletedIds.has(c.id),
      );

      return (
        <article className="max-w-xl mx-auto mt-6 bg-white border border-cream rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <header className="flex items-center justify-between">
            <span className="font-semibold text-ink">{post.author.username}</span>
            <time className="text-sm text-slate">
              {new Date(post.created_at).toLocaleString("fr-FR")}
            </time>
          </header>

          <p className="text-ink/80 whitespace-pre-line">{post.content}</p>

          {post.imageUrl && (
            <img
              src={`${API_URL}${post.imageUrl}`}
              alt=""
              className="w-full rounded-xl object-cover"
            />
          )}

          <p className="text-sm text-slate">
            ❤️ {post.likeCount} like{post.likeCount !== 1 ? "s" : ""}
          </p>

          <section aria-label="Commentaires" className="border-t border-cream pt-4 flex flex-col gap-3">
            <h2 className="font-display text-lg uppercase text-ink">
              Commentaires ({allComments.length})
            </h2>

            <ul className="flex flex-col gap-2">
              {allComments.length === 0 ? (
                <li className="text-slate text-sm">Aucun commentaire pour l'instant.</li>
              ) : (
                allComments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    canDelete={user?.id === c.author.id}
                    token={token}
                    onDeleted={(deletedId) =>
                      setDeletedIds((prev) => new Set(prev).add(deletedId))
                    }
                  />
                ))
              )}
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
                  className="w-full rounded-lg border border-cream bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
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
                className="bg-brand text-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors"
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
