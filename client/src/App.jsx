import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/projects" replace /> : <LoginPage />
        }
      />
      <Route
        path="/projects"
        element={
          isAuthenticated ? <ProjectsPage /> : <Navigate to="/" replace />
        }
      />
      {/* later: add /projects/:id, etc. */}
    </Routes>
  );
}

export default App;
