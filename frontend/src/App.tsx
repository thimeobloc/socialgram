import { Routes, Route } from "react-router-dom";
import RegistryPages from "./pages/registryPages";


export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<RegistryPages />} />
    </Routes>
  );
}
