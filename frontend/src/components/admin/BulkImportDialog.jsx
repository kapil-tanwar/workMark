import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Download, FileSpreadsheet,
  KeyRound, Loader2, ShieldCheck, Upload, X, XCircle, Copy, Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { downloadCsv, downloadBlob } from "@/lib/csv";
import { downloadImportTemplate, getBulkImportSpec, previewBulkImport, runBulkImport } from "@/lib/api";
import { refreshStore } from "@/lib/store";

const PAGE_SIZE = 25;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;

/* Fallback shown instantly; replaced by the server's spec once loaded. */
const FALLBACK_COLUMNS = [
  { header: "Name", required: true, note: "Full name, up to 120 characters", example: "Aarav Sharma" },
  { header: "Employee ID", required: true, note: "2–32 characters, unique. Stored in upper case", example: "EMP-2001" },
  { header: "Phone", required: true, note: "7–20 characters, digits with optional + ( ) - . and spaces, unique", example: "+91 98765 43210" },
  { header: "Email", required: false, note: "Optional. Valid email format, unique", example: "aarav@company.com" },
  { header: "Department", required: false, note: "Optional, up to 120 characters", example: "Engineering" },
  { header: "Designation", required: false, note: "Optional, up to 120 characters", example: "Software Engineer" },
  { header: "Earned Leaves", required: false, note: "Optional number 0–365. Blank = this month's accrual", example: "12" },
  { header: "Comp-Off Leaves", required: false, note: "Optional number 0–365. Blank = 0", example: "2" },
];

const STATUS_STYLE = {
  valid:     { label: "Ready",     cls: "bg-success-soft text-tertiary", dot: "bg-tertiary" },
  invalid:   { label: "Invalid",   cls: "bg-danger-soft text-destructive", dot: "bg-destructive" },
  duplicate: { label: "Duplicate", cls: "bg-warning-soft text-warning", dot: "bg-warning" },
  imported:  { label: "Imported",  cls: "bg-success-soft text-tertiary", dot: "bg-tertiary" },
  failed:    { label: "Failed",    cls: "bg-danger-soft text-destructive", dot: "bg-destructive" },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.invalid;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap", s.cls)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function Tile({ label, value, tone = "default" }) {
  const tones = {
    default: "text-foreground",
    success: "text-tertiary",
    danger: "text-destructive",
    warning: "text-warning",
  };
  return (
    <div className="surface-inset px-4 py-3 min-w-0">
      <p className="eyebrow !text-[10px] truncate">{label}</p>
      <p className={cn("num font-headline text-2xl font-bold tracking-[-0.04em] mt-1", tones[tone])}>{value}</p>
    </div>
  );
}

