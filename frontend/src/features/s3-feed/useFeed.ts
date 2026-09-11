import { useState, useEffect, useCallback } from "react";
import { fetchFeed } from "./feed.api";
import { likePost, unlikePost } from "./like.api";
import type { Post } from "./feed.schema";

type Status = "loading" | "error" | "empty" | "success";

// The token comes from the caller (see s3-Feed) rather than from useAuth
// here: the feed request needs it, and so does every like sent from a card.
export function useFeed(token: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Posts dont le like est en cours d'envoi : on neutralise leur bouton
  // pour qu'un double-clic n'envoie pas deux requêtes contradictoires.
  const [pendingLikeIds, setPendingLikeIds] = useState<string[]>([]);
  const [likeErrorMessage, setLikeErrorMessage] = useState("");

  // --- Loading ---
  const loadFirstPage = useCallback(() => {
    setStatus("loading");
    setErrorMessage("");
    fetchFeed(1, token)
      .then((data) => {
        if (data.items.length === 0) {
          setStatus("empty");
          return;
        }
        setPosts(data.items);
        setHasMore(data.hasMore);
        setPage(1);
        setStatus("success");
      })
      .catch((err: Error) => {
        setErrorMessage(err.message);
        setStatus("error");
      });
  }, [token]);

  // --- Start loading ---
  // Se relance si le token change (connexion / déconnexion) : likedByMe
  // dépend de qui regarde.
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  // --- Next Page ---
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setErrorMessage("");
    fetchFeed(nextPage, token)
      .then((data) => {
        setPosts((prev) => [...prev, ...data.items]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      })
      .catch((err: Error) => setErrorMessage(err.message))
      .finally(() => setIsLoadingMore(false));
  }, [page, hasMore, isLoadingMore, token]);

  const addPost = useCallback((newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    setStatus("success");
  }, []);

  // --- Like / Unlike ---
  const toggleLike = useCallback(
    async (postId: string) => {
      if (!token) return;
      if (pendingLikeIds.includes(postId)) return;

      const target = posts.find((post) => post.id === postId);
      if (!target) return;

      // On mémorise l'état d'avant pour pouvoir revenir en arrière.
      const wasLiked = target.likedByMe;
      const previousCount = target.likeCount;

      // 1. Mise à jour optimiste : l'écran réagit tout de suite,
      //    sans attendre la réponse du serveur.
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likedByMe: !wasLiked,
                likeCount: wasLiked ? post.likeCount - 1 : post.likeCount + 1,
              }
            : post,
        ),
      );
      setPendingLikeIds((prev) => [...prev, postId]);
      setLikeErrorMessage("");

      try {
        const result = wasLiked
          ? await unlikePost(postId, token)
          : await likePost(postId, token);

        // 2. Le serveur fait autorité : on aligne sur sa réponse plutôt
        //    que de garder notre estimation.
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likedByMe: result.liked, likeCount: result.likeCount }
              : post,
          ),
        );
      } catch (err) {
        // 3. Échec : on remet exactement l'état d'avant et on prévient.
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likedByMe: wasLiked, likeCount: previousCount }
              : post,
          ),
        );
        setLikeErrorMessage(
          err instanceof Error ? err.message : "Le like n'a pas pu être envoyé",
        );
      } finally {
        setPendingLikeIds((prev) => prev.filter((id) => id !== postId));
      }
    },
    [posts, token, pendingLikeIds],
  );

  return {
    posts,
    status,
    errorMessage,
    hasMore,
    isLoadingMore,
    loadMore,
    retry: loadFirstPage,
    addPost,
    toggleLike,
    pendingLikeIds,
    likeErrorMessage,
  };
}