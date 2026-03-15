import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  getProjectsApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
  getAnalyticsSummaryApi,
  getMyTasksApi,
} from "../api";

const TITLE_MAX = 100;

const STATUS_BADGE_CLASS = {
  todo: "badge-todo",
  "in-progress": "badge-inprogress",
  done: "badge-done",
};

const STATUS_LABELS = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const PRIORITY_BADGE_CLASS = {
  low: "badge-low",
  medium: "badge-medium",
  high: "badge-high",
};

function ProjectsPage() {
  const { token, user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [myTasks, setMyTasks] = useState([]);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingMyTasks, setLoadingMyTasks] = useState(true);
  const [pageError, setPageError] = useState("");

  // Create project form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState("");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  // Inline rename state
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renaming, setRenaming] = useState(false);

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

  const loadMyTasks = async () => {
    setLoadingMyTasks(true);
    try {
      const data = await getMyTasksApi(token);
      setMyTasks(data);
    } catch (err) {
      console.error("My tasks error:", err);
    } finally {
      setLoadingMyTasks(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    loadProjects();
    loadAnalytics();
    loadMyTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const handleLogout = () => {
    logout();
    navigate("/");
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

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (
      !window.confirm(
        `Delete "${projectTitle}"? This will also delete all its tasks and cannot be undone.`
      )
    ) {
      return;
    }
    setPageError("");
    try {
      await deleteProjectApi(token, projectId);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      setMyTasks((prev) =>
        prev.filter((t) => t.projectId?._id !== projectId && t.projectId !== projectId)
      );
      loadAnalytics();
    } catch (err) {
      setPageError(err.message || "Failed to delete project");
    }
  };

  const startRename = (project) => {
    setEditingProjectId(project._id);
    setEditTitle(project.title);
    setRenameError("");
  };

  const cancelRename = () => {
    setEditingProjectId(null);
    setEditTitle("");
    setRenameError("");
  };

  const handleRename = async (projectId) => {
    if (!editTitle.trim()) {
      setRenameError("Title cannot be empty");
      return;
    }
    setRenaming(true);
    setRenameError("");
    try {
      const updated = await updateProjectApi(token, projectId, { title: editTitle.trim() });
      setProjects((prev) => prev.map((p) => (p._id === projectId ? updated : p)));
      setEditingProjectId(null);
    } catch (err) {
      setRenameError(err.message || "Failed to rename project");
    } finally {
      setRenaming(false);
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
        <h1>Projects</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user && (
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              {user.name}
            </span>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Workspace analytics */}
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
            No analytics available.
          </p>
        )}
      </div>

      {/* My Assigned Tasks */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginBottom: "0.875rem" }}>
          My Tasks
          {!loadingMyTasks && myTasks.length > 0 && (
            <span
              style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.875rem", marginLeft: "0.5rem" }}
            >
              ({myTasks.length})
            </span>
          )}
        </h2>

        {loadingMyTasks && (
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Loading…
          </p>
        )}

        {!loadingMyTasks && myTasks.length === 0 && (
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No tasks assigned to you yet.
          </p>
        )}

        {!loadingMyTasks && myTasks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {myTasks.map((t) => {
              const project = t.projectId;
              const dueInfo = t.dueDate ? formatDueDate(t.dueDate) : null;
              return (
                <div
                  key={t._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: 8,
                    background: "var(--surface-2)",
                    borderLeft: "3px solid var(--accent)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: "0.9rem",
                        marginBottom: "0.2rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.title}
                    </div>
                    {project && (
                      <Link
                        to={`/projects/${project._id}`}
                        style={{
                          fontSize: "0.775rem",
                          color: "var(--accent)",
                          textDecoration: "none",
                        }}
                      >
                        {project.title}
                      </Link>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.35rem",
                      alignItems: "center",
                      flexShrink: 0,
                      flexWrap: "wrap",
                    }}
                  >
                    <span className={`badge ${STATUS_BADGE_CLASS[t.status] || "badge-todo"}`}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                    <span
                      className={`badge ${PRIORITY_BADGE_CLASS[t.priority] || "badge-medium"}`}
                    >
                      {t.priority}
                    </span>
                    {dueInfo && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: dueInfo.overdue ? "var(--danger)" : "var(--text-muted)",
                        }}
                      >
                        {dueInfo.overdue ? "Overdue · " : "Due · "}
                        {dueInfo.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

      {pageError && <AlertError style={{ marginBottom: "1rem" }}>{pageError}</AlertError>}

      {/* Projects list */}
      <section>
        <h2 style={{ marginBottom: "0.875rem" }}>All Projects</h2>

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
              onMouseEnter={(e) =>
                editingProjectId !== p._id &&
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onMouseLeave={(e) =>
                editingProjectId !== p._id &&
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              {editingProjectId === p._id ? (
                /* Inline rename form */
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={editTitle}
                    onChange={(e) => {
                      if (e.target.value.length <= TITLE_MAX) setEditTitle(e.target.value);
                      if (renameError) setRenameError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(p._id);
                      if (e.key === "Escape") cancelRename();
                    }}
                    autoFocus
                    maxLength={TITLE_MAX}
                    style={renameError ? { borderColor: "var(--danger)" } : undefined}
                  />
                  {renameError && (
                    <span style={{ color: "var(--danger)", fontSize: "0.775rem" }}>
                      {renameError}
                    </span>
                  )}
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                    <button
                      className="btn-primary"
                      onClick={() => handleRename(p._id)}
                      disabled={renaming}
                      style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                    >
                      {renaming ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={cancelRename}
                      style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal project row */
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
              )}

              {editingProjectId !== p._id && (
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  <button
                    onClick={() => startRename(p)}
                    title="Rename project"
                    style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
                  >
                    Rename
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteProject(p._id, p.title)}
                    title="Delete project"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatDueDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: d < now,
  };
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
