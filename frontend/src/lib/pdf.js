// Safe PDF/print helper - escapes user data and uses Blob URL (no document.write).
const escapeHtml = (v) => {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const esc = escapeHtml;

// Only allow data: URLs for image embedding from our own canvas captures.
export const safeImgSrc = (src) => {
  if (typeof src !== "string") return "";
  if (src.startsWith("data:image/")) return src;
  return "";
};

export const openPrintWindow = (html) => {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "noopener,noreferrer");
  // Revoke after the new tab has had a chance to load. The browser keeps a copy.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return w;
};

export const printCss = `
body{font-family:Inter,sans-serif;max-width:780px;margin:auto;padding:40px;color:#0f172a}
.header{display:flex;justify-content:space-between;border-bottom:2px solid #047857;padding-bottom:16px;margin-bottom:24px}
h1{color:#047857;margin:0}
h3{color:#047857;margin-top:24px}
table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{border:1px solid #e2e8f0;padding:12px;text-align:left}
th{background:#f8fafc}
.right{text-align:right}
.total{font-weight:700;color:#047857;font-size:18px}
.row{display:grid;grid-template-columns:160px 1fr;padding:6px 0;border-bottom:1px solid #f1f5f9}
.label{color:#64748b;font-size:12px;text-transform:uppercase}
`;
