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

export interface Settings {
  default_notify_email: string;
  default_notify_url: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  retention_days: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type JobStatus = 'success' | 'failure' | 'pending' | 'disabled';

export interface JobFormData {
  name: string;
  url: string;
  method: HttpMethod;
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
}

export type SortField = 'name' | 'next_run' | 'success_rate' | 'last_status';
export type SortDirection = 'asc' | 'desc';
