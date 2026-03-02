import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  getProjectsApi,
  createProjectApi,
  deleteProjectApi,
  getAnalyticsSummaryApi,
} from "../api";

const TITLE_MAX = 100;

function ProjectsPage() {
  const { token, user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [pageError, setPageError] = useState("");

  // Create project form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState("");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const loadProjects = async () => {
    setPageError("");
    setLoadingProjects(true);
    try {
      const data = await getProjectsApi(token);
      setProjects(data);
    } catch (err) {
      setPageError(err.message || "Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await getAnalyticsSummaryApi(token);
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics error:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    loadProjects();
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (!window.confirm(`Delete "${projectTitle}"? This will also delete all its tasks and cannot be undone.`)) {
      return;
    }
    setPageError("");
    try {
      await deleteProjectApi(token, projectId);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      loadAnalytics();
    } catch (err) {
      setPageError(err.message || "Failed to delete project");
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError("");
    setTitleError("");

    if (!title.trim()) {
      setTitleError("Title is required");
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
      loadAnalytics();
    } catch (err) {
      setFormError(err.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const todo = analytics?.tasksByStatus?.todo ?? 0;
  const inProgress = analytics?.tasksByStatus?.inProgress ?? 0;
  const done = analytics?.tasksByStatus?.done ?? 0;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <h1>My Projects</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user && (
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              {user.name}
            </span>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Analytics summary */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        {loadingAnalytics ? (
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Loading summary…
          </p>
        ) : analytics ? (
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center" }}>
            <StatItem label="Projects" value={analytics.totalProjects} />
            <StatItem label="Tasks" value={analytics.totalTasks} />
            <StatItem label="To Do" value={todo} color="#94a3b8" />
            <StatItem label="In Progress" value={inProgress} color="#f59e0b" />
            <StatItem label="Done" value={done} color="#22c55e" />
          </div>
        ) : (
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No analytics available yet.
          </p>
        )}
      </div>

      {/* Create project */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>New Project</h2>
        <form onSubmit={handleCreateProject} noValidate>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>
              Title <Required />
            </label>
            <input
              value={title}
              onChange={(e) => {
                if (e.target.value.length <= TITLE_MAX) setTitle(e.target.value);
                if (titleError) setTitleError("");
              }}
              placeholder="e.g., Capstone Sprint Board"
              maxLength={TITLE_MAX}
              style={titleError ? { borderColor: "var(--danger)" } : undefined}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
              {titleError ? (
                <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{titleError}</span>
              ) : (
                <span />
              )}
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              maxLength={300}
            />
          </div>

          {formError && <AlertError style={{ marginBottom: "0.75rem" }}>{formError}</AlertError>}

          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? "Creating…" : "Create Project"}
          </button>
        </form>
      </div>

      {/* Page-level errors (load / delete) */}
      {pageError && <AlertError style={{ marginBottom: "1rem" }}>{pageError}</AlertError>}

      {/* Projects list */}
      <section>
        <h2 style={{ marginBottom: "0.875rem" }}>Projects</h2>

        {loadingProjects && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading projects…</p>
        )}

        {!loadingProjects && projects.length === 0 && !pageError && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No projects yet. Create your first project above.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {projects.map((p) => (
            <div
              key={p._id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <Link
                to={`/projects/${p._id}`}
                style={{ flex: 1, textDecoration: "none", color: "inherit", minWidth: 0 }}
              >
                <div style={{ fontWeight: 600, marginBottom: p.description ? "0.2rem" : 0 }}>
                  {p.title}
                </div>
                {p.description && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {p.description}
                  </div>
                )}
              </Link>
              <button
                className="btn-danger"
                onClick={() => handleDeleteProject(p._id, p.title)}
                title="Delete project"
                style={{ flexShrink: 0 }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div style={{ textAlign: "center", minWidth: 60 }}>
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: color || "var(--text)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
        {label}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "0.375rem",
  fontSize: "0.875rem",
  fontWeight: 500,
};

function Required() {
  return (
    <span style={{ color: "var(--danger)", marginLeft: "0.15rem" }} aria-hidden="true">
      *
    </span>
  );
}

function AlertError({ children, style }) {
  return (
    <p
      style={{
        color: "var(--danger)",
        fontSize: "0.875rem",
        margin: 0,
        padding: "0.5rem 0.75rem",
        background: "rgba(239,68,68,0.1)",
        borderRadius: "6px",
        border: "1px solid rgba(239,68,68,0.25)",
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export default ProjectsPage;
