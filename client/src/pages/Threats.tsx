import { useEffect, useMemo, useState } from "react";
import {
  CircleAlert,
  CircleCheckBig,
  Loader2,
  Plus,
  Radar,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableData } from "@/hooks/useTableData";
import { requireSupabase } from "@/lib/supabase";
import {
  SEVERITIES,
  formatDateTime,
  formatRelative,
  friendlyDataError,
  severityClass,
  severityLabel,
  type Severity,
  type ThreatRow,
} from "@/lib/aegis";

export default function Threats() {
  const threats = useTableData<ThreatRow>("threats");
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const [draftSeverity, setDraftSeverity] = useState<Severity>("medium");
  const [recording, setRecording] = useState(false);

  // Realtime: refresh the feed whenever a threat row changes for this user.
  useEffect(() => {
    let channel: { unsubscribe: () => void } | null = null;
    try {
      const client = requireSupabase();
      channel = client
        .channel("aegis-threats")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "threats" },
          () => {
            void threats.refresh();
          }
        )
        .subscribe();
    } catch {
      /* Realtime is optional — the initial fetch still works. */
    }
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [threats.refresh]);

  const filtered = useMemo(
    () => (filter === "all" ? threats.rows : threats.rows.filter((threat) => threat.severity === filter)),
    [threats.rows, filter]
  );

  const counts = useMemo(() => {
    const base: Record<string, number> = {};
    for (const severity of SEVERITIES) base[severity] = 0;
    for (const threat of threats.rows) {
      base[threat.severity] = (base[threat.severity] ?? 0) + 1;
    }
    return base;
  }, [threats.rows]);

  const recordSignal = async () => {
    if (recording) return;
    setRecording(true);
    try {
      const client = requireSupabase();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) throw new Error("Your session has expired. Please sign in again.");

      const { error } = await client.from("threats").insert({
        user_id: auth.user.id,
        severity: draftSeverity,
        source: "Manual signal",
        description: "Signal recorded manually from the threat monitor.",
      });
      if (error) throw error;
      await threats.refresh();
      toast.success("Signal recorded.");
    } catch (caught) {
      if (caught instanceof Error && caught.message.startsWith("Your session")) {
        toast.error(caught.message);
      } else {
        toast.error(friendlyDataError(caught, "threats"));
      }
    } finally {
      setRecording(false);
    }
  };

  return (
    <AppShell current="/threats">
      <div className="app-page-head">
        <div>
          <span className="kicker">
            <ShieldAlert size={13} /> Workspace / Threats
          </span>
          <h1>Threat Monitor</h1>
          <p>
            A live feed of the signals recorded against your workspace. The list refreshes the moment
            a new signal arrives.
          </p>
        </div>
        <div className="app-page-head__actions">
          <Select value={draftSeverity} onValueChange={(value) => setDraftSeverity(value as Severity)}>
            <SelectTrigger className="w-[150px]" aria-label="Signal severity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {severityLabel(severity)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => void recordSignal()} disabled={recording}>
            {recording ? <Loader2 className="animate-spin" /> : <Plus />}
            Record signal
          </Button>
        </div>
      </div>

      <div className="filters" style={{ marginBottom: 15 }}>
        <div className="chips" role="group" aria-label="Filter by severity">
          <button
            type="button"
            className={`chip ${filter === "all" ? "is-active" : ""}`}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
          >
            All ({threats.rows.length})
          </button>
          {SEVERITIES.map((severity) => (
            <button
              key={severity}
              type="button"
              className={`chip ${filter === severity ? "is-active" : ""}`}
              onClick={() => setFilter(severity)}
              aria-pressed={filter === severity}
            >
              {severityLabel(severity)} ({counts[severity] ?? 0})
            </button>
          ))}
        </div>
        <Button variant="outline" type="button" onClick={() => void threats.refresh()} disabled={threats.loading}>
          {threats.loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Refresh
        </Button>
      </div>

      {threats.loading ? (
        <section className="panel">
          <div className="empty-state">
            <Loader2 size={20} className="spin" />
            <p>Loading the threat feed…</p>
          </div>
        </section>
      ) : threats.error ? (
        <section className="panel">
          <div className="empty-state empty-state--error">
            <CircleAlert size={22} />
            <h3>We couldn&apos;t load the threat feed</h3>
            <p>{threats.error}</p>
            <button className="button button--outline-dark button--small" type="button" onClick={() => void threats.refresh()}>
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        </section>
      ) : filtered.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            <CircleCheckBig size={22} />
            <h3>All clear</h3>
            <p>
              {filter === "all"
                ? "No threat signals have been recorded. We'll surface anything new here."
                : `No ${severityLabel(filter).toLowerCase()} signals right now. Try a different filter.`}
            </p>
          </div>
        </section>
      ) : (
        <section className="panel-grid panel-grid--3">
          {filtered.map((threat) => (
            <article className="panel" key={threat.id}>
              <div className="panel__head">
                <span className={severityClass(threat.severity)}>{severityLabel(threat.severity)}</span>
                <span className="kicker">{formatRelative(threat.created_at)}</span>
              </div>
              <div className="panel__body">
                <h3 className="panel__title">
                  <Radar size={15} /> {threat.source}
                </h3>
                <p className="panel__note">{threat.description || "No additional context recorded."}</p>
                <span className="kicker" style={{ marginTop: 12 }}>
                  {formatDateTime(threat.created_at)}
                </span>
              </div>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
