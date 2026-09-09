import { useFeed } from "./useFeed";
import PostCard from "./PostCard";

export default function Feed() {
  const { posts, status, errorMessage, hasMore, isLoadingMore, loadMore, retry } = useFeed();

  // --- 1. LOADING (uniquement au tout premier chargement) ---
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
    return <p className="text-center text-gray-500 mt-20">Aucun post pour le moment.</p>;
  }

  // --- 4. SUCCESS ---
  return (
    <div className="max-w-xl mx-auto py-10 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-800">Feed</h1>

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
