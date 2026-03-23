import nodemailer from 'nodemailer';
import { getSetting } from './db';
import type { Execution } from './types';

interface JobInfo {
  id: string;
  name: string;
  url: string;
  notify_url: string;
  notify_email: string;
}

async function sendWebhook(
  webhookUrl: string,
  job: JobInfo,
  execution: Execution
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'job.failed',
        job: {
          id: job.id,
          name: job.name,
          url: job.url,
        },
        execution: {
          id: execution.id,
          status_code: execution.status_code,
          error: execution.error,
          latency_ms: execution.latency_ms,
          attempt: execution.attempt,
          started_at: execution.started_at,
          finished_at: execution.finished_at,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    console.error(`Webhook notification failed for job ${job.id}:`, err);
  } finally {
    clearTimeout(timeout);
  }
}

async function sendEmail(
  to: string,
  job: JobInfo,
  execution: Execution
): Promise<void> {
  const smtpHost = getSetting('smtp_host') || process.env.SMTP_HOST;
  const smtpPort = getSetting('smtp_port') || process.env.SMTP_PORT || '587';
  const smtpUser = getSetting('smtp_user') || process.env.SMTP_USER;
  const smtpPass = getSetting('smtp_pass') || process.env.SMTP_PASS;
  const smtpFrom =
    getSetting('smtp_from') || process.env.SMTP_FROM || 'cron@localhost';

  if (!smtpHost) return; // No SMTP configured, skip silently

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465,
      auth:
        smtpUser && smtpPass
          ? { user: smtpUser, pass: smtpPass }
          : undefined,
    });

    const errorDetail = execution.error
      ? `Error: ${execution.error}`
      : `Status Code: ${execution.status_code}`;

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: `[Cron Failure] ${job.name}`,
      text: [
        `Job "${job.name}" failed after all retry attempts.`,
        '',
        `Job URL: ${job.url}`,
        `${errorDetail}`,
        `Latency: ${execution.latency_ms}ms`,
        `Attempt: ${execution.attempt}`,
        `Started: ${execution.started_at}`,
        `Finished: ${execution.finished_at}`,
      ].join('\n'),
      html: [
        `<h2>Cron Job Failure</h2>`,
        `<p>Job <strong>${job.name}</strong> failed after all retry attempts.</p>`,
        `<table style="border-collapse:collapse;">`,
        `<tr><td style="padding:4px 8px;font-weight:bold;">URL</td><td style="padding:4px 8px;">${job.url}</td></tr>`,
        `<tr><td style="padding:4px 8px;font-weight:bold;">${execution.error ? 'Error' : 'Status'}</td><td style="padding:4px 8px;">${execution.error || execution.status_code}</td></tr>`,
        `<tr><td style="padding:4px 8px;font-weight:bold;">Latency</td><td style="padding:4px 8px;">${execution.latency_ms}ms</td></tr>`,
        `<tr><td style="padding:4px 8px;font-weight:bold;">Attempt</td><td style="padding:4px 8px;">${execution.attempt}</td></tr>`,
        `<tr><td style="padding:4px 8px;font-weight:bold;">Started</td><td style="padding:4px 8px;">${execution.started_at}</td></tr>`,
        `<tr><td style="padding:4px 8px;font-weight:bold;">Finished</td><td style="padding:4px 8px;">${execution.finished_at}</td></tr>`,
        `</table>`,
      ].join('\n'),
    });
  } catch (err) {
    console.error(`Email notification failed for job ${job.id} to ${to}:`, err);
  }
}

async function notifyFailure(job: JobInfo, execution: Execution): Promise<void> {
  // Determine notification targets: per-job overrides, then defaults
  const notifyUrl =
    job.notify_url || getSetting('default_notify_url') || '';
  const notifyEmail =
    job.notify_email || getSetting('default_notify_email') || '';

  const promises: Promise<void>[] = [];

  if (notifyUrl) {
    promises.push(sendWebhook(notifyUrl, job, execution));
  }

  if (notifyEmail) {
    promises.push(sendEmail(notifyEmail, job, execution));
  }

  if (promises.length > 0) {
    await Promise.allSettled(promises);
  }
}

export { notifyFailure };
