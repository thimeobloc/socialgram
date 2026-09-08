import { useContext } from "react";

import { AuthContext } from "./AuthContext";

// Small wrapper around useContext so components never have to handle the
// "used outside the provider" case themselves.
export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  }
  return value;
}
