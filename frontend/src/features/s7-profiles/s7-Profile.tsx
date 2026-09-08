// S7 — Profils : affichage uniquement, données en dur, aucun appel API.
// Bascule le contexte "mon profil / profil d'un autre" avec isOwner.

const isOwner = true;

const profile = {
  username: "alice",
  fullName: "Alice Martin",
  bio: "Photographe amateur — Paris\nCouchers de soleil, cafés et balades en montagne.",
  memberSince: "septembre 2026",
  avatarTint: "from-fuchsia-500 to-purple-600",
  stats: { posts: 12, followers: 348, following: 187 },
};

const posts = [
  { id: "p1", caption: "Coucher de soleil incroyable", likes: 42, comments: 5, tint: "from-orange-400 to-rose-500" },
  { id: "p2", caption: "Petit café du matin", likes: 18, comments: 2, tint: "from-amber-300 to-orange-500" },
  { id: "p3", caption: "Balade en montagne ce week-end", likes: 73, comments: 11, tint: "from-emerald-400 to-teal-600" },
  { id: "p4", caption: "Nouvelle recette maison", likes: 9, comments: 1, tint: "from-lime-300 to-green-500" },
  { id: "p5", caption: "Sortie entre amis", likes: 51, comments: 8, tint: "from-sky-400 to-indigo-500" },
  { id: "p6", caption: "Concert de folie hier", likes: 120, comments: 24, tint: "from-violet-500 to-fuchsia-600" },
  { id: "p7", caption: "Journée dans le jardin", likes: 33, comments: 4, tint: "from-green-400 to-emerald-600" },
  { id: "p8", caption: "Premier jour dans le nouvel appart", likes: 64, comments: 9, tint: "from-rose-400 to-pink-600" },
  { id: "p9", caption: "Session code toute la nuit", likes: 27, comments: 3, tint: "from-slate-500 to-gray-700" },
];

export default function Profile() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* En-tête du profil */}
        <header className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-10">
          <div
            className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${profile.avatarTint} text-3xl font-bold text-white sm:h-32 sm:w-32`}
          >
            {profile.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-1 flex-col items-center gap-4 sm:items-start">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
              <h1 className="text-xl font-semibold">{profile.username}</h1>

              {isOwner ? (
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-50"
                >
                  Modifier le profil
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Suivre
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-50"
                  >
                    Message
                  </button>
                </div>
              )}
            </div>

            <ul className="flex gap-8 text-sm">
              <li>
                <span className="font-semibold">{profile.stats.posts}</span> posts
              </li>
              <li>
                <span className="font-semibold">{profile.stats.followers}</span> abonnés
              </li>
              <li>
                <span className="font-semibold">{profile.stats.following}</span> abonnements
              </li>
            </ul>

            <div className="text-center sm:text-left">
              <p className="font-medium">{profile.fullName}</p>
              <p className="whitespace-pre-line text-sm text-gray-600">{profile.bio}</p>
              <p className="mt-2 text-xs text-gray-400">Membre depuis {profile.memberSince}</p>
            </div>
          </div>
        </header>

        <hr className="my-8 border-gray-200" />

        {/* Grille des posts */}
        <section aria-label="Publications">
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className={`group relative aspect-square overflow-hidden rounded-md bg-gradient-to-br ${post.tint}`}
              >
                <p className="absolute inset-0 flex items-end p-2 text-xs font-medium text-white/90">
                  {post.caption}
                </p>
                <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/40 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <span>♥ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
