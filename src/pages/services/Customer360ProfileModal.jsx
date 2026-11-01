import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest } from "../../lib/api.js";

const TABS = [
  ["overview", "Overview", "user"],
  ["orders", "Orders", "bag"],
  ["activity", "Activity", "pulse"],
  ["assets", "Services & assets", "box"],
];

const ACTIVITY_LABELS = {
  order: "Orders",
  review: "Reviews",
  support: "Support",
  visit: "Visits",
  notification: "Notifications",
  contribution: "Submissions",
};

const number = (value) => new Intl.NumberFormat("en-BD").format(Number(value || 0));
const money = (value) => `BDT ${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(Number(value || 0))}`;

function dateTime(value) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(parsed);
}

function timeAgo(value) {
  if (!value) return "";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  if (s < 31536000) return `${Math.floor(s / 2592000)}mo ago`;
  return `${Math.floor(s / 31536000)}y ago`;
}

function titleCase(value) {
  return String(value || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function downloadCsv(filename, headers, rows) {
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const reduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useCountUp(target, duration = 900) {
  const to = Number(target) || 0;
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (reduced()) {
      prev.current = to;
      setValue(to);
      return undefined;
    }
    const from = prev.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const next = from + (to - from) * (1 - Math.pow(1 - p, 4));
      prev.current = next;
      setValue(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return value;
}

function Counter({ value, format = number }) {
  return <>{format(useCountUp(value))}</>;
}

/* ---------------------------------------------------------------- icons */
const PATHS = {
  user: "M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0",
  bag: "M6 7h13l-1.4 8.2a2 2 0 01-2 1.6H9.2a2 2 0 01-2-1.6L5.4 4.5H3M9.5 20.2h.01M16.5 20.2h.01",
  pulse: "M3 12h4l2.5-6 4 12L16 12h5",
  box: "M4.5 7.5L12 3l7.5 4.5L12 12 4.5 7.5zM4.5 7.5v9L12 21l7.5-4.5v-9M12 12v9",
  phone: "M5 4.5h3l1.5 4-2 1.3a11 11 0 005.7 5.7l1.3-2 4 1.5v3a2 2 0 01-2 2A14.5 14.5 0 013 6.5a2 2 0 012-2z",
  mail: "M4 6.5h16v11H4zM4 7l8 6 8-6",
  copy: "M8.5 8.5h9v11h-9zM15.5 8.5v-3h-9v11h2",
  check: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6L6 18",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  download: "M12 4v11m0 0l-4-4m4 4l4-4M5 19.5h14",
  search: "M20 20l-4.2-4.2M11 17.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z",
  pin: "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 10-13 0C5.5 15.4 12 21 12 21zM12 12.2a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8z",
  wallet: "M4 7.5h15a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0119 19.5H5A1.5 1.5 0 013.5 18V7.5zM4 7.5l11-3.5v3.5M16.5 13.5h.01",
  tag: "M3.5 12.5V4.5h8l9 9-8 8-9-9zM8 8.5h.01",
  alert: "M12 8.5v4.5m0 3.5h.01M10.3 4.2L2.8 17.2A2 2 0 004.5 20.2h15a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z",
  clock: "M12 7.5V12l3 2M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z",
  device: "M8 3.5h8a1.5 1.5 0 011.5 1.5v14a1.5 1.5 0 01-1.5 1.5H8A1.5 1.5 0 016.5 19V5A1.5 1.5 0 018 3.5zM11 17.5h2",
  up: "M12 19V5M6 11l6-6 6 6",
};

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/* --------------------------------------------------------------- styles */
const css = `
.c3{--red:#e10613;--red-600:#c20510;--red-soft:#fdecee;--red-mid:#f9c7cc;--bg:#f4f6fa;--surface:#fff;--soft:#f6f8fb;--line:#e6e9f0;--line2:#d4d9e3;--ink:#0b1220;--text:#334155;--muted:#7a8699;--ok:#15803d;--ok-soft:#e8f6ee;--warn:#b45309;--warn-soft:#fdf3e1;--ease:cubic-bezier(.2,.8,.2,1);--spring:cubic-bezier(.34,1.56,.64,1);font-family:inherit;color:var(--text)}
.c3 *{box-sizing:border-box}
.c3 a{color:inherit;text-decoration:none}
@keyframes c3Fade{from{opacity:0}to{opacity:1}}
@keyframes c3Out{to{opacity:0}}
@keyframes c3Rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes c3Modal{from{opacity:0;transform:translateY(26px) scale(.965)}to{opacity:1;transform:none}}
@keyframes c3ModalOut{to{opacity:0;transform:translateY(14px) scale(.98)}}
@keyframes c3Pop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
@keyframes c3Slide{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
@keyframes c3Grow{from{transform:scaleX(0)}}
@keyframes c3Spin{to{transform:rotate(360deg)}}
@keyframes c3Blink{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes c3Float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes c3Toast{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes c3Ring{from{stroke-dashoffset:var(--c)}}

.c3-overlay{position:fixed;inset:0;z-index:90;display:flex;align-items:stretch;justify-content:center;background:rgba(11,18,32,.62);backdrop-filter:blur(6px);animation:c3Fade .25s ease both}
.c3-overlay.is-out{animation:c3Out .22s ease both}
@media(min-width:640px){.c3-overlay{padding:16px}}
.c3-modal{position:relative;display:flex;width:100%;max-width:1520px;flex-direction:column;overflow:hidden;background:var(--bg);box-shadow:0 40px 100px rgba(0,0,0,.4);animation:c3Modal .42s var(--spring) both}
.c3-overlay.is-out .c3-modal{animation:c3ModalOut .22s var(--ease) both}
@media(min-width:640px){.c3-modal{border-radius:30px}}

/* header */
.c3-head{position:relative;flex-shrink:0;background:var(--surface);border-bottom:1px solid var(--line)}
.c3-bar{height:5px;background:var(--red);transform-origin:left;animation:c3Grow .8s var(--ease) both}
.c3-head-in{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:20px 20px 16px}
@media(min-width:1024px){.c3-head-in{padding:22px 28px 18px}}
.c3-who{display:flex;min-width:0;align-items:center;gap:16px}
.c3-av{position:relative;flex-shrink:0;width:72px;height:72px}
.c3-av img,.c3-av .ini{width:100%;height:100%;border-radius:22px;object-fit:cover}
.c3-av .ini{display:grid;place-items:center;background:var(--red);font-size:24px;font-weight:900;color:#fff}
.c3-av::after{content:"";position:absolute;inset:-5px;border:2px solid var(--red-mid);border-radius:27px;animation:c3Pop .6s var(--spring) .15s both}
.c3-av .live{position:absolute;right:-4px;bottom:-4px;z-index:1;width:18px;height:18px;border:3px solid #fff;border-radius:50%;background:var(--ok);animation:c3Pop .5s var(--spring) .5s both}
.c3-av .live.off{background:var(--red)}
.c3-name{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.c3-name h2{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:26px;font-weight:900;letter-spacing:-.02em;color:var(--ink);animation:c3Slide .5s var(--ease) .1s both}
.c3-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin-top:8px}
.c3-chip{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 11px;border:1px solid var(--line);border-radius:99px;background:var(--soft);color:var(--text);font-size:12.5px;font-weight:700;cursor:pointer;transition:all .22s var(--ease)}
a.c3-chip:hover,button.c3-chip:hover{border-color:var(--red);background:var(--red-soft);color:var(--red);transform:translateY(-1px)}
.c3-chip.is-static{cursor:default}
.c3-chip.is-static:hover{transform:none}
.c3-chip .ok{color:var(--ok)}
.c3-actions{display:flex;align-items:center;gap:8px}
.c3-btn{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 15px;border:1px solid var(--line);border-radius:13px;background:var(--surface);color:var(--text);font-size:13.5px;font-weight:800;cursor:pointer;transition:all .22s var(--ease)}
.c3-btn:hover:not(:disabled){border-color:var(--red);background:var(--red-soft);color:var(--red);transform:translateY(-1px)}
.c3-btn:active:not(:disabled){transform:scale(.95)}
.c3-btn:disabled{opacity:.6;cursor:not-allowed}
.c3-btn.is-red{border-color:var(--red);background:var(--red);color:#fff}
.c3-btn.is-red:hover:not(:disabled){background:var(--red-600);border-color:var(--red-600);color:#fff;box-shadow:0 10px 22px rgba(225,6,19,.3)}
.c3-btn.is-icon{width:42px;justify-content:center;padding:0}
.c3-btn.is-dark{border-color:var(--ink);background:var(--ink);color:#fff}
.c3-btn.is-dark:hover{border-color:var(--red);background:var(--red);color:#fff}
.c3-btn .spin{animation:c3Spin .8s linear infinite}
.c3-hide-sm{display:none}
@media(min-width:640px){.c3-hide-sm{display:inline}}

/* tabs */
.c3-tabs{position:relative;display:flex;gap:4px;overflow-x:auto;padding:0 12px;scrollbar-width:none}
@media(min-width:1024px){.c3-tabs{padding:0 24px}}
.c3-tabs::-webkit-scrollbar{display:none}
.c3-tab{display:inline-flex;align-items:center;gap:8px;flex-shrink:0;padding:14px 16px;border:0;background:none;color:var(--muted);font-size:14px;font-weight:800;white-space:nowrap;cursor:pointer;transition:color .22s}
.c3-tab:hover{color:var(--ink)}
.c3-tab.is-on{color:var(--red)}
.c3-tab svg{transition:transform .35s var(--spring)}
.c3-tab:hover svg,.c3-tab.is-on svg{transform:scale(1.15) rotate(-6deg)}
.c3-tab .cnt{padding:2px 8px;border-radius:99px;background:var(--soft);font-size:11px;font-weight:900;color:var(--text);transition:all .22s}
.c3-tab.is-on .cnt{background:var(--red);color:#fff}
.c3-ink{position:absolute;bottom:0;left:0;height:3px;border-radius:3px 3px 0 0;background:var(--red);transition:transform .45s var(--spring),width .45s var(--spring)}

/* body */
.c3-main{flex:1;min-height:0;overflow-y:auto;scroll-behavior:smooth}
.c3-main::-webkit-scrollbar{width:8px}
.c3-main::-webkit-scrollbar-thumb{background:var(--line2);border-radius:99px}
.c3-main::-webkit-scrollbar-thumb:hover{background:var(--red)}
.c3-pad{display:flex;flex-direction:column;gap:20px;padding:16px}
@media(min-width:640px){.c3-pad{padding:24px}}
@media(min-width:1024px){.c3-pad{padding:28px}}
.c3-reveal{animation:c3Rise .6s var(--ease) calc(var(--d,0)*60ms) both}
.c3-pane{display:flex;flex-direction:column;gap:20px;animation:c3Rise .45s var(--ease) both}
.c3-refresh{position:sticky;top:0;z-index:5;display:flex;justify-content:center;height:0;pointer-events:none}
.c3-refresh span{display:inline-flex;align-items:center;gap:8px;margin-top:10px;padding:8px 14px;border-radius:99px;background:var(--ink);color:#fff;font-size:12px;font-weight:800;box-shadow:0 10px 24px rgba(0,0,0,.25);animation:c3Pop .25s var(--ease) both}
.c3-refresh .spin{animation:c3Spin .8s linear infinite}

/* KPI */
.c3-kpis{display:grid;gap:12px;grid-template-columns:repeat(2,1fr)}
@media(min-width:768px){.c3-kpis{grid-template-columns:repeat(3,1fr)}}
@media(min-width:1280px){.c3-kpis{grid-template-columns:repeat(6,1fr)}}
.c3-kpi{position:relative;overflow:hidden;padding:16px;border:1px solid var(--line);border-radius:20px;background:var(--surface);transition:transform .3s var(--ease),box-shadow .3s,border-color .3s}
.c3-kpi:hover{transform:translateY(-4px);border-color:var(--line2);box-shadow:0 16px 36px rgba(11,18,32,.09)}
.c3-kpi::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--red);transform:scaleX(0);transform-origin:left;transition:transform .45s var(--ease)}
.c3-kpi:hover::after{transform:scaleX(1)}
.c3-kpi-ic{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:var(--soft);color:var(--text);transition:all .35s var(--spring)}
.c3-kpi:hover .c3-kpi-ic{transform:rotate(-8deg) scale(1.1)}
.c3-kpi.t-red .c3-kpi-ic{background:var(--red-soft);color:var(--red)}
.c3-kpi.t-green .c3-kpi-ic{background:var(--ok-soft);color:var(--ok)}
.c3-kpi.t-amber .c3-kpi-ic{background:var(--warn-soft);color:var(--warn)}
.c3-kpi.t-solid{border-color:var(--red);background:var(--red);color:#fff}
.c3-kpi.t-solid .c3-kpi-ic{background:rgba(255,255,255,.2);color:#fff}
.c3-kpi.t-solid .c3-kpi-v,.c3-kpi.t-solid .c3-kpi-l{color:#fff}
.c3-kpi.t-solid .c3-kpi-h{color:rgba(255,255,255,.85)}
.c3-kpi.t-solid::after{background:#fff}
.c3-kpi-l{margin-top:12px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.c3-kpi-v{margin-top:4px;font-size:22px;font-weight:900;letter-spacing:-.02em;color:var(--ink);font-variant-numeric:tabular-nums}
.c3-kpi-h{margin-top:3px;font-size:12px;font-weight:650;color:var(--muted)}

/* cards */
.c3-card{border:1px solid var(--line);border-radius:22px;background:var(--surface);box-shadow:0 1px 2px rgba(11,18,32,.03);transition:box-shadow .3s,border-color .3s}
.c3-card:hover{border-color:var(--line2);box-shadow:0 12px 30px rgba(11,18,32,.06)}
.c3-card-h{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 20px 14px}
.c3-card-h h3{margin:0;font-size:16px;font-weight:900;letter-spacing:-.01em;color:var(--ink)}
.c3-card-h p{margin:3px 0 0;font-size:12.5px;font-weight:600;color:var(--muted)}
.c3-card-b{padding:0 20px 20px}
.c3-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:10.5px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:var(--red)}
.c3-eyebrow::before{content:"";width:16px;height:3px;border-radius:3px;background:var(--red)}
.c3-grid{display:grid;gap:20px}
@media(min-width:1280px){.c3-g-ov{grid-template-columns:1fr 1fr 1.25fr}.c3-span2{grid-column:span 2}.c3-g-as{grid-template-columns:1.5fr 1fr}}

/* details */
.c3-dl{margin:0}
.c3-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);animation:c3Slide .45s var(--ease) calc(var(--i,0)*40ms) both}
.c3-row:last-child{border-bottom:0}
.c3-row dt{flex-shrink:0;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding-top:2px}
.c3-row dd{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin:0;min-width:0;text-align:right;font-size:13.5px;font-weight:750;color:var(--ink);word-break:break-word}
.c3-row dd a{color:var(--red)}
.c3-row dd a:hover{text-decoration:underline}
.c3-row .none{color:var(--muted);font-weight:600}
.c3-copy{display:grid;place-items:center;flex-shrink:0;width:26px;height:26px;border:0;border-radius:8px;background:none;color:var(--muted);cursor:pointer;opacity:0;transition:all .2s var(--ease)}
.c3-row:hover .c3-copy,.c3-copy:focus-visible,.c3-copy.is-done{opacity:1}
.c3-copy:hover{background:var(--red-soft);color:var(--red)}
.c3-copy.is-done{color:var(--ok);background:var(--ok-soft);animation:c3Pop .3s var(--spring)}
@media(hover:none){.c3-copy{opacity:1}}

/* pills */
.c3-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid transparent;border-radius:99px;font-size:11px;font-weight:850;white-space:nowrap}
.c3-pill::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.c3-pill.ok{border-color:#bfe5cd;background:var(--ok-soft);color:var(--ok)}
.c3-pill.red{border-color:var(--red-mid);background:var(--red-soft);color:var(--red)}
.c3-pill.warn{border-color:#f3d8a4;background:var(--warn-soft);color:var(--warn)}
.c3-pill.slate{border-color:var(--line);background:var(--soft);color:var(--text)}

/* health + tiles */
.c3-health{display:flex;align-items:center;gap:16px;margin-bottom:16px;padding:14px;border:1px solid var(--line);border-radius:18px;background:var(--soft)}
.c3-ring{position:relative;flex-shrink:0;width:74px;height:74px}
.c3-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.c3-ring circle{fill:none;stroke-width:8}
.c3-ring .bg{stroke:var(--line2)}
.c3-ring .fg{stroke:var(--red);stroke-linecap:round;animation:c3Ring 1.2s var(--ease) .2s both}
.c3-ring b{position:absolute;inset:0;display:grid;place-items:center;font-size:15px;font-weight:900;color:var(--ink)}
.c3-health p{margin:0;font-size:13px;font-weight:650;line-height:1.5;color:var(--muted)}
.c3-health p strong{display:block;margin-bottom:2px;font-size:14px;font-weight:900;color:var(--ink)}
.c3-tiles{display:grid;gap:10px;grid-template-columns:repeat(2,1fr)}
@media(min-width:640px){.c3-tiles{grid-template-columns:repeat(3,1fr)}}
@media(min-width:1280px){.c3-tiles.in-ov{grid-template-columns:repeat(2,1fr)}}
.c3-tile{padding:12px 14px;border:1px solid var(--line);border-radius:16px;background:var(--soft);animation:c3Pop .45s var(--spring) calc(var(--i,0)*45ms) both;transition:all .25s var(--ease)}
.c3-tile:hover{border-color:var(--red);background:var(--red-soft);transform:translateY(-3px)}
.c3-tile b{display:block;font-size:20px;font-weight:900;letter-spacing:-.01em;color:var(--ink);font-variant-numeric:tabular-nums}
.c3-tile span{display:block;margin-top:2px;font-size:12px;font-weight:700;color:var(--muted)}

/* services */
.c3-svc{display:grid;gap:14px}
@media(min-width:768px){.c3-svc{grid-template-columns:repeat(3,1fr)}}
.c3-svc-card{padding:16px;border:1px solid var(--line);border-radius:20px;background:var(--surface);animation:c3Rise .55s var(--ease) calc(var(--i,0)*80ms) both;transition:all .3s var(--ease)}
.c3-svc-card:hover{border-color:var(--red);transform:translateY(-4px);box-shadow:0 16px 34px rgba(11,18,32,.08)}
.c3-svc-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.c3-svc-top strong{display:block;font-size:15px;font-weight:900;color:var(--ink);text-transform:capitalize}
.c3-svc-top small{display:block;margin-top:2px;font-size:12px;font-weight:600;color:var(--muted)}
.c3-svc-n{min-width:38px;padding:5px 10px;border-radius:11px;background:var(--red-soft);text-align:center;font-size:15px;font-weight:900;color:var(--red)}
.c3-share{height:7px;margin:14px 0 4px;border-radius:99px;background:var(--soft);overflow:hidden}
.c3-share i{display:block;height:100%;border-radius:99px;background:var(--red);transform-origin:left;animation:c3Grow 1s var(--ease) .25s both}
.c3-share-l{font-size:11.5px;font-weight:700;color:var(--muted)}
.c3-mini{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.c3-mini div{padding:10px;border-radius:13px;background:var(--soft)}
.c3-mini b{display:block;font-size:16px;font-weight:900;color:var(--ink)}
.c3-mini span{font-size:11.5px;font-weight:650;color:var(--muted)}
.c3-mini .wide{grid-column:span 2;background:var(--ink)}
.c3-mini .wide b{color:#fff}
.c3-mini .wide span{color:rgba(255,255,255,.65)}

/* addresses + devices */
.c3-list{display:flex;flex-direction:column;gap:10px;max-height:360px;overflow-y:auto;padding-right:4px}
.c3-item{padding:14px;border:1px solid var(--line);border-radius:16px;animation:c3Slide .45s var(--ease) calc(var(--i,0)*60ms) both;transition:all .25s var(--ease)}
.c3-item:hover{border-color:var(--red);background:var(--red-soft);transform:translateX(3px)}
.c3-item-h{display:flex;align-items:center;justify-content:space-between;gap:10px}
.c3-item-h strong{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:900;color:var(--ink)}
.c3-item-h strong svg{color:var(--red)}
.c3-item p{margin:8px 0 0;font-size:13px;font-weight:600;line-height:1.55;color:var(--text)}
.c3-item small{display:block;margin-top:8px;font-size:12px;font-weight:700;color:var(--muted)}

/* toolbar + filters */
.c3-tools{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:16px}
.c3-search{display:flex;flex:1;min-width:220px;max-width:380px;align-items:center;gap:8px;height:42px;padding:0 13px;border:1px solid var(--line);border-radius:13px;background:var(--soft);color:var(--muted);transition:all .22s}
.c3-search:focus-within{border-color:var(--red);background:var(--surface);box-shadow:0 0 0 4px var(--red-soft)}
.c3-search input{flex:1;min-width:0;border:0;outline:0;background:none;color:var(--ink);font-size:13.5px;font-weight:600}
.c3-search input::placeholder{color:var(--muted)}
.c3-search button{display:grid;place-items:center;width:22px;height:22px;border:0;border-radius:50%;background:var(--line);color:var(--text);cursor:pointer;animation:c3Pop .2s var(--ease)}
.c3-filters{display:flex;flex-wrap:wrap;gap:6px}
.c3-f{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 13px;border:1px solid var(--line);border-radius:99px;background:var(--surface);color:var(--text);font-size:12.5px;font-weight:800;cursor:pointer;transition:all .22s var(--ease)}
.c3-f:hover{border-color:var(--red);color:var(--red)}
.c3-f.is-on{border-color:var(--red);background:var(--red);color:#fff;transform:scale(1.03)}
.c3-f em{font-style:normal;font-size:11px;font-weight:900;opacity:.75}
.c3-note{margin:0 0 12px;font-size:12px;font-weight:650;color:var(--muted)}

/* orders */
.c3-table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:18px}
.c3-table{width:100%;min-width:980px;border-collapse:collapse;text-align:left;font-size:13.5px}
.c3-table th{padding:13px 16px;background:var(--soft);font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.c3-table td{padding:14px 16px;border-top:1px solid var(--line);vertical-align:top;transition:background .2s}
.c3-table tbody tr{animation:c3Slide .4s var(--ease) calc(var(--i,0)*35ms) both}
.c3-table tbody tr:hover td{background:var(--red-soft)}
.c3-o-no{font-weight:900;color:var(--ink)}
.c3-o-sub{display:block;max-width:260px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:600;color:var(--muted)}
.c3-svc-tag{display:inline-block;padding:3px 10px;border-radius:99px;background:var(--soft);font-size:12px;font-weight:800;color:var(--text);text-transform:capitalize}
.c3-total{font-size:15px;font-weight:900;color:var(--ink);text-align:right;white-space:nowrap}
.c3-ocards{display:none;flex-direction:column;gap:10px}
.c3-ocard{padding:14px;border:1px solid var(--line);border-radius:18px;animation:c3Rise .45s var(--ease) calc(var(--i,0)*45ms) both}
.c3-ocard-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.c3-ocard-mid{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.c3-ocard-bot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:10px;border-top:1px solid var(--line);font-size:12px;font-weight:700;color:var(--muted)}
@media(max-width:767px){.c3-table-wrap{display:none}.c3-ocards{display:flex}}
.c3-pager{margin-top:18px}

/* timeline */
.c3-tl{position:relative;display:flex;flex-direction:column}
.c3-ev{position:relative;display:flex;gap:14px;padding-bottom:18px;animation:c3Slide .5s var(--ease) calc(var(--i,0)*50ms) both}
.c3-ev:last-child{padding-bottom:0}
.c3-ev::before{content:"";position:absolute;left:19px;top:42px;bottom:0;width:2px;background:var(--line)}
.c3-ev:last-child::before{display:none}
.c3-ev-ic{position:relative;z-index:1;display:grid;place-items:center;flex-shrink:0;width:40px;height:40px;border-radius:13px;background:var(--ink);font-size:12px;font-weight:900;color:#fff;transition:all .3s var(--spring)}
.c3-ev:hover .c3-ev-ic{background:var(--red);transform:scale(1.12) rotate(-6deg)}
.c3-ev-body{flex:1;min-width:0;padding:13px 15px;border:1px solid var(--line);border-radius:16px;background:var(--surface);transition:all .25s var(--ease)}
.c3-ev:hover .c3-ev-body{border-color:var(--red);background:var(--red-soft)}
.c3-ev-top{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:8px}
.c3-ev-top strong{display:block;font-size:14px;font-weight:900;color:var(--ink)}
.c3-ev-top p{margin:3px 0 0;font-size:13px;font-weight:600;line-height:1.5;color:var(--text)}
.c3-ev-time{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;font-weight:700;color:var(--muted)}

/* assets */
.c3-assets{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
.c3-asset{padding:16px;border:1px solid var(--line);border-radius:18px;background:var(--soft);animation:c3Pop .5s var(--spring) calc(var(--i,0)*50ms) both;transition:all .28s var(--ease)}
.c3-asset:hover{border-color:var(--red);background:var(--surface);transform:translateY(-4px);box-shadow:0 14px 30px rgba(11,18,32,.08)}
.c3-asset b{display:block;font-size:28px;font-weight:900;letter-spacing:-.02em;color:var(--ink)}
.c3-asset span{display:block;margin-top:2px;font-size:13px;font-weight:700;color:var(--text)}

/* empty / loading / error */
.c3-empty{display:grid;justify-items:center;gap:8px;padding:36px 16px;border:1.5px dashed var(--line2);border-radius:18px;background:var(--soft);text-align:center;font-size:13.5px;font-weight:700;color:var(--muted)}
.c3-empty svg{opacity:.55;animation:c3Float 3s ease-in-out infinite}
.c3-sk{border-radius:18px;background:var(--line);animation:c3Blink 1.3s ease-in-out infinite}
.c3-err{max-width:520px;margin:48px auto;padding:28px;border:1px solid var(--red-mid);border-radius:22px;background:var(--surface);text-align:center;animation:c3Pop .4s var(--spring) both}
.c3-err .ic{display:grid;place-items:center;width:56px;height:56px;margin:0 auto 14px;border-radius:18px;background:var(--red-soft);color:var(--red);animation:c3Float 2.6s ease-in-out infinite}
.c3-err p{margin:0 0 16px;font-size:14.5px;font-weight:800;color:var(--ink)}

/* floating */
.c3-top{position:absolute;right:22px;bottom:22px;z-index:6;display:grid;place-items:center;width:46px;height:46px;border:0;border-radius:15px;background:var(--red);color:#fff;box-shadow:0 12px 26px rgba(225,6,19,.38);cursor:pointer;animation:c3Pop .35s var(--spring) both;transition:transform .22s var(--ease)}
.c3-top:hover{transform:translateY(-4px)}
.c3-toast{position:absolute;left:50%;bottom:24px;z-index:7;display:flex;align-items:center;gap:8px;padding:11px 18px;border-radius:99px;background:var(--ink);color:#fff;font-size:13px;font-weight:800;box-shadow:0 14px 30px rgba(0,0,0,.3);animation:c3Toast .35s var(--spring) both}
.c3-toast svg{color:#4ade80}

@media(prefers-reduced-motion:reduce){
  .c3 *,.c3 *::before,.c3 *::after{animation-duration:.001ms!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}
`;

/* ---------------------------------------------------------- components */
function pillTone(value) {
  const v = String(value || "unknown").toLowerCase();
  if (["delivered", "active", "paid", "verified", "opened", "converted", "enabled", "default"].includes(v)) return "ok";
  if (["cancelled", "rejected", "blocked", "failed", "refunded"].includes(v)) return "red";
  if (["pending", "queued", "unpaid", "unverified", "processing"].includes(v)) return "warn";
  return "slate";
}

function StatusPill({ value }) {
  return <span className={`c3-pill ${pillTone(value)}`}>{titleCase(value)}</span>;
}

function Kpi({ icon, label, value, format, hint, tone = "slate", index = 0 }) {
  return (
    <div className={`c3-kpi t-${tone} c3-reveal`} style={{ "--d": index }}>
      <span className="c3-kpi-ic"><Icon name={icon} size={19} /></span>
      <div className="c3-kpi-l">{label}</div>
      <div className="c3-kpi-v"><Counter value={value} format={format} /></div>
      {hint ? <div className="c3-kpi-h">{hint}</div> : null}
    </div>
  );
}

function Card({ title, subtitle, action, eyebrow, children, className = "", delay = 0 }) {
  return (
    <section className={`c3-card c3-reveal ${className}`} style={{ "--d": delay }}>
      <header className="c3-card-h">
        <div>
          {eyebrow ? <div className="c3-eyebrow">{eyebrow}</div> : null}
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="c3-card-b">{children}</div>
    </section>
  );
}

function Empty({ icon = "box", children }) {
  return (
    <div className="c3-empty">
      <Icon name={icon} size={34} />
      <span>{children}</span>
    </div>
  );
}

function Row({ label, value, href, copy, onCopy, copied, index = 0 }) {
  return (
    <div className="c3-row" style={{ "--i": index }}>
      <dt>{label}</dt>
      <dd>
        {value ? (href ? <a href={href}>{value}</a> : <span>{value}</span>) : <span className="none">Not provided</span>}
        {copy && value ? (
          <button type="button" className={`c3-copy ${copied ? "is-done" : ""}`} onClick={() => onCopy(String(value), label)} aria-label={`Copy ${label}`} title="Copy">
            <Icon name={copied ? "check" : "copy"} size={15} />
          </button>
        ) : null}
      </dd>
    </div>
  );
}

function Loading() {
  return (
    <div className="c3-pad" aria-hidden="true">
      <div className="c3-kpis">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="c3-sk" style={{ height: 124, animationDelay: `${i * 90}ms` }} />)}
      </div>
      <div className="c3-grid c3-g-ov">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="c3-sk" style={{ height: 330, animationDelay: `${i * 120}ms` }} />)}
      </div>
    </div>
  );
}

