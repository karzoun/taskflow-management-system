import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { getProjectsApi, createProjectApi } from "../api";

function ProjectsPage() {
  const { token, user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create project form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Project title is required");
      return;
    }

    setCreating(true);
    try {
      await createProjectApi(token, {
        title: title.trim(),
        description: description.trim(),
        status: "planned",
      });

      setTitle("");
      setDescription("");
      await loadProjects();
    } catch (err) {
      setError(err.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>My Projects</h1>
        <div>
          {user && <span style={{ marginRight: "1rem" }}>Hi, {user.name}</span>}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create Project</h2>
        <form onSubmit={handleCreateProject}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", marginBottom: 6 }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "0.5rem" }}
              placeholder="e.g., Capstone Sprint Board"
            />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", marginBottom: 6 }}>
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "0.5rem" }}
              placeholder="Short description (optional)"
            />
          </div>

          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        {loading && <p>Loading projects...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && projects.length === 0 && <p>No projects yet.</p>}

        <ul style={{ paddingLeft: "1.25rem" }}>
          {projects.map((p) => (
            <li key={p._id} style={{ marginBottom: "0.5rem" }}>
              <Link to={`/projects/${p._id}`}>
                <strong>{p.title}</strong>
              </Link>
              {p.description && <span> — {p.description}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ProjectsPage;
