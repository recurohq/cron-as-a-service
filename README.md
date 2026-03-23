# cron-as-a-service

**A modern, self-hosted cron-as-a-service with a web dashboard. `docker compose up -d` and you're running.**

[![GitHub stars](https://img.shields.io/github/stars/yourname/cron-as-a-service?style=flat-square)](https://github.com/yourname/cron-as-a-service/stargazers)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/yourname/cron-as-a-service/ci.yml?branch=main&style=flat-square)](https://github.com/yourname/cron-as-a-service/actions)

<!-- TODO: Add full-width dashboard screenshot (dark mode) -->
<!-- ![Dashboard Screenshot](screenshots/dashboard-dark.png) -->

---

## Why This Exists

Existing cron-as-a-service tools are either abandoned, expensive SaaS, or overkill enterprise schedulers. This gives you a complete self-hosted cron job scheduler and webhook scheduler with a web dashboard -- create jobs, see execution history, get failure alerts -- with `docker compose up -d` and zero configuration.

---

## Features

- :desktop_computer: **Dashboard UI** -- create, edit, and monitor cron jobs from a clean web interface
- :crescent_moon: **Dark Mode** -- beautiful light and dark themes
- :arrows_counterclockwise: **Any HTTP Method** -- GET, POST, PUT, PATCH, DELETE with custom headers and body
- :bar_chart: **Execution History** -- every run logged with status code, response body, and latency
- :chart_with_upwards_trend: **Success/Failure Stats** -- see job health at a glance (e.g., "47/50")
- :bell: **Failure Alerts** -- email (SMTP) and webhook notifications when jobs fail
- :repeat: **Retry with Backoff** -- automatic retries with exponential backoff
- :clock1: **Interactive Cron Builder** -- clickable schedule builder with plain English preview
- :earth_americas: **Timezone Support** -- any IANA timezone
- :package: **Import / Export** -- bulk import and export jobs as JSON
- :whale: **Docker Compose** -- `docker compose up -d` and you're running
- :floppy_disk: **SQLite** -- zero-config, data persists in a Docker volume
- :lock: **Password Protected** -- single env var, no complex auth
- :scroll: **MIT Licensed** -- free forever

---

## Quick Start

```bash
git clone https://github.com/yourname/cron-as-a-service.git
cd cron-as-a-service
cp .env.example .env   # edit PASSWORD
docker compose up -d
```

Open [http://localhost:8080](http://localhost:8080) and create your first cron job.

<!-- TODO: Add screenshot of job creation form with cron builder -->
<!-- ![Job Creation](screenshots/create-job.png) -->

---

## Configuration

All configuration is via environment variables in your `.env` file (or `docker-compose.yml`):

| Variable | Default | Description |
|---|---|---|
| `PASSWORD` | *(required)* | Dashboard login password |
| `TZ` | `UTC` | Server timezone |
| `SESSION_DAYS` | `7` | Login session duration in days |
| `SMTP_HOST` | -- | SMTP server for email notifications |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | -- | SMTP username |
| `SMTP_PASS` | -- | SMTP password |
| `SMTP_FROM` | -- | Sender email address |
| `RETENTION_DAYS` | `30` | Execution history retention in days |

---

## Screenshots

<!-- TODO: Add screenshots when UI is ready -->

| View | Light | Dark |
|---|---|---|
| Jobs List | ![Jobs Light](screenshots/jobs-light.png) | ![Jobs Dark](screenshots/jobs-dark.png) |
| Job Creation | ![Create Light](screenshots/create-light.png) | ![Create Dark](screenshots/create-dark.png) |
| Job Detail | ![Detail Light](screenshots/detail-light.png) | ![Detail Dark](screenshots/detail-dark.png) |
| Import/Export | ![Import Light](screenshots/import-light.png) | ![Import Dark](screenshots/import-dark.png) |

---

## Comparison

| Feature | fzaninotto/cron-as-a-service | EasyCron | cron-job.org | **This project** |
|---|---|---|---|---|
| Dashboard UI | :x: None | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Dark Mode | :x: | :x: | :x: | :white_check_mark: |
| HTTP Methods | GET only | All | All | :white_check_mark: **All** |
| Custom Headers/Body | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Execution History | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Success/Failure Stats | :x: | :x: | :x: | :white_check_mark: |
| Failure Alerts | :x: | Email | Email | :white_check_mark: **Email + Webhook** |
| Retry Logic | :x: | :white_check_mark: | :x: | :white_check_mark: **Exp. backoff** |
| Timezone Support | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Cron Expression Builder | :x: | :x: | :x: | :white_check_mark: **Interactive** |
| Import/Export Jobs | :x: | :x: | :x: | :white_check_mark: **JSON** |
| `docker compose up` | :x: | N/A (SaaS) | N/A (SaaS) | :white_check_mark: |
| Self-Hosted | :white_check_mark: | :x: | :x: | :white_check_mark: |
| Open Source (MIT) | :white_check_mark: | :x: | GPL | :white_check_mark: |
| Zero Config | :x: (needs Mongo) | N/A | N/A | :white_check_mark: **SQLite** |
| Price | Free | $12+/mo | Free | **Free forever** |

> *The only self-hosted option with a dashboard, dark mode, execution history, interactive cron builder, job import/export, retry logic, and failure alerts -- deployable in one command with zero dependencies.*

---

## Roadmap

- [ ] REST API for programmatic access
- [ ] PostgreSQL support
- [ ] Multi-user with roles
- [ ] Prometheus metrics endpoint
- [ ] Job groups / tags

---

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## License

[MIT](LICENSE) -- free forever.
