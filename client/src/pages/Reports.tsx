import { useMemo, useState } from "react";
import {
  CircleAlert,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTableData } from "@/hooks/useTableData";
import { requireSupabase } from "@/lib/supabase";
import {
  REPORT_TYPES,
  SEVERITIES,
  exportCsv,
  formatDateTime,
  friendlyDataError,
  severityClass,
  severityLabel,
  statusClass,
  statusLabel,
  type ReportRow,
} from "@/lib/aegis";

type Filters = { from: string; to: string; type: string; severity: string };

const EMPTY_FILTERS: Filters = { from: "", to: "", type: "all", severity: "all" };

export default function Reports() {
  const reports = useTableData<ReportRow>("reports");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ReportRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return reports.rows.filter((report) => {
      if (filters.type !== "all" && report.type !== filters.type) return false;
      if (filters.severity !== "all" && report.severity !== filters.severity) return false;
      const createdAt = new Date(report.created_at).getTime();
      if (filters.from && createdAt < new Date(`${filters.from}T00:00:00`).getTime()) return false;
      if (filters.to && createdAt > new Date(`${filters.to}T23:59:59`).getTime()) return false;
      return true;
    });
  }, [reports.rows, filters]);

  const filtersActive =
    filters.from !== "" || filters.to !== "" || filters.type !== "all" || filters.severity !== "all";

  const updateStatus = async (report: ReportRow) => {
    if (busyId) return;
    setBusyId(report.id);
    try {
      const next = report.status === "resolved" ? "open" : "resolved";
      const { error } = await requireSupabase()
        .from("reports")
        .update({ status: next })
        .eq("id", report.id);
      if (error) throw error;
      await reports.refresh();
      toast.success(next === "resolved" ? "Report marked as resolved." : "Report reopened.");
    } catch (caught) {
      toast.error(friendlyDataError(caught, "reports"));
    } finally {
      setBusyId(null);
    }
  };

  const deleteReport = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const { error } = await requireSupabase()
        .from("reports")
        .delete()
        .eq("id", pendingDelete.id);
      if (error) throw error;
      await reports.refresh();
      setPendingDelete(null);
      toast.success("Report deleted.");
    } catch (caught) {
      toast.error(friendlyDataError(caught, "reports"));
    } finally {
      setDeleting(false);
    }
  };

  const exportFiltered = () => {
    if (filtered.length === 0) {
      toast.error("There is nothing to export yet.");
      return;
    }
    exportCsv(
      `aegis-reports-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Type", "Severity", "Status", "Description"],
      filtered.map((report) => [
        formatDateTime(report.created_at),
        report.type,
        severityLabel(report.severity),
        statusLabel(report.status),
        report.description ?? "",
      ])
    );
    toast.success(`Exported ${filtered.length} report${filtered.length === 1 ? "" : "s"}.`);
  };

  return (
    <AppShell current="/reports">
      <div className="app-page-head">
        <div>
          <span className="kicker">
            <FileText size={13} /> Workspace / Reports
          </span>
          <h1>Security Reports</h1>
          <p>
            Every scan and review recorded against your workspace. Filter the audit trail, change a
            status, or export the current view as CSV.
          </p>
        </div>
        <div className="app-page-head__actions">
          <Button variant="outline" type="button" onClick={() => void reports.refresh()} disabled={reports.loading}>
            {reports.loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Refresh
          </Button>
          <Button type="button" onClick={exportFiltered}>
            <Download />
            Export CSV
          </Button>
        </div>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">
            <FileText size={16} /> Audit trail
          </h2>
          <div className="filters">
            <Input
              type="date"
              aria-label="From date"
              value={filters.from}
              onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
              className="w-[152px]"
            />
            <Input
              type="date"
              aria-label="To date"
              value={filters.to}
              onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
              className="w-[152px]"
            />
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters((current) => ({ ...current, type: value }))}
            >
              <SelectTrigger className="w-[178px]" aria-label="Filter by type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.severity}
              onValueChange={(value) => setFilters((current) => ({ ...current, severity: value }))}
            >
              <SelectTrigger className="w-[168px]" aria-label="Filter by severity">
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                {SEVERITIES.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {severityLabel(severity)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              disabled={!filtersActive}
            >
              <RotateCcw />
              Reset
            </Button>
          </div>
        </div>

        <div className="panel__body panel__body--flush">
          {reports.loading ? (
            <div className="empty-state">
              <Loader2 size={20} className="spin" />
              <p>Loading your reports…</p>
            </div>
          ) : reports.error ? (
            <div className="empty-state empty-state--error">
              <CircleAlert size={22} />
              <h3>We couldn&apos;t load your reports</h3>
              <p>{reports.error}</p>
              <button className="button button--outline-dark button--small" type="button" onClick={() => void reports.refresh()}>
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <FileText size={22} />
              <h3>No reports yet</h3>
              <p>
                {filtersActive
                  ? "No reports match the current filters. Try widening the date range or clearing them."
                  : "Run a scan from the dashboard and the result will appear here."}
              </p>
              <a className="button button--outline-dark button--small" href="/dashboard">
                Go to dashboard
              </a>
            </div>
          ) : (
            <div className="table-scroll">
              <Table className="app-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead style={{ textAlign: "right" }}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{formatDateTime(report.created_at)}</TableCell>
                      <TableCell>
                        <span className="app-table__primary">
                          <strong>{report.type}</strong>
                          {report.description && <span>{report.description}</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={severityClass(report.severity)}>{severityLabel(report.severity)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={statusClass(report.status)}>
                          <i aria-hidden="true" />
                          {statusLabel(report.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => void updateStatus(report)}
                            disabled={busyId === report.id}
                          >
                            {busyId === report.id && <Loader2 className="animate-spin" />}
                            {report.status === "resolved" ? "Reopen" : "Resolve"}
                          </Button>
                          <button
                            className="icon-button icon-button--danger"
                            type="button"
                            aria-label={`Delete ${report.type}`}
                            onClick={() => setPendingDelete(report)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this report?"
        description={
          pendingDelete
            ? `“${pendingDelete.type}” from ${formatDateTime(pendingDelete.created_at)} will be permanently removed.`
            : ""
        }
        confirmLabel="Delete report"
        destructive
        pending={deleting}
        onConfirm={deleteReport}
      />
    </AppShell>
  );
}
