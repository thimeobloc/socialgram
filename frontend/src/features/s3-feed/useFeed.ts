import { useState, useEffect, useCallback } from "react";
import { fetchFeed } from "./feed.api";
import type { Post } from "./feed.schema";

type Status = "loading" | "error" | "empty" | "success";

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- Loading ---
  const loadFirstPage = useCallback(() => {
    setStatus("loading");
    setErrorMessage("");
    fetchFeed(1)
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
  }, []);

  // --- Start loading ---
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  // --- Next Page ---
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return; 
    const nextPage = page + 1;
    setIsLoadingMore(true);                
    setErrorMessage("");
    fetchFeed(nextPage)
      .then((data) => {
        setPosts((prev) => [...prev, ...data.items]); 
        setHasMore(data.hasMore);
        setPage(nextPage);
      })
      .catch((err: Error) => setErrorMessage(err.message))
      .finally(() => setIsLoadingMore(false));
  }, [page, hasMore, isLoadingMore]);

  const addPost = useCallback((newPost: Post) => {
  setPosts((prev) => [newPost, ...prev]);
  setStatus("success");
}, []);

  return { posts, status, errorMessage, hasMore, isLoadingMore, loadMore, retry: loadFirstPage, addPost };
}
