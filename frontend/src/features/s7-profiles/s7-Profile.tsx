import { useParams } from "react-router-dom";

import { useAuth } from "../../shared/auth/useAuth";
import { useProfile } from "./useProfile";

export default function Profile() {
  const { id: routeId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const profileId = routeId ?? user?.id;
  const { screen } = useProfile(profileId);

  if (screen.status === "loading") {
    return <p className="mt-20 text-center text-gray-500">Chargement…</p>;
  }

  if (screen.status === "error") {
    return <p className="mt-20 text-center text-red-600">{screen.message}</p>;
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {screen.user.username}
        </h1>
      </header>

      {screen.status === "empty" ? (
        <p className="mt-6 text-gray-500">Aucun post.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {screen.posts.map((post) => (
            <li
              key={post.id}
              className="whitespace-pre-line rounded-lg border border-gray-200 p-3 text-gray-700"
            >
              {post.content}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
