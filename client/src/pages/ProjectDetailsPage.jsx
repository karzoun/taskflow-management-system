import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProjectApi,
  getTasksApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
} from "../api";

const TASK_TITLE_MAX = 200;

const STATUS_LABELS = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const STATUS_BADGE_CLASS = {
  todo: "badge-todo",
  "in-progress": "badge-inprogress",
  done: "badge-done",
};

const STATUS_BTN_CLASS = {
  todo: "btn-status-todo",
  "in-progress": "btn-status-inprogress",
  done: "btn-status-done",
};

const PRIORITY_BADGE_CLASS = {
  low: "badge-low",
  medium: "badge-medium",
  high: "badge-high",
};

function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { token } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Create task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskTitleError, setTaskTitleError] = useState("");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setPageError("");
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        getProjectApi(token, projectId),
        getTasksApi(token, projectId),
      ]);
      setProject(p);
      setTasks(t);
    } catch (err) {
      setPageError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, token]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormError("");
    setTaskTitleError("");

    if (!taskTitle.trim()) {
      setTaskTitleError("Title is required");
      return;
    }

    setCreating(true);
    try {
      await createTaskApi(token, projectId, {
        title: taskTitle.trim(),
        priority: taskPriority,
        status: "todo",
      });
      setTaskTitle("");
      setTaskPriority("medium");
      const updated = await getTasksApi(token, projectId);
      setTasks(updated);
    } catch (err) {
      setFormError(err.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const setStatus = async (taskId, newStatus) => {
    setPageError("");
    try {
      await updateTaskApi(token, projectId, taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      setPageError(err.message || "Failed to update task");
    }
  };

  const removeTask = async (taskId, taskTitle) => {
    if (!window.confirm(`Delete task "${taskTitle}"?`)) return;
    setPageError("");
    try {
      await deleteTaskApi(token, projectId, taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      setPageError(err.message || "Failed to delete task");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Back link */}
      <Link
        to="/projects"
        style={{ fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
      >
        ← Back to Projects
      </Link>

      {/* Project header */}
      {project && (
        <div style={{ marginTop: "1.25rem", marginBottom: "1.5rem" }}>
          <h1>{project.title}</h1>
          {project.description && (
            <p style={{ margin: "0.375rem 0 0", color: "var(--text-muted)", fontSize: "0.925rem" }}>
              {project.description}
            </p>
          )}
        </div>
      )}

      {pageError && (
        <AlertError style={{ marginBottom: "1rem" }}>{pageError}</AlertError>
      )}

      {/* Add task form */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Add Task</h2>
        <form onSubmit={handleCreateTask} noValidate>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>
              Title <Required />
            </label>
            <input
              value={taskTitle}
              onChange={(e) => {
                if (e.target.value.length <= TASK_TITLE_MAX) setTaskTitle(e.target.value);
                if (taskTitleError) setTaskTitleError("");
              }}
              placeholder="e.g., Build task list UI"
              maxLength={TASK_TITLE_MAX}
              style={taskTitleError ? { borderColor: "var(--danger)" } : undefined}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
              {taskTitleError ? (
                <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{taskTitleError}</span>
              ) : (
                <span />
              )}
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {taskTitle.length}/{TASK_TITLE_MAX}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Priority</label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              style={{ width: "auto", minWidth: 140 }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {formError && <AlertError style={{ marginBottom: "0.75rem" }}>{formError}</AlertError>}

          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? "Adding…" : "Add Task"}
          </button>
        </form>
      </div>

      {/* Tasks */}
      <section>
        <h2 style={{ marginBottom: "0.875rem" }}>
          Tasks{" "}
          {tasks.length > 0 && (
            <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.9rem" }}>
              ({tasks.length})
            </span>
          )}
        </h2>

        {tasks.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No tasks yet. Add your first task above.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {tasks.map((t) => (
            <div
              key={t._id}
              className="card"
              style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}
            >
              {/* Task info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, marginBottom: "0.375rem", wordBreak: "break-word" }}>
                  {t.title}
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span className={`badge ${STATUS_BADGE_CLASS[t.status] || "badge-todo"}`}>
                    {STATUS_LABELS[t.status] || t.status}
                  </span>
                  <span className={`badge ${PRIORITY_BADGE_CLASS[t.priority] || "badge-medium"}`}>
                    {t.priority}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", flexShrink: 0 }}>
                {Object.entries(STATUS_LABELS).map(([statusKey, statusLabel]) => (
                  <button
                    key={statusKey}
                    onClick={() => setStatus(t._id, statusKey)}
                    disabled={t.status === statusKey}
                    className={
                      t.status === statusKey
                        ? `${STATUS_BTN_CLASS[statusKey]} active`
                        : STATUS_BTN_CLASS[statusKey]
                    }
                    title={`Set to ${statusLabel}`}
                  >
                    {statusLabel}
                  </button>
                ))}
                <button
                  onClick={() => removeTask(t._id, t.title)}
                  className="btn-danger"
                  title="Delete task"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
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

export default ProjectDetailsPage;
