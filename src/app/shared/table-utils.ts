// ── Shared table helpers: CSV export, print, status pills ──

export function exportCsv(filename: string, headers: string[], rows: string[][]): void {
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.replace(/\s+/g, '-').toLowerCase() + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function printTable(title: string, headers: string[], rows: string[][]): void {
  const th = headers.map(h => `<th>${h}</th>`).join('');
  const trs = rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('');
  const html = `<!doctype html><html><head><title>${title} — HNPCL EMS</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 28px; color: #221a1c; }
    h1 { font-size: 19px; margin: 0 0 2px; color: #8A1E32; }
    .sub { font-size: 11px; color: #777; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #8A1E32; color: #fff; text-align: left; padding: 7px 9px; }
    td { padding: 7px 9px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) td { background: #faf7f8; }
  </style></head><body>
  <h1>${title}</h1>
  <div class="sub">HNPCL — Contract Employees Management System &middot; Generated on ${new Date().toLocaleString('en-IN')}</div>
  <table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>
  <script>window.onload = () => { window.print(); }</script>
  </body></html>`;
  const w = window.open('', '_blank', 'width=1000,height=700');
  if (w) { w.document.write(html); w.document.close(); }
}

export function pillClass(status: string): string {
  const map: Record<string, string> = {
    'Active': 'pill-green', 'Current': 'pill-green', 'Declared': 'pill-green',
    'Open': 'pill-green', 'Completed': 'pill-green', 'Paid': 'pill-green', 'Trained': 'pill-green',
    'Expiring': 'pill-orange', 'Closing': 'pill-orange', 'Scheduled': 'pill-orange', 'Pending': 'pill-orange',
    'Expired': 'pill-red', 'Not Done': 'pill-red', 'Not Issued': 'pill-red', 'Overdue': 'pill-red',
    'Cancelled': 'pill-gray', 'Closed': 'pill-gray', 'Inactive': 'pill-gray', 'Disabled': 'pill-gray', 'Released': 'pill-gray',
    'Upcoming': 'pill-gold', 'Main Village': 'pill-gold', 'Renewed': 'pill-blue', 'Imported': 'pill-blue',
  };
  return map[status] || 'pill-gray';
}
