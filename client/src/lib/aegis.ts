/**
 * Aegis domain helpers.
 *
 * Small, dependency-free utilities shared by the authenticated workspace pages:
 * user field readers, severity/status metadata, the security-score formula,
 * formatting, CSV export, password-strength scoring, and friendly database
 * error messages (raw PostgREST/Postgres text never reaches the user).
 */

import { format, formatDistanceToNow } from "date-fns";

/* ------------------------------------------------------------------ *
 * User field readers (Supabase `User` is exposed as a loose record)
 * ------------------------------------------------------------------ */

export function getMetadata(user: Record<string, unknown> | null): Record<string, unknown> {
  const meta = user?.user_metadata;
  return meta && typeof meta === "object" ? (meta as Record<string, unknown>) : {};
}

export function getEmail(user: Record<string, unknown> | null): string {
  const email = user?.email;
  return typeof email === "string" ? email : "";
}

export function getDisplayName(user: Record<string, unknown> | null): string {
  const meta = getMetadata(user);
  const fullName = meta.full_name ?? meta.name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  const email = getEmail(user);
  return email ? email.split("@")[0] : "Agent";
}

export function getInitials(user: Record<string, unknown> | null): string {
  const name = getDisplayName(user);
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function isEmailVerified(user: Record<string, unknown> | null): boolean {
  return Boolean(user?.email_confirmed_at ?? user?.confirmed_at);
}

export function getLastSignIn(user: Record<string, unknown> | null): string | null {
  const value = user?.last_sign_in_at;
  return typeof value === "string" ? value : null;
}

/* ------------------------------------------------------------------ *
 * Row shapes for the Aegis tables (mirrors the SQL migration)
 * ------------------------------------------------------------------ */

export type ReportRow = {
  id: string;
  user_id: string;
  type: string;
  severity: string;
  status: string;
  description: string | null;
  created_at: string;
};

export type ThreatRow = {
  id: string;
  user_id: string;
  severity: string;
  source: string;
  description: string | null;
  created_at: string;
};

export type VaultRow = {
  id: string;
  user_id: string;
  site: string;
  username: string | null;
  password_encrypted: string | null;
  strength: string;
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------------------------ *
 * Reports / threats metadata
 * ------------------------------------------------------------------ */

export const SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const REPORT_STATUSES = ["open", "in_progress", "resolved"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_TYPES = [
  "Vulnerability scan",
  "Access review",
  "Configuration audit",
  "Dependency check",
  "Phishing review",
] as const;

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 14,
  high: 9,
  medium: 5,
  low: 2,
};

export function severityLabel(value: string): string {
  return SEVERITY_LABEL[value as Severity] ?? value;
}

export function severityClass(value: string): string {
  return SEVERITIES.includes(value as Severity) ? `sev sev--${value}` : "sev sev--low";
}

export function statusLabel(value: string): string {
  return STATUS_LABEL[value as ReportStatus] ?? value;
}

export function statusClass(value: string): string {
  return REPORT_STATUSES.includes(value as ReportStatus) ? `status status--${value}` : "status";
}

/** Normalizes a free-text severity into a known value, defaulting to "low". */
export function normalizeSeverity(value: string): Severity {
  const lower = value.trim().toLowerCase();
  return (SEVERITIES as readonly string[]).includes(lower) ? (lower as Severity) : "low";
}

export function severityRank(value: string): number {
  const index = SEVERITIES.indexOf(normalizeSeverity(value));
  return index === -1 ? SEVERITIES.length : index;
}

/* ------------------------------------------------------------------ *
 * Security score
 * ------------------------------------------------------------------ */

export type ScoreInput = {
  reports: { severity: string; status: string }[];
  threats: { severity: string }[];
};

/**
 * Starts at 100 and subtracts a weight per unresolved report and per threat.
 * A simple, explainable formula — never presented as a guarantee.
 */
export function computeSecurityScore({ reports, threats }: ScoreInput): number {
  let score = 100;
  for (const report of reports) {
    if (report.status === "resolved") continue;
    score -= SEVERITY_WEIGHT[normalizeSeverity(report.severity)];
  }
  for (const threat of threats) {
    score -= SEVERITY_WEIGHT[normalizeSeverity(threat.severity)];
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreSummary(score: number): { label: string; copy: string } {
  if (score >= 90) {
    return { label: "Strong posture", copy: "Nothing urgent needs attention right now." };
  }
  if (score >= 70) {
    return { label: "Building a baseline", copy: "A few items are worth a closer look." };
  }
  if (score >= 45) {
    return { label: "Needs attention", copy: "Several open items are lowering your score." };
  }
  return { label: "Act soon", copy: "Resolve the highest-severity items first." };
}

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "d MMM yyyy, HH:mm");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "d MMM yyyy");
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

/** Value for an <input type="date"> lower bound, N days back from today. */
export function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return format(date, "yyyy-MM-dd");
}

/* ------------------------------------------------------------------ *
 * CSV export (client-side)
 * ------------------------------------------------------------------ */

export function exportCsv(
  filename: string,
  header: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const escape = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ *
 * Password strength (client-side only — never sent anywhere)
 * ------------------------------------------------------------------ */

export type StoredStrength = "weak" | "fair" | "good" | "strong";

export function passwordStrength(password: string): {
  level: number;
  label: string;
  stored: StoredStrength;
} {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const level = Math.min(4, score);
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  const stored: StoredStrength[] = ["weak", "weak", "fair", "good", "strong"];
  return { level, label: labels[level], stored: stored[level] };
}

/* ------------------------------------------------------------------ *
 * Friendly database errors
 * ------------------------------------------------------------------ */

export function friendlyDataError(caught: unknown, table?: string): string {
  const error = caught as { code?: string; message?: string } | null;
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  const tableName = table ? `"${table}"` : "required";

  if (code === "42P01" || code === "PGRST205" || /relation .* does not exist|schema cache/i.test(message)) {
    return `The ${tableName} table isn't set up yet. Run the Aegis SQL migration in your Supabase project, then try again.`;
  }
  if (code === "42501" || /row-level security|permission denied/i.test(message)) {
    return "This account doesn't have permission to change that record.";
  }
  if (code === "23514" || /violates check constraint/i.test(message)) {
    return "That value isn't allowed. Check the form and try again.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "That record is linked to something else and can't be changed.";
  }
  if (/failed to fetch|networkerror|fetch failed|load failed/i.test(message)) {
    return "We couldn't reach the database. Check your connection and try again.";
  }
  return "Something went wrong saving that. Please try again.";
}

