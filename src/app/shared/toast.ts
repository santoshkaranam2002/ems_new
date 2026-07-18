// ── Global toast notifications (success / error / info) ──────────
// Pure DOM implementation: works everywhere, no change detection needed.

let containerEl: HTMLDivElement | null = null;

function ensureContainer(): HTMLDivElement {
  if (containerEl && document.body.contains(containerEl)) { return containerEl; }
  containerEl = document.createElement('div');
  containerEl.id = 'ems-toast-container';
  containerEl.style.cssText = [
    'position:fixed', 'top:18px', 'right:18px', 'z-index:99999',
    'display:flex', 'flex-direction:column', 'gap:10px',
    'pointer-events:none', 'max-width:360px'
  ].join(';');
  document.body.appendChild(containerEl);
  return containerEl;
}

const ICONS: { [k: string]: string } = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="17" height="17"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="17" height="17"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="17" height="17"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

const COLORS: { [k: string]: { bg: string; border: string; icon: string } } = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: '#16a34a' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: '#dc2626' },
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: '#2563eb' }
};

function showToast(message: string, type: 'success' | 'error' | 'info'): void {
  const c = ensureContainer();
  const t = COLORS[type];
  const el = document.createElement('div');
  el.style.cssText = [
    'pointer-events:auto', 'display:flex', 'align-items:flex-start', 'gap:10px',
    'padding:12px 16px 12px 13px', 'border-radius:12px',
    `background:${t.bg}`, `border:1px solid ${t.border}`,
    'box-shadow:0 10px 30px rgba(34,26,28,0.16), 0 3px 10px rgba(34,26,28,0.08)',
    'font-family:inherit', 'font-size:13px', 'font-weight:600', 'color:#3d3436',
    'line-height:1.45', 'opacity:0', 'transform:translateX(14px)',
    'transition:opacity .22s ease, transform .22s ease', 'white-space:pre-line',
    'cursor:pointer'
  ].join(';');
  el.innerHTML =
    `<span style="color:${t.icon};flex-shrink:0;display:flex;margin-top:1px">${ICONS[type]}</span>` +
    `<span>${escapeHtml(message)}</span>`;
  el.onclick = () => dismiss(el);
  c.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(0)';
  });
  setTimeout(() => dismiss(el), type === 'error' ? 5200 : 3600);
}

function dismiss(el: HTMLElement): void {
  if (!el.parentElement) { return; }
  el.style.opacity = '0';
  el.style.transform = 'translateX(14px)';
  setTimeout(() => { if (el.parentElement) { el.parentElement.removeChild(el); } }, 240);
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function toastSuccess(message: string): void { showToast(message, 'success'); }
export function toastError(message: string): void { showToast(message, 'error'); }
export function toastInfo(message: string): void { showToast(message, 'info'); }
