import { Link } from "react-router-dom";

import { useFeed } from "./useFeed";
import PostCard from "./PostCard";
import { useAuth } from "../../shared/auth/useAuth";
import { CreatePost } from "../s4-creatPost/createPost";
import type { CreatedPost } from "../s4-creatPost/posts.types";
import type { Post } from "./feed.schema";

export default function Feed() {
  const { token, user } = useAuth();
  const { posts, status, errorMessage, hasMore, isLoadingMore, loadMore, retry, addPost } = useFeed(token);

  function handlePostCreated(created: CreatedPost) {
    if (!user) return; 
    const newPost: Post = {
      id: created.id,
      content: created.content,
      imageUrl: created.imageUrl,
      created_at: created.createdAt,
      author: { id: user.id, username: user.username },
      likeCount: 0,
      commentCount: 0,
    };
    addPost(newPost);
  }

  // --- 1. LOADING (only during the very first load) ---
  if (status === "loading") {
    return <p className="text-center text-gray-500 mt-20">Chargement du feed…</p>;
  }

  // --- 2. ERROR ---
  if (status === "error") {
    return (
      <div className="max-w-xl mx-auto mt-20 flex flex-col items-center gap-4">
        <p className="text-red-600">Une erreur est survenue : {errorMessage}</p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // --- 3. EMPTY ---
  if (status === "empty") {
  return (
    <div className="max-w-xl mx-auto py-10 flex flex-col gap-4">
      {token && <CreatePost token={token} onPostCreated={handlePostCreated} />}
      <p className="text-center text-gray-500 mt-20">Aucun post pour le moment.</p>
    </div>
  );
}

  // --- 4. SUCCESS ---
  return (
    <div className="max-w-xl mx-auto py-10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Feed</h1>
        <Link
          to="/profile"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Profil
        </Link>
      </div>

      {/* Displays the creation form only if the user is authenticated. */}
      {token && <CreatePost token={token} onPostCreated={handlePostCreated} />}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {hasMore ? (
        <button
          onClick={loadMore}
          disabled={isLoadingMore}
          className="mx-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoadingMore ? "Chargement…" : "Charger plus"}
        </button>
      ) : (
        <p className="text-center text-sm text-gray-400">Vous avez tout vu 🎉</p>
      )}
    </div>
  );
}
