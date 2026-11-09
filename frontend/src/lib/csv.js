const esc = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // block spreadsheet formula execution
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function downloadCSV(filename, headers, rows) {
  const text = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
