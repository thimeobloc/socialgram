import { Routes, Route } from "react-router-dom";
import RegistryPage from "./features/s1-registry/registryPage";


export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<RegistryPage />} />
    </Routes>
  );
}
