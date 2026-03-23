'use client';

export default function DocsPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-[var(--text)] mb-6">API Documentation</h1>

      <div className="space-y-8 max-w-3xl">
        {/* Auth */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text)] mb-3">Authentication</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            All API requests require authentication via a session cookie obtained from the login endpoint.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Endpoint</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Method</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/login</td>
                  <td className="py-2 px-3 text-[var(--text)]">POST</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Authenticate with password. Body: <code className="text-xs bg-[var(--bg-subtle)] px-1 py-0.5 rounded">{`{"password": "..."}`}</code></td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/logout</td>
                  <td className="py-2 px-3 text-[var(--text)]">POST</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">End current session</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Jobs API */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text)] mb-3">Jobs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Endpoint</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Method</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/jobs</td>
                  <td className="py-2 px-3 text-[var(--text)]">GET</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">List all cron jobs</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/jobs</td>
                  <td className="py-2 px-3 text-[var(--text)]">POST</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Create a new cron job</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/jobs/:id</td>
                  <td className="py-2 px-3 text-[var(--text)]">GET</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Get a specific cron job</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/jobs/:id</td>
                  <td className="py-2 px-3 text-[var(--text)]">PUT</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Update a cron job</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/jobs/:id</td>
                  <td className="py-2 px-3 text-[var(--text)]">DELETE</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Delete a cron job and its execution history</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/jobs/:id/toggle</td>
                  <td className="py-2 px-3 text-[var(--text)]">POST</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Toggle a job&apos;s enabled/disabled state</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/jobs/:id/run</td>
                  <td className="py-2 px-3 text-[var(--text)]">POST</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Trigger an immediate execution</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/jobs/:id/executions</td>
                  <td className="py-2 px-3 text-[var(--text)]">GET</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Get execution history. Query params: <code className="text-xs bg-[var(--bg-subtle)] px-1 py-0.5 rounded">page</code>, <code className="text-xs bg-[var(--bg-subtle)] px-1 py-0.5 rounded">limit</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Bulk operations */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text)] mb-3">Bulk operations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Endpoint</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Method</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/jobs/bulk/toggle</td>
                  <td className="py-2 px-3 text-[var(--text)]">POST</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Bulk enable/disable. Body: <code className="text-xs bg-[var(--bg-subtle)] px-1 py-0.5 rounded">{`{"ids": [...], "enabled": true}`}</code></td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/jobs/bulk</td>
                  <td className="py-2 px-3 text-[var(--text)]">DELETE</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Bulk delete. Body: <code className="text-xs bg-[var(--bg-subtle)] px-1 py-0.5 rounded">{`{"ids": [...]}`}</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Import/Export */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text)] mb-3">Import / Export</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Endpoint</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Method</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/export</td>
                  <td className="py-2 px-3 text-[var(--text)]">GET</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Export all jobs as JSON</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/import</td>
                  <td className="py-2 px-3 text-[var(--text)]">POST</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Import jobs from JSON</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Settings API */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text)] mb-3">Settings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Endpoint</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Method</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/settings</td>
                  <td className="py-2 px-3 text-[var(--text)]">GET</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Get current settings</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/settings</td>
                  <td className="py-2 px-3 text-[var(--text)]">PUT</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Update settings</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">/api/settings/purge</td>
                  <td className="py-2 px-3 text-[var(--text)]">POST</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Purge all execution history</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Job configuration */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text)] mb-3">Job configuration</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Field</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Type</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">name</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">string</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Display name for the job</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">url</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">string</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Target URL to call</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">method</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">string</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">HTTP method: GET, POST, PUT, PATCH, DELETE</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">expression</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">string</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Cron expression (5-field): minute hour day month weekday</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">timezone</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">string</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">IANA timezone (e.g. America/New_York)</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">headers</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">object</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Key-value pairs for request headers</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">body</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">string</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Request body (for POST/PUT/PATCH)</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">enabled</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">boolean</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Whether the job is active</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">retries</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">number</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Number of retry attempts on failure (0-10)</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">retry_interval</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">number</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Seconds between retries</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">timeout</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">number</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Request timeout in seconds (1-300)</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">notify_url</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">string</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Webhook URL for failure notifications</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">notify_email</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">string</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Email address for failure notifications</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Environment variables */}
        <section>
          <h2 className="text-sm font-medium text-[var(--text)] mb-3">Environment variables</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Variable</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Default</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-secondary)]">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">PASSWORD</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">admin</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Login password</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">PORT</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">8080</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">Server port</td>
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text)]">DB_PATH</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">./data/cron.db</td>
                  <td className="py-2 px-3 text-[var(--text-secondary)]">SQLite database file path</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