function Steps({ step }) {
  const order = ["upload", "preview", "summary"];
  const active = step === "checking" ? "upload" : step === "importing" ? "preview" : step;
  const labels = { upload: "Upload", preview: "Review", summary: "Summary" };
  return (
    <ol className="flex items-center gap-2 text-xs font-semibold" aria-label="Import progress">
      {order.map((k, i) => {
        const done = order.indexOf(active) > i;
        const current = active === k;
        return (
          <li key={k} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
            <span className={cn(
              "size-5 rounded-full grid place-items-center text-[10px]",
              current ? "bg-primary text-primary-foreground" : done ? "bg-tertiary-fixed text-tertiary" : "bg-muted text-muted-foreground",
            )}>
              {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
            </span>
            <span className={current ? "text-foreground" : "text-muted-foreground"}>{labels[k]}</span>
            {i < order.length - 1 && <span className="w-6 h-px bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

export function BulkImportDialog({ open, onOpenChange }) {
  const [step, setStep] = useState("upload"); // upload | checking | preview | importing | summary
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const [spec, setSpec] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [downloading, setDownloading] = useState("");
  const inputRef = useRef(null);

  const busy = step === "checking" || step === "importing";
  const maxBytes = spec?.maxFileBytes ?? DEFAULT_MAX_BYTES;
  const maxRows = spec?.maxRows ?? 1000;
  const columns = spec?.columns ?? FALLBACK_COLUMNS;

  useEffect(() => {
    if (!open || spec) return;
    getBulkImportSpec().then(setSpec).catch(() => { /* fallback columns stay */ });
  }, [open, spec]);

  function reset() {
    setStep("upload"); setFile(null); setPreview(null); setResult(null);
    setFilter("all"); setPage(1); setFileError(""); setConfirmOpen(false); setDragOver(false);
  }

  function handleOpenChange(next) {
    if (busy) return; // never abandon an in-flight request
    if (!next) reset();
    onOpenChange(next);
  }

  function pickFile(f) {
    setFileError("");
    if (!f) return;
    if (!/\.(csv|xlsx)$/i.test(f.name)) {
      setFile(null);
      setFileError("Unsupported file type. Please choose a .csv or .xlsx file.");
      return;
    }
    if (f.size === 0) { setFile(null); setFileError("This file is empty."); return; }
    if (f.size > maxBytes) {
      setFile(null);
      setFileError(`File is too large (${formatBytes(f.size)}). The limit is ${formatBytes(maxBytes)}.`);
      return;
    }
    setFile(f);
  }

  async function handleTemplate(format) {
    setDownloading(format);
    try {
      const blob = await downloadImportTemplate(format);
      downloadBlob(blob, `workmark-employee-import-template.${format}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading("");
    }
  }

  async function handleCheck() {
    if (!file) return;
    setStep("checking");
    try {
      const data = await previewBulkImport(file);
      setPreview(data);
      setFilter(data.summary.invalid + data.summary.duplicates > 0 ? "problems" : "all");
      setPage(1);
      setStep("preview");
    } catch (err) {
      setFileError(err.message);
      setStep("upload");
    }
  }

  async function handleImport() {
    setConfirmOpen(false);
    setStep("importing");
    try {
      const data = await runBulkImport(file);
      setResult(data);
      setStep("summary");
      await refreshStore();
      if (data.summary.imported > 0) toast.success(`${data.summary.imported} employee${data.summary.imported !== 1 ? "s" : ""} imported`);
      else toast.info("No employees were imported");
    } catch (err) {
      toast.error(err.message);
      setStep("preview");
    }
  }

  /* ── derived ── */
  const rows = (step === "summary" ? result?.rows : preview?.rows) ?? [];
  const counts = useMemo(() => ({
    all: rows.length,
    problems: rows.filter((r) => !["valid", "imported"].includes(r.status)).length,
    ok: rows.filter((r) => ["valid", "imported"].includes(r.status)).length,
  }), [rows]);
  const filtered = rows.filter((r) =>
    filter === "all" ? true : filter === "problems" ? !["valid", "imported"].includes(r.status) : ["valid", "imported"].includes(r.status));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function downloadErrorReport() {
    const problems = (result?.rows ?? []).filter((r) => r.status !== "imported");
    downloadCsv("workmark-import-errors.csv", [
      ["Row", "Status", "Name", "Employee ID", "Email", "Phone", "Department", "Designation", "Reason"],
      ...problems.map((r) => [
        r.rowNumber, STATUS_STYLE[r.status]?.label ?? r.status, r.data.name, r.data.employeeId,
        r.data.email, r.data.phone, r.data.department, r.data.designation, r.errors.join("; "),
      ]),
    ]);
  }

  function invitationRows() {
    return (result?.invitations ?? []).map((i) => [i.employeeId, i.name, i.email, i.inviteUrl, new Date(i.expiresAt).toLocaleDateString()]);
  }
  function downloadInvitations() {
    downloadCsv("workmark-invitation-links.csv", [["Employee ID", "Name", "Email", "Invitation link", "Expires"], ...invitationRows()]);
  }
  async function copyInvitations() {
    const text = (result?.invitations ?? []).map((i) => `${i.name} (${i.employeeId}): ${i.inviteUrl}`).join("\n");
    try { await navigator.clipboard.writeText(text); toast.success("Invitation links copied"); }
    catch { toast.error("Could not copy — use the CSV download instead"); }
  }

  const validCount = preview?.summary.valid ?? 0;
  const skipCount = preview ? preview.summary.invalid + preview.summary.duplicates : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-5xl w-[calc(100%-1.5rem)] max-h-[92vh] p-0 gap-0 flex flex-col overflow-hidden"
          onInteractOutside={(e) => busy && e.preventDefault()}
          onEscapeKeyDown={(e) => busy && e.preventDefault()}
        >
          <DialogHeader className="px-6 sm:px-8 pt-6 pb-4 border-b border-border/50 space-y-3 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
              <div>
                <DialogTitle className="text-xl">Bulk import employees</DialogTitle>
                <DialogDescription className="mt-1.5">
                  Upload a CSV or Excel file. You will review every record before anything is created.
                </DialogDescription>
              </div>
              <Steps step={step} />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
            {/* ═════════ STEP 1 — upload ═════════ */}
            {(step === "upload" || step === "checking") && (
              <div className="space-y-6">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!busy) pickFile(e.dataTransfer.files?.[0]); }}
                  className={cn(
                    "rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
                    dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30",
                    fileError && "border-destructive/50",
                  )}
                >
                  {step === "checking" ? (
                    <div className="py-4 flex flex-col items-center gap-3" role="status" aria-live="polite">
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <p className="font-semibold">Reading and validating {file?.name}…</p>
                      <p className="text-sm text-muted-foreground">Checking required fields, formats and duplicates. Nothing is saved yet.</p>
                    </div>
                  ) : file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-12 rounded-2xl bg-primary-fixed text-on-primary-fixed grid place-items-center"><FileSpreadsheet className="size-6" /></div>
                      <div>
                        <p className="font-semibold break-all">{file.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{formatBytes(file.size)} · {file.name.toLowerCase().endsWith(".csv") ? "CSV" : "Excel"} file</p>
                      </div>
                      <button type="button" onClick={() => { setFile(null); setFileError(""); if (inputRef.current) inputRef.current.value = ""; }}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
                        <X className="size-4" /> Choose a different file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-12 rounded-2xl bg-muted border border-border grid place-items-center text-muted-foreground"><Upload className="size-5" /></div>
                      <div>
                        <p className="font-semibold">Drag a file here, or</p>
                        <button type="button" onClick={() => inputRef.current?.click()}
                          className="mt-2 btn-glow px-5 h-10 rounded-xl text-sm font-semibold">Browse files</button>
                      </div>
                      <p className="text-xs text-muted-foreground">.csv or .xlsx · up to {formatBytes(maxBytes)} · up to {maxRows.toLocaleString()} employees</p>
                    </div>
                  )}
                  <input ref={inputRef} type="file" accept=".csv,.xlsx" className="sr-only" aria-label="Choose employee file"
                    onChange={(e) => pickFile(e.target.files?.[0])} />
                </div>

                {fileError && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-danger-soft px-4 py-3 text-sm text-destructive">
                    <XCircle className="size-4 mt-0.5 shrink-0" /> <span>{fileError}</span>
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <h3 className="font-headline font-semibold text-[15px] mb-3">Expected columns</h3>
                    <div className="overflow-x-auto rounded-xl border border-border/60">
                      <table className="w-full text-left text-[13px]">
                        <thead>
                          <tr className="bg-muted/40 text-muted-foreground">
                            <th className="px-3 py-2 font-semibold">Column</th>
                            <th className="px-3 py-2 font-semibold">Required</th>
                            <th className="px-3 py-2 font-semibold">Format</th>
                            <th className="px-3 py-2 font-semibold hidden sm:table-cell">Example</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {columns.map((c) => (
                            <tr key={c.header}>
                              <td className="px-3 py-2 font-semibold whitespace-nowrap">{c.header}</td>
                              <td className="px-3 py-2">{c.required ? <span className="text-destructive font-semibold">Required</span> : <span className="text-muted-foreground">Optional</span>}</td>
                              <td className="px-3 py-2 text-muted-foreground">{c.note}</td>
                              <td className="px-3 py-2 font-mono text-xs hidden sm:table-cell whitespace-nowrap">{c.example || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3 lg:w-64">
                    <h3 className="font-headline font-semibold text-[15px]">Sample template</h3>
                    <p className="text-sm text-muted-foreground">Start from the template so your columns match exactly.</p>
                    <div className="flex gap-2">
                      {["xlsx", "csv"].map((f) => (
                        <button key={f} type="button" disabled={!!downloading || busy} onClick={() => handleTemplate(f)}
                          className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted disabled:opacity-60">
                          {downloading === f ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                          .{f}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
                      <ShieldCheck className="size-4 shrink-0 text-tertiary mt-0.5" />
                      <span>No passwords in the file. Each employee gets a secure, single-use invitation link to set their own. All imported accounts are employees.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════ STEP 2 — preview ═════════ */}
            {(step === "preview" || step === "importing") && preview && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="size-4" />
                  <span className="font-semibold text-foreground break-all">{preview.fileName}</span>
                  <span>· {preview.summary.total} record{preview.summary.total !== 1 ? "s" : ""} found</span>
                </div>
                {preview.unknownColumns?.length > 0 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    <Info className="size-4 mt-0.5 shrink-0" />
                    <span>Ignored unrecognised column{preview.unknownColumns.length > 1 ? "s" : ""}: {preview.unknownColumns.join(", ")}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Tile label="Total records" value={preview.summary.total} />
                  <Tile label="Valid" value={preview.summary.valid} tone="success" />
                  <Tile label="Invalid" value={preview.summary.invalid} tone={preview.summary.invalid ? "danger" : "default"} />
                  <Tile label="Duplicates" value={preview.summary.duplicates} tone={preview.summary.duplicates ? "warning" : "default"} />
                </div>
                <RecordsTable
                  rows={paged} filter={filter} setFilter={(f) => { setFilter(f); setPage(1); }} counts={counts}
                  page={safePage} totalPages={totalPages} setPage={setPage} total={filtered.length}
                />
              </div>
            )}

            {step === "importing" && (
              <div role="status" aria-live="polite" className="mt-5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3 text-sm">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="font-semibold">Importing {validCount} employee{validCount !== 1 ? "s" : ""}…</span>
                <span className="text-muted-foreground">Please keep this window open.</span>
              </div>
            )}

            {/* ═════════ STEP 3 — summary ═════════ */}
            {step === "summary" && result && (
              <div className="space-y-5">
                <div className={cn(
                  "flex items-start gap-3 rounded-2xl border px-5 py-4",
                  result.summary.imported > 0 ? "border-tertiary/30 bg-success-soft" : "border-warning/30 bg-warning-soft",
                )}>
                  {result.summary.imported > 0
                    ? <CheckCircle2 className="size-6 text-tertiary shrink-0" />
                    : <AlertTriangle className="size-6 text-warning shrink-0" />}
                  <div>
                    <p className="font-headline font-semibold text-base">
                      {result.summary.imported > 0
                        ? `${result.summary.imported} employee${result.summary.imported !== 1 ? "s" : ""} imported`
                        : "Nothing was imported"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {result.summary.failed + result.summary.duplicates > 0
                        ? `${result.summary.failed + result.summary.duplicates} record${result.summary.failed + result.summary.duplicates !== 1 ? "s were" : " was"} skipped — see the reasons below.`
                        : "Every record in the file was imported successfully."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Tile label="Records processed" value={result.summary.total} />
                  <Tile label="Imported" value={result.summary.imported} tone="success" />
                  <Tile label="Failed" value={result.summary.failed} tone={result.summary.failed ? "danger" : "default"} />
                  <Tile label="Duplicates" value={result.summary.duplicates} tone={result.summary.duplicates ? "warning" : "default"} />
                </div>

                {result.invitations.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-xl bg-primary-fixed text-on-primary-fixed grid place-items-center shrink-0"><KeyRound className="size-[18px]" /></div>
                      <div>
                        <p className="font-semibold">Send each employee their invitation link</p>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          Employees set their own password through this link. Links are single-use and expire in 7 days.
                          <strong className="text-foreground"> They are shown only now</strong> — download them before closing. You can issue a fresh link later from the employee list.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={downloadInvitations} className="btn-glow inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold">
                        <Download className="size-4" /> Download invitation links (CSV)
                      </button>
                      <button type="button" onClick={copyInvitations} className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-border text-sm font-semibold hover:bg-muted">
                        <Copy className="size-4" /> Copy all
                      </button>
                    </div>
                  </div>
                )}

                {counts.problems > 0 && (
                  <RecordsTable
                    rows={paged} filter={filter} setFilter={(f) => { setFilter(f); setPage(1); }} counts={counts}
                    page={safePage} totalPages={totalPages} setPage={setPage} total={filtered.length} summaryMode
                  />
                )}
              </div>
            )}
          </div>

          {/* ═════════ footer actions ═════════ */}
          <div className="shrink-0 px-6 sm:px-8 py-4 border-t border-border/50 bg-muted/30 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            {step === "upload" || step === "checking" ? (
              <>
                <button type="button" onClick={() => handleOpenChange(false)} disabled={busy}
                  className="px-5 h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-60">Cancel</button>
                <button type="button" onClick={handleCheck} disabled={!file || busy}
                  className="btn-glow px-6 h-11 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                  {step === "checking" && <Loader2 className="size-4 animate-spin" />}
                  Validate &amp; preview
                </button>
              </>
            ) : step === "preview" || step === "importing" ? (
              <>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setStep("upload"); setPreview(null); }} disabled={busy}
                    className="inline-flex items-center gap-1.5 px-4 h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-60">
                    <ArrowLeft className="size-4" /> Back
                  </button>
                  <button type="button" onClick={() => handleOpenChange(false)} disabled={busy}
                    className="px-4 h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-60">Cancel import</button>
                </div>
                <button type="button" onClick={() => setConfirmOpen(true)} disabled={busy || validCount === 0}
                  className="btn-glow px-6 h-11 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
                  {step === "importing" && <Loader2 className="size-4 animate-spin" />}
                  {validCount === 0 ? "No valid records to import" : `Import ${validCount} employee${validCount !== 1 ? "s" : ""}`}
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {counts.problems > 0 && (
                    <button type="button" onClick={downloadErrorReport}
                      className="inline-flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted">
                      <Download className="size-4" /> Download error report (CSV)
                    </button>
                  )}
                  <button type="button" onClick={reset}
                    className="px-4 h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted">Import another file</button>
                </div>
                <button type="button" onClick={() => handleOpenChange(false)} className="btn-glow px-8 h-11 rounded-xl text-sm font-semibold">Done</button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import {validCount} employee{validCount !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              {validCount} account{validCount !== 1 ? "s" : ""} will be created with the Employee role and a pending invitation.
              {skipCount > 0 && <> <strong>{skipCount} record{skipCount !== 1 ? "s" : ""}</strong> with problems will be skipped.</>}
              {" "}The file is checked again on the server before anything is saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review again</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>Confirm import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── Records table with filter tabs + pagination ── */
function RecordsTable({ rows, filter, setFilter, counts, page, totalPages, setPage, total, summaryMode }) {
  const tabs = [
    { id: "all", label: "All", n: counts.all },
    { id: "problems", label: "Needs attention", n: counts.problems },
    { id: "ok", label: summaryMode ? "Imported" : "Ready", n: counts.ok },
  ];
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-muted/40 border-b border-border/60">
        <div className="flex gap-1" role="tablist" aria-label="Filter records">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={filter === t.id} type="button" onClick={() => setFilter(t.id)}
              className={cn("px-3 h-8 rounded-lg text-xs font-semibold transition-colors",
                filter === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {t.label} <span className="num opacity-70">{t.n}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{total} shown</p>
      </div>
      <div className="overflow-auto max-h-[46vh]">
        <table className="w-full text-left text-[13px] min-w-[760px]">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur text-muted-foreground">
            <tr>
              {["Row", "Status", "Name", "Employee ID", "Email", "Phone", "Department", "Issues"].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">No records in this view.</td></tr>
            ) : rows.map((r) => {
              const bad = !["valid", "imported"].includes(r.status);
              return (
                <tr key={r.rowNumber} className={cn(bad && "bg-destructive/[0.04]")}>
                  <td className="px-3 py-2.5 num text-muted-foreground">{r.rowNumber}</td>
                  <td className="px-3 py-2.5"><StatusPill status={r.status} /></td>
                  <td className="px-3 py-2.5 font-semibold max-w-[160px] truncate" title={r.data.name}>{r.data.name || <em className="text-muted-foreground font-normal">missing</em>}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{r.data.employeeId || <em className="text-muted-foreground font-sans">missing</em>}</td>
                  <td className="px-3 py-2.5 max-w-[180px] truncate" title={r.data.email}>{r.data.email || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{r.data.phone || <em className="text-muted-foreground">missing</em>}</td>
                  <td className="px-3 py-2.5">{r.data.department || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2.5 min-w-[220px]">
                    {r.errors.length === 0 ? <span className="text-muted-foreground">—</span> : (
                      <ul className="space-y-0.5 text-destructive">
                        {r.errors.map((e, i) => <li key={i} className="flex gap-1.5"><span aria-hidden="true">•</span><span>{e}</span></li>)}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/60 bg-muted/30">
          <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-1.5">
            <button type="button" aria-label="Previous page" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft className="size-4" /></button>
            <button type="button" aria-label="Next page" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
