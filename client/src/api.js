const API_BASE_URL = "http://localhost:4000";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || "Request failed";
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

// TASKS (nested)
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
