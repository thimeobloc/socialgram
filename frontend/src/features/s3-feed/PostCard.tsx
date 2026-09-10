import { Link } from "react-router-dom";
import { API_URL } from "./config";
import type { Post } from "./feed.schema";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-3">
      <Link to={`/posts/${post.id}`} className="flex flex-col gap-3">
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
      </Link>

      <footer className="text-sm text-gray-500 flex gap-4">
        <span>❤️ {post.likeCount}</span>
        <span>💬 {post.commentCount}</span>
      </footer>
    </article>
  );
}