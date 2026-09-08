import { Routes, Route } from "react-router-dom";
import LoginPages from "./features/s2-login/loginPages";
import RegistryPage from "./features/s1-registry/registryPage";


export default function App() {
  return (
    <Routes>
       <Route path="/login" element={<LoginPages />} />
      <Route path="/register" element={<RegistryPage />} />
    </Routes>
  );
}
