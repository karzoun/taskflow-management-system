const API_BASE_URL = "http://localhost:4000";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

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
    const message = data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

export function loginApi(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getProjectsApi(token) {
  return request("/projects", {
    method: "GET",
    token,
  });
}

// later you can add: createProjectApi, getTasksApi, etc.
