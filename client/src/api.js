const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Support both { error } (new standard) and { message } (legacy)
    const message = data?.error || data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

// AUTH
export function loginApi(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function registerApi(name, email, password) {
  return request("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

// PROJECTS
export function getProjectsApi(token) {
  return request("/projects", { method: "GET", token });
}

export function createProjectApi(token, project) {
  return request("/projects", { method: "POST", token, body: project });
}

export function getProjectApi(token, projectId) {
  return request(`/projects/${projectId}`, { method: "GET", token });
}

export function updateProjectApi(token, projectId, updates) {
  return request(`/projects/${projectId}`, { method: "PUT", token, body: updates });
}

export function deleteProjectApi(token, projectId) {
  return request(`/projects/${projectId}`, { method: "DELETE", token });
}

export function getUsersApi(token) {
  return request("/users", { method: "GET", token });
}

export function getMyTasksApi(token) {
  return request("/analytics/my-tasks", { method: "GET", token });
}

// TASKS
export function getTasksApi(token, projectId) {
  return request(`/projects/${projectId}/tasks`, { method: "GET", token });
}

export function createTaskApi(token, projectId, task) {
  return request(`/projects/${projectId}/tasks`, {
    method: "POST",
    token,
    body: task,
  });
}

export function updateTaskApi(token, projectId, taskId, updates) {
  return request(`/projects/${projectId}/tasks/${taskId}`, {
    method: "PUT",
    token,
    body: updates,
  });
}

export function deleteTaskApi(token, projectId, taskId) {
  return request(`/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
    token,
  });
}

// ANALYTICS
export function getAnalyticsSummaryApi(token) {
  return request("/analytics/summary", { method: "GET", token });
}