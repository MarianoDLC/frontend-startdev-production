// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import Login from "./features/auth/Login";
import PrivateRoute from "./routes/PrivateRoute";
import DashboardAdmin from "./features/administrator/DashboarAdmin";
import DashboardPracticant from "./features/practicant/DashboardPract";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Redirigir root a login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas privadas con roles */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute allowedRoles={["administrator"]}>
                <DashboardAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/practicant/dashboard"
            element={
              <PrivateRoute allowedRoles={["practicant"]}>
                <DashboardPracticant />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
