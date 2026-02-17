import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";

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

      <Route
        path="/projects/:projectId"
        element={
          isAuthenticated ? (
            <ProjectDetailsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
