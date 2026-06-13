import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Miembros from "./pages/Miembros";
import NuevoMiembro from "./pages/NuevoMiembro";
import PerfilMiembro from "./pages/PerfilMiembro";
import Finanzas from "./pages/Finanzas";
import Inventario from "./pages/Inventario";
import Asistencia from "./pages/Asistencia";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/miembros" element={<ProtectedRoute><Miembros /></ProtectedRoute>} />
          <Route path="/nuevo-miembro" element={<ProtectedRoute><NuevoMiembro /></ProtectedRoute>} />
          <Route path="/miembro/:id" element={<ProtectedRoute><PerfilMiembro /></ProtectedRoute>} />
          <Route path="/finanzas" element={<ProtectedRoute><Finanzas /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
          <Route path="/asistencia" element={<ProtectedRoute><Asistencia /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;