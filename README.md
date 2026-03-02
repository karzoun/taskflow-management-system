# TaskFlow

**A full-stack project and task management app built with React and Express.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white&style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs&logoColor=white&style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?logo=mongodb&logoColor=white&style=flat-square)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white&style=flat-square)

---

## Overview

TaskFlow is a personal project management tool where users can organize work into projects and track individual tasks within each project. It provides a real-time analytics summary, per-task priority and status tracking, and a clean dark-themed interface. The app is designed for individual users managing their own project workloads.

---

## Features

- **User authentication** — register and log in with email/password; sessions persisted via JWT in localStorage
- **Project management** — create and delete projects with a title and optional description
- **Task management** — add tasks to any project with a title and priority level (low / medium / high)
- **Task status tracking** — move tasks between `To Do`, `In Progress`, and `Done` with one click
- **Analytics dashboard** — live summary of total projects, total tasks, and task counts by status
- **Cascade delete** — deleting a project automatically removes all associated tasks
- **Protected routes** — all project and task pages require authentication
- **Inline form validation** — required fields, length limits, and email/password format checks on both client and server

---

## Tech Stack

### Frontend

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| React Router DOM | 7 | Client-side routing |
| Vite | 7 | Build tool and dev server |

### Backend

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | — | Runtime |
| Express | 5 | HTTP framework |
| Mongoose | 8 | MongoDB ODM |
| jsonwebtoken | 9 | JWT signing and verification |
| bcrypt | 6 | Password hashing |
| dotenv | — | Environment variable loading |
| cors | — | Cross-origin request handling |

### Database

| Tool | Purpose |
|------|---------|
| MongoDB Atlas | Hosted document database |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or a local MongoDB instance)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/taskflow-management-system.git
cd taskflow-management-system
```

**2. Install server dependencies**

```bash
cd server
npm install
```

**3. Install client dependencies**

```bash
cd ../client
npm install
```

### Environment Variables

**Server** — create `server/.env`:

```env
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/taskflow
JWT_SECRET=your_strong_random_secret_here
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Port the API listens on (default: `4000`) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |

**Client** — create `client/.env` (optional):

```env
VITE_API_URL=http://localhost:4000
```

If `VITE_API_URL` is not set, the client defaults to `http://localhost:4000`.

---

## Usage

### Development

Run the API server and the Vite dev server in separate terminals.

```bash
# Terminal 1 — API server (with auto-reload via nodemon)
cd server
npm run dev
```

```bash
# Terminal 2 — React dev server
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:4000`.

### Production

```bash
# Build the frontend
cd client
npm run build

# Start the API server
cd ../server
npm start
```

Serve the built `client/dist` folder with a static file host (e.g., Nginx, Vercel) and deploy the Express server to any Node.js host (e.g., Railway, Render).

---

## API Reference

All routes except `/auth/*` require an `Authorization: Bearer <token>` header.

Error responses use the shape `{ "error": "message" }`. Success responses return the resource or `{ "message": "..." }`.

### Auth

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Log in and receive a JWT token |

**Register body**

```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```

**Login response**

```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "Alice", "email": "alice@example.com" }
}
```

---

### Projects

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/projects` | List all projects owned by the authenticated user |
| `POST` | `/projects` | Create a new project |
| `GET` | `/projects/:id` | Get a single project by ID |
| `PUT` | `/projects/:id` | Update a project's fields |
| `DELETE` | `/projects/:id` | Delete a project and all its tasks |

**Project fields**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | Max 100 characters |
| `description` | string | No | |
| `status` | string | No | `planned` \| `in-progress` \| `done` |
| `startDate` | ISO date | No | |
| `endDate` | ISO date | No | |

---

### Tasks

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/projects/:projectId/tasks` | List all tasks for a project |
| `POST` | `/projects/:projectId/tasks` | Create a task in a project |
| `PUT` | `/projects/:projectId/tasks/:taskId` | Update a task |
| `DELETE` | `/projects/:projectId/tasks/:taskId` | Delete a task |

**Task fields**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | Max 200 characters |
| `description` | string | No | |
| `status` | string | No | `todo` \| `in-progress` \| `done` |
| `priority` | string | No | `low` \| `medium` \| `high` |
| `dueDate` | ISO date | No | |

Setting `status` to `done` automatically records `completedAt`. Partial updates are supported — only the fields you send are changed.

---

### Analytics

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/analytics/summary` | Returns project and task counts for the current user |

**Response**

```json
{
  "totalProjects": 3,
  "totalTasks": 12,
  "tasksByStatus": {
    "todo": 5,
    "inProgress": 4,
    "done": 3
  }
}
```

---

## Project Structure

```
taskflow-management-system/
│
├── server/                      # Express API
│   ├── index.js                 # Entry point; registers routes and starts server
│   ├── .env                     # Environment variables (not committed)
│   ├── middleware/
│   │   └── auth.js              # JWT verification; attaches req.user
│   ├── models/
│   │   ├── User.js              # User schema (name, email, passwordHash)
│   │   ├── Project.js           # Project schema (title, status, dates)
│   │   └── Task.js              # Task schema (title, status, priority, completedAt)
│   └── routes/
│       ├── auth.js              # POST /auth/register and /auth/login
│       ├── projects.js          # CRUD for /projects
│       ├── tasks.js             # CRUD for /projects/:projectId/tasks
│       └── analytics.js         # GET /analytics/summary
│
└── client/                      # React + Vite SPA
    ├── index.html               # HTML shell
    ├── vite.config.js           # Vite configuration
    └── src/
        ├── main.jsx             # React entry point; wraps app in providers
        ├── App.jsx              # Route definitions
        ├── api.js               # Centralized fetch-based API client
        ├── index.css            # Global styles and CSS custom properties
        ├── App.css              # Utility classes (.card, .badge, .btn-*)
        ├── context/
        │   └── AuthContext.jsx  # Auth state; persists token in localStorage
        └── pages/
            ├── LoginPage.jsx          # Login form
            ├── ProjectsPage.jsx       # Project list, analytics summary, create form
            └── ProjectDetailsPage.jsx # Task list, task create form, status controls
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request against `main`

Please keep pull requests focused — one feature or fix per PR.
