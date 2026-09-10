import { useState } from "react";
import type { Comment } from "./postDetail.schema";
import { deleteComment } from "../s8-deletion/commentDeletion";

type Props = {
  comment: Comment;
  canDelete: boolean;              
  token: string | null;
  onDeleted: (id: string) => void; 
};

export function CommentItem({ comment, canDelete, token, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!token) return;
    setDeleting(true);
    setError(null);

    const result = await deleteComment(comment.id, token);
    setDeleting(false);

    if (!result.success) {
      setError(result.error);
      return;   
    }
    onDeleted(comment.id);
  }

  return (
    <li className="group relative bg-paper border border-cream rounded-lg px-3 py-2 text-sm text-ink/80">
      <div className="flex items-start justify-between gap-2">
        <span>
          <strong className="text-ink">{comment.author.username}</strong> : {comment.content}
        </span>

        {canDelete && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Supprimer le commentaire"
            className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition text-slate hover:text-red-600"
          >
            🗑️
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-red-800">Supprimer ce commentaire ?</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full bg-red-600 px-3 py-1 text-white disabled:opacity-50"
          >
            {deleting ? "Suppression…" : "Oui, supprimer"}
          </button>
          <button
            type="button"
            onClick={() => { setConfirming(false); setError(null); }}
            disabled={deleting}
            className="rounded-full border border-brand px-3 py-1 text-brand"
          >
            Annuler
          </button>
        </div>
      )}

      {error && <p role="alert" className="mt-1 text-red-600">{error}</p>}
    </li>
  );
}
