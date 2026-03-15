import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProjectApi,
  updateProjectApi,
  getTasksApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  getUsersApi,
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return {
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: d < now,
  };
}

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#10b981"];

function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ user, size = 26 }) {
  if (!user) return null;
  return (
    <div
      title={user.name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: avatarColor(user.name),
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
    >
      {initials(user.name)}
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "0.375rem",
  fontSize: "0.875rem",
  fontWeight: 500,
};

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

function Required() {
  return (
    <span style={{ color: "var(--danger)", marginLeft: "0.15rem" }} aria-hidden="true">
      *
    </span>
  );
}

// ── EditTaskForm ──────────────────────────────────────────────────────────────

function EditTaskForm({ task, users, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [priority, setPriority] = useState(task.priority || "medium");
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        description,
        dueDate: dueDate || null,
        priority,
        assigneeId: assigneeId || null,
      });
    } catch (err) {
      setError(err.message || "Failed to save");
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={labelStyle}>
          Title <Required />
        </label>
        <input
          value={title}
          onChange={(e) => {
            if (e.target.value.length <= TASK_TITLE_MAX) setTitle(e.target.value);
            if (error) setError("");
          }}
          maxLength={TASK_TITLE_MAX}
          style={!title.trim() ? { borderColor: "var(--danger)" } : undefined}
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional description…"
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={labelStyle}>Assignee</label>
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ fontSize: "0.875rem" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} style={{ fontSize: "0.875rem" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({ task, users, currentUserId, onStatusChange, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);

  const assignee = users.find(
    (u) => u._id === task.assigneeId || u._id === task.assigneeId?._id
  );
  const isAssignedToMe =
    task.assigneeId &&
    (task.assigneeId === currentUserId || task.assigneeId?._id === currentUserId);

  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  if (editing) {
    return (
      <div
        className="card"
        style={{ borderLeft: "3px solid var(--accent)", borderColor: "var(--accent)" }}
      >
        <EditTaskForm
          task={task}
          users={users}
          onSave={async (updates) => {
            await onUpdate(task._id, updates);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        borderLeft: isAssignedToMe ? "3px solid var(--accent)" : undefined,
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Task info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.375rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 500, wordBreak: "break-word" }}>{task.title}</span>
            {isAssignedToMe && (
              <span
                style={{
                  fontSize: "0.68rem",
                  background: "rgba(99,102,241,0.12)",
                  color: "var(--accent)",
                  padding: "0.1rem 0.4rem",
                  borderRadius: 4,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                You
              </span>
            )}
          </div>

          {task.description && (
            <p
              style={{
                margin: "0 0 0.4rem",
                fontSize: "0.825rem",
                color: "var(--text-muted)",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {task.description}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.4rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span className={`badge ${STATUS_BADGE_CLASS[task.status] || "badge-todo"}`}>
              {STATUS_LABELS[task.status] || task.status}
            </span>
            <span className={`badge ${PRIORITY_BADGE_CLASS[task.priority] || "badge-medium"}`}>
              {task.priority}
            </span>
            {dueInfo && (
              <span
                style={{
                  fontSize: "0.775rem",
                  color: dueInfo.overdue ? "var(--danger)" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="1" y="2" width="14" height="13" rx="2" />
                  <line x1="1" y1="6" x2="15" y2="6" />
                  <line x1="5" y1="1" x2="5" y2="4" />
                  <line x1="11" y1="1" x2="11" y2="4" />
                </svg>
                {dueInfo.overdue ? "Overdue · " : ""}{dueInfo.label}
              </span>
            )}
            {assignee && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.775rem",
                  color: "var(--text-muted)",
                }}
              >
                <Avatar user={assignee} size={18} />
                {assignee.name}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            flexWrap: "wrap",
            flexShrink: 0,
            alignItems: "flex-start",
          }}
        >
          <button
            onClick={() => setEditing(true)}
            style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
            title="Edit task"
          >
            Edit
          </button>
          {Object.entries(STATUS_LABELS).map(([statusKey, statusLabel]) => (
            <button
              key={statusKey}
              onClick={() => onStatusChange(task._id, statusKey)}
              disabled={task.status === statusKey}
              className={
                task.status === statusKey
                  ? `${STATUS_BTN_CLASS[statusKey]} active`
                  : STATUS_BTN_CLASS[statusKey]
              }
              title={`Set to ${statusLabel}`}
            >
              {statusLabel}
            </button>
          ))}
          <button
            onClick={() => onDelete(task._id, task.title)}
            className="btn-danger"
            title="Delete task"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProjectDetailsPage ────────────────────────────────────────────────────────

function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { token, user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Project rename
  const [renamingProject, setRenamingProject] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  // Add task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskTitleError, setTaskTitleError] = useState("");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  // Assignee filter
  const [filterAssigneeId, setFilterAssigneeId] = useState("");

  const loadData = async () => {
    setPageError("");
    setLoading(true);
    try {
      const [p, t, u] = await Promise.all([
        getProjectApi(token, projectId),
        getTasksApi(token, projectId),
        getUsersApi(token),
      ]);
      setProject(p);
      setTasks(t);
      setUsers(u);
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

  // ── Project rename ──────────────────────────────────────────────────────────

  const startProjectRename = () => {
    setRenameTitle(project.title);
    setRenameError("");
    setRenamingProject(true);
  };

  const cancelProjectRename = () => {
    setRenamingProject(false);
    setRenameError("");
  };

  const handleProjectRename = async () => {
    if (!renameTitle.trim()) {
      setRenameError("Title cannot be empty");
      return;
    }
    setRenameSaving(true);
    setRenameError("");
    try {
      const updated = await updateProjectApi(token, projectId, { title: renameTitle.trim() });
      setProject(updated);
      setRenamingProject(false);
    } catch (err) {
      setRenameError(err.message || "Failed to rename");
    } finally {
      setRenameSaving(false);
    }
  };

  // ── Task CRUD ───────────────────────────────────────────────────────────────

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
        description: taskDescription.trim(),
        dueDate: taskDueDate || undefined,
        priority: taskPriority,
        assigneeId: taskAssigneeId || undefined,
        status: "todo",
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      setTaskPriority("medium");
      setTaskAssigneeId("");
      const updated = await getTasksApi(token, projectId);
      setTasks(updated);
    } catch (err) {
      setFormError(err.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setPageError("");
    try {
      const updated = await updateTaskApi(token, projectId, taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
    } catch (err) {
      setPageError(err.message || "Failed to update task");
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    const updated = await updateTaskApi(token, projectId, taskId, updates);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
  };

  const handleDeleteTask = async (taskId, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    setPageError("");
    try {
      await deleteTaskApi(token, projectId, taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      setPageError(err.message || "Failed to delete task");
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filteredTasks = filterAssigneeId
    ? tasks.filter((t) => t.assigneeId === filterAssigneeId)
    : tasks;

  const assigneeOptions = users.filter((u) =>
    tasks.some((t) => t.assigneeId === u._id)
  );

  // ── Render ──────────────────────────────────────────────────────────────────

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
        style={{
          fontSize: "0.875rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        ← Back to Projects
      </Link>

      {/* Project header */}
      {project && (
        <div style={{ marginTop: "1.25rem", marginBottom: "1.5rem" }}>
          {renamingProject ? (
            <div>
              <input
                value={renameTitle}
                onChange={(e) => {
                  if (e.target.value.length <= 100) setRenameTitle(e.target.value);
                  if (renameError) setRenameError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleProjectRename();
                  if (e.key === "Escape") cancelProjectRename();
                }}
                autoFocus
                maxLength={100}
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.5rem",
                  ...(renameError ? { borderColor: "var(--danger)" } : {}),
                }}
              />
              {renameError && (
                <p style={{ color: "var(--danger)", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                  {renameError}
                </p>
              )}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
                <button
                  onClick={handleProjectRename}
                  disabled={renameSaving}
                  className="btn-primary"
                  style={{ fontSize: "0.875rem" }}
                >
                  {renameSaving ? "Saving…" : "Save"}
                </button>
                <button onClick={cancelProjectRename} style={{ fontSize: "0.875rem" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0 }}>{project.title}</h1>
              <button
                onClick={startProjectRename}
                style={{ fontSize: "0.8rem", padding: "0.3rem 0.65rem" }}
                title="Rename project"
              >
                Rename
              </button>
            </div>
          )}
          {project.description && (
            <p
              style={{
                margin: "0.375rem 0 0",
                color: "var(--text-muted)",
                fontSize: "0.925rem",
              }}
            >
              {project.description}
            </p>
          )}
        </div>
      )}

      {pageError && <AlertError style={{ marginBottom: "1rem" }}>{pageError}</AlertError>}

      {/* Add task form */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Add Task</h2>
        <form onSubmit={handleCreateTask} noValidate>
          {/* Title */}
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
            <div
              style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}
            >
              {taskTitleError ? (
                <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>
                  {taskTitleError}
                </span>
              ) : (
                <span />
              )}
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {taskTitle.length}/{TASK_TITLE_MAX}
              </span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Optional description…"
              rows={2}
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Due date + Priority */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginBottom: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={labelStyle}>Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Assignee</label>
            <select
              value={taskAssigneeId}
              onChange={(e) => setTaskAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} {u._id === user?.id ? "(you)" : ""}
                </option>
              ))}
            </select>
          </div>

          {formError && (
            <AlertError style={{ marginBottom: "0.75rem" }}>{formError}</AlertError>
          )}

          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? "Adding…" : "Add Task"}
          </button>
        </form>
      </div>

      {/* Tasks section */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.875rem",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0 }}>
            Tasks
            {tasks.length > 0 && (
              <span
                style={{
                  color: "var(--text-muted)",
                  fontWeight: 400,
                  fontSize: "0.9rem",
                  marginLeft: "0.4rem",
                }}
              >
                {filterAssigneeId ? `${filteredTasks.length} of ${tasks.length}` : tasks.length}
              </span>
            )}
          </h2>

          {/* Assignee filter */}
          {assigneeOptions.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label
                style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}
              >
                Filter:
              </label>
              <select
                value={filterAssigneeId}
                onChange={(e) => setFilterAssigneeId(e.target.value)}
                style={{ width: "auto", minWidth: 140, fontSize: "0.875rem" }}
              >
                <option value="">All assignees</option>
                {assigneeOptions.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                    {u._id === user?.id ? " (you)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredTasks.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {filterAssigneeId ? "No tasks match this filter." : "No tasks yet. Add your first task above."}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {filteredTasks.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              users={users}
              currentUserId={user?.id}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
              onUpdate={handleUpdateTask}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProjectDetailsPage;
