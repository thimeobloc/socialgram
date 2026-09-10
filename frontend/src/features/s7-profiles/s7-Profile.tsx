import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../shared/auth/useAuth";
import Delete from "../s8-deletion/postDeletion";

const API_URL = import.meta.env.VITE_API_URL;

const UserSchema = z.object({ username: z.string() });
const PostsSchema = z.array(z.object({ id: z.string(), content: z.string() }));

type ScreenState =
  | { status: "loading" }
  | { status: "error" }
  | {
    status: "ready";
    username: string;
    posts: { id: string; content: string }[];
  };

export default function Profile() {

  //Post deletion confirmation
  const [confirmPostDeletion, setConfirmationDeletion] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { id: routeId } = useParams<{ id: string }>();
  const { user, token } = useAuth();
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
    return (
      <p className="mt-20 text-center text-red-600">Profil introuvable.</p>
    );
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
              className="relative rounded-xl border border-gray-200 bg-white p-4 pr-28 shadow-sm transition hover:shadow-md"
            >
              <button
                onClick={() => setConfirmationDeletion(post.id)}
                className="absolute right-4 top-4 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-95"
              >
                Supprimer
              </button>

              <p className="whitespace-pre-line text-gray-700">
                {post.content}
              </p>

              {confirmPostDeletion === post.id && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="mb-3 text-sm font-medium text-red-800">
                    Voulez-vous vraiment supprimer ce post ?
                  </p>

                  <div className="flex gap-2">

                    <button
                      onClick={async () => {

                        if (!token) {
                          return;
                        }

                        const result = await Delete(post.id, token);

                        if (!result.success) {
                          setDeleteError(result.error);
                          return;
                        }

                        setState((currentState) => {
                          if (currentState.status !== "ready") {
                            return currentState;
                          }

                          return {
                            ...currentState,
                            posts: currentState.posts.filter(
                              (currentPost) => currentPost.id !== post.id
                            ),

                          };
                        });

                        setConfirmationDeletion(null);
                      }}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
                    >
                      Oui, supprimer
                    </button>

                    <button
                      onClick={() => setConfirmationDeletion(null)}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 active:scale-95"
                    >
                      Annuler
                    </button>

                    {deleteError && (
                      <p className="mb-3 text-sm font-medium text-red-700">
                        {deleteError}
                      </p>
                    )}

                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
