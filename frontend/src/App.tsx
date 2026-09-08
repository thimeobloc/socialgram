import { Routes, Route } from "react-router-dom";
import RegistryPages from "./pages/registryPages";
import LoginPages from "./pages/loginPages";


export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<RegistryPages />} />
       <Route path="/login" element={<LoginPages />} />
    </Routes>
  );
}
