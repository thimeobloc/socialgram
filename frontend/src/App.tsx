import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./shared/auth/AuthContext";
import ProtectedRoute from "./shared/auth/ProtectedRoute";
import LoginPages from "./features/s2-login/loginPages";
import RegistryPage from "./features/s1-registry/registryPage";
import FeedPage from "./features/s3-feed/feedPage";
import ProfilePage from "./features/s7-profiles/profilePage";
import { PostDetail } from "./features/s5-commentary/postDetail";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/login" element={<LoginPages />} />
        <Route path="/register" element={<RegistryPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:id" element={<ProfilePage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
  
}
