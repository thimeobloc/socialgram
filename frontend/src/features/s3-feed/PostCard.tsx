import { API_URL } from "./config";
import type { Post } from "./feed.schema";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return ""; // date invalide -> on n'affiche rien
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PostCard({
  post,
  onToggleLike,
  isPending,
  canLike,
}: {
  post: Post;
  onToggleLike: (postId: string) => void;
  isPending: boolean;
  canLike: boolean;
}) {
  return (
    <article className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <span className="font-semibold text-gray-800">
          {post.author?.username ?? "Utilisateur supprimé"}
        </span>
        <time className="text-sm text-gray-500">{formatDate(post.created_at)}</time>
      </header>

      <p className="text-gray-700 whitespace-pre-line">{post.content}</p>

      {post.imageUrl && (
        <img
          src={`${API_URL}${post.imageUrl}`}
          alt=""
          loading="lazy"
          className="w-full rounded-lg object-cover"
        />
      )}

      <footer className="text-sm text-gray-500 flex gap-4 items-center">
        <button
          type="button"
          onClick={() => onToggleLike(post.id)}
          disabled={!canLike || isPending}
          aria-pressed={post.likedByMe}
          aria-label={post.likedByMe ? "Retirer mon like" : "Aimer ce post"}
          className="flex items-center gap-1 transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{post.likedByMe ? "❤️" : "🤍"}</span>
          <span>{post.likeCount}</span>
        </button>
        <span>💬 {post.commentCount}</span>
      </footer>
    </article>
  );
}