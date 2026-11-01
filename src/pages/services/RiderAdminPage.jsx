import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../../lib/api.js";
import { formatDateTime } from "../../lib/formatters.js";

const statusBn = {
  draft: "খসড়া",
  pending: "অপেক্ষমাণ",
  approved: "অনুমোদিত",
  rejected: "বাতিল",
  accepted: "গ্রহণ করেছে",
  expired: "মেয়াদ শেষ",
  cancelled: "বাতিল",
  active: "সক্রিয়",
  suspended: "সাময়িক বন্ধ",
  blocked: "ব্লক",
  offline: "অফলাইন",
  online: "অনলাইন",
  busy: "ব্যস্ত",
  delivered: "ডেলিভারড",
  picked_up: "পিকড আপ",
  on_the_way: "পথে আছে",
  preparing: "প্রস্তুত হচ্ছে",
  open: "ওপেন",
  reviewing: "রিভিউ",
  resolved: "সমাধান",
  closed: "বন্ধ",
};

const vehicleBn = { cycle: "সাইকেল", bike: "মোটরসাইকেল", car: "গাড়ি" };
const money = (value) => `৳${Number(value || 0).toLocaleString("bn-BD")}`;
const numberBn = (value) => Number(value || 0).toLocaleString("bn-BD");
const dateTime = formatDateTime;
const shortText = (value, fallback = "-") => value || fallback;
const toCoord = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const mapsPointUrl = (lat, lng) => {
  const safeLat = toCoord(lat);
  const safeLng = toCoord(lng);
  if (safeLat === null || safeLng === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${safeLat},${safeLng}`;
};
const mapsEmbedPointUrl = (lat, lng) => {
  const safeLat = toCoord(lat);
  const safeLng = toCoord(lng);
  if (safeLat === null || safeLng === null) return null;
  return `https://maps.google.com/maps?q=${safeLat},${safeLng}&z=15&output=embed`;
};
const initials = (name) => String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const reduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useCountUp(target, duration = 900) {
  const to = Number(target) || 0;
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (reduced()) { prev.current = to; setValue(to); return undefined; }
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

function Counter({ value, format = (v) => String(Math.round(v)) }) {
  return <>{format(useCountUp(value))}</>;
}

/* ------------------------------------------------------------------ icons */
const PATHS = {
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  search: "M20 20l-4.2-4.2M11 17.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  trash: "M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3",
  phone: "M5 4.5h3l1.5 4-2 1.3a11 11 0 005.7 5.7l1.3-2 4 1.5v3a2 2 0 01-2 2A14.5 14.5 0 013 6.5a2 2 0 012-2z",
  pin: "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 10-13 0C5.5 15.4 12 21 12 21zM12 12.2a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  box: "M4.5 7.5L12 3l7.5 4.5L12 12 4.5 7.5zM4.5 7.5v9L12 21l7.5-4.5v-9M12 12v9",
  truck: "M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7M7 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  alert: "M12 8.5v4.5m0 3.5h.01M10.3 4.2L2.8 17.2A2 2 0 004.5 20.2h15a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z",
  wallet: "M4 7.5h15a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0119 19.5H5A1.5 1.5 0 013.5 18V7.5zM4 7.5l11-3.5v3.5M16.5 13.5h.01",
  store: "M4 9l1.5-5h13L20 9M4 9h16M4 9v11h16V9M9 20v-6h6v6",
  clock: "M12 7.5V12l3 2M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z",
  upload: "M12 16V5m0 0L8 9m4-4l4 4M5 19.5h14",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  map: "M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4zM9 4v14M15 6v14",
  note: "M6 4.5h12v15H6zM9 9h6M9 13h6",
  bag: "M6 7h13l-1.4 8.2a2 2 0 01-2 1.6H9.2a2 2 0 01-2-1.6L5.4 4.5H3M9.5 20.2h.01M16.5 20.2h.01",
  star: "M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.9 6.75 19.7l1-5.85L3.5 9.7l5.9-.9L12 3.5z",
  user:"M12 12a4.2 4.2 0 100-8.4 4.2 4.2 0 000 8.4zM4.5 20.5a7.5 7.5 0 0115 0",
  bike:"M6 18.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM18 18.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM6 15l3-6h5l4 6M9 9L8 6H6M12 9l-1.5 6",
  doc:"M7 3.5h7l4 4v13H7zM14 3.5v4h4M9.5 12h5M9.5 15.5h5",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zM9 12l2.2 2.2L15.5 10",
};

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/* ----------------------------------------------------------------- styles */
const css = `
.gx{--red:#e10613;--red-600:#c20510;--red-soft:#fdecee;--red-mid:#f9c7cc;--bg:#f4f6fa;--surface:#fff;--soft:#f6f8fb;--line:#e6e9f0;--line2:#d4d9e3;--ink:#0b1220;--text:#334155;--muted:#7a8699;--ok:#15803d;--ok-soft:#e8f6ee;--warn:#b45309;--warn-soft:#fdf3e1;--blue:#1d4ed8;--blue-soft:#e8f0fe;--violet:#6d28d9;--violet-soft:#f1eafe;--cyan:#0e7490;--cyan-soft:#e3f6fa;--indigo:#4338ca;--indigo-soft:#ebebfd;--ease:cubic-bezier(.2,.8,.2,1);--spring:cubic-bezier(.34,1.56,.64,1);color:var(--text)}
.gx *{box-sizing:border-box}
.gx a{text-decoration:none}
@keyframes gxRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes gxFade{from{opacity:0}to{opacity:1}}
@keyframes gxOut{to{opacity:0}}
@keyframes gxModal{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
@keyframes gxModalOut{to{opacity:0;transform:translateY(12px) scale(.98)}}
@keyframes gxPop{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}
@keyframes gxSlide{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
@keyframes gxGrowX{from{transform:scaleX(0)}}
@keyframes gxSpin{to{transform:rotate(360deg)}}
@keyframes gxBlink{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes gxFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes gxPing{0%{box-shadow:0 0 0 0 rgba(225,6,19,.45)}100%{box-shadow:0 0 0 9px rgba(225,6,19,0)}}
@keyframes gxToast{from{opacity:0;transform:translate(-50%,18px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes gxBar{from{transform:translateY(100%)}to{transform:none}}

.gx-page{display:flex;flex-direction:column;gap:20px}
.gx-reveal{animation:gxRise .55s var(--ease) calc(var(--d,0)*60ms) both}

/* header */
.gx-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:14px}
.gx-eyebrow{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:var(--red)}
.gx-eyebrow::before{content:"";width:18px;height:3px;border-radius:3px;background:var(--red)}
.gx-title{margin:6px 0 0;font-size:28px;font-weight:900;letter-spacing:-.02em;color:var(--ink);animation:gxSlide .5s var(--ease) both}
.gx-sub{margin:4px 0 0;font-size:13.5px;font-weight:600;color:var(--muted)}
.gx-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px}

/* buttons + fields */
.gx-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 16px;border:1px solid var(--line);border-radius:13px;background:var(--surface);color:var(--text);font-size:13.5px;font-weight:800;cursor:pointer;transition:all .22s var(--ease)}
.gx-btn:hover:not(:disabled){border-color:var(--red);background:var(--red-soft);color:var(--red);transform:translateY(-1px)}
.gx-btn:active:not(:disabled){transform:scale(.95)}
.gx-btn:disabled{opacity:.55;cursor:not-allowed}
.gx-btn.is-red{border-color:var(--red);background:var(--red);color:#fff}
.gx-btn.is-red:hover:not(:disabled){background:var(--red-600);border-color:var(--red-600);color:#fff;box-shadow:0 10px 22px rgba(225,6,19,.28)}
.gx-btn.is-sm{height:34px;padding:0 12px;font-size:12.5px;border-radius:11px}
.gx-btn.is-icon{width:42px;padding:0}
.gx-btn.is-danger{color:var(--red)}
.gx-btn .spin{animation:gxSpin .8s linear infinite;display:inline-flex}
.gx-field{display:block;font-size:12.5px;font-weight:800;color:var(--text)}
.gx-field>span{display:block;margin-bottom:6px}
.gx-field i{color:var(--red);font-style:normal}
.gx-in{width:100%;min-height:44px;padding:10px 13px;border:1px solid var(--line);border-radius:13px;background:var(--soft);color:var(--ink);font-size:14px;font-weight:600;outline:0;font-family:inherit;transition:all .2s}
.gx-in:hover{border-color:var(--line2)}
.gx-in:focus{border-color:var(--red);background:var(--surface);box-shadow:0 0 0 4px var(--red-soft)}
textarea.gx-in{min-height:96px;resize:vertical}
.gx-search{display:flex;align-items:center;gap:8px;height:42px;min-width:220px;padding:0 12px;border:1px solid var(--line);border-radius:13px;background:var(--surface);color:var(--muted);transition:all .2s}
.gx-search:focus-within{border-color:var(--red);box-shadow:0 0 0 4px var(--red-soft)}
.gx-search input{flex:1;min-width:0;border:0;outline:0;background:none;color:var(--ink);font-size:13.5px;font-weight:600}
.gx-grid2{display:grid;gap:14px}
@media(min-width:640px){.gx-grid2{grid-template-columns:1fr 1fr}.gx-span2{grid-column:span 2}}

/* switch */
.gx-sw{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);cursor:pointer;transition:all .22s var(--ease)}
.gx-sw:hover{border-color:var(--line2)}
.gx-sw.is-on{border-color:var(--red-mid);background:var(--red-soft)}
.gx-sw b{font-size:13.5px;font-weight:800;color:var(--ink)}
.gx-sw small{display:block;margin-top:1px;font-size:11.5px;font-weight:600;color:var(--muted)}
.gx-sw input{position:absolute;opacity:0;pointer-events:none}
.gx-track{position:relative;flex-shrink:0;width:44px;height:26px;border-radius:99px;background:var(--line2);transition:background .25s}
.gx-sw.is-on .gx-track{background:var(--red)}
.gx-track::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.2);transition:transform .35s var(--spring)}
.gx-sw.is-on .gx-track::after{transform:translateX(18px)}

/* cards + kpi */
.gx-card{border:1px solid var(--line);border-radius:22px;background:var(--surface);box-shadow:0 1px 2px rgba(11,18,32,.03);transition:box-shadow .3s,border-color .3s,transform .3s var(--ease)}
.gx-card-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px 14px}
.gx-card-h h3{margin:0;font-size:16px;font-weight:900;color:var(--ink)}
.gx-card-h p{margin:3px 0 0;font-size:12.5px;font-weight:600;color:var(--muted)}
.gx-card-b{padding:0 20px 20px}
.gx-kpis{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.gx-kpi{position:relative;overflow:hidden;padding:18px;border:1px solid var(--line);border-radius:22px;background:var(--surface);transition:transform .3s var(--ease),box-shadow .3s,border-color .3s}
.gx-kpi:hover{transform:translateY(-4px);border-color:var(--line2);box-shadow:0 16px 36px rgba(11,18,32,.09)}
.gx-kpi::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--red);transform:scaleX(0);transform-origin:left;transition:transform .45s var(--ease)}
.gx-kpi:hover::after{transform:scaleX(1)}
.gx-kpi-ic{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:var(--soft);color:var(--text);transition:all .35s var(--spring)}
.gx-kpi:hover .gx-kpi-ic{transform:rotate(-8deg) scale(1.1)}
.gx-kpi.t-red .gx-kpi-ic{background:var(--red-soft);color:var(--red)}
.gx-kpi.t-ok .gx-kpi-ic{background:var(--ok-soft);color:var(--ok)}
.gx-kpi.t-warn .gx-kpi-ic{background:var(--warn-soft);color:var(--warn)}
.gx-kpi.t-solid{border-color:var(--red);background:var(--red);color:#fff}
.gx-kpi.t-solid .gx-kpi-ic{background:rgba(255,255,255,.2);color:#fff}
.gx-kpi.t-solid .gx-kpi-v,.gx-kpi.t-solid .gx-kpi-l{color:#fff}
.gx-kpi.t-solid .gx-kpi-n{color:rgba(255,255,255,.85)}
.gx-kpi.t-solid::after{background:#fff}
.gx-kpi.is-alert .gx-kpi-ic{animation:gxPing 1.8s ease-out infinite}
.gx-kpi-l{margin-top:14px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.gx-kpi-v{margin-top:4px;font-size:28px;font-weight:900;letter-spacing:-.02em;color:var(--ink);font-variant-numeric:tabular-nums}
.gx-kpi-n{margin-top:3px;font-size:12px;font-weight:650;color:var(--muted)}

/* pipeline */
.gx-pipe{display:flex;height:14px;gap:4px;overflow:hidden;border-radius:99px;background:var(--soft)}
.gx-pipe i{display:block;height:100%;border-radius:99px;transform-origin:left;animation:gxGrowX 1s var(--ease) both}
.gx-legend{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:14px}
.gx-legend span{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--text)}
.gx-legend i{width:10px;height:10px;border-radius:4px}
.gx-legend b{color:var(--ink)}

/* badges */
.gx-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:99px;background:var(--soft);color:var(--text);font-size:11.5px;font-weight:850;text-transform:capitalize;white-space:nowrap}
.gx-badge::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.gx-b-pending,.gx-b-unpaid{background:var(--warn-soft);color:var(--warn)}
.gx-b-accepted{background:var(--blue-soft);color:var(--blue)}
.gx-b-preparing{background:var(--violet-soft);color:var(--violet)}
.gx-b-picked_up{background:var(--cyan-soft);color:var(--cyan)}
.gx-b-on_the_way{background:var(--indigo-soft);color:var(--indigo)}
.gx-b-delivered,.gx-b-active,.gx-b-available,.gx-b-paid,.gx-b-verified{background:var(--ok-soft);color:var(--ok)}
.gx-b-cancelled,.gx-b-inactive,.gx-b-disabled{background:var(--soft);color:var(--muted)}
.gx-b-rejected,.gx-b-suspended,.gx-b-failed,.gx-b-refunded{background:var(--red-soft);color:var(--red)}
.gx-b-promoted{background:var(--red-soft);color:var(--red)}

/* chips */
.gx-chips{display:flex;flex-wrap:wrap;gap:6px}
.gx-chip{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 13px;border:1px solid var(--line);border-radius:99px;background:var(--surface);color:var(--text);font-size:12.5px;font-weight:800;text-transform:capitalize;cursor:pointer;transition:all .22s var(--ease)}
.gx-chip:hover:not(:disabled){border-color:var(--red);color:var(--red)}
.gx-chip.is-on{border-color:var(--red);background:var(--red);color:#fff;transform:scale(1.03)}
.gx-chip:disabled{opacity:.5;cursor:not-allowed}

/* tables */
.gx-tw{overflow-x:auto}
.gx-table{width:100%;min-width:760px;border-collapse:collapse;text-align:left;font-size:13.5px}
.gx-table th{padding:13px 16px;background:var(--soft);font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.gx-table td{padding:14px 16px;border-top:1px solid var(--line);vertical-align:middle;transition:background .2s}
.gx-table tbody tr{animation:gxSlide .4s var(--ease) calc(var(--i,0)*35ms) both}
.gx-table tbody tr:hover td{background:var(--red-soft)}
.gx-table small{display:block;margin-top:2px;font-size:12px;font-weight:600;color:var(--muted)}
.gx-table b{font-weight:850;color:var(--ink)}
.gx-table a.tel{color:var(--red);font-weight:800}
.gx-table a.tel:hover{text-decoration:underline}
.gx-r{text-align:right}
.gx-acts{display:flex;align-items:center;justify-content:flex-end;gap:6px}

/* card grid */
.gx-cards{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(290px,1fr))}
.gx-item{position:relative;overflow:hidden;padding:16px;border:1px solid var(--line);border-radius:22px;background:var(--surface);animation:gxRise .5s var(--ease) calc(var(--i,0)*50ms) both;transition:transform .3s var(--ease),box-shadow .3s,border-color .3s}
.gx-item:hover{transform:translateY(-4px);border-color:var(--red);box-shadow:0 18px 38px rgba(11,18,32,.09)}
.gx-item-top{display:flex;align-items:flex-start;gap:12px}
.gx-thumb{display:grid;place-items:center;flex-shrink:0;width:60px;height:60px;overflow:hidden;border-radius:16px;background:var(--red-soft);color:var(--red)}
.gx-thumb img{width:100%;height:100%;object-fit:cover}
.gx-item h4{margin:0;font-size:15px;font-weight:900;color:var(--ink)}
.gx-item p{margin:3px 0 0;font-size:12.5px;font-weight:600;color:var(--muted)}
.gx-prices{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
.gx-prices div{padding:10px 12px;border-radius:14px;background:var(--soft)}
.gx-prices small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.gx-prices b{display:block;margin-top:2px;font-size:16px;font-weight:900;color:var(--ink)}
.gx-stock{margin-top:12px}
.gx-stock-row{display:flex;align-items:center;gap:10px;margin-top:7px;font-size:12px;font-weight:750;color:var(--text)}
.gx-stock-row span:first-child{width:46px;color:var(--muted)}
.gx-meter{flex:1;height:7px;border-radius:99px;background:var(--soft);overflow:hidden}
.gx-meter i{display:block;height:100%;border-radius:99px;background:var(--ok);transform-origin:left;animation:gxGrowX .9s var(--ease) both}
.gx-meter i.low{background:var(--warn)}
.gx-meter i.zero{background:var(--red)}
.gx-item-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}
.gx-contact{display:flex;flex-direction:column;gap:6px;margin-top:14px;font-size:13px;font-weight:650;color:var(--text)}
.gx-contact span{display:flex;align-items:flex-start;gap:8px}
.gx-contact svg{flex-shrink:0;margin-top:2px;color:var(--muted)}

/* pagination */
.gx-pager{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:14px 20px;border-top:1px solid var(--line);font-size:13px;font-weight:700;color:var(--muted)}
.gx-pages{display:flex;gap:6px}
.gx-pg{display:grid;place-items:center;min-width:36px;height:36px;padding:0 8px;border:1px solid var(--line);border-radius:11px;background:var(--surface);color:var(--text);font-size:13px;font-weight:800;cursor:pointer;transition:all .2s var(--ease)}
.gx-pg:hover:not(:disabled){border-color:var(--red);color:var(--red)}
.gx-pg.is-on{border-color:var(--red);background:var(--red);color:#fff}
.gx-pg:disabled{opacity:.4;cursor:not-allowed}

/* states */
.gx-empty{display:grid;justify-items:center;gap:8px;padding:44px 16px;text-align:center;font-size:14px;font-weight:700;color:var(--muted)}
.gx-empty svg{opacity:.5;animation:gxFloat 3s ease-in-out infinite}
.gx-sk{border-radius:16px;background:var(--line);animation:gxBlink 1.3s ease-in-out infinite}
.gx-alert{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;border:1px solid var(--red-mid);border-radius:16px;background:var(--red-soft);color:var(--red);font-size:14px;font-weight:700;animation:gxRise .35s var(--ease) both}
.gx-alert button{border:0;background:none;color:var(--red);cursor:pointer;font-weight:900}
.gx-toast{position:fixed;left:50%;bottom:26px;z-index:200;display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:99px;background:var(--ink);color:#fff;font-size:13.5px;font-weight:800;box-shadow:0 16px 36px rgba(0,0,0,.3);animation:gxToast .4s var(--spring) both}
.gx-toast svg{color:#4ade80}
.gx-toast.is-err svg{color:#f87171}

/* modal */
.gx-ov{position:fixed;inset:0;z-index:120;display:grid;place-items:center;overflow-y:auto;padding:16px;background:rgba(11,18,32,.55);backdrop-filter:blur(6px);animation:gxFade .22s ease both}
.gx-ov.is-out{animation:gxOut .2s ease both}
.gx-modal{width:100%;max-width:720px;margin:auto;overflow:hidden;border-radius:26px;background:var(--bg);box-shadow:0 40px 100px rgba(0,0,0,.4);animation:gxModal .4s var(--spring) both}
.gx-modal.is-wide{max-width:1040px}
.gx-modal.is-sm{max-width:420px}
.gx-ov.is-out .gx-modal{animation:gxModalOut .2s var(--ease) both}
.gx-m-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;border-bottom:1px solid var(--line);background:var(--surface)}
.gx-m-head h3{margin:0;font-size:19px;font-weight:900;letter-spacing:-.01em;color:var(--ink)}
.gx-m-head p{margin:2px 0 0;font-size:12.5px;font-weight:600;color:var(--muted)}
.gx-m-body{max-height:calc(100vh - 170px);overflow-y:auto;padding:20px 22px}
.gx-m-foot{display:flex;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid var(--line);background:var(--surface)}
.gx-sec{margin-bottom:16px;padding:16px;border:1px solid var(--line);border-radius:18px;background:var(--surface)}
.gx-sec h4{margin:0 0 14px;font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.gx-confirm{padding:26px;text-align:center;background:var(--surface)}
.gx-confirm .ic{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 14px;border-radius:18px;background:var(--red-soft);color:var(--red);animation:gxFloat 2.6s ease-in-out infinite}
.gx-confirm h3{margin:0;font-size:19px;font-weight:900;color:var(--ink)}
.gx-confirm p{margin:8px 0 20px;font-size:13.5px;line-height:1.55;font-weight:600;color:var(--muted)}
.gx-confirm .row{display:flex;justify-content:center;gap:10px}

/* upload */
.gx-drop{display:flex;align-items:center;gap:14px;padding:14px;border:1.5px dashed var(--line2);border-radius:16px;background:var(--soft);cursor:pointer;transition:all .22s var(--ease)}
.gx-drop:hover,.gx-drop.is-over{border-color:var(--red);background:var(--red-soft)}
.gx-drop input{display:none}
.gx-drop .pv{display:grid;place-items:center;flex-shrink:0;width:64px;height:64px;overflow:hidden;border-radius:14px;background:var(--surface);color:var(--red)}
.gx-drop .pv img{width:100%;height:100%;object-fit:cover}
.gx-drop b{display:block;font-size:13.5px;font-weight:850;color:var(--ink)}
.gx-drop small{display:block;margin-top:2px;font-size:12px;font-weight:600;color:var(--muted)}

/* order modal */
.gx-ostrip{display:grid;gap:10px;grid-template-columns:repeat(2,1fr);margin-bottom:16px}
@media(min-width:768px){.gx-ostrip{grid-template-columns:repeat(4,1fr)}}
.gx-os{padding:12px 14px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.gx-os small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.gx-os b{display:block;margin-top:5px;font-size:16px;font-weight:900;color:var(--ink)}
.gx-os.is-red{border-color:var(--red);background:var(--red)}
.gx-os.is-red small{color:rgba(255,255,255,.8)}
.gx-os.is-red b{color:#fff}
.gx-ogrid{display:grid;gap:16px}
@media(min-width:900px){.gx-ogrid{grid-template-columns:1.1fr .9fr}}
.gx-steps{display:flex;align-items:flex-start;margin-bottom:18px;overflow-x:auto;padding-bottom:4px}
.gx-step{position:relative;flex:1;min-width:74px;text-align:center}
.gx-step::before{content:"";position:absolute;top:15px;left:-50%;width:100%;height:3px;border-radius:3px;background:var(--line)}
.gx-step:first-child::before{display:none}
.gx-step.is-done::before,.gx-step.is-now::before{background:var(--red)}
.gx-dot{position:relative;z-index:1;display:grid;place-items:center;width:32px;height:32px;margin:0 auto;border:3px solid var(--line);border-radius:50%;background:var(--surface);color:var(--muted);font-size:11px;font-weight:900;transition:all .4s var(--spring)}
.gx-step.is-done .gx-dot{border-color:var(--red);background:var(--red);color:#fff}
.gx-step.is-now .gx-dot{border-color:var(--red);color:var(--red);animation:gxPing 1.8s ease-out infinite}
.gx-step span{display:block;margin-top:7px;font-size:11px;font-weight:800;text-transform:capitalize;color:var(--muted)}
.gx-step.is-done span,.gx-step.is-now span{color:var(--ink)}
.gx-info{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13.5px}
.gx-info:last-child{border-bottom:0}
.gx-info span:first-child{flex-shrink:0;font-weight:700;color:var(--muted)}
.gx-info span:last-child{max-width:68%;text-align:right;font-weight:750;color:var(--ink);word-break:break-word}
.gx-line{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);animation:gxSlide .4s var(--ease) calc(var(--i,0)*50ms) both}
.gx-line:last-child{border-bottom:0}
.gx-line b{color:var(--ink)}
.gx-line p{margin:3px 0 0;font-size:12px;font-weight:600;color:var(--muted)}
.gx-saved{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:var(--ok);animation:gxPop .3s var(--spring)}

/* settings */
.gx-sgrid{display:grid;gap:18px}
@media(min-width:1100px){.gx-sgrid{grid-template-columns:1fr 1fr}}
.gx-slot{display:flex;gap:8px;animation:gxSlide .35s var(--ease) both}
.gx-savebar{position:sticky;bottom:16px;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px 12px 20px;border:1px solid var(--line2);border-radius:20px;background:var(--surface);box-shadow:0 18px 40px rgba(11,18,32,.18);animation:gxBar .4s var(--spring) both}
.gx-savebar span{display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:800;color:var(--ink)}
.gx-savebar .dirty{width:9px;height:9px;border-radius:50%;background:var(--red);animation:gxBlink 1.2s ease-in-out infinite}


.gx-modal.is-xl{max-width:1240px}
.gx-b-approved,.gx-b-online,.gx-b-resolved{background:var(--ok-soft);color:var(--ok)}
.gx-b-blocked{background:var(--red-soft);color:var(--red)}
.gx-b-offline,.gx-b-closed,.gx-b-draft,.gx-b-expired{background:var(--soft);color:var(--muted)}
.gx-b-busy,.gx-b-open{background:var(--warn-soft);color:var(--warn)}
.gx-b-reviewing{background:var(--blue-soft);color:var(--blue)}
.rx-ic{padding:14px 16px;border:1px solid var(--line);border-radius:16px;background:var(--soft);animation:gxRise .5s var(--ease) calc(var(--i,0)*50ms) both;transition:transform .25s var(--ease),border-color .25s}
.rx-ic:hover{transform:translateY(-3px);border-color:var(--line2)}
.rx-ic small{display:block;font-size:11.5px;font-weight:800;opacity:.75}
.rx-ic b{display:block;margin-top:4px;font-size:19px;font-weight:900;word-break:break-word}
.rx-ic.t-red{background:var(--red-soft);border-color:var(--red-mid);color:var(--red)}
.rx-ic.t-ok{background:var(--ok-soft);border-color:#c9ebd6;color:var(--ok)}
.rx-ic.t-warn{background:var(--warn-soft);border-color:#f3dcb0;color:var(--warn)}
.rx-ic.t-blue{background:var(--blue-soft);border-color:#c7d8fb;color:var(--blue)}
.rx-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.rx-av{display:grid;place-items:center;flex-shrink:0;width:54px;height:54px;border-radius:18px;background:var(--red);color:#fff;font-size:18px;font-weight:900;position:relative;transition:transform .35s var(--spring)}
.gx-item:hover .rx-av{transform:rotate(-6deg) scale(1.08)}
.rx-av i{position:absolute;right:-3px;bottom:-3px;width:15px;height:15px;border:3px solid var(--surface);border-radius:50%;background:var(--muted)}
.rx-av i.on{background:#22c55e;animation:gxPing 1.8s ease-out infinite}
.rx-av i.busy{background:#f59e0b}
.rx-mini{display:grid;gap:8px;grid-template-columns:repeat(3,1fr);margin-top:14px}
.rx-mini div{padding:10px 12px;border-radius:14px;background:var(--soft)}
.rx-mini small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.06em;color:var(--muted)}
.rx-mini b{display:block;margin-top:3px;font-size:13.5px;font-weight:900;color:var(--ink)}
.rx-tabs{display:flex;gap:6px;overflow-x:auto;padding:12px 22px;border-bottom:1px solid var(--line);background:var(--surface)}
.rx-tabs .gx-chip{flex-shrink:0;text-transform:none}
.rx-pane{animation:gxRise .4s var(--ease) both}
.rx-split{display:grid;gap:16px}
@media(min-width:1000px){.rx-split{grid-template-columns:.85fr 1.15fr}}
.rx-bar{height:10px;border-radius:99px;background:var(--soft);overflow:hidden}
.rx-bar i{display:block;height:100%;border-radius:99px;transform-origin:left;animation:gxGrowX .9s var(--ease) both}
.rx-cells{display:grid;overflow:hidden;border:1px solid var(--line);border-radius:18px;gap:1px;background:var(--line)}
@media(min-width:760px){.rx-cells{grid-template-columns:repeat(3,1fr)}}
.rx-cell{padding:16px;background:var(--soft)}
.rx-cell small{display:block;font-size:12px;font-weight:800;color:var(--muted)}
.rx-cell b{display:block;margin-top:4px;font-size:24px;font-weight:900;color:var(--ink)}
.rx-cell.t-ok{background:var(--ok-soft)}.rx-cell.t-ok small,.rx-cell.t-ok b{color:var(--ok)}
.rx-cell.t-blue{background:var(--blue-soft)}.rx-cell.t-blue small,.rx-cell.t-blue b{color:var(--blue)}
.rx-cell.t-red{background:var(--red-soft)}.rx-cell.t-red small,.rx-cell.t-red b{color:var(--red)}
.rx-formula{margin-top:14px;padding:12px 16px;border:1.5px dashed var(--line2);border-radius:14px;background:var(--soft);font-size:13px;font-weight:650;line-height:1.6;color:var(--text)}
.rx-live{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--red)}
.rx-live i{width:9px;height:9px;border-radius:50%;background:var(--red);animation:gxPing 1.5s ease-out infinite}
.rx-map{width:100%;height:300px;margin-top:14px;border:1px solid var(--line);border-radius:18px}
.rx-pts{display:grid;gap:8px;margin-top:14px;grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}
.rx-pts a{display:block;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--soft);font-size:12px;font-weight:800;color:var(--text);transition:all .2s var(--ease)}
.rx-pts a:hover{border-color:var(--red);background:var(--red-soft);color:var(--red);transform:translateY(-2px)}
.rx-pts a span{display:block;margin-top:2px;font-weight:600;color:var(--muted)}
.rx-doc{overflow:hidden;border:1px solid var(--line);border-radius:18px;background:var(--surface);animation:gxRise .5s var(--ease) calc(var(--i,0)*60ms) both;transition:transform .3s var(--ease),box-shadow .3s}
.rx-doc:hover{transform:translateY(-4px);box-shadow:0 16px 34px rgba(11,18,32,.1)}
.rx-doc .im{display:block;height:170px;overflow:hidden;background:var(--soft)}
.rx-doc .im img{width:100%;height:100%;object-fit:cover;transition:transform .5s var(--ease)}
.rx-doc:hover .im img{transform:scale(1.07)}
.rx-doc .pdf{display:grid;place-items:center;height:170px;background:var(--red-soft);color:var(--red);font-size:13px;font-weight:900}
.rx-doc .bd{padding:14px}
.rx-doc h5{margin:0;font-size:14px;font-weight:900;color:var(--ink)}
.rx-doc p{margin:3px 0 0;font-size:12px;font-weight:600;color:var(--muted)}
.rx-note{margin-top:14px;padding:14px;border-radius:14px;background:var(--soft);font-size:13px;font-weight:600;line-height:1.8;color:var(--text)}
.rx-note b{color:var(--ink)}
.rx-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.rx-search{min-width:min(100%,320px)}

@media(prefers-reduced-motion:reduce){
  .gx *,.gx *::before,.gx *::after{animation-duration:.001ms!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}
`;

/* ------------------------------------------------------------ primitives */
function Badge({ value }) {
  const key = String(value || "-");
  return <span className={`gx-badge gx-b-${key}`}>{statusBn[key] || key.replaceAll("_", " ")}</span>;
}

function Switch({ checked, onChange, label, hint }) {
  return (
    <label className={`gx-sw ${checked ? "is-on" : ""}`}>
      <span><b>{label}</b>{hint ? <small>{hint}</small> : null}</span>
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span className="gx-track" />
    </label>
  );
}

function Field({ label, required, children }) {
  return <label className="gx-field"><span>{label}{required ? <i> *</i> : null}</span>{children}</label>;
}

function TextInput({ label, onChange, required, ...rest }) {
  return <Field label={label} required={required}><input className="gx-in" required={required} onChange={(e) => onChange(e.target.value)} {...rest} /></Field>;
}

function SelectField({ label, value, onChange, children, required, ...rest }) {
  return <Field label={label} required={required}><select className="gx-in" value={value} required={required} onChange={(e) => onChange(e.target.value)} {...rest}>{children}</select></Field>;
}

function TextArea({ label, value, onChange }) {
  return <Field label={label} required><textarea required className="gx-in" value={value} onChange={(e) => onChange(e.target.value)} /></Field>;
}

function Panel({ title, children, index = 0 }) {
  return <section className="gx-sec gx-reveal" style={{ "--d": index }}><h4>{title}</h4>{children}</section>;
}

function Info({ label, value }) {
  return <div className="gx-info"><span>{label}</span><span>{value}</span></div>;
}

function Empty({ icon = "box", children }) {
  return <div className="gx-empty"><Icon name={icon} size={38} /><span>{children}</span></div>;
}

function Skeleton({ rows = 5 }) {
  return <div style={{ display: "grid", gap: 10, padding: 16 }} aria-hidden="true">{Array.from({ length: rows }).map((_, i) => <div key={i} className="gx-sk" style={{ height: 54, animationDelay: `${i * 80}ms` }} />)}</div>;
}

function Modal({ title, subtitle, children, footer, onClose, wide = false, small = false, xl = false }) {
  const [closing, setClosing] = useState(false);
  const timer = useRef(null);
  const close = useCallback(() => {
    if (closing) return;
    if (reduced()) { onClose(); return; }
    setClosing(true);
    timer.current = setTimeout(onClose, 200);
  }, [closing, onClose]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [close]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className={`gx gx-ov ${closing ? "is-out" : ""}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className={`gx-modal ${wide ? "is-wide" : ""} ${xl ? "is-xl" : ""} ${small ? "is-sm" : ""}`}>
        {title ? (
          <div className="gx-m-head">
            <div><h3>{title}</h3>{subtitle ? <p>{subtitle}</p> : null}</div>
            <button type="button" className="gx-btn is-icon is-sm" onClick={close} aria-label="Close"><Icon name="close" size={18} /></button>
          </div>
        ) : null}
        {children}
        {footer}
      </div>
    </div>
  );
}

function ConfirmDialog({ title, text, confirmLabel = "Delete", busy, onCancel, onConfirm }) {
  return (
    <Modal small onClose={onCancel}>
      <div className="gx-confirm">
        <div className="ic"><Icon name="trash" size={26} /></div>
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="row">
          <button type="button" className="gx-btn" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="gx-btn is-red" onClick={onConfirm} disabled={busy}>{busy ? "Working..." : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}

function Pager({ meta, onPage }) {
  if (meta.last_page <= 1) return null;
  const { current_page: cur, last_page: last } = meta;
  const pages = [];
  for (let p = Math.max(1, cur - 2); p <= Math.min(last, cur + 2); p += 1) pages.push(p);
  return (
    <div className="gx-pager">
      <span>Page {cur} of {last} · {meta.total} records</span>
      <div className="gx-pages">
        <button type="button" className="gx-pg" disabled={cur <= 1} onClick={() => onPage(cur - 1)} aria-label="Previous"><Icon name="left" size={16} /></button>
        {pages.map((p) => <button key={p} type="button" className={`gx-pg ${p === cur ? "is-on" : ""}`} onClick={() => onPage(p)}>{p}</button>)}
        <button type="button" className="gx-pg" disabled={cur >= last} onClick={() => onPage(cur + 1)} aria-label="Next"><Icon name="right" size={16} /></button>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, format, note, tone = "slate", alert = false, index = 0 }) {
  return (
    <div className={`gx-kpi t-${tone} ${alert ? "is-alert" : ""} gx-reveal`} style={{ "--d": index }}>
      <span className="gx-kpi-ic"><Icon name={icon} size={21} /></span>
      <div className="gx-kpi-l">{label}</div>
      <div className="gx-kpi-v"><Counter value={value} format={format} /></div>
      <div className="gx-kpi-n">{note}</div>
    </div>
  );
}

function StockRow({ label, value }) {
  const n = Number(value || 0);
  const pct = Math.min(100, (n / 30) * 100);
  return (
    <div className="gx-stock-row">
      <span>{label}</span>
      <div className="gx-meter"><i className={n === 0 ? "zero" : n <= 5 ? "low" : ""} style={{ width: `${Math.max(n === 0 ? 4 : 6, pct)}%` }} /></div>
      <span>{n}</span>
    </div>
  );
}

/* ------------------------------------------------------------ rider bits */
function InfoCard({ label, value, tone = "default", index = 0 }) {
  return (
    <div className={`rx-ic t-${tone}`} style={{ "--i": index }}>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

function RiderFinancialOverview({ financial, compact = false }) {
  const cash = Number(financial.cash_in_hand || 0);
  const pending = Number(financial.pending_earning || 0);
  const adminReceivable = Number(financial.admin_receivable_after_earning || 0);
  const adminPayable = Number(financial.admin_payable_to_rider || 0);
  const max = Math.max(cash, pending, 1);

  return (
    <section className="gx-sec">
      <div className="gx-head" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="gx-eyebrow" style={{ color: "var(--ok)" }}>Financial Overview</div>
          <h4 style={{ margin: "6px 0 0", fontSize: 20, letterSpacing: "-.01em", textTransform: "none", color: "var(--ink)" }}>রাইডারের আয় ও ক্যাশ হিসাব</h4>
          <p className="gx-sub">আজকের আয়, বর্তমান ক্যাশ এবং settlement-এর পরিষ্কার হিসাব।</p>
        </div>
        <span className="gx-badge">{financial.as_of ? `আপডেট: ${dateTime(financial.as_of)}` : "বর্তমান হিসাব"}</span>
      </div>

      <div className="rx-grid" style={{ marginTop: 16 }}>
        <InfoCard index={0} label="আজকের আয়" value={money(financial.today_earning)} tone="ok" />
        <InfoCard index={1} label="আজ ডেলিভারি" value={`${numberBn(financial.today_delivered_orders)}টি`} tone="blue" />
        <InfoCard index={2} label="আজ ক্যাশ সংগ্রহ" value={money(financial.today_cash_collected)} />
        <InfoCard index={3} label="রাইডারের কাছে মোট ক্যাশ" value={money(cash)} tone="warn" />
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
        <div>
          <div className="gx-stock-row" style={{ marginTop: 0 }}><span style={{ width: 110 }}>ক্যাশ হাতে</span><div className="rx-bar"><i style={{ width: `${Math.max(3, (cash / max) * 100)}%`, background: "var(--warn)" }} /></div><span style={{ width: 80, textAlign: "right" }}>{money(cash)}</span></div>
          <div className="gx-stock-row"><span style={{ width: 110 }}>অনাদায়ী আয়</span><div className="rx-bar"><i style={{ width: `${Math.max(3, (pending / max) * 100)}%`, background: "var(--ok)", animationDelay: ".15s" }} /></div><span style={{ width: 80, textAlign: "right" }}>{money(pending)}</span></div>
        </div>
      </div>

      <div className="rx-cells" style={{ marginTop: 16 }}>
        <div className="rx-cell"><small>অনাদায়ী রাইডার আয়</small><b>{money(pending)}</b></div>
        <div className="rx-cell t-ok"><small>ক্যাশ থেকে রাইডার রাখবে</small><b>{money(financial.earning_retained_from_cash)}</b></div>
        <div className={`rx-cell ${adminPayable > 0 ? "t-blue" : "t-red"}`}>
          <small>{adminPayable > 0 ? "অ্যাডমিন রাইডারকে দেবে" : "অ্যাডমিন রাইডারের কাছে পাবে"}</small>
          <b>{money(adminPayable > 0 ? adminPayable : adminReceivable)}</b>
        </div>
      </div>

      <div className="rx-formula">
        <b>হিসাব:</b> রাইডারের কাছে ক্যাশ {money(cash)} − অনাদায়ী আয় {money(pending)} = {adminPayable > 0 ? `অ্যাডমিন রাইডারকে দেবে ${money(adminPayable)}` : `অ্যাডমিন পাবে ${money(adminReceivable)}`}।
      </div>

      {!compact && (
        <div className="rx-grid" style={{ marginTop: 14 }}>
          <InfoCard index={0} label="আজকের ডেলিভারি চার্জ" value={money(financial.today_delivery_fees)} />
          <InfoCard index={1} label="বর্তমান ওয়ালেট ব্যালেন্স" value={money(financial.wallet_balance)} />
          <InfoCard index={2} label="Net settlement" value={money(adminPayable > 0 ? -adminPayable : adminReceivable)} tone={adminPayable > 0 ? "blue" : "red"} />
        </div>
      )}
    </section>
  );
}

function EmptyState({ children }) {
  return <Empty icon="note">{children}</Empty>;
}

function HistoryTable({ columns, rows, empty }) {
  if (!rows?.length) return <div className="gx-card"><EmptyState>{empty}</EmptyState></div>;
  return (
    <div className="gx-card" style={{ overflow: "hidden" }}>
      <div className="gx-tw">
        <table className="gx-table">
          <thead>
            <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} style={{ "--i": Math.min(i, 14) }}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : shortText(row[column.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiderLiveMapCard({ rider, locations }) {
  const lat = toCoord(rider.last_lat);
  const lng = toCoord(rider.last_lng);
  const pointUrl = mapsPointUrl(lat, lng);
  const embedUrl = mapsEmbedPointUrl(lat, lng);

  return (
    <section className="gx-sec">
      <div className="gx-head" style={{ alignItems: "flex-start" }}>
        <div>
          {pointUrl ? <span className="rx-live"><i />Live</span> : null}
          <h4 style={{ margin: "6px 0 0", fontSize: 18, textTransform: "none", letterSpacing: "-.01em", color: "var(--ink)" }}>লাইভ লোকেশন</h4>
          <p className="gx-sub">
            {lat !== null && lng !== null
              ? `${lat}, ${lng}${rider.last_location_at ? ` • Updated ${dateTime(rider.last_location_at)}` : ""}`
              : "রাইডার এখনো live location পাঠায়নি।"}
          </p>
        </div>
        {pointUrl && <a href={pointUrl} target="_blank" rel="noreferrer" className="gx-btn is-sm"><Icon name="map" size={14} /> Open Map</a>}
      </div>
      {embedUrl ? (
        <iframe title={`Rider live map ${rider.id}`} src={embedUrl} className="rx-map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <div className="rx-note" style={{ textAlign: "center" }}>Location available হলে এখানে map preview দেখা যাবে।</div>
      )}
      {!!locations?.length && (
        <div className="rx-pts">
          {locations.slice(0, 6).map((location) => (
            <a key={location.id} href={mapsPointUrl(location.lat, location.lng)} target="_blank" rel="noreferrer">
              {location.lat}, {location.lng}
              <span>{dateTime(location.created_at)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

const SERVICE = (row) => (row.service_type === "medicine" ? "Medicine" : "Food");

function RiderDetails({ detail, token, onClose, onSaved }) {
  const rider = detail.rider || detail;
  const stats = detail.stats || {};
  const financial = detail.financial_overview || {};
  const [tab, setTab] = useState("overview");
  const [form, setForm] = useState({
    kyc_status: rider.kyc_status || "pending",
    account_status: rider.account_status || "pending",
    availability_status: rider.availability_status || "offline",
    commission_type: rider.commission_type || "fixed",
    commission_value: rider.commission_value || 0,
    payment_cycle: rider.payment_cycle || "weekly",
    admin_note: rider.admin_note || "",
    kyc_note: rider.kyc_note || "",
    bkash_number: rider.bkash_number || "",
    nagad_number: rider.nagad_number || "",
    bank_account_name: rider.bank_account_name || "",
    bank_account_number: rider.bank_account_number || "",
    bank_name: rider.bank_name || "",
    bank_branch: rider.bank_branch || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const docs = rider.documents || [];
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (patch = {}) => {
    setSaving(true);
    setErr("");
    try {
      await apiRequest(`/admin/resources/riders/${rider.id}`, {
        method: "PUT",
        token,
        body: { ...form, ...patch },
      });
      await onSaved();
      onClose();
    } catch (e) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    ["overview", "ওভারভিউ"],
    ["financials", "আর্থিক হিসাব"],
    ["kyc", "KYC"],
    ["orders", "অর্ডার"],
    ["wallet", "ওয়ালেট"],
    ["requests", "রিকোয়েস্ট"],
    ["ratings", "রেটিং"],
    ["support", "সাপোর্ট"],
    ["locations", "লোকেশন"],
    ["deal", "চুক্তি"],
  ];

  const SaveBtn = ({ children }) => <button type="button" className="gx-btn is-red" onClick={() => save()} disabled={saving}>{saving ? "Saving..." : children}</button>;

  return (
    <Modal
      xl
      title={rider.name}
      subtitle={`${rider.phone} • ${vehicleBn[rider.vehicle_type] || rider.vehicle_type} • ${rider.upazila || "উপজেলা নেই"}`}
      onClose={onClose}
    >
      <div className="rx-tabs" role="tablist">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={`gx-chip ${tab === key ? "is-on" : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div className="gx-m-body" key={tab}>
        {err ? <div className="gx-alert" style={{ marginBottom: 14 }}><span>{err}</span><button type="button" onClick={() => setErr("")}>Dismiss</button></div> : null}

        {tab === "overview" && (
          <div className="rx-pane">
            <RiderFinancialOverview financial={financial} compact />
            <div className="rx-split">
              <section className="gx-sec">
                <h4>প্রোফাইল</h4>
                <div className="rx-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
                  <InfoCard index={0} label="KYC" value={statusBn[rider.kyc_status] || rider.kyc_status} />
                  <InfoCard index={1} label="অ্যাকাউন্ট" value={statusBn[rider.account_status] || rider.account_status} />
                  <InfoCard index={2} label="অনলাইন অবস্থা" value={statusBn[rider.availability_status] || rider.availability_status} />
                  <InfoCard index={3} label="রেটিং" value={`${rider.rating || "0.00"} (${numberBn(rider.rating_count)})`} />
                  <InfoCard index={4} label="মোট অর্ডার" value={numberBn(stats.total_orders)} />
                  <InfoCard index={5} label="ডেলিভারড" value={numberBn(stats.delivered_orders)} />
                  <InfoCard index={6} label="Active Order" value={numberBn(stats.active_orders)} />
                  <InfoCard index={7} label="মোট আয়" value={money(stats.total_earning)} tone="ok" />
                </div>
                <div className="rx-note">
                  <div><b>ঠিকানা:</b> {[rider.district, rider.upazila, rider.address].filter(Boolean).join(", ") || "-"}</div>
                  <div><b>যানবাহন:</b> {vehicleBn[rider.vehicle_type] || "-"} • {rider.vehicle_number || "নম্বর নেই"}</div>
                  <div><b>জরুরি যোগাযোগ:</b> {rider.emergency_contact_name || "-"} • {rider.emergency_contact_phone || "-"}</div>
                  <div><b>bKash/Nagad:</b> {rider.bkash_number || "-"} • {rider.nagad_number || "-"}</div>
                  <div><b>User:</b> {rider.user?.name || "-"} • {rider.user?.email || rider.email || "-"}</div>
                </div>
              </section>

              <section className="gx-sec">
                <h4>দ্রুত অ্যাকশন</h4>
                <p className="gx-sub" style={{ marginTop: -6, marginBottom: 14 }}>KYC approve/reject, account status, online status এক জায়গা থেকে control করুন।</p>
                <div className="gx-grid2">
                  <SelectField label="KYC স্ট্যাটাস" value={form.kyc_status} onChange={set("kyc_status")}>
                    <option value="pending">পর্যালোচনায়</option>
                    <option value="approved">অনুমোদিত</option>
                    <option value="rejected">বাতিল</option>
                  </SelectField>
                  <SelectField label="অ্যাকাউন্ট স্ট্যাটাস" value={form.account_status} onChange={set("account_status")}>
                    <option value="pending">অপেক্ষমাণ</option>
                    <option value="active">সক্রিয়</option>
                    <option value="suspended">সাময়িক বন্ধ</option>
                    <option value="blocked">ব্লক</option>
                  </SelectField>
                  <SelectField label="অনলাইন অবস্থা" value={form.availability_status} onChange={set("availability_status")}>
                    <option value="offline">অফলাইন</option>
                    <option value="online">অনলাইন</option>
                    <option value="busy">ব্যস্ত</option>
                  </SelectField>
                  <div className="gx-span2">
                    <Field label="অ্যাডমিন নোট"><textarea className="gx-in" value={form.admin_note} onChange={(e) => set("admin_note")(e.target.value)} /></Field>
                  </div>
                </div>
                <div className="rx-actions">
                  <SaveBtn>Save Changes</SaveBtn>
                  <button type="button" className="gx-btn" disabled={saving} onClick={() => save({ kyc_status: "approved", account_status: "active", agreement_status: "active" })}><Icon name="check" size={15} /> Approve Rider</button>
                  <button type="button" className="gx-btn is-danger" disabled={saving} onClick={() => save({ account_status: "blocked", availability_status: "offline" })}>Block</button>
                </div>
              </section>
            </div>
            <RiderLiveMapCard rider={rider} locations={detail.locations || []} />
          </div>
        )}

        {tab === "financials" && (
          <div className="rx-pane">
            <RiderFinancialOverview financial={financial} />
            <div style={{ margin: "4px 0 12px" }}>
              <h4 style={{ margin: 0, fontSize: 18, color: "var(--ink)" }}>ডেলিভারি অনুযায়ী আর্থিক বিবরণ</h4>
              <p className="gx-sub">সাম্প্রতিক delivered order-এ কত ক্যাশ নেওয়া হয়েছে, rider-এর আয় এবং admin-এর প্রাপ্য।</p>
            </div>
            <HistoryTable
              rows={detail.financial_orders || []}
              empty="এই রাইডারের delivered order-এর আর্থিক history নেই।"
              columns={[
                { key: "order_no", label: "অর্ডার", render: (row) => <b>{row.order_no}</b> },
                { key: "service_type", label: "সার্ভিস", render: SERVICE },
                { key: "payment_method", label: "পেমেন্ট", render: (row) => row.payment_method === "cash_on_delivery" ? "ক্যাশ" : shortText(row.payment_method) },
                { key: "grand_total", label: "অর্ডার মোট", render: (row) => money(row.grand_total) },
                { key: "delivery_fee", label: "ডেলিভারি চার্জ", render: (row) => money(row.delivery_fee) },
                { key: "cash_collected", label: "ক্যাশ নিয়েছে", render: (row) => money(row.cash_collected) },
                { key: "rider_earning", label: "রাইডার আয়", render: (row) => <b style={{ color: "var(--ok)" }}>{money(row.rider_earning)}</b> },
                { key: "admin_receivable_if_earning_kept", label: "অ্যাডমিন পাবে", render: (row) => <b style={{ color: "var(--red)" }}>{money(row.admin_receivable_if_earning_kept)}</b> },
                { key: "delivered_at", label: "ডেলিভারড", render: (row) => dateTime(row.delivered_at) },
              ]}
            />
          </div>
        )}

        {tab === "kyc" && (
          <div className="rx-pane">
            <section className="gx-sec">
              <h4>KYC ডকুমেন্ট যাচাই</h4>
              <div className="gx-cards" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))" }}>
                {docs.map((doc, i) => (
                  <article key={doc.id} className="rx-doc" style={{ "--i": i }}>
                    {doc.file_url && /\.(jpg|jpeg|png|webp)$/i.test(doc.file_url) && (
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="im"><img src={doc.file_url} alt={doc.title || doc.type} /></a>
                    )}
                    {doc.file_url && !/\.(jpg|jpeg|png|webp)$/i.test(doc.file_url) && (
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="pdf">PDF ডকুমেন্ট খুলুন</a>
                    )}
                    <div className="bd">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                        <div><h5>{doc.type_bn || doc.title}</h5><p>{doc.title}</p></div>
                        <Badge value={doc.status} />
                      </div>
                      {doc.file_url && <div style={{ marginTop: 12 }}><a className="gx-btn is-sm" href={doc.file_url} target="_blank" rel="noreferrer"><Icon name="doc" size={14} /> ডকুমেন্ট দেখুন</a></div>}
                    </div>
                  </article>
                ))}
              </div>
              {!docs.length && <EmptyState>এখনো KYC ডকুমেন্ট আপলোড হয়নি।</EmptyState>}
            </section>

            <section className="gx-sec">
              <h4>রাইডার পেমেন্ট তথ্য</h4>
              <div className="gx-grid2">
                <TextInput label="bKash Number" value={form.bkash_number} onChange={set("bkash_number")} />
                <TextInput label="Nagad Number" value={form.nagad_number} onChange={set("nagad_number")} />
                <TextInput label="Bank Account Name" value={form.bank_account_name} onChange={set("bank_account_name")} />
                <TextInput label="Bank Account Number" value={form.bank_account_number} onChange={set("bank_account_number")} />
                <TextInput label="Bank Name" value={form.bank_name} onChange={set("bank_name")} />
                <TextInput label="Branch" value={form.bank_branch} onChange={set("bank_branch")} />
              </div>
              <div className="rx-actions">
                <SaveBtn>Save Payment Info</SaveBtn>
                <button type="button" className="gx-btn" disabled={saving} onClick={() => save({ kyc_status: "approved", account_status: "active" })}><Icon name="check" size={15} /> KYC Approve</button>
                <button type="button" className="gx-btn is-danger" disabled={saving} onClick={() => save({ kyc_status: "rejected", account_status: "pending" })}>Reject</button>
              </div>
            </section>
          </div>
        )}

        {tab === "orders" && (
          <div className="rx-pane">
            <HistoryTable
              rows={detail.orders || []}
              empty="এই রাইডারের কোনো অর্ডার history নেই।"
              columns={[
                { key: "order_no", label: "Order", render: (row) => <b>{row.order_no}</b> },
                { key: "service_type", label: "Service", render: SERVICE },
                { key: "status", label: "Status", render: (row) => <Badge value={row.status} /> },
                { key: "receiver_name", label: "Customer", render: (row) => <span>{row.receiver_name}<small>{row.receiver_phone}</small></span> },
                { key: "merchant_name", label: "Merchant" },
                { key: "grand_total", label: "Total", render: (row) => money(row.grand_total) },
                { key: "rider_earning", label: "Earning", render: (row) => money(row.rider_earning) },
                { key: "created_at", label: "Date", render: (row) => dateTime(row.created_at) },
              ]}
            />
          </div>
        )}

        {tab === "wallet" && (
          <div className="rx-pane">
            <div className="rx-grid" style={{ marginBottom: 16 }}>
              <InfoCard index={0} label="Wallet Balance" value={money(rider.wallet_balance)} />
              <InfoCard index={1} label="Pending Payout" value={money(rider.pending_payout)} tone="warn" />
              <InfoCard index={2} label="Cash In Hand" value={money(rider.cash_in_hand)} tone="red" />
              <InfoCard index={3} label="Total Earning" value={money(stats.total_earning)} tone="ok" />
            </div>
            <HistoryTable
              rows={detail.wallet_entries || []}
              empty="এই রাইডারের wallet transaction নেই।"
              columns={[
                { key: "created_at", label: "Date", render: (row) => dateTime(row.created_at) },
                { key: "type", label: "Type" },
                { key: "title", label: "Title" },
                { key: "amount", label: "Amount", render: (row) => <b>{money(row.amount)}</b> },
                { key: "balance_after", label: "Balance", render: (row) => money(row.balance_after) },
                { key: "payout_status", label: "Payout", render: (row) => shortText(row.payout_status) },
              ]}
            />
          </div>
        )}

        {tab === "requests" && (
          <div className="rx-pane">
            <HistoryTable
              rows={detail.order_requests || []}
              empty="এই রাইডারের dispatch request history নেই।"
              columns={[
                { key: "order_no", label: "Order", render: (row) => <b>{row.order_no}</b> },
                { key: "service_type", label: "Service", render: SERVICE },
                { key: "status", label: "Request", render: (row) => <Badge value={row.status} /> },
                { key: "order_status", label: "Order Status" },
                { key: "distance_km", label: "Distance", render: (row) => row.distance_km ? `${row.distance_km} km` : "-" },
                { key: "notified_at", label: "Notified", render: (row) => dateTime(row.notified_at) },
                { key: "responded_at", label: "Response", render: (row) => dateTime(row.responded_at) },
              ]}
            />
          </div>
        )}

        {tab === "ratings" && (
          <div className="rx-pane">
            <HistoryTable
              rows={detail.ratings || []}
              empty="এই রাইডারের rating history নেই।"
              columns={[
                { key: "created_at", label: "Date", render: (row) => dateTime(row.created_at) },
                { key: "rating", label: "Rating", render: (row) => <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 900, color: "var(--warn)" }}><Icon name="star" size={14} />{row.rating}/5</span> },
                { key: "review", label: "Review", render: (row) => shortText(row.review) },
                { key: "food_order_id", label: "Food Order", render: (row) => shortText(row.food_order_id) },
                { key: "user_id", label: "User", render: (row) => shortText(row.user_id) },
              ]}
            />
          </div>
        )}

        {tab === "support" && (
          <div className="rx-pane">
            <HistoryTable
              rows={detail.support_tickets || []}
              empty="এই রাইডারের support ticket নেই।"
              columns={[
                { key: "created_at", label: "Date", render: (row) => dateTime(row.created_at) },
                { key: "subject", label: "Subject", render: (row) => <b>{row.subject}</b> },
                { key: "status", label: "Status", render: (row) => <Badge value={row.status} /> },
                { key: "message", label: "Message" },
                { key: "admin_reply", label: "Admin Reply", render: (row) => shortText(row.admin_reply) },
              ]}
            />
          </div>
        )}

        {tab === "locations" && (
          <div className="rx-pane">
            <RiderLiveMapCard rider={rider} locations={detail.locations || []} />
            <HistoryTable
              rows={detail.locations || []}
              empty="এই রাইডারের location history নেই।"
              columns={[
                { key: "created_at", label: "Date", render: (row) => dateTime(row.created_at) },
                { key: "lat", label: "Latitude" },
                { key: "lng", label: "Longitude" },
                { key: "accuracy", label: "Accuracy", render: (row) => row.accuracy ? `${row.accuracy}m` : "-" },
                { key: "map", label: "Map", render: (row) => <a className="tel" href={mapsPointUrl(row.lat, row.lng)} target="_blank" rel="noreferrer">Open</a> },
              ]}
            />
          </div>
        )}

        {tab === "deal" && (
          <div className="rx-pane">
            <section className="gx-sec">
              <h4>চুক্তি, কমিশন ও পেমেন্ট</h4>
              <div className="gx-grid2" style={{ gridTemplateColumns: undefined }}>
                <SelectField label="কমিশন ধরন" value={form.commission_type} onChange={set("commission_type")}>
                  <option value="fixed">প্রতি ডেলিভারিতে নির্দিষ্ট</option>
                  <option value="percentage">শতকরা</option>
                  <option value="zone_based">এলাকা অনুযায়ী</option>
                </SelectField>
                <TextInput label="কমিশন ভ্যালু" type="number" value={form.commission_value} onChange={set("commission_value")} />
                <SelectField label="পেমেন্ট সাইকেল" value={form.payment_cycle} onChange={set("payment_cycle")}>
                  <option value="daily">দৈনিক</option>
                  <option value="weekly">সাপ্তাহিক</option>
                  <option value="monthly">মাসিক</option>
                </SelectField>
              </div>
              <div className="rx-grid" style={{ marginTop: 16 }}>
                <InfoCard index={0} label="চুক্তি" value={rider.agreement_accepted ? "গ্রহণ করেছে" : "গ্রহণ করেনি"} tone={rider.agreement_accepted ? "ok" : "warn"} />
                <InfoCard index={1} label="Agreement Status" value={statusBn[rider.agreement_status] || rider.agreement_status || "-"} />
                <InfoCard index={2} label="Payment Cycle" value={rider.payment_cycle || "-"} />
              </div>
              <div className="rx-actions"><SaveBtn>Save Deal</SaveBtn></div>
            </section>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------- page */
const FILTERS = [
  ["all", "সব"],
  ["kyc", "KYC Pending"],
  ["active", "Active"],
  ["online", "Online"],
];

export default function RiderAdminPage({ token }) {
  const [riders, setRiders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loadedOnce, setLoadedOnce] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/admin/resources/riders?search=${encodeURIComponent(search)}&per_page=100`, { token });
      setRiders(data.data || []);
    } catch (err) {
      setError(err.message || "রাইডার লোড করা যায়নি।");
    } finally {
      setLoading(false);
      setLoadedOnce(true);
    }
  };

  useEffect(() => {
    load();
  }, [search, token]);

  const openRider = async (rider) => {
    setDetailLoading(rider.id);
    setError("");
    try {
      const data = await apiRequest(`/admin/riders/${rider.id}/details`, { token });
      setSelected(data);
    } catch (err) {
      setError(err.message || "রাইডার বিস্তারিত লোড করা যায়নি।");
    } finally {
      setDetailLoading(null);
    }
  };

  const stats = useMemo(() => ({
    total: riders.length,
    pending: riders.filter((r) => r.kyc_status === "pending").length,
    active: riders.filter((r) => r.account_status === "active").length,
    online: riders.filter((r) => r.availability_status === "online").length,
  }), [riders]);

  const visible = useMemo(() => riders.filter((r) => {
    if (filter === "kyc") return r.kyc_status === "pending";
    if (filter === "active") return r.account_status === "active";
    if (filter === "online") return r.availability_status === "online";
    return true;
  }), [riders, filter]);

  return (
    <div className="gx gx-page">
      <style>{css}</style>

      <header className="gx-head gx-reveal">
        <div>
          <div className="gx-eyebrow">Rider System</div>
          <h2 className="gx-title">রাইডার ম্যানেজমেন্ট</h2>
          <p className="gx-sub">KYC, চুক্তি, অর্ডার history, wallet, dispatch, support ও location এক জায়গায়।</p>
        </div>
        <div className="gx-tools">
          <label className="gx-search rx-search">
            <Icon name="search" size={16} />
            <input placeholder="নাম, ফোন, উপজেলা বা যানবাহন নম্বর খুঁজুন" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <button type="button" className="gx-btn is-icon" onClick={load} disabled={loading} aria-label="Refresh">
            <span className={loading ? "spin" : ""} style={{ display: "inline-flex" }}><Icon name="refresh" size={16} /></span>
          </button>
        </div>
      </header>

      <div className="gx-kpis">
        <Kpi index={0} icon="bike" label="মোট রাইডার" value={stats.total} note="তালিকায় আছে" />
        <Kpi index={1} icon="shield" label="KYC Pending" value={stats.pending} note="যাচাই বাকি" tone="warn" alert={stats.pending > 0} />
        <Kpi index={2} icon="check" label="Active" value={stats.active} note="সক্রিয় অ্যাকাউন্ট" tone="ok" />
        <Kpi index={3} icon="truck" label="Online" value={stats.online} note="এখন কাজে আছে" tone="solid" />
      </div>

      {error && (
        <div className="gx-alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      <div className="gx-chips gx-reveal" style={{ "--d": 5 }}>
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" className={`gx-chip ${filter === key ? "is-on" : ""}`} onClick={() => setFilter(key)}>
            {label}
            <b style={{ opacity: .75 }}>{key === "all" ? stats.total : key === "kyc" ? stats.pending : key === "active" ? stats.active : stats.online}</b>
          </button>
        ))}
      </div>

      {loading && !loadedOnce ? (
        <div className="gx-cards">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="gx-sk" style={{ height: 210, borderRadius: 22, animationDelay: `${i * 90}ms` }} />)}</div>
      ) : null}

      <div className="gx-cards" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,420px),1fr))", opacity: loading && loadedOnce ? 0.6 : 1, transition: "opacity .25s" }}>
        {visible.map((rider, i) => (
          <article key={rider.id} className="gx-item" style={{ "--i": Math.min(i, 12) }}>
            <div className="gx-item-top">
              <span className="rx-av">
                {initials(rider.name)}
                <i className={rider.availability_status === "online" ? "on" : rider.availability_status === "busy" ? "busy" : ""} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4 style={{ fontSize: 17 }}>{rider.name}</h4>
                <p>{rider.phone} • {rider.upazila || "উপজেলা নেই"} • {vehicleBn[rider.vehicle_type] || rider.vehicle_type}</p>
              </div>
              <Badge value={rider.account_status} />
            </div>

            <div className="rx-mini">
              <div><small>KYC</small><b>{statusBn[rider.kyc_status] || rider.kyc_status}</b></div>
              <div><small>অবস্থা</small><b>{statusBn[rider.availability_status] || rider.availability_status}</b></div>
              <div><small>পেআউট</small><b>{money(rider.pending_payout)}</b></div>
            </div>

            <div className="gx-item-foot">
              <button type="button" className="gx-btn is-red is-sm" onClick={() => openRider(rider)} disabled={detailLoading !== null}>
                {detailLoading === rider.id ? <><span className="spin"><Icon name="refresh" size={14} /></span> Loading...</> : <><Icon name="user" size={14} /> Full Details</>}
              </button>
              {rider.last_lat && rider.last_lng && (
                <a className="gx-btn is-sm" href={mapsPointUrl(rider.last_lat, rider.last_lng)} target="_blank" rel="noreferrer"><Icon name="pin" size={14} /> Live Map</a>
              )}
            </div>
          </article>
        ))}
      </div>

      {!visible.length && !(loading && !loadedOnce) && (
        <div className="gx-card"><Empty icon="bike">{loading ? "রাইডার লোড হচ্ছে..." : "কোনো রাইডার পাওয়া যায়নি।"}</Empty></div>
      )}

      {selected && <RiderDetails detail={selected} token={token} onClose={() => setSelected(null)} onSaved={load} />}
    </div>
  );
}
