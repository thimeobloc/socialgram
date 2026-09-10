import { useEffect, useState } from "react";

import { fetchProfile } from "./profile.api";
import type { ProfilePost, ProfileUser } from "./profile.schema";

export type ProfileScreen =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty"; user: ProfileUser }
  | { status: "success"; user: ProfileUser; posts: ProfilePost[] };

export function useProfile(userId: string | undefined) {
  const [screen, setScreen] = useState<ProfileScreen>({ status: "loading" });

  useEffect(() => {
    if (userId === undefined) {
      setScreen({ status: "error", message: "Profil introuvable." });
      return;
    }

    // Ignore the answer if the user navigates away before it arrives.
    let cancelled = false;
    setScreen({ status: "loading" });

    fetchProfile(userId).then((result) => {
      if (cancelled) return;

      if (result.status === "not-found") {
        setScreen({ status: "error", message: "Ce profil n'existe pas." });
      } else if (result.status === "error") {
        setScreen({
          status: "error",
          message: "Impossible de charger le profil.",
        });
      } else if (result.posts.length === 0) {
        setScreen({ status: "empty", user: result.user });
      } else {
        setScreen({
          status: "success",
          user: result.user,
          posts: result.posts,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function showUsername(username: string) {
    setScreen((current) => {
      if (current.status === "empty" || current.status === "success") {
        return { ...current, user: { ...current.user, username } };
      }
      return current;
    });
  }

  function removePost(postId: string) {
    setScreen((current) => {
      if (current.status !== "success") {
        return current;
      }

      const posts = current.posts.filter((post) => post.id !== postId);

      if (posts.length === 0) {
        return {
          status: "empty",
          user: current.user,
        };
      }

      return {
        ...current,
        posts,
      };
    });
  }

  return { screen, showUsername, removePost };
}