function activityMarker(type) {
  return ({ order: "O", review: "R", support: "S", visit: "V", notification: "N", contribution: "A" }[type] || "•");
}

/* ----------------------------------------------------------------- main */
export default function Customer360ProfileModal({ token, userId, fallbackCustomer, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [orderPage, setOrderPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [refreshKey, setRefreshKey] = useState(0);

  const [closing, setClosing] = useState(false);
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [activityType, setActivityType] = useState("all");
  const [copied, setCopied] = useState("");
  const [showTop, setShowTop] = useState(false);
  const [ink, setInk] = useState({ left: 0, width: 0 });

  const mainRef = useRef(null);
  const tabRefs = useRef({});
  const copyTimer = useRef(null);
  const closeTimer = useRef(null);

  const requestClose = useCallback(() => {
    if (closing) return;
    if (reduced()) {
      onClose?.();
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(() => onClose?.(), 220);
  }, [closing, onClose]);

  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && requestClose();
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [requestClose]);

  useEffect(() => () => {
    clearTimeout(copyTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (!token || !userId) return undefined;
    let active = true;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      order_page: String(orderPage),
      activity_page: String(activityPage),
      per_page: String(perPage),
    });
    apiRequest(`/admin/users/${userId}/profile?${params.toString()}`, { token })
      .then((data) => active && setProfile(data))
      .catch((err) => active && setError(err.message || "Unable to load the customer profile."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [activityPage, orderPage, perPage, refreshKey, token, userId]);

  const user = profile?.user || fallbackCustomer || {};
  const commerce = profile?.commerce || {};
  const engagement = profile?.engagement || {};
  const orders = profile?.orders?.data || [];
  const activities = profile?.activity?.data || [];
  const activeAssets = useMemo(() => (profile?.assets || []).filter((item) => Number(item.count) > 0), [profile?.assets]);
  const initials = String(user.name || fallbackCustomer?.name || "Customer")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const retry = () => setRefreshKey((value) => value + 1);

  const totalOrders = Number(commerce.total_orders || 0);
  const successRate = totalOrders ? Math.round((Number(commerce.delivered_orders || 0) / totalOrders) * 100) : 0;
  const cancelRate = totalOrders ? Math.round((Number(commerce.cancelled_orders || 0) / totalOrders) * 100) : 0;
  const ringC = 2 * Math.PI * 30;

  const services = Object.entries(commerce.by_service || {});
  const serviceMax = Math.max(1, ...services.map(([, s]) => Number(s.total_orders || 0)));

  const orderStatuses = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => map.set(o.status, (map.get(o.status) || 0) + 1));
    return [...map.entries()];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = orderQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatus !== "all" && o.status !== orderStatus) return false;
      if (!q) return true;
      return `${o.order_no} ${o.service} ${o.receiver_name} ${o.receiver_phone} ${o.delivery_address} ${o.status} ${o.payment_status}`.toLowerCase().includes(q);
    });
  }, [orders, orderQuery, orderStatus]);

  const activityTypes = useMemo(() => {
    const map = new Map();
    activities.forEach((a) => map.set(a.type, (map.get(a.type) || 0) + 1));
    return [...map.entries()];
  }, [activities]);

  const filteredActivities = useMemo(
    () => (activityType === "all" ? activities : activities.filter((a) => a.type === activityType)),
    [activities, activityType],
  );

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(el);
    }
    setCopied(label);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(""), 1800);
  };

  const exportOrders = () => {
    downloadCsv(
      `customer-${user.id || userId}-orders.csv`,
      ["Order", "Service", "Placed", "Receiver", "Phone", "Payment method", "Payment status", "Status", "Total"],
      filteredOrders.map((o) => [o.order_no, o.service, o.created_at, o.receiver_name, o.receiver_phone, o.payment_method, o.payment_status, o.status, o.grand_total]),
    );
  };

  const measureInk = useCallback(() => {
    const el = tabRefs.current[tab];
    if (el) setInk({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  useEffect(() => {
    measureInk();
    window.addEventListener("resize", measureInk);
    return () => window.removeEventListener("resize", measureInk);
  }, [measureInk, profile?.orders?.meta?.total, Boolean(profile)]);

  const switchTab = (key) => {
    setTab(key);
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onTabKey = (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const idx = TABS.findIndex(([k]) => k === tab);
    const next = TABS[(idx + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length][0];
    switchTab(next);
    tabRefs.current[next]?.focus();
  };

  const pref = profile?.account?.notification_preference || {};
  const flag = (v) => (v === undefined ? "Not configured" : v ? "Enabled" : "Disabled");
  const lastVisit = profile?.account?.last_visit;

  return (
    <div
      className={`c3 c3-overlay ${closing ? "is-out" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Customer 360 profile"
      onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}
    >
      <style>{css}</style>
      <div className="c3-modal">
        {/* ------------------------------------------------------ header */}
        <header className="c3-head">
          <div className="c3-bar" />
          <div className="c3-head-in">
            <div className="c3-who">
              <div className="c3-av">
                {user.photo_url ? <img src={user.photo_url} alt={user.name || "Customer"} /> : <div className="ini">{initials || "CU"}</div>}
                <span className={`live ${user.is_blocked ? "off" : ""}`} title={user.is_blocked ? "Blocked" : "Active"} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="c3-name">
                  <h2>{user.name || "Customer profile"}</h2>
                  <StatusPill value={user.verified ? "verified" : "unverified"} />
                  {user.is_blocked ? <StatusPill value="blocked" /> : null}
                </div>
                <div className="c3-meta">
                  <span className="c3-chip is-static"><Icon name="user" size={14} /> Customer #{user.id || userId}</span>
                  {user.phone ? <a href={`tel:${user.phone}`} className="c3-chip"><Icon name="phone" size={14} /> {user.phone}</a> : null}
                  {user.email ? <a href={`mailto:${user.email}`} className="c3-chip"><Icon name="mail" size={14} /> {user.email}</a> : null}
                  <span className="c3-chip is-static"><Icon name="clock" size={14} /> Joined {dateTime(user.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="c3-actions">
              <button type="button" className="c3-btn is-icon" onClick={retry} disabled={loading} aria-label="Refresh profile" title="Refresh">
                <span className={loading ? "spin" : ""} style={{ display: "inline-flex" }}><Icon name="refresh" size={18} /></span>
              </button>
              {user.phone ? (
                <a href={`tel:${user.phone}`} className="c3-btn is-red"><Icon name="phone" size={17} /><span className="c3-hide-sm">Call customer</span></a>
              ) : null}
              <button type="button" onClick={requestClose} className="c3-btn is-icon is-dark" aria-label="Close customer profile"><Icon name="close" size={19} /></button>
            </div>
          </div>

          <nav className="c3-tabs" role="tablist" aria-label="Profile sections" onKeyDown={onTabKey}>
            {TABS.map(([key, label, icon]) => (
              <button
                key={key}
                ref={(el) => { tabRefs.current[key] = el; }}
                type="button"
                role="tab"
                aria-selected={tab === key}
                tabIndex={tab === key ? 0 : -1}
                className={`c3-tab ${tab === key ? "is-on" : ""}`}
                onClick={() => switchTab(key)}
              >
                <Icon name={icon} size={17} />
                {label}
                {key === "orders" && profile?.orders?.meta ? <span className="cnt">{profile.orders.meta.total}</span> : null}
              </button>
            ))}
            <span className="c3-ink" style={{ width: ink.width, transform: `translateX(${ink.left}px)` }} />
          </nav>
        </header>

        {/* ----------------------------------------------------- content */}
        <main
          className="c3-main"
          ref={mainRef}
          onScroll={(e) => setShowTop(e.currentTarget.scrollTop > 420)}
        >
          {loading && !profile ? <Loading /> : null}

          {error && !profile ? (
            <div className="c3-err" role="alert">
              <div className="ic"><Icon name="alert" size={26} /></div>
              <p>{error}</p>
              <button type="button" onClick={retry} className="c3-btn is-red" style={{ margin: "0 auto" }}>Try again</button>
            </div>
          ) : null}

          {profile ? (
            <div className="c3-pad">
              {loading ? (
                <div className="c3-refresh"><span><i className="spin" style={{ display: "inline-flex" }}><Icon name="refresh" size={14} /></i> Refreshing profile...</span></div>
              ) : null}

              <div className="c3-kpis">
                <Kpi index={0} icon="bag" label="Total orders" value={commerce.total_orders} hint={`${number(commerce.active_orders)} currently active`} />
                <Kpi index={1} icon="wallet" label="Lifetime spend" value={commerce.lifetime_spend} format={money} hint="Delivered orders" tone="solid" />
                <Kpi index={2} icon="check" label="Delivered" value={commerce.delivered_orders} hint="Successfully completed" tone="green" />
                <Kpi index={3} icon="alert" label="Cancelled" value={commerce.cancelled_orders} hint="Cancelled or rejected" tone="amber" />
                <Kpi index={4} icon="pulse" label="Average order" value={commerce.average_delivered_order} format={money} hint="Delivered average" />
                <Kpi index={5} icon="tag" label="Discount received" value={commerce.total_discount} format={money} hint="Across all orders" tone="red" />
              </div>

              {/* ---------------------------------------------- overview */}
              {tab === "overview" ? (
                <div key="overview" className="c3-pane">
                  <div className="c3-grid c3-g-ov">
                    <Card eyebrow="Profile" title="Identity & contact" subtitle="Customer account information">
                      <dl className="c3-dl">
                        <Row index={0} label="Full name" value={user.name} />
                        <Row index={1} label="Phone" value={user.phone} href={user.phone ? `tel:${user.phone}` : null} copy onCopy={copy} copied={copied === "Phone"} />
                        <Row index={2} label="Email" value={user.email} href={user.email ? `mailto:${user.email}` : null} copy onCopy={copy} copied={copied === "Email"} />
                        <Row index={3} label="Role" value={titleCase(user.role)} />
                        <Row index={4} label="Rating" value={user.rating ? `${user.rating} / 5` : "No rating"} />
                        <Row index={5} label="Location" value={[user.union_name, user.upazila, user.district].filter(Boolean).join(", ")} />
                        <Row index={6} label="Address" value={user.address} copy onCopy={copy} copied={copied === "Address"} />
                      </dl>
                    </Card>

                    <Card eyebrow="Account" title="Account & app usage" subtitle="Login footprint without exposing private tokens" delay={1}>
                      <dl className="c3-dl">
                        <Row index={0} label="Account status" value={user.is_blocked ? "Blocked" : "Active"} />
                        <Row index={1} label="Email verification" value={user.email_verified_at ? dateTime(user.email_verified_at) : "Not verified"} />
                        <Row index={2} label="Last app visit" value={lastVisit?.visited_at ? `${dateTime(lastVisit.visited_at)} (${timeAgo(lastVisit.visited_at)})` : "Not available"} />
                        <Row index={3} label="Last visited screen" value={lastVisit?.path || lastVisit?.source} />
                        <Row index={4} label="Registered devices" value={number(engagement.devices)} />
                        <Row index={5} label="Marketing notifications" value={flag(pref.marketing_enabled)} />
                        <Row index={6} label="Order notifications" value={flag(pref.order_updates_enabled)} />
                      </dl>
                    </Card>

                    <Card eyebrow="Engagement" title="Engagement overview" subtitle="How this customer uses Bholavashi" delay={2}>
                      <div className="c3-health">
                        <div className="c3-ring" style={{ "--c": ringC }}>
                          <svg viewBox="0 0 74 74" aria-hidden="true">
                            <circle className="bg" cx="37" cy="37" r="30" />
                            <circle className="fg" cx="37" cy="37" r="30" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - successRate / 100)} />
                          </svg>
                          <b><Counter value={successRate} format={(v) => `${Math.round(v)}%`} /></b>
                        </div>
                        <p>
                          <strong>Delivery success rate</strong>
                          {totalOrders ? `${number(commerce.delivered_orders)} of ${number(totalOrders)} orders delivered, ${cancelRate}% cancelled.` : "No orders yet."}
                        </p>
                      </div>
                      <div className="c3-tiles in-ov">
                        {[
                          ["App visits", engagement.app_visits],
                          ["Notifications", engagement.notifications],
                          ["AI decisions", engagement.ai_notifications],
                          ["Reviews", engagement.reviews],
                          ["Support tickets", engagement.support_tickets],
                          ["Saved addresses", engagement.food_addresses],
                          ["Food favourites", engagement.food_favorites],
                          ["Messages sent", engagement.messages_sent],
                          ["Messages received", engagement.messages_received],
                        ].map(([label, value], i) => (
                          <div key={label} className="c3-tile" style={{ "--i": i }}>
                            <b><Counter value={value} /></b>
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <div className="c3-span2">
                      <Card eyebrow="Commerce" title="Order history by service" subtitle="Food, medicine and gas delivery performance" delay={3}>
                        {services.length ? (
                          <div className="c3-svc">
                            {services.map(([service, summary], i) => {
                              const pct = Math.round((Number(summary.total_orders || 0) / serviceMax) * 100);
                              return (
                                <div key={service} className="c3-svc-card" style={{ "--i": i }}>
                                  <div className="c3-svc-top">
                                    <div>
                                      <strong>{service}</strong>
                                      <small>Last order {dateTime(summary.last_order_at)}</small>
                                    </div>
                                    <span className="c3-svc-n">{summary.total_orders}</span>
                                  </div>
                                  <div className="c3-share"><i style={{ width: `${Math.max(4, pct)}%` }} /></div>
                                  <div className="c3-share-l">{pct}% of most-used service</div>
                                  <div className="c3-mini">
                                    <div><b>{summary.delivered_orders}</b><span>Delivered</span></div>
                                    <div><b>{summary.active_orders}</b><span>Active</span></div>
                                    <div className="wide"><b>{money(summary.delivered_spend)}</b><span>Delivered spend</span></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : <Empty icon="bag">No order history found for this customer.</Empty>}
                      </Card>
                    </div>

                    <Card eyebrow="Delivery" title="Saved delivery addresses" subtitle={`${profile.addresses?.length || 0} address records`} delay={4}>
                      <div className="c3-list">
                        {profile.addresses?.length ? profile.addresses.map((address, i) => (
                          <div key={address.id} className="c3-item" style={{ "--i": i }}>
                            <div className="c3-item-h">
                              <strong><Icon name="pin" size={16} /> {address.label || "Address"}</strong>
                              {address.is_default ? <StatusPill value="default" /> : null}
                            </div>
                            <p>{[address.address, address.area, address.landmark].filter(Boolean).join(", ")}</p>
                            <small>{address.receiver_name} · {address.receiver_phone}</small>
                          </div>
                        )) : <Empty icon="pin">No saved address.</Empty>}
                      </div>
                    </Card>
                  </div>
                </div>
              ) : null}

              {/* ------------------------------------------------ orders */}
              {tab === "orders" ? (
                <div key="orders" className="c3-pane">
                  <Card
                    eyebrow="Orders"
                    title="Complete order history"
                    subtitle="All Bholavashi delivery services in one place"
                    action={
                      <button type="button" className="c3-btn" onClick={exportOrders} disabled={!filteredOrders.length}>
                        <Icon name="download" size={17} /> Export CSV
                      </button>
                    }
                  >
                    {orders.length ? (
                      <>
                        <div className="c3-tools">
                          <label className="c3-search">
                            <Icon name="search" size={17} />
                            <input value={orderQuery} onChange={(e) => setOrderQuery(e.target.value)} placeholder="Search order, receiver, address..." aria-label="Search orders" />
                            {orderQuery ? <button type="button" onClick={() => setOrderQuery("")} aria-label="Clear search"><Icon name="close" size={12} /></button> : null}
                          </label>
                          <div className="c3-filters" role="group" aria-label="Filter by status">
                            <button type="button" className={`c3-f ${orderStatus === "all" ? "is-on" : ""}`} onClick={() => setOrderStatus("all")}>All <em>{orders.length}</em></button>
                            {orderStatuses.map(([status, count]) => (
                              <button key={status} type="button" className={`c3-f ${orderStatus === status ? "is-on" : ""}`} onClick={() => setOrderStatus(status)}>
                                {titleCase(status)} <em>{count}</em>
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="c3-note">Search and filters apply to the orders on this page.</p>
                      </>
                    ) : null}

                    {filteredOrders.length ? (
                      <>
                        <div className="c3-table-wrap">
                          <table className="c3-table">
                            <thead>
                              <tr><th>Order</th><th>Service</th><th>Placed</th><th>Receiver</th><th>Payment</th><th>Status</th><th style={{ textAlign: "right" }}>Total</th></tr>
                            </thead>
                            <tbody>
                              {filteredOrders.map((order, i) => (
                                <tr key={`${order.resource}-${order.id}`} style={{ "--i": Math.min(i, 14) }}>
                                  <td><span className="c3-o-no">{order.order_no}</span><span className="c3-o-sub">{order.delivery_address}</span></td>
                                  <td><span className="c3-svc-tag">{order.service}</span></td>
                                  <td style={{ fontSize: 12.5, fontWeight: 650, color: "var(--muted)" }}>{dateTime(order.created_at)}</td>
                                  <td style={{ fontWeight: 800, color: "var(--ink)" }}>{order.receiver_name || "-"}<span className="c3-o-sub">{order.receiver_phone || "-"}</span></td>
                                  <td style={{ fontSize: 12.5, fontWeight: 750 }}>{titleCase(order.payment_method)}<div style={{ marginTop: 6 }}><StatusPill value={order.payment_status} /></div></td>
                                  <td><StatusPill value={order.status} /></td>
                                  <td className="c3-total">{money(order.grand_total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="c3-ocards">
                          {filteredOrders.map((order, i) => (
                            <div key={`m-${order.resource}-${order.id}`} className="c3-ocard" style={{ "--i": Math.min(i, 10) }}>
                              <div className="c3-ocard-top">
                                <div><span className="c3-o-no">{order.order_no}</span><span className="c3-o-sub">{order.delivery_address}</span></div>
                                <StatusPill value={order.status} />
                              </div>
                              <div className="c3-ocard-mid">
                                <span className="c3-svc-tag">{order.service}</span>
                                <StatusPill value={order.payment_status} />
                              </div>
                              <div className="c3-ocard-bot">
                                <span>{dateTime(order.created_at)}</span>
                                <span className="c3-total">{money(order.grand_total)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : orders.length ? (
                      <Empty icon="search">No orders match your filters.</Empty>
                    ) : (
                      <Empty icon="bag">No orders found.</Empty>
                    )}

                    <div className="c3-pager">
                      <Pagination
                        meta={profile.orders?.meta}
                        page={orderPage}
                        perPage={perPage}
                        onPageChange={setOrderPage}
                        onPerPageChange={(value) => { setPerPage(value); setOrderPage(1); setActivityPage(1); }}
                      />
                    </div>
                  </Card>
                </div>
              ) : null}

              {/* ---------------------------------------------- activity */}
              {tab === "activity" ? (
                <div key="activity" className="c3-pane">
                  <Card eyebrow="Timeline" title="Customer activity timeline" subtitle="Orders, visits, reviews, support, notifications and user submissions">
                    {activities.length ? (
                      <div className="c3-tools">
                        <div className="c3-filters" role="group" aria-label="Filter by type">
                          <button type="button" className={`c3-f ${activityType === "all" ? "is-on" : ""}`} onClick={() => setActivityType("all")}>All <em>{activities.length}</em></button>
                          {activityTypes.map(([type, count]) => (
                            <button key={type} type="button" className={`c3-f ${activityType === type ? "is-on" : ""}`} onClick={() => setActivityType(type)}>
                              {ACTIVITY_LABELS[type] || titleCase(type)} <em>{count}</em>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {filteredActivities.length ? (
                      <div className="c3-tl">
                        {filteredActivities.map((activity, index) => (
                          <div key={`${activity.type}-${activity.occurred_at}-${index}`} className="c3-ev" style={{ "--i": Math.min(index, 12) }}>
                            <span className="c3-ev-ic">{activityMarker(activity.type)}</span>
                            <div className="c3-ev-body">
                              <div className="c3-ev-top">
                                <div>
                                  <strong>{activity.title}</strong>
                                  <p>{activity.description}</p>
                                </div>
                                {activity.status ? <StatusPill value={activity.status} /> : null}
                              </div>
                              <div className="c3-ev-time"><Icon name="clock" size={13} /> {dateTime(activity.occurred_at)} {timeAgo(activity.occurred_at) ? `· ${timeAgo(activity.occurred_at)}` : ""}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activities.length ? (
                      <Empty icon="search">No activity of this type on this page.</Empty>
                    ) : (
                      <Empty icon="pulse">No activity has been recorded yet.</Empty>
                    )}

                    <div className="c3-pager">
                      <Pagination
                        meta={profile.activity?.meta}
                        page={activityPage}
                        perPage={perPage}
                        onPageChange={setActivityPage}
                        onPerPageChange={(value) => { setPerPage(value); setOrderPage(1); setActivityPage(1); }}
                      />
                    </div>
                  </Card>
                </div>
              ) : null}

              {/* ------------------------------------------------ assets */}
              {tab === "assets" ? (
                <div key="assets" className="c3-pane">
                  <div className="c3-grid c3-g-as">
                    <Card eyebrow="Records" title="Services & user-owned records" subtitle="Everything created or requested under this customer account">
                      {activeAssets.length ? (
                        <div className="c3-assets">
                          {activeAssets.map((asset, i) => (
                            <div key={asset.key} className="c3-asset" style={{ "--i": i }}>
                              <b><Counter value={asset.count} /></b>
                              <span>{asset.label}</span>
                            </div>
                          ))}
                        </div>
                      ) : <Empty icon="box">This customer has no service listings or requests yet.</Empty>}
                    </Card>

                    <Card eyebrow="Security" title="Registered devices" subtitle="Device tokens are intentionally hidden" delay={1}>
                      <div className="c3-list">
                        {profile.account?.devices?.length ? profile.account.devices.map((device, i) => (
                          <div key={device.id} className="c3-item" style={{ "--i": i }}>
                            <div className="c3-item-h">
                              <strong><Icon name="device" size={16} /> {titleCase(device.platform || "Device")}</strong>
                              <StatusPill value="active" />
                            </div>
                            <small>Last seen {dateTime(device.last_seen_at || device.created_at)}</small>
                          </div>
                        )) : <Empty icon="device">No registered device found.</Empty>}
                      </div>
                    </Card>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </main>

        {showTop ? (
          <button type="button" className="c3-top" onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
            <Icon name="up" size={20} />
          </button>
        ) : null}

        {copied ? (
          <div className="c3-toast" role="status"><Icon name="check" size={16} /> {copied} copied</div>
        ) : null}
      </div>
    </div>
  );
}