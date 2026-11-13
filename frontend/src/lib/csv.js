/**
 * Safe CSV generation for downloads.
 *
 * Spreadsheet apps execute cells that start with = + - @ (or tab / CR) as formulas.
 * Values here can originate from an uploaded file, so every cell is neutralised
 * with a leading apostrophe and quoted (OWASP "CSV injection" guidance).
 */
const FORMULA_START = /^\s*[=+\-@]|^[\t\r]/;

export function csvSafeCell(value) {
  let s = value === null || value === undefined ? "" : String(value);
  if (FORMULA_START.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows) {
  // BOM so Excel opens UTF-8 names correctly.
  return "\uFEFF" + rows.map((r) => r.map(csvSafeCell).join(",")).join("\r\n") + "\r\n";
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(fileName, rows) {
  downloadBlob(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }), fileName);
}
