# CLAUDE.md

## Project

Cron by Recuro — a self-hosted cron job scheduler with a web dashboard. Next.js fullstack app deployed via Docker.

## Tech Stack

- **Framework:** Next.js 15 (App Router), TypeScript
- **Database:** SQLite via better-sqlite3
- **Scheduler:** node-cron
- **Styling:** Tailwind CSS v4 (PostCSS)
- **Deployment:** Docker Compose

## Development

All commands must be run inside Docker:

```bash
docker compose up -d --build    # Build and start
docker compose down              # Stop
docker compose logs              # View logs
docker compose logs -f           # Follow logs
```

The app runs at http://localhost:8080. Default password is set via `PASSWORD` env var in docker-compose.yml.

## Project Structure

```
src/
  app/
    layout.tsx              # Root layout (server component)
    providers.tsx           # Client providers (theme, toast)
    globals.css             # CSS variables + Tailwind config
    login/page.tsx          # Login page
    (dashboard)/
      layout.tsx            # Dashboard layout (nav, auth guard)
      page.tsx              # Crons list (home)
      jobs/new/page.tsx     # Create cron form
      jobs/[id]/page.tsx    # Cron detail
      jobs/[id]/edit/page.tsx # Edit cron form
      settings/page.tsx     # Settings
      docs/page.tsx         # API docs
    api/                    # API route handlers
      login/route.ts
      logout/route.ts
      jobs/route.ts         # GET list, POST create
      jobs/[id]/route.ts    # GET, PUT, DELETE
      jobs/[id]/toggle/route.ts
      jobs/[id]/run/route.ts
      jobs/[id]/executions/route.ts
      jobs/bulk/route.ts
      jobs/bulk/toggle/route.ts
      export/route.ts
      import/route.ts
      settings/route.ts
      settings/purge/route.ts
  lib/
    db.ts                   # SQLite singleton + migrations + CRUD
    auth.ts                 # HMAC cookie auth
    scheduler.ts            # node-cron singleton + worker pool
    executor.ts             # HTTP execution + retry
    notification.ts         # Email (SMTP) + webhook alerts
    init.ts                 # Server initialization
    types.ts                # Shared TypeScript types
    api.ts                  # Client-side fetch wrapper
    cron.ts                 # Cron expression parser/builder
    format.ts               # Date/time formatting
  components/               # React UI components
  hooks/                    # React hooks
```

## Key Conventions

- Colors via CSS custom properties only (--bg, --text, --accent, etc.) — defined in globals.css
- `cursor-pointer` must be added explicitly to all interactive elements (Tailwind v4 doesn't set it by default)
- Dark mode via `.dark` class on `<html>`, configured with `@custom-variant dark` in Tailwind v4
- API routes: all under `/api/*`, auth via signed HMAC cookie
- Frontend calls "jobs" in API paths but displays "crons" in UI
- All page components use `"use client"` (they depend on React hooks)
- Root layout is a server component
- Backend singletons (db, scheduler) use `globalThis` pattern for Next.js hot-reload compatibility
- Branding: "Cron by Recuro" with link to https://recurohq.com
