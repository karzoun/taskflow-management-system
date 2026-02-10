import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getProjectsApi } from "../api";

function ProjectsPage() {
  const { token, user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    const loadProjects = async () => {
      setError("");
      setLoading(true);
      try {
        const data = await getProjectsApi(token);
        setProjects(data);
      } catch (err) {
        setError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [isAuthenticated, navigate, token]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>My Projects</h1>
        <div>
          {user && <span style={{ marginRight: "1rem" }}>Hi, {user.name}</span>}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {loading && <p>Loading projects...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && projects.length === 0 && <p>No projects yet.</p>}

      <ul>
        {projects.map((project) => (
          <li key={project._id}>
            <strong>{project.title}</strong>
            {project.description && <span> — {project.description}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectsPage;
