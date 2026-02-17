import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProjectApi,
  getTasksApi,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
} from "../api";

function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { token } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const p = await getProjectApi(token, projectId);
      const t = await getTasksApi(token, projectId);
      setProject(p);
      setTasks(t);
    } catch (err) {
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, token]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError("");

    if (!taskTitle.trim()) {
      setError("Task title is required");
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
      setError(err.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const setStatus = async (taskId, newStatus) => {
    setError("");
    try {
      await updateTaskApi(token, projectId, taskId, { status: newStatus });
      const updated = await getTasksApi(token, projectId);
      setTasks(updated);
    } catch (err) {
      setError(err.message || "Failed to update task");
    }
  };

  const removeTask = async (taskId) => {
    setError("");
    try {
      await deleteTaskApi(token, projectId, taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      setError(err.message || "Failed to delete task");
    }
  };

  if (loading) return <p style={{ padding: "1rem" }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <Link to="/projects">← Back to Projects</Link>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {project && (
        <>
          <h1 style={{ marginBottom: 0 }}>{project.title}</h1>
          {project.description && (
            <p style={{ marginTop: "0.5rem" }}>{project.description}</p>
          )}
        </>
      )}

      <section
        style={{
          marginTop: "1.25rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Add Task</h2>
        <form onSubmit={handleCreateTask}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", marginBottom: 6 }}>Title</label>
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              style={{ width: "100%", padding: "0.5rem" }}
              placeholder="e.g., Build task list UI"
            />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", marginBottom: 6 }}>
              Priority
            </label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              style={{ padding: "0.5rem" }}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>

          <button type="submit" disabled={creating}>
            {creating ? "Adding..." : "Add Task"}
          </button>
        </form>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Tasks</h2>

        {tasks.length === 0 && <p>No tasks yet.</p>}

        <ul style={{ paddingLeft: "1.25rem" }}>
          {tasks.map((t) => (
            <li
              key={t._id}
              style={{
                marginBottom: "0.75rem",
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>{t.title}</strong>{" "}
                <span style={{ opacity: 0.7 }}>
                  ({t.status}, {t.priority})
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setStatus(t._id, "todo")}>To Do</button>
                <button onClick={() => setStatus(t._id, "in-progress")}>
                  In Progress
                </button>
                <button onClick={() => setStatus(t._id, "done")}>Done</button>
                <button onClick={() => removeTask(t._id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ProjectDetailsPage;
