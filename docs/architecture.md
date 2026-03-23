# Architecture Overview

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Go + [Fiber](https://gofiber.io/) | HTTP server, API handlers, job scheduling |
| Frontend | React + [Vite](https://vitejs.dev/) | Single-page dashboard UI |
| Database | SQLite (via [modernc.org/sqlite](https://pkg.go.dev/modernc.org/sqlite)) | Persistent storage, zero-config, pure Go driver |
| Deployment | Docker + Docker Compose | Single-command deployment |

## Clean Architecture Layers

The backend follows a clean architecture pattern with clear separation of concerns:

```
cmd/server/          Entry point — wires everything together
internal/
  domain/            Entities and interfaces (Job, Execution, Settings)
  service/           Business logic (job CRUD, import/export, settings)
  scheduler/         Cron scheduling engine (manages job timers)
  executor/          HTTP execution engine (makes requests, handles retries)
  notification/      Alert delivery (email via SMTP, webhook POST)
  storage/           SQLite repository implementations
    migrations/      Database schema migrations
  server/
    handlers/        HTTP route handlers (Fiber)
    middleware/       Auth middleware, logging
```

**Dependency rule:** Inner layers (domain) have no dependencies on outer layers. The domain package defines interfaces that are implemented by storage, notification, etc.

## Scheduler + Worker Pool Pattern

```
┌─────────────────────────────────────────────┐
│                 Scheduler                    │
│                                             │
│  On startup:                                │
│    1. Load all enabled jobs from DB         │
│    2. Register each job's cron expression   │
│    3. Start cron ticker                     │
│                                             │
│  On tick (job due):                         │
│    1. Submit job to executor worker pool    │
│                                             │
│  On job create/update/delete:               │
│    1. Re-register or remove cron entry      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              Executor (Worker Pool)          │
│                                             │
│  For each job execution:                    │
│    1. Make HTTP request (method, headers,   │
│       body, timeout)                        │
│    2. Record result in executions table     │
│    3. If failed and retries > 0:            │
│       - Wait retry_interval (exp backoff)   │
│       - Retry up to N times                 │
│    4. If all attempts fail:                 │
│       - Send failure notification           │
│         (email and/or webhook)              │
└─────────────────────────────────────────────┘
```

## Authentication Flow

Single-password authentication using session cookies:

```
User → POST /login (password) → Server validates against PASSWORD env var
  ├─ Success → Set session cookie (HTTP-only, SameSite=Strict)
  │            Cookie expires after SESSION_DAYS (default 7)
  │            → Redirect to dashboard
  └─ Failure → Return 401

All /api/* routes → Auth middleware checks session cookie
  ├─ Valid session → Proceed to handler
  └─ Invalid/missing → Return 401 → Frontend redirects to /login
```

There is no user registration, no username, no roles. A single password (from the `PASSWORD` environment variable) protects the entire dashboard.

## Data Flow

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  Browser  │◄─────►│  Go Server   │◄─────►│  SQLite  │
│  (React)  │ HTTP  │  (Fiber)     │  SQL   │  (.db)   │
└──────────┘       └──────┬───────┘       └──────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌────────┐ ┌─────────┐
        │ Scheduler│ │Executor│ │Notifier │
        │(cron tick│ │(HTTP   │ │(SMTP /  │
        │ engine)  │ │ calls) │ │ webhook)│
        └──────────┘ └────────┘ └─────────┘
```

**Request lifecycle (dashboard):**

1. Browser sends API request (e.g., `GET /api/jobs`)
2. Auth middleware validates session cookie
3. Handler calls service layer
4. Service layer calls storage (SQLite)
5. Response returned as JSON

**Execution lifecycle (cron job):**

1. Scheduler fires when a cron expression matches
2. Executor makes the HTTP request to the target URL
3. Result (status code, response body, latency) is saved to the executions table
4. If the request fails, the executor retries with exponential backoff
5. After all retries are exhausted, the notifier sends alerts (email/webhook) if configured

## Frontend Architecture

The React frontend is a single-page application built with Vite:

- **Pages:** Login, Jobs List, Job Detail, Create/Edit Job, Settings
- **Components:** Reusable UI components, cron expression builder
- **Hooks:** Custom hooks for API calls and state management
- **Styles:** CSS custom properties for theming (light/dark mode)

In production, the frontend is compiled to static files and served by the Go binary. During development, Vite runs on port 5173 with a proxy to the Go backend on port 8080.
