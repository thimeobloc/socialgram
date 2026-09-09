import { useAuth } from "../../shared/auth/useAuth";

// Placeholder page. The real feed is story S3. It exists here only so that
// a successful login has somewhere protected to redirect to.
export default function FeedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto mt-20 max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800">Feed</h1>
      <p className="mt-2 text-gray-600">Connecté en tant que {user?.username}</p>
      <button
        type="button"
        onClick={logout}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
      >
        Se déconnecter
      </button>
    </div>
  );
}
