# Contributing to cron-as-a-service

Thanks for your interest in contributing! This document explains how to get started.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cron-as-a-service.git
   cd cron-as-a-service
   ```
3. **Create a branch** for your change:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Running Locally

### Prerequisites

- Go 1.22+
- Node.js 20+
- npm

### Backend

```bash
go run ./cmd/server
```

The server starts on `http://localhost:8080`.

### Frontend (development mode)

```bash
cd web
npm install
npm run dev
```

Vite dev server starts on `http://localhost:5173` and proxies API calls to the Go backend on port 8080.

### Docker

```bash
cp .env.example .env   # edit PASSWORD
docker compose up -d
```

## Code Style

### Go

- Follow standard Go conventions (`gofmt`, `go vet`).
- Keep packages small and focused.
- Write tests for new functionality.

### TypeScript / React

- Use functional components with hooks.
- Follow the existing project structure (pages, components, hooks, lib).
- Use TypeScript strict mode.

## Submitting a Pull Request

1. Make sure all tests pass:
   ```bash
   go vet ./...
   go test ./...
   cd web && npm run build
   ```
2. Commit your changes with a clear, descriptive commit message.
3. Push your branch to your fork.
4. Open a Pull Request against the `main` branch.
5. Describe what your PR does and why.

## Reporting Bugs

Use the [bug report template](https://github.com/yourname/cron-as-a-service/issues/new?template=bug_report.md) when filing issues. Include steps to reproduce, expected behavior, and your environment details.

## Feature Requests

Use the [feature request template](https://github.com/yourname/cron-as-a-service/issues/new?template=feature_request.md). Describe the use case and proposed solution.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
