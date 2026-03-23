# cron-as-a-service — Product Requirements Document

> **Version:** 1.0  
> **Date:** March 2026  
> **Status:** Draft

---

A modern, self-hosted cron job scheduler with a web dashboard.  
`docker compose up -d` and you're running.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Competitive Analysis](#4-competitive-analysis)
5. [Product Architecture](#5-product-architecture)
6. [Feature Specifications](#6-feature-specifications)
7. [README & GitHub Repository Specification](#7-readme--github-repository-specification)
8. [SEO & Distribution Strategy](#8-seo--distribution-strategy)
9. [Success Metrics](#9-success-metrics)
10. [Roadmap](#10-roadmap)

---

## 1. Executive Summary

cron-as-a-service is a free, open-source, self-hosted cron job scheduler with a clean web dashboard. You create and manage scheduled HTTP calls entirely through the UI. It ships with a `docker-compose.yml` — clone, set a password, `docker compose up -d`, done. No database to install, no API to learn, no auth system to configure.

This is a community open-source project, MIT licensed, free forever. No paid tiers, no hosted version, no vendor lock-in.

The project is designed to outcompete the abandoned fzaninotto/cron-as-a-service GitHub repository and rank for the keyword "cron as a service" on both GitHub and Google.

### Strategic Goals

- **Capture the "cron as a service" keyword** on GitHub and Google within 6 months
- **Reach 500+ GitHub stars** within 3 months via r/selfhosted, HN, dev.to
- **Become the go-to self-hosted alternative** to EasyCron, cron-job.org, and FastCron
- **Ship in 4–5 weeks** by keeping scope focused

### What We're NOT Building

- No REST API — dashboard only, all interaction through the UI
- No auth system — single password via env var
- No PostgreSQL — SQLite only
- No real-time updates — simple auto-refresh polling
- No multi-user — single operator model
- No paid tier — free and open-source forever

---

## 2. Problem Statement

Developers need to schedule periodic HTTP calls (webhooks, health checks, cache warming, cleanup triggers). Current options all have painful tradeoffs:

| Option | Problem |
|---|---|
| System cron + curl | No UI, no history, no alerts, silent failures, painful to manage |
| SaaS (EasyCron, FastCron) | Costs money, data leaves your infra, vendor lock-in |
| Cloud schedulers (EventBridge, GCP) | Cloud lock-in, complex IAM, overkill |
| fzaninotto/cron-as-a-service | Abandoned, no dashboard, no logs, no Docker, GET-only |
| Heavy OSS (Airflow, Dkron) | Complex setup, high resource usage, steep learning curve |

**Gap:** No simple, self-hosted cron scheduler exists that has a dashboard, execution logs, and failure alerts — deployable with a single `docker compose up -d`.

---

## 3. Target Users

### Indie Developer / Solo Founder

Runs a SaaS on a VPS. Needs periodic webhooks for billing, reports, cache warming. Currently uses crontab + curl and has no idea when jobs fail. Wants a UI to see what's running and get notified when something breaks.

### r/selfhosted Enthusiast

Runs a home lab. Installs everything via Docker Compose. Evaluates tools by: one `docker-compose.yml`, clean UI, active repo, GitHub stars. This persona drives organic discovery.

### Small DevOps Team (2–5 people)

Managing cron jobs across multiple apps with scattered crontabs. Wants one dashboard to see all scheduled jobs, their history, and failures. Doesn't want to deploy Airflow for simple HTTP scheduling.

---

## 4. Competitive Analysis

| Feature | fzaninotto (target) | EasyCron | cron-job.org | **Ours (v1.0)** |
|---|---|---|---|---|
| Dashboard UI | ❌ None | ✅ | ✅ | ✅ |
| Dark Mode | ❌ | ❌ | ❌ | ✅ |
| HTTP Methods | GET only | All | All | ✅ **All** |
| Custom Headers/Body | ❌ | ✅ | ✅ | ✅ |
| Execution History | ❌ | ✅ | ✅ | ✅ |
| Success/Failure Stats | ❌ | ❌ | ❌ | ✅ |
| Failure Alerts | ❌ | Email | Email | ✅ **Email + Webhook** |
| Retry Logic | ❌ | ✅ | ❌ | ✅ **Exp. backoff** |
| Timezone Support | ❌ | ✅ | ✅ | ✅ |
| Cron Expression Builder | ❌ | ❌ | ❌ | ✅ **Interactive** |
| Import/Export Jobs | ❌ | ❌ | ❌ | ✅ **JSON** |
| `docker compose up` | ❌ | N/A (SaaS) | N/A (SaaS) | ✅ |
| Self-Hosted | ✅ | ❌ | ❌ | ✅ |
| Open Source (MIT) | ✅ | ❌ | GPL | ✅ |
| Zero Config | ❌ (needs Mongo) | N/A | N/A | ✅ **SQLite** |
| Price | Free | $12+/mo | Free | **Free forever** |

> *The only self-hosted option with a dashboard, dark mode, execution history, interactive cron builder, job import/export, retry logic, and failure alerts — deployable in one command with zero dependencies.*

---

## 5. Product Architecture

### Tech Stack

| Component | Technology | Why |
|---|---|---|
| Server | **Go** (Fiber) | Single binary, fast, low memory |
| Database | **SQLite** (via `modernc.org/sqlite`) | Zero config, single file, pure Go (no CGO) |
| Dashboard | **React 18 + TypeScript + Tailwind CSS** | Fast to build, component ecosystem, great DX |
| Scheduler | **robfig/cron** v3 | Battle-tested, second-precision, timezone-aware |
| HTTP Client | **Go net/http** | Full control over timeouts, redirects, TLS |
| Notifications | Email (SMTP) + generic webhook | Simple, no external dependencies |
| Deployment | **Docker Compose** | One file, one command |

---

### Backend Architecture Best Practices

#### Project Structure — Clean Architecture

The backend follows a clean architecture pattern with clear dependency boundaries. Inner layers never import from outer layers.

```
cmd/
  server/
    main.go                  # Wiring only: init DB, init scheduler, start server

internal/
  domain/                    # INNER LAYER — pure business types, zero imports
    job.go                   # Job struct, JobStatus enum, validation methods
    execution.go             # Execution struct
    settings.go              # Settings struct

  service/                   # APPLICATION LAYER — business logic, orchestration
    job_service.go           # Create/update/delete/toggle jobs, coordinates scheduler
    execution_service.go     # Query execution history, cleanup old records
    settings_service.go      # Read/write settings, merge env defaults with DB overrides
    import_export.go         # JSON import/export logic

  scheduler/                 # INFRASTRUCTURE — cron scheduling
    scheduler.go             # Wraps robfig/cron, hot-reload on job changes
    worker_pool.go           # Fixed-size goroutine pool for HTTP execution

  executor/                  # INFRASTRUCTURE — HTTP execution + retry
    executor.go              # Fire HTTP request, record result
    retry.go                 # Exponential backoff logic

  notification/              # INFRASTRUCTURE — alerting
    email.go                 # SMTP sender
    webhook.go               # Generic POST webhook sender
    notifier.go              # Router: pick channel based on job config + fallback

  storage/                   # INFRASTRUCTURE — database
    sqlite.go                # SQLite connection, migrations, query helpers
    job_repo.go              # Job CRUD queries
    execution_repo.go        # Execution insert/query/cleanup queries
    settings_repo.go         # Settings key-value queries
    migrations/              # SQL migration files (embedded via go:embed)
      001_initial.sql
      002_add_stats.sql

  server/                    # INFRASTRUCTURE — HTTP layer
    server.go                # Fiber app setup, middleware, static file serving
    routes.go                # Route definitions (dashboard pages + internal endpoints)
    handlers/                # One file per page/action
      login.go
      jobs.go
      job_detail.go
      settings.go
      import_export.go
    middleware/
      auth.go                # Cookie check, redirect to login
```

#### Key Principles

**Dependency injection via interfaces.** Services depend on repository interfaces defined in `service/`, not on concrete SQLite implementations. This makes testing trivial — swap in an in-memory mock.

```go
// In service/job_service.go
type JobRepository interface {
    Create(ctx context.Context, job domain.Job) error
    GetByID(ctx context.Context, id string) (domain.Job, error)
    List(ctx context.Context, filter JobFilter) ([]domain.Job, error)
    Update(ctx context.Context, job domain.Job) error
    Delete(ctx context.Context, id string) error
}

type JobService struct {
    repo      JobRepository
    scheduler Scheduler
}
```

**All database access goes through repository structs.** No raw SQL in handlers or services. Repositories return domain types, never `sql.Rows`.

**Migrations are embedded and run on startup.** Use `go:embed` to bundle `.sql` files into the binary. On boot, check which migrations have run (track in a `migrations` table) and apply new ones. Never require manual migration steps.

**Graceful shutdown.** `main.go` listens for SIGTERM/SIGINT, then: (1) stop accepting new HTTP requests, (2) wait for in-flight requests to finish (5s timeout), (3) stop the cron scheduler, (4) wait for running job executions to finish (30s timeout), (5) close the database. This matters for Docker — `docker compose down` sends SIGTERM.

**Structured logging.** Use `log/slog` (Go stdlib). Every log line includes: timestamp, level, message, and structured fields (job_id, execution_id, etc.). No `fmt.Println`. Log levels: DEBUG for scheduler tick details, INFO for job executions and lifecycle events, WARN for skipped overlapping runs and missing SMTP config, ERROR for execution failures and notification delivery failures.

**Configuration loading order.** On startup: (1) read env vars, (2) read SQLite settings table, (3) settings table values override env vars. This allows users to configure via env vars initially, then override from the dashboard without restarting.

**Error handling pattern.** Services return `(result, error)`. Handlers translate errors to HTTP responses. Domain validation errors become 400s. Not-found errors become 404s. Everything else is 500 with a generic message (log the real error server-side). Never expose internal errors to the UI.

**No global state.** No package-level `var db` or `var scheduler`. Everything is initialized in `main.go` and passed via struct fields. This makes the application testable and the dependency graph explicit.

#### SQLite Best Practices

- **WAL mode on.** Set `PRAGMA journal_mode=WAL` on connection open. This allows concurrent reads while a write is happening — critical since the scheduler writes executions while the dashboard reads them.
- **Busy timeout.** Set `PRAGMA busy_timeout=5000` to wait 5 seconds on lock contention instead of failing immediately.
- **Foreign keys on.** Set `PRAGMA foreign_keys=ON` on every connection.
- **Single writer.** Use a `sync.Mutex` or a dedicated write goroutine to serialize writes. SQLite handles one writer at a time — serializing at the application level avoids `SQLITE_BUSY` errors entirely.
- **Connection pool: 1 write, N read.** Open two separate connection pools: one connection for writes (serialized), and a pool of read-only connections for dashboard queries. This maximizes read concurrency while preventing write contention.
- **Prepared statements.** Prepare frequently-used queries once at startup, reuse across requests. Reduces parsing overhead significantly for hot paths (insert execution, list jobs, etc.).
- **Embed the database file path.** Default to `/data/cron.db` (Docker volume mount point). Never use `:memory:` in production — data must survive restarts.

#### Execution Engine Details

- **Worker pool pattern.** On startup, create a buffered channel (`chan ExecutionRequest`, capacity 100) and spawn 10 goroutines that read from it. The scheduler pushes to this channel on each cron tick. If the channel is full (all workers busy + 100 queued), log a warning and drop the execution — do not block the scheduler.
- **Overlap prevention.** Keep a `sync.Map` of currently-executing job IDs. Before pushing to the worker channel, check if the job ID is already in the map. If yes, skip and log a warning. Remove from the map when execution completes (in a `defer`).
- **Retry as a loop inside the worker.** When a job fails and has retries configured, the retry loop runs inside the same goroutine — sleep for the backoff interval, then retry. This means a retrying job occupies a worker for the full retry duration. This is acceptable for v1.0's 10-worker pool with a max 5 retries.
- **HTTP client reuse.** Create a single `http.Client` with sensible defaults (30s timeout, 10 max redirects, system cert pool) and share it across all workers. Do NOT create a new client per request.

---

### Frontend Architecture Best Practices

#### Project Structure

```
web/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── src/
    ├── main.tsx                 # React root, router setup, theme provider
    ├── App.tsx                  # Layout shell: sidebar/topbar + outlet
    │
    ├── pages/                   # One file per route — page-level components
    │   ├── LoginPage.tsx
    │   ├── JobsListPage.tsx
    │   ├── JobDetailPage.tsx
    │   ├── JobFormPage.tsx       # Shared for create + edit
    │   ├── SettingsPage.tsx
    │   └── ImportExportPage.tsx
    │
    ├── components/              # Reusable UI components
    │   ├── ui/                  # Primitives (button, input, badge, modal, toast, toggle)
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Toast.tsx
    │   │   └── Toggle.tsx
    │   ├── CronBuilder.tsx      # Interactive cron expression builder
    │   ├── CronPreview.tsx      # Human-readable preview + next 5 runs
    │   ├── KeyValueEditor.tsx   # Headers editor (add/remove key-value rows)
    │   ├── ExecutionTable.tsx   # Execution history table (reused on job detail + global log)
    │   ├── StatusBadge.tsx      # Color-coded status (2xx green, 4xx yellow, 5xx red)
    │   ├── JobStatsBar.tsx      # Mini success/failure bar (e.g., "47/50")
    │   └── ThemeToggle.tsx      # Dark/light mode switch
    │
    ├── hooks/                   # Custom React hooks
    │   ├── useJobs.ts           # Fetch + poll jobs list
    │   ├── useJob.ts            # Fetch single job + executions
    │   ├── useSettings.ts       # Fetch + update settings
    │   ├── usePolling.ts        # Generic polling hook (interval + pause when tab hidden)
    │   └── useTheme.ts          # Dark mode state + localStorage persistence
    │
    ├── lib/                     # Utilities, no React dependencies
    │   ├── api.ts               # Fetch wrapper (base URL, cookie auth, error handling)
    │   ├── cron.ts              # Cron expression parser, human-readable formatter, next-runs calculator
    │   ├── format.ts            # Date formatting, relative time, number formatting
    │   └── types.ts             # TypeScript types matching backend domain (Job, Execution, Settings)
    │
    └── styles/
        └── globals.css          # Tailwind imports + CSS custom properties for theming
```

#### Key Principles

**Pages are thin, components are reusable.** A page component fetches data (via hooks), handles page-level state (modals, forms), and composes components. It should not contain complex rendering logic — push that into components. If a chunk of JSX is used in two places, extract it.

**All API calls go through `lib/api.ts`.** One fetch wrapper that: (1) prepends the base URL, (2) includes credentials (cookies), (3) parses JSON responses, (4) handles 401 (redirect to login), (5) handles errors consistently. No raw `fetch()` calls in components or hooks.

```typescript
// lib/api.ts
const BASE = '';  // same-origin, served by the Go backend

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json();
}
```

**Polling, not WebSockets.** The jobs list page and job detail page use a `usePolling` hook that calls the API every 30 seconds. The hook pauses polling when the browser tab is hidden (using `document.visibilitychange`) to avoid wasting resources. No WebSocket, no SSE — keep it simple.

```typescript
// hooks/usePolling.ts
export function usePolling(callback: () => void, intervalMs = 30_000) {
  useEffect(() => {
    callback(); // initial fetch
    const id = setInterval(() => {
      if (!document.hidden) callback();
    }, intervalMs);
    return () => clearInterval(id);
  }, [callback, intervalMs]);
}
```

**Dark mode via CSS custom properties.** Define all colors as CSS custom properties in `globals.css`. Tailwind is configured to use these variables. The `useTheme` hook toggles a `dark` class on `<html>` and persists the preference in `localStorage`. System preference is respected on first visit.

```css
/* globals.css */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --accent: #2563eb;
  --success: #16a34a;
  --warning: #d97706;
  --error: #dc2626;
}

.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: #334155;
  --accent: #3b82f6;
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
}
```

**TypeScript types mirror the backend domain exactly.** Define types in `lib/types.ts` that match the Go structs field-for-field (with JSON naming). This is the single source of truth for the frontend. If a backend field changes, it breaks here first — which is what you want.

```typescript
// lib/types.ts
export interface Job {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  expression: string;
  timezone: string;
  headers: Record<string, string>;
  body: string;
  enabled: boolean;
  retries: number;
  retry_interval: number;
  timeout: number;
  notify_url: string;
  notify_email: string;
  created_at: string;
  updated_at: string;
  // Computed by backend, included in list responses:
  next_run: string;
  last_status: 'success' | 'failure' | 'pending' | 'disabled';
  stats: { success: number; failure: number; total: number };
}

export interface Execution {
  id: string;
  job_id: string;
  status_code: number;
  response_body: string;
  latency_ms: number;
  error: string;
  attempt: number;
  started_at: string;
  finished_at: string;
}
```

**Form state with controlled components.** Job create/edit uses React `useState` for each field. No form library needed for this size — just controlled inputs + a submit handler that calls the API. Validation happens on blur (field-level) and on submit (full form). Show inline error messages below each field.

**Cron builder is a standalone component.** `CronBuilder.tsx` is a self-contained interactive component. It takes a `value: string` and `onChange: (expr: string) => void` prop. Internally it manages its own state for the builder tabs (every X minutes, hourly, daily, weekly, monthly) and generates the cron expression string. This keeps it reusable and testable in isolation.

**Toast notifications for actions.** "Job created", "Job deleted", "Execution triggered", "Settings saved" — all use a simple toast system. Toasts auto-dismiss after 4 seconds. No toast library — build a minimal one with React portal + CSS animations (~50 lines). Toasts stack in the bottom-right.

**Embedded SPA serving.** The React app is built to static files (`web/dist/`) during the Docker build stage. The Go binary embeds these files using `go:embed` and serves them via Fiber's static middleware. All non-API routes fall through to `index.html` for client-side routing. This means the entire app — backend, frontend, database — is a single binary.

**Vite for development.** During local frontend development, run `npm run dev` for hot-reload on port 5173, with Vite proxying API calls to the Go backend on port 8080. In production, everything is served from the Go binary. The `vite.config.ts` should include a proxy config for `/api` and `/login` routes.

---

### Deployment Model

The repo ships a `docker-compose.yml` at the root. This is the only supported deployment method.

```yaml
# docker-compose.yml
services:
  cron:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - cron-data:/data
    environment:
      - PASSWORD=changeme
      - TZ=UTC
      - SMTP_HOST=
      - SMTP_PORT=587
      - SMTP_USER=
      - SMTP_PASS=
      - SMTP_FROM=
    restart: unless-stopped

volumes:
  cron-data:
```

#### Dockerfile Best Practices

Multi-stage build, three stages:

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Stage 2: Build backend
FROM golang:1.22-alpine AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /app/web/dist ./web/dist
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /cron-server ./cmd/server

# Stage 3: Final image
FROM gcr.io/distroless/static-debian12
COPY --from=backend /cron-server /cron-server
COPY --from=backend /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
EXPOSE 8080
ENTRYPOINT ["/cron-server"]
```

Key points:
- `CGO_ENABLED=0` + pure-Go SQLite driver (`modernc.org/sqlite`) = fully static binary, no libc needed
- Distroless base image = ~2MB overhead, minimal attack surface
- SSL certs copied in for outbound HTTPS requests
- `-ldflags="-s -w"` strips debug info, reduces binary size by ~30%
- Final image target: **<25MB total**

User workflow:

1. `git clone` the repo
2. `cp .env.example .env` and set `PASSWORD`
3. `docker compose up -d`
4. Open `http://localhost:8080`

---

### Database Schema

Three tables total.

**jobs**

| Column | Type | Notes |
|---|---|---|
| id | TEXT (ULID) | Primary key |
| name | TEXT | Human-readable label |
| url | TEXT | Target URL |
| method | TEXT | GET, POST, PUT, PATCH, DELETE |
| expression | TEXT | Cron expression (5-field) |
| timezone | TEXT | IANA timezone, default UTC |
| headers | TEXT (JSON) | `{}` if empty |
| body | TEXT | Request body for POST/PUT/PATCH |
| enabled | BOOLEAN | Default true |
| retries | INTEGER | 0–5, default 0 |
| retry_interval | INTEGER | Seconds between retries, default 60 |
| timeout | INTEGER | Request timeout in seconds, default 30 |
| notify_url | TEXT | Webhook URL for failure alerts (optional) |
| notify_email | TEXT | Email for failure alerts (optional) |
| created_at | DATETIME | |
| updated_at | DATETIME | |

**executions**

| Column | Type | Notes |
|---|---|---|
| id | TEXT (ULID) | Primary key |
| job_id | TEXT | Foreign key → jobs (CASCADE delete) |
| status_code | INTEGER | HTTP response code (0 if connection failed) |
| response_body | TEXT | First 10KB of response |
| latency_ms | INTEGER | Request duration in milliseconds |
| error | TEXT | Error message if connection/timeout failure |
| attempt | INTEGER | Which retry attempt (1 = first try) |
| started_at | DATETIME | |
| finished_at | DATETIME | |

Index: `CREATE INDEX idx_executions_job_started ON executions(job_id, started_at DESC)` — the hot query path for job detail pages.

**settings**

| Column | Type | Notes |
|---|---|---|
| key | TEXT | Primary key |
| value | TEXT | Stored value |

---

## 6. Feature Specifications

### F1: Login Screen

**Priority:** P0

- Single password field + "Log in" button
- Password checked against `PASSWORD` env var
- On success: set a signed HTTP-only cookie (HMAC with server-generated secret stored in SQLite on first boot)
- Cookie expires in 7 days (configurable via `SESSION_DAYS` env var)
- All dashboard routes check for valid cookie → redirect to login if missing
- If `PASSWORD` env var is not set: show a warning page telling the user to set it
- Dark/light theme toggle visible on the login page

---

### F2: Jobs List (Home Page)

**Priority:** P0

| Element | Behavior |
|---|---|
| Job table | Columns: status dot (colored), name (clickable), expression (human-readable), next run (relative time), **stats bar** (e.g., "47/50" with mini green/red bar), last status badge, enabled toggle |
| Search | Text input — client-side instant filter by job name |
| "New Job" button | Top right, opens create form |
| Bulk actions | Checkbox select → enable / disable / delete (with confirmation modal) |
| Import / Export | "Import JSON" button (file picker) + "Export All" button (downloads JSON) |
| Empty state | Friendly message + "Create your first cron job" button |
| Auto-refresh | Polls every 30 seconds, pauses when tab is hidden |
| Sorting | Clickable column headers: name, next run, success rate, last status |
| Theme toggle | Dark/light switch in the top bar |

**Stats bar:** Each job row shows a compact success/failure indicator based on the last 50 executions (or fewer if the job hasn't run that many times). Format: "47/50" with a thin horizontal bar (green portion = successes, red portion = failures). Calculated by the backend and included in the jobs list response.

---

### F3: Create / Edit Job Form

**Priority:** P0

Single page form.

| Field | Input Type | Validation |
|---|---|---|
| Name | Text input | Required, max 100 chars |
| URL | Text input | Required, valid URL (http/https) |
| Method | Dropdown | GET (default), POST, PUT, PATCH, DELETE |
| Cron Expression | Text input + interactive builder | Required, valid 5-field cron |
| Timezone | Searchable dropdown | IANA timezones, default UTC |
| Headers | Key-value pair editor | Add/remove rows |
| Body | Monospace textarea | Only visible for POST/PUT/PATCH |
| Timeout | Number input | 1–300 seconds, default 30 |
| Retries | Number input | 0–5, default 0 |
| Retry Interval | Number input | 10–3600 seconds, default 60 |
| Notify email | Text input | Optional, valid email |
| Notify webhook | Text input | Optional, valid URL |

#### Interactive Cron Builder

Two parts, always visible below the cron expression text input:

**1. Live preview:** Human-readable translation + next 5 execution times. Updates as the user types or clicks the builder.

**2. Clickable builder:** Tab-style interface with options:
- **Every X minutes** — dropdown: 1, 2, 5, 10, 15, 30
- **Hourly** — at minute: dropdown 0–59
- **Daily** — at time: hour + minute dropdowns
- **Weekly** — checkboxes for days + time dropdowns
- **Monthly** — day-of-month dropdown (1–31) + time dropdowns
- **Custom** — direct text input (the default text field)

Selecting any builder option populates the cron expression text input. User can always switch to "Custom" and type directly. The builder tries to reverse-parse the current expression and highlight the matching tab.

#### Run Now Button

Visible on the edit form (not create). Triggers immediate execution. Toast confirmation + result appears in execution history.

---

### F4: Job Detail Page

**Priority:** P0

**Top section — Summary card:**
- Name, URL (clickable), method badge, expression (human-readable), timezone
- Next scheduled run
- **Stats:** success/failure counts and rate for last 50 runs, displayed as a bar + percentage
- Quick actions: Edit, Run Now, Enable/Disable toggle, Delete (confirmation modal)

**Bottom section — Execution history table:**
- Most recent first
- Columns: timestamp (relative + absolute on hover), status code (color badge), latency, attempt number, error (truncated)
- Click row to expand: full response body (monospace, scrollable), full error, request details
- Pagination: 25 per page, "Load more" button

---

### F5: Settings Page

**Priority:** P1

| Setting | Description | Default |
|---|---|---|
| Default notification email | Fallback for jobs without per-job email | (empty) |
| Default notification webhook | Fallback for jobs without per-job webhook | (empty) |
| SMTP Host | SMTP server address | From `SMTP_HOST` env |
| SMTP Port | SMTP port | From `SMTP_PORT` env or 587 |
| SMTP User | SMTP username | From `SMTP_USER` env |
| SMTP Password | Masked input | From `SMTP_PASS` env |
| SMTP From | Sender address | From `SMTP_FROM` env |
| Retention days | Days to keep execution history | 30 |

Dashboard overrides take precedence over env vars once saved. "Purge old executions" button for manual cleanup.

---

### F6: Import / Export

**Priority:** P0

#### Export

- "Export All Jobs" button on the jobs list page
- Downloads a `.json` file containing an array of all jobs (without executions)
- Format:

```json
{
  "version": 1,
  "exported_at": "2026-03-20T14:00:00Z",
  "jobs": [
    {
      "name": "Heartbeat",
      "url": "https://example.com/ping",
      "method": "POST",
      "expression": "*/5 * * * *",
      "timezone": "UTC",
      "headers": { "Authorization": "Bearer token123" },
      "body": "{\"status\":\"alive\"}",
      "enabled": true,
      "retries": 3,
      "retry_interval": 60,
      "timeout": 30,
      "notify_url": "",
      "notify_email": "ops@example.com"
    }
  ]
}
```

- IDs, timestamps, and execution history are NOT exported — this is a portable job definition format

#### Import

- "Import Jobs" button on the jobs list page → file picker (accepts `.json`)
- Validates the file format and each job's fields
- Shows a preview: list of job names to be imported with any validation warnings
- "Import" button to confirm → creates all valid jobs
- Duplicate names are allowed (no upsert) — user can clean up manually
- If the file has errors: show clear error messages, import nothing (all or nothing)

---

### F7: Notification System

**Priority:** P1

Two channels only. No plugin system, no abstraction overhead.

#### Email (SMTP)

- Sent when a job fails after all retries exhausted
- Uses per-job `notify_email`, falls back to default from Settings
- Subject: `[cron-as-a-service] Job "{name}" failed`
- Body: plain text — job name, URL, status code, error, timestamp, link to job detail
- If SMTP not configured: skip silently, log a warning

#### Webhook

- POST to `notify_url` (per-job) or default webhook (Settings) on failure after all retries
- JSON payload:

```json
{
  "event": "job.failed",
  "job": {
    "id": "01HXY...",
    "name": "Heartbeat Check",
    "url": "https://example.com/ping",
    "expression": "*/5 * * * *"
  },
  "execution": {
    "status_code": 500,
    "error": "Internal Server Error",
    "latency_ms": 2340,
    "attempt": 3,
    "timestamp": "2026-03-20T14:30:00Z"
  }
}
```

- Timeout: 10 seconds, no retries on notification delivery failure (log and move on)

---

### F8: Job Execution Engine

**Priority:** P0

#### Scheduling

- `robfig/cron` v3 with timezone support
- All enabled jobs loaded on startup
- Hot-reload on job changes via dashboard (no restart needed)
- Standard 5-field cron expressions

#### Execution

- Worker pool: 10 goroutines (hardcoded for v1.0)
- Overlap prevention: skip if same job is already executing, log warning
- Record: status code, response body (10KB max), latency, error, timestamps
- Follow redirects (up to 10 hops)
- TLS: system cert pool

#### Retry Logic

On failure (5xx, connection error, DNS failure, timeout):

1. Wait `retry_interval` seconds
2. Retry (same goroutine)
3. Exponential backoff: interval doubles each attempt (60s → 120s → 240s)
4. Stop after `retries` reached → mark failed → fire notification

Not retried: 2xx, 3xx (followed), 4xx (client error, not transient).

Each attempt is a separate row in `executions` with incrementing `attempt` number.

#### Stats Calculation

The backend calculates per-job stats on each jobs list request:

```sql
SELECT
  SUM(CASE WHEN status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END) as success,
  COUNT(*) as total
FROM executions
WHERE job_id = ? AND attempt = 1
ORDER BY started_at DESC
LIMIT 50
```

Returned as `{ success, failure, total }` alongside each job in the list response.

#### Cleanup

- Daily at 03:00 UTC: delete executions older than `retention_days`
- No SQLite VACUUM (causes lock contention)

---

### F9: Dark Mode

**Priority:** P0

- Toggle switch in the top navigation bar (visible on all pages including login)
- Respects system preference on first visit (`prefers-color-scheme: dark`)
- User override stored in `localStorage`
- Implementation: toggle `dark` class on `<html>`, all colors via CSS custom properties
- Both themes must be visually polished — dark mode is not an afterthought

---

## 7. README & GitHub Repository Specification

### README Structure (exact order)

**1. Hero Section**
- Project logo (simple SVG)
- Tagline: **"A modern, self-hosted cron-as-a-service with a web dashboard. `docker compose up -d` and you're running."**
- Badge row: GitHub stars, license (MIT), build status, latest release
- Full-width dashboard screenshot (dark mode — it screenshots better)

**2. Why This Exists (2–3 sentences)**
- "Existing cron-as-a-service tools are either abandoned, expensive SaaS, or overkill enterprise schedulers. This gives you a complete cron job dashboard — create jobs, see execution history, get failure alerts — with `docker compose up -d` and zero configuration."

**3. Features**
- 🖥️ **Dashboard UI** — create, edit, and monitor cron jobs from a clean web interface
- 🌙 **Dark Mode** — beautiful light and dark themes
- 🔄 **Any HTTP Method** — GET, POST, PUT, PATCH, DELETE with custom headers and body
- 📊 **Execution History** — every run logged with status code, response body, and latency
- 📈 **Success/Failure Stats** — see job health at a glance (e.g., "47/50")
- 🔔 **Failure Alerts** — email (SMTP) and webhook notifications when jobs fail
- 🔁 **Retry with Backoff** — automatic retries with exponential backoff
- 🕐 **Interactive Cron Builder** — clickable schedule builder with plain English preview
- 🌍 **Timezone Support** — any IANA timezone
- 📦 **Import / Export** — bulk import and export jobs as JSON
- 🐳 **Docker Compose** — `docker compose up -d` and you're running
- 💾 **SQLite** — zero-config, data persists in a Docker volume
- 🔒 **Password Protected** — single env var, no complex auth
- 📜 **MIT Licensed** — free forever

**4. Quick Start**

```bash
git clone https://github.com/yourname/cron-as-a-service.git
cd cron-as-a-service
cp .env.example .env   # edit PASSWORD
docker compose up -d
```

"Open http://localhost:8080 and create your first cron job."

Second screenshot: job creation form with cron builder.

**5. Configuration**

| Variable | Default | Description |
|---|---|---|
| `PASSWORD` | (required) | Dashboard login password |
| `TZ` | `UTC` | Server timezone |
| `SESSION_DAYS` | `7` | Login session duration |
| `SMTP_HOST` | — | SMTP server |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` | — | Sender email |
| `RETENTION_DAYS` | `30` | Execution history retention |

**6. Screenshots**
- Jobs list (light + dark)
- Job creation with cron builder
- Job detail with execution history
- Import/export flow

**7. Comparison Table**
Same as Section 4 of this PRD.

**8. Roadmap**
- [ ] REST API for programmatic access
- [ ] PostgreSQL support
- [ ] Multi-user with roles
- [ ] Prometheus metrics endpoint
- [ ] Job groups / tags

**9. Contributing + License**
- CONTRIBUTING.md link
- MIT license

### README SEO Requirements

- **H1:** `cron-as-a-service`
- **First paragraph keywords (natural):** "cron as a service", "self-hosted", "cron job scheduler", "webhook scheduler", "docker compose"
- **GitHub description:** "Self-hosted cron-as-a-service with a web dashboard — schedule HTTP calls, view execution history, get failure alerts. docker compose up -d."
- **Topics:** `cron`, `cron-job`, `cron-as-a-service`, `scheduler`, `job-scheduler`, `webhook-scheduler`, `self-hosted`, `docker`, `docker-compose`, `devops`, `automation`

### Repository File Structure

```
cron-as-a-service/
├── README.md
├── LICENSE                        # MIT
├── CONTRIBUTING.md
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .github/
│   ├── workflows/ci.yml
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── cmd/
│   └── server/main.go
├── internal/
│   ├── domain/
│   ├── service/
│   ├── scheduler/
│   ├── executor/
│   ├── notification/
│   ├── storage/
│   │   └── migrations/
│   └── server/
│       ├── handlers/
│       └── middleware/
├── web/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
├── screenshots/
└── docs/
    └── architecture.md
```

---

## 8. SEO & Distribution Strategy

### Keyword Targets

| Keyword | Intent | Target Asset |
|---|---|---|
| cron as a service | Product discovery | GitHub repo |
| cron as a service open source | OSS evaluation | GitHub repo |
| self-hosted cron job scheduler | Self-hosted tooling | Repo |
| EasyCron alternative | Competitor comparison | README comparison table  |
| cron-job.org alternative | Competitor comparison | README comparison table  |
| webhook scheduler docker | Container-native | README |
| free cron job service self hosted | Price-sensitive | README |
| docker compose cron scheduler | Deployment | README quick start |

---

## 10. Roadmap

### v1.0 — Full Release (Target: 4–5 weeks)

- [x] Login screen (password from env var)
- [x] Jobs list with status, search, sorting, auto-refresh
- [x] **Job success/failure stats** (last 50 runs per job)
- [x] Create / edit job form
- [x] **Interactive cron expression builder** (clickable + preview)
- [x] Job detail page with execution history
- [x] Execution engine with retry + exponential backoff
- [x] Email notifications (SMTP)
- [x] Webhook notifications (generic POST)
- [x] Settings page
- [x] **Dark mode** (system preference + manual toggle)
- [x] **Import jobs from JSON**
- [x] **Export all jobs as JSON**
- [x] SQLite with auto-migration
- [x] Docker Compose deployment
- [x] README with screenshots and comparison table
- [x] CI pipeline (build + test)
