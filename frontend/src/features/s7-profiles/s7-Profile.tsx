import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "../../shared/auth/useAuth";

const API_URL = import.meta.env.VITE_API_URL;

const UserSchema = z.object({ username: z.string() });
const PostsSchema = z.array(z.object({ id: z.string(), content: z.string() }));

type ScreenState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; username: string; posts: { id: string; content: string }[] };

export default function Profile() {
  const { id: routeId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const id = routeId ?? user?.id;

  const [state, setState] = useState<ScreenState>({ status: "loading" });

  useEffect(() => {
    if (!id) {
      setState({ status: "error" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    Promise.all([
      fetch(`${API_URL}/users/${id}`).then((r) => r.json()),
      fetch(`${API_URL}/users/${id}/posts`).then((r) => r.json()),
    ])
      .then(([rawUser, rawPosts]: [unknown, unknown]) => {
        if (cancelled) return;
        const parsedUser = UserSchema.safeParse(rawUser);
        const parsedPosts = PostsSchema.safeParse(rawPosts);
        if (!parsedUser.success || !parsedPosts.success) {
          setState({ status: "error" });
          return;
        }
        setState({
          status: "ready",
          username: parsedUser.data.username,
          posts: parsedPosts.data,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === "loading") {
    return <p className="mt-20 text-center text-gray-500">Chargement…</p>;
  }

  if (state.status === "error") {
    return <p className="mt-20 text-center text-red-600">Profil introuvable.</p>;
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold text-gray-900">{state.username}</h1>

      <ul className="mt-6 flex flex-col gap-2">
        {state.posts.length === 0 ? (
          <li className="text-gray-500">Aucun post.</li>
        ) : (
          state.posts.map((post) => (
            <li
              key={post.id}
              className="whitespace-pre-line rounded-lg border border-gray-200 p-3 text-gray-700"
            >
              {post.content}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
