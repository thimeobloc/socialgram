import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "./useAuth";

// Wraps the routes that require a session. Renders the child route only
// when the user is authenticated; otherwise sends them to /login.
export default function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return <p className="mt-20 text-center text-gray-500">Chargement…</p>;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
