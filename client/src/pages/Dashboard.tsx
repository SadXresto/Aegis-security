import { CSSProperties, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CircleAlert,
  CircleCheckBig,
  Gauge,
  KeyRound,
  Loader2,
  Radar,
  RefreshCw,
  ScanSearch,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useTableData } from "@/hooks/useTableData";
import { requireSupabase } from "@/lib/supabase";
import {
  computeSecurityScore,
  formatDate,
  formatRelative,
  friendlyDataError,
  getDisplayName,
  getLastSignIn,
  normalizeSeverity,
  scoreSummary,
  severityClass,
  severityLabel,
  severityRank,
  type ReportRow,
  type ThreatRow,
} from "@/lib/aegis";

export default function Dashboard() {
  const { user } = useAuth();
  const reports = useTableData<ReportRow>("reports");
  const threats = useTableData<ThreatRow>("threats");
  const [scanning, setScanning] = useState(false);

  const score = useMemo(
    () => computeSecurityScore({ reports: reports.rows, threats: threats.rows }),
    [reports.rows, threats.rows]
  );
  const summary = scoreSummary(score);
  const loading = reports.loading || threats.loading;
  const loadError = reports.error ?? threats.error;
  const displayName = getDisplayName(user);
  const lastSignIn = getLastSignIn(user);

  const openReports = useMemo(
    () => reports.rows.filter((report) => report.status !== "resolved").length,
    [reports.rows]
  );

  const highestSeverity = useMemo(() => {
    const all = [...reports.rows, ...threats.rows].map((item) => normalizeSeverity(item.severity));
    if (all.length === 0) return null;
    return all.reduce((worst, current) =>
      severityRank(current) < severityRank(worst) ? current : worst
    );
  }, [reports.rows, threats.rows]);

  const activity = useMemo(() => {
    const items = [
      ...reports.rows.map((report) => ({
        id: `report-${report.id}`,
        kind: "report" as const,
        severity: report.severity,
        title: report.type,
        detail: report.description || "Security report recorded.",
        createdAt: report.created_at,
      })),
      ...threats.rows.map((threat) => ({
        id: `threat-${threat.id}`,
        kind: "threat" as const,
        severity: threat.severity,
        title: threat.source,
        detail: threat.description || "Threat signal recorded.",
        createdAt: threat.created_at,
      })),
    ];
    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [reports.rows, threats.rows]);

  const refreshAll = async () => {
    await Promise.all([reports.refresh(), threats.refresh()]);
  };

  const runScan = async () => {
    if (scanning) return;
    setScanning(true);
    try {
      const client = requireSupabase();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) throw new Error("Your session has expired. Please sign in again.");

      const severity = threats.rows.some((threat) => threat.severity === "critical")
        ? "critical"
        : threats.rows.length > 0
          ? "medium"
          : "low";

      const { error } = await client.from("reports").insert({
        user_id: auth.user.id,
        type: "Vulnerability scan",
        severity,
        status: "open",
        description: "Manual scan requested from the dashboard.",
      });
      if (error) throw error;

      await refreshAll();
      toast.success("Scan complete", {
        description: "The result was saved to your security reports.",
      });
    } catch (caught) {
      if (caught instanceof Error && caught.message.startsWith("Your session")) {
        toast.error(caught.message);
      } else {
        toast.error(friendlyDataError(caught, "reports"));
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <AppShell current="/dashboard">
      <div className="app-page-head">
        <div>
          <span className="kicker">
            <ShieldCheck size={13} /> Workspace / Overview
          </span>
          <h1>Welcome back, {displayName}.</h1>
          <p>
            Your live security posture across reports, threat signals, and the password vault.
            Everything here is scoped to your account.
          </p>
        </div>
        <div className="app-page-head__actions">
          <button className="button button--lime" type="button" onClick={runScan} disabled={scanning}>
            {scanning ? <Loader2 size={16} className="spin" /> : <ScanSearch size={16} />}
            {scanning ? "Scanning…" : "Run scan"}
          </button>
          <a className="button button--outline-dark" href="/reports">
            View reports <ArrowUpRight size={15} />
          </a>
        </div>
      </div>

      {loadError && (
        <div className="panel" style={{ marginBottom: 13 }}>
          <div className="panel__body empty-state empty-state--error">
            <CircleAlert size={22} />
            <h3>We couldn&apos;t load your workspace data</h3>
            <p>{loadError}</p>
            <button className="button button--outline-dark button--small" type="button" onClick={() => void refreshAll()}>
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        </div>
      )}

      <section className="stat-grid" aria-label="Security statistics">
        <article className="stat-card">
          <div className="stat-card__top">
            <span className="kicker">Total scans</span>
            <span className="stat-card__icon">
              <ScanSearch size={15} />
            </span>
          </div>
          <strong>{loading ? "—" : reports.rows.length}</strong>
          <small>{openReports} still open</small>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <span className="kicker">Threats on record</span>
            <span className="stat-card__icon">
              <Radar size={15} />
            </span>
          </div>
          <strong>{loading ? "—" : threats.rows.length}</strong>
          <small>Live signals from the monitor</small>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <span className="kicker">Security score</span>
            <span className="stat-card__icon">
              <Gauge size={15} />
            </span>
          </div>
          <strong>{loading ? "—" : score}</strong>
          <small>{summary.label}</small>
        </article>

        <article className="stat-card stat-card--warn">
          <div className="stat-card__top">
            <span className="kicker">Last login</span>
            <span className="stat-card__icon">
              <Activity size={15} />
            </span>
          </div>
          <strong>{lastSignIn ? formatDate(lastSignIn) : "—"}</strong>
          <small>{lastSignIn ? formatRelative(lastSignIn) : "This session"}</small>
        </article>
      </section>

      <div className="panel-grid panel-grid--main" style={{ marginTop: 13 }}>
        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">
              <Gauge size={16} /> Security score
            </h2>
            <span className="kicker">Aegis / index</span>
          </div>
          <div className="panel__body">
            <div className="gauge" style={{ "--gauge-score": score } as CSSProperties}>
              <div className="gauge__ring" role="img" aria-label={`Security score ${score} out of 100`}>
                <span className="gauge__value">
                  {score}
                  <small>/ 100</small>
                </span>
              </div>
              <div className="gauge__copy">
                <strong>{summary.label}</strong>
                <p>{summary.copy}</p>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="field-row" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span className="field-row__label">Open reports</span>
                <strong>{loading ? "—" : openReports}</strong>
              </div>
              <div className="field-row" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span className="field-row__label">Live threats</span>
                <strong>{loading ? "—" : threats.rows.length}</strong>
              </div>
              <div className="field-row" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span className="field-row__label">Highest severity</span>
                <strong>
                  {highestSeverity ? (
                    <span className={severityClass(highestSeverity)}>
                      {severityLabel(highestSeverity)}
                    </span>
                  ) : (
                    "None"
                  )}
                </strong>
              </div>
            </div>

            <p className="panel__note">
              The score starts at 100 and subtracts a weight for each open report and live threat.
              It is a directional signal, not a guarantee.
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2 className="panel__title">
              <Activity size={16} /> Recent activity
            </h2>
            <span className="kicker">Latest 5</span>
          </div>
          <div className="panel__body panel__body--flush">
            {loading ? (
              <div className="empty-state">
                <Loader2 size={20} className="spin" />
                <p>Loading activity…</p>
              </div>
            ) : activity.length === 0 ? (
              <div className="empty-state">
                <CircleCheckBig size={22} />
                <h3>All clear</h3>
                <p>Nothing has been recorded yet. Run a scan to create your first entry.</p>
              </div>
            ) : (
              <div className="activity-feed">
                {activity.map((item) => (
                  <div className="activity-item" key={item.id}>
                    <span
                      className={`activity-item__icon ${
                        item.severity === "critical" || item.severity === "high"
                          ? "activity-item__icon--warn"
                          : "activity-item__icon--good"
                      }`}
                    >
                      {item.kind === "threat" ? <Radar size={14} /> : <BookOpen size={14} />}
                    </span>
                    <span className="activity-item__body">
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </span>
                    <span className="activity-item__time">{formatRelative(item.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel-grid panel-grid--3" style={{ marginTop: 13 }}>
        <a className="panel" href="/reports" style={{ display: "block" }}>
          <div className="panel__body">
            <h2 className="panel__title">
              <BookOpen size={16} /> View reports
            </h2>
            <p className="panel__note">
              Filter the full audit trail by date, type, and severity, then export it as CSV.
            </p>
          </div>
        </a>
        <a className="panel" href="/passwords" style={{ display: "block" }}>
          <div className="panel__body">
            <h2 className="panel__title">
              <KeyRound size={16} /> Manage passwords
            </h2>
            <p className="panel__note">
              Keep encrypted credentials and their strength ratings in one place.
            </p>
          </div>
        </a>
        <a className="panel" href="/settings" style={{ display: "block" }}>
          <div className="panel__body">
            <h2 className="panel__title">
              <Settings size={16} /> Settings
            </h2>
            <p className="panel__note">
              Update your profile, security options, notifications, and appearance.
            </p>
          </div>
        </a>
      </section>
    </AppShell>
  );
}
