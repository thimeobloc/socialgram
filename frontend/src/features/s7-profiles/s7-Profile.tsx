import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../shared/auth/useAuth";
import EditProfileModal from "./EditProfileModal";
import { useProfile } from "./useProfile";
import Delete from "../s8-deletion/postDeletion";


export default function Profile() {

  type ScreenState =
  | { status: "loading" }
  | { status: "error" }
  | {
    status: "ready";
    username: string;
    posts: { id: string; content: string }[];
  };

  //Post deletion confirmation
  const [confirmPostDeletion, setConfirmationDeletion] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { id: routeId } = useParams<{ id: string }>();
  const { user, token, updateUser } = useAuth();

  const profileId = routeId ?? user?.id;
  const isOwner = routeId === undefined || routeId === user?.id;

  const { screen, showUsername } = useProfile(profileId)
  const [state, setState] = useState<ScreenState>({ status: "loading" });

  const [isEditOpen, setIsEditOpen] = useState(false); 
  
  if (screen.status === "loading") {
    return <p className="mt-20 text-center text-gray-500">Chargement…</p>;
  }


  if (screen.status === "error") {
    return <p className="mt-20 text-center text-red-600">{screen.message}</p>;
  }
  if (state.status === "error") {
    return (
      <p className="mt-20 text-center text-red-600">Profil introuvable.</p>
    );
  }

  const canEdit = isOwner && token !== null && profileId !== undefined;

  return (

    <main className="mx-auto max-w-xl p-6">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {screen.user.username}
        </h1>

        {canEdit && (
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Modifier le profil
          </button>
        )}
      </header>

      {screen.status === "empty" ? (
        <p className="mt-6 text-gray-500">Aucun post.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {screen.posts.map((post) => (
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
          ))}
        </ul>
      )}

      {isEditOpen &&
        isOwner &&
        user !== null &&
        token !== null &&
        profileId !== undefined && (
          <EditProfileModal
            userId={profileId}
            token={token}
            currentUsername={screen.user.username}
            currentEmail={user.email}
            onClose={() => setIsEditOpen(false)}
            onSaved={(updated) => {
              showUsername(updated.username);
              updateUser(updated);
            }}
          />
        )}
    </main>
  );
}
