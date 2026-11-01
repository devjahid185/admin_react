import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest, apiUpload } from "../../lib/api.js";
import { formatDateTime } from "../../lib/formatters.js";

const statuses = ["pending", "accepted", "preparing", "picked_up", "on_the_way", "delivered", "cancelled", "rejected"];
const FLOW = ["pending", "accepted", "preparing", "picked_up", "on_the_way", "delivered"];
const TERMINAL = ["delivered", "cancelled", "rejected"];
const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"];
const money = (v) => `৳${Number(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
const emptyDealer = { name: "", phone: "", email: "", address: "", lat: "", lng: "", trade_license: "", status: "active", is_verified: true, delivery_available: true };
const emptyProduct = { gas_dealer_id: "", brand: "", name: "", weight_kg: "12", new_cylinder_price: "", refill_price: "", security_deposit: "0", new_stock: "0", refill_stock: "0", description: "", is_available: true, is_promoted: false, sort_order: "0" };
const defaultSettings = { is_enabled: true, fixed_delivery_fee: 40, free_delivery_min_order: "", emergency_fee: 50, max_delivery_distance_km: "", cod_enabled: true, bkash_enabled: false, nagad_enabled: false, bkash_number: "", nagad_number: "", delivery_slots: ["সকাল ৮টা - ১১টা", "দুপুর ১১টা - ৩টা", "বিকাল ৩টা - ৭টা", "সন্ধ্যা ৭টা - রাত ১০টা"], safety_notice: "", service_notice: "" };

const TITLES = {
  dashboard: ["Gas delivery", "Overview", "Live snapshot of orders, revenue and stock."],
  orders: ["Gas delivery", "Orders", "Track, assign and fulfil cylinder orders."],
  products: ["Gas delivery", "Products", "Cylinders, prices and stock by dealer."],
  dealers: ["Gas delivery", "Dealers", "Verified suppliers who fulfil the orders."],
  settings: ["Gas delivery", "Settings", "Fees, payments, slots and customer notices."],
};

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

@media(prefers-reduced-motion:reduce){
  .gx *,.gx *::before,.gx *::after{animation-duration:.001ms!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}
`;

/* ------------------------------------------------------------ primitives */
function Badge({ value }) {
  const key = String(value || "-");
  return <span className={`gx-badge gx-b-${key}`}>{key.replaceAll("_", " ")}</span>;
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

function Modal({ title, subtitle, children, footer, onClose, wide = false, small = false }) {
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
      <div className={`gx-modal ${wide ? "is-wide" : ""} ${small ? "is-sm" : ""}`}>
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

/* ------------------------------------------------------------------ page */
export default function GasDeliveryAdminPage({ token, section = "dashboard" }) {
  const tab = section;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState({ summary: {}, recent_orders: [], low_stock_products: [] });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dealers, setDealers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [savedSettings, setSavedSettings] = useState(JSON.stringify(defaultSettings));
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [confirmRow, setConfirmRow] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((text, isErr = false) => {
    setToast({ text, isErr, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const loadLookups = async () => {
    const [dealerData, riderData] = await Promise.all([
      apiRequest("/admin/gas/dealers?per_page=100", { token }),
      apiRequest("/admin/resources/riders?per_page=100", { token }),
    ]);
    setDealers(dealerData.data || []);
    setRiders((riderData.data || []).filter((r) => r.account_status === "active"));
  };

  const load = async (page = 1, over = {}) => {
    const q = over.search !== undefined ? over.search : search;
    const st = over.status !== undefined ? over.status : status;
    setLoading(true);
    setError("");
    try {
      if (tab === "dashboard") {
        const data = await apiRequest("/admin/gas/dashboard", { token });
        setDashboard(data);
        const next = { ...defaultSettings, ...(data.settings || {}) };
        setSettings(next);
        setSavedSettings(JSON.stringify(next));
      } else if (tab === "settings") {
        const data = await apiRequest("/admin/gas/settings", { token });
        const next = { ...defaultSettings, ...(data.settings || {}) };
        setSettings(next);
        setSavedSettings(JSON.stringify(next));
      } else {
        const params = new URLSearchParams({ page, per_page: 25 });
        if (q.trim()) params.set("search", q.trim());
        if (st && tab === "orders") params.set("status", st);
        const data = await apiRequest(`/admin/gas/${tab}?${params}`, { token });
        setRows(data.data || []);
        setMeta({ current_page: data.current_page || 1, last_page: data.last_page || 1, total: data.total || 0 });
      }
    } catch (e) {
      setError(e.message || "Unable to load gas delivery data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLookups().catch(() => {}); }, [token]);
  useEffect(() => { setRows([]); load(); }, [tab]);

  useEffect(() => {
    if (!image) { setPreview(""); return undefined; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const openCreate = () => { setImage(null); setEditing(tab === "dealers" ? { ...emptyDealer } : { ...emptyProduct }); };
  const openEdit = (row) => { setImage(null); setEditing({ ...row, gas_dealer_id: row.gas_dealer_id || row.dealer?.id || "" }); };

  const saveEntity = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const resource = tab;
      const exists = Boolean(editing.id);
      const payload = { ...editing };
      ["lat", "lng"].forEach((k) => { if (payload[k] === "") payload[k] = null; });
      const data = await apiRequest(`/admin/gas/${resource}${exists ? `/${editing.id}` : ""}`, { method: exists ? "PUT" : "POST", token, body: payload });
      const entity = data.product || data.dealer;
      if (tab === "products" && image && entity?.id) {
        const fd = new FormData();
        fd.append("image", image);
        await apiUpload(`/admin/gas/products/${entity.id}/image`, { token, formData: fd });
      }
      setEditing(null);
      setImage(null);
      await load(meta.current_page);
      await loadLookups();
      notify(exists ? "Changes saved" : `${tab === "products" ? "Product" : "Dealer"} added`);
    } catch (e2) {
      setError(e2.message);
      notify(e2.message || "Could not save", true);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmRow) return;
    setDeleting(true);
    try {
      await apiRequest(`/admin/gas/${tab}/${confirmRow.id}`, { method: "DELETE", token });
      setConfirmRow(null);
      await load(meta.current_page);
      notify("Deleted");
    } catch (e) {
      setConfirmRow(null);
      notify(e.message || "Could not delete", true);
    } finally {
      setDeleting(false);
    }
  };

  const openOrder = async (id) => {
    try { setDetail(await apiRequest(`/admin/gas/orders/${id}`, { token })); }
    catch (e) { notify(e.message || "Could not open order", true); }
  };

  const updateOrder = async (patch) => {
    setSaving(true);
    try {
      const data = await apiRequest(`/admin/gas/orders/${detail.id}`, { method: "PUT", token, body: patch });
      setDetail(data.order);
      await load(meta.current_page);
      notify("Order updated");
    } catch (e) {
      notify(e.message || "Update failed", true);
    } finally {
      setSaving(false);
    }
  };

  const assignRider = async (riderId) => {
    try {
      const data = await apiRequest(`/admin/gas/orders/${detail.id}/assign-rider`, { method: "POST", token, body: { rider_id: riderId || null } });
      setDetail((p) => ({ ...p, rider_id: riderId || null, rider: data.order.rider }));
      notify(riderId ? "Rider assigned" : "Rider removed");
    } catch (e) {
      notify(e.message || "Could not assign rider", true);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...settings, free_delivery_min_order: settings.free_delivery_min_order === "" ? null : settings.free_delivery_min_order, max_delivery_distance_km: settings.max_delivery_distance_km === "" ? null : settings.max_delivery_distance_km };
      const data = await apiRequest("/admin/gas/settings", { method: "PUT", token, body });
      const next = { ...defaultSettings, ...data.settings };
      setSettings(next);
      setSavedSettings(JSON.stringify(next));
      notify("Settings saved");
    } catch (e2) {
      notify(e2.message || "Could not save settings", true);
    } finally {
      setSaving(false);
    }
  };

  const dirty = JSON.stringify(settings) !== savedSettings;
  const s = dashboard.summary || {};
  const sum = Number(s.orders_pending || 0) + Number(s.orders_active || 0) + Number(s.orders_delivered || 0);
  const other = Math.max(0, Number(s.orders_total || 0) - sum);
  const pipe = useMemo(() => [
    ["Pending", Number(s.orders_pending || 0), "#b45309"],
    ["Active", Number(s.orders_active || 0), "#e10613"],
    ["Delivered", Number(s.orders_delivered || 0), "#15803d"],
    ["Cancelled / rejected", other, "#aab3c2"],
  ], [s, other]);
  const pipeTotal = pipe.reduce((a, p) => a + p[1], 0) || 1;
  const head = TITLES[tab] || TITLES.dashboard;
  const noun = tab === "products" ? "product" : "dealer";

  return (
    <div className="gx gx-page">
      <style>{css}</style>

      <header className="gx-head gx-reveal">
        <div>
          <div className="gx-eyebrow">{head[0]}</div>
          <h2 className="gx-title" key={tab}>{head[1]}</h2>
          <p className="gx-sub">{head[2]}</p>
        </div>
        <div className="gx-tools">
          <button type="button" className="gx-btn" onClick={() => load(tab === "dashboard" || tab === "settings" ? 1 : meta.current_page)} disabled={loading}>
            <span className={loading ? "spin" : ""} style={{ display: "inline-flex" }}><Icon name="refresh" size={16} /></span>
            Refresh
          </button>
          {(tab === "products" || tab === "dealers") && (
            <button type="button" className="gx-btn is-red" onClick={openCreate}><Icon name="plus" size={16} /> Add {noun}</button>
          )}
        </div>
      </header>

      {error ? (
        <div className="gx-alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>Dismiss</button>
        </div>
      ) : null}

      {/* ------------------------------------------------------ dashboard */}
      {tab === "dashboard" && loading && !s.orders_total ? (
        <>
          <div className="gx-kpis">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="gx-sk" style={{ height: 150, borderRadius: 22, animationDelay: `${i * 90}ms` }} />)}</div>
          <div className="gx-sk" style={{ height: 180, borderRadius: 22 }} />
        </>
      ) : null}

      {tab === "dashboard" && !(loading && !s.orders_total) ? (
        <>
          <div className="gx-kpis">
            <Kpi index={0} icon="bag" label="Total orders" value={s.orders_total || 0} note="All time" />
            <Kpi index={1} icon="clock" label="Pending" value={s.orders_pending || 0} note="Needs action" tone="warn" alert={Number(s.orders_pending) > 0} />
            <Kpi index={2} icon="truck" label="Active delivery" value={s.orders_active || 0} note="In progress" tone="red" />
            <Kpi index={3} icon="check" label="Delivered" value={s.orders_delivered || 0} note="Completed" tone="ok" />
            <Kpi index={4} icon="wallet" label="Delivered revenue" value={Number(s.revenue_delivered || 0)} format={money} note="Gross total" tone="solid" />
            <Kpi index={5} icon="alert" label="Low stock" value={s.low_stock || 0} note="5 or fewer" tone="warn" alert={Number(s.low_stock) > 0} />
          </div>

          <section className="gx-card gx-reveal" style={{ "--d": 6 }}>
            <div className="gx-card-h"><div><h3>Order pipeline</h3><p>How all orders are distributed right now.</p></div></div>
            <div className="gx-card-b">
              <div className="gx-pipe">
                {pipe.filter((p) => p[1] > 0).map((p, i) => <i key={p[0]} title={`${p[0]}: ${p[1]}`} style={{ width: `${(p[1] / pipeTotal) * 100}%`, background: p[2], animationDelay: `${i * 120}ms` }} />)}
              </div>
              <div className="gx-legend">
                {pipe.map((p) => <span key={p[0]}><i style={{ background: p[2] }} />{p[0]} <b>{p[1]}</b></span>)}
              </div>
            </div>
          </section>

          <div className="gx-sgrid">
            <section className="gx-card gx-reveal" style={{ "--d": 7, overflow: "hidden" }}>
              <div className="gx-card-h"><div><h3>Recent orders</h3><p>Latest activity across all dealers.</p></div></div>
              <div className="gx-tw">
                <table className="gx-table" style={{ minWidth: 520 }}>
                  <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th className="gx-r">Total</th></tr></thead>
                  <tbody>
                    {dashboard.recent_orders?.length ? dashboard.recent_orders.map((o, i) => (
                      <tr key={o.id} style={{ "--i": i }}>
                        <td><b>{o.order_no}</b></td>
                        <td>{o.receiver_name}<small>{o.dealer?.name}</small></td>
                        <td><Badge value={o.status} /></td>
                        <td className="gx-r"><b>{money(o.grand_total)}</b></td>
                      </tr>
                    )) : <tr><td colSpan={4}><Empty icon="bag">No data yet</Empty></td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="gx-card gx-reveal" style={{ "--d": 8, overflow: "hidden" }}>
              <div className="gx-card-h"><div><h3>Low stock watch</h3><p>Restock these before they run out.</p></div></div>
              <div className="gx-tw">
                <table className="gx-table" style={{ minWidth: 520 }}>
                  <thead><tr><th>Product</th><th>Dealer</th><th>New</th><th>Refill</th></tr></thead>
                  <tbody>
                    {dashboard.low_stock_products?.length ? dashboard.low_stock_products.map((p, i) => (
                      <tr key={p.id} style={{ "--i": i }}>
                        <td><b>{p.brand} {p.name}</b></td>
                        <td>{p.dealer?.name}</td>
                        <td><span className={`gx-badge ${Number(p.new_stock) === 0 ? "gx-b-rejected" : "gx-b-pending"}`}>{p.new_stock}</span></td>
                        <td><span className={`gx-badge ${Number(p.refill_stock) === 0 ? "gx-b-rejected" : "gx-b-pending"}`}>{p.refill_stock}</span></td>
                      </tr>
                    )) : <tr><td colSpan={4}><Empty icon="shield">All stock levels look healthy</Empty></td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      ) : null}

      {/* ------------------------------------------------ list sections */}
      {["orders", "products", "dealers"].includes(tab) ? (
        <section className="gx-card gx-reveal" style={{ "--d": 1, overflow: "hidden" }}>
          <div className="gx-card-h">
            <div><h3 style={{ textTransform: "capitalize" }}>{tab}</h3><p>{meta.total} records</p></div>
            <form className="gx-tools" onSubmit={(e) => { e.preventDefault(); load(1); }}>
              <label className="gx-search">
                <Icon name="search" size={16} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab}`} />
              </label>
              <button type="submit" className="gx-btn">Filter</button>
            </form>
          </div>

          {tab === "orders" ? (
            <div className="gx-card-b" style={{ paddingTop: 0 }}>
              <div className="gx-chips">
                <button type="button" className={`gx-chip ${status === "" ? "is-on" : ""}`} onClick={() => { setStatus(""); load(1, { status: "" }); }}>All</button>
                {statuses.map((st) => (
                  <button key={st} type="button" className={`gx-chip ${status === st ? "is-on" : ""}`} onClick={() => { setStatus(st); load(1, { status: st }); }}>{st.replaceAll("_", " ")}</button>
                ))}
              </div>
            </div>
          ) : null}

          {loading ? <Skeleton rows={6} /> : null}

          {!loading && rows.length === 0 ? <Empty icon={tab === "dealers" ? "store" : "box"}>No {tab} found</Empty> : null}

          {!loading && tab === "orders" && rows.length > 0 ? (
            <div className="gx-tw">
              <table className="gx-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Dealer</th><th>Schedule</th><th>Status</th><th className="gx-r">Total</th><th /></tr></thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id} style={{ "--i": i }}>
                      <td><b>{row.order_no}</b><small>{formatDateTime(row.created_at)}</small></td>
                      <td>{row.receiver_name}<a className="tel" href={`tel:${row.receiver_phone}`} style={{ display: "block" }}>{row.receiver_phone}</a></td>
                      <td>{row.dealer?.name || "-"}</td>
                      <td>{row.delivery_date || "Today"}<small>{row.is_emergency ? "Emergency" : row.delivery_slot || "Flexible"}</small></td>
                      <td><Badge value={row.status} /></td>
                      <td className="gx-r"><b>{money(row.grand_total)}</b></td>
                      <td><div className="gx-acts"><button type="button" className="gx-btn is-sm" onClick={() => openOrder(row.id)}>Details</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!loading && tab === "products" && rows.length > 0 ? (
            <div className="gx-card-b">
              <div className="gx-cards">
                {rows.map((row, i) => (
                  <article key={row.id} className="gx-item" style={{ "--i": i }}>
                    <div className="gx-item-top">
                      <span className="gx-thumb">{row.image_url ? <img src={row.image_url} alt="" /> : <Icon name="box" size={26} />}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4>{row.brand} {row.name}</h4>
                        <p>{row.weight_kg} kg · {row.dealer?.name || "No dealer"}</p>
                      </div>
                      {row.is_promoted ? <span className="gx-badge gx-b-promoted"><Icon name="star" size={12} />Promoted</span> : null}
                    </div>
                    <div className="gx-prices">
                      <div><small>New</small><b>{money(row.new_cylinder_price)}</b></div>
                      <div><small>Refill</small><b>{money(row.refill_price)}</b></div>
                    </div>
                    <div className="gx-stock">
                      <StockRow label="New" value={row.new_stock} />
                      <StockRow label="Refill" value={row.refill_stock} />
                    </div>
                    <div className="gx-item-foot">
                      <Badge value={row.is_available ? "available" : "disabled"} />
                      <div className="gx-acts">
                        <button type="button" className="gx-btn is-sm" onClick={() => openEdit(row)}><Icon name="edit" size={14} /> Edit</button>
                        <button type="button" className="gx-btn is-sm is-icon is-danger" onClick={() => setConfirmRow(row)} aria-label="Delete"><Icon name="trash" size={14} /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {!loading && tab === "dealers" && rows.length > 0 ? (
            <div className="gx-card-b">
              <div className="gx-cards">
                {rows.map((row, i) => (
                  <article key={row.id} className="gx-item" style={{ "--i": i }}>
                    <div className="gx-item-top">
                      <span className="gx-thumb"><Icon name="store" size={26} /></span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4>{row.name}</h4>
                        <p>{row.products_count || 0} products</p>
                      </div>
                      {row.is_verified ? <span className="gx-badge gx-b-verified">Verified</span> : null}
                    </div>
                    <div className="gx-contact">
                      <span><Icon name="phone" size={15} /><a className="tel" href={`tel:${row.phone}`} style={{ color: "var(--red)", fontWeight: 800 }}>{row.phone}</a></span>
                      {row.email ? <span><Icon name="note" size={15} />{row.email}</span> : null}
                      <span><Icon name="pin" size={15} />{row.address}</span>
                    </div>
                    <div className="gx-item-foot">
                      <Badge value={row.status} />
                      <div className="gx-acts">
                        <button type="button" className="gx-btn is-sm" onClick={() => openEdit(row)}><Icon name="edit" size={14} /> Edit</button>
                        <button type="button" className="gx-btn is-sm is-icon is-danger" onClick={() => setConfirmRow(row)} aria-label="Delete"><Icon name="trash" size={14} /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <Pager meta={meta} onPage={(p) => load(p)} />
        </section>
      ) : null}

      {/* --------------------------------------------------- settings */}
      {tab === "settings" && loading ? <Skeleton rows={5} /> : null}

      {tab === "settings" && !loading ? (
        <form onSubmit={saveSettings} style={{ display: "grid", gap: 18 }}>
          <div className="gx-sgrid">
            <Panel index={0} title="Service and delivery">
              <div className="gx-grid2">
                <Switch label="Gas delivery enabled" hint="Turn off to pause all orders" checked={settings.is_enabled} onChange={(v) => setSettings({ ...settings, is_enabled: v })} />
                <Switch label="Cash on delivery" hint="Pay when cylinder arrives" checked={settings.cod_enabled} onChange={(v) => setSettings({ ...settings, cod_enabled: v })} />
                <TextInput label="Fixed delivery fee" type="number" value={settings.fixed_delivery_fee} onChange={(v) => setSettings({ ...settings, fixed_delivery_fee: v })} />
                <TextInput label="Emergency fee" type="number" value={settings.emergency_fee} onChange={(v) => setSettings({ ...settings, emergency_fee: v })} />
                <TextInput label="Free delivery minimum" type="number" value={settings.free_delivery_min_order ?? ""} onChange={(v) => setSettings({ ...settings, free_delivery_min_order: v })} />
                <TextInput label="Maximum distance (km)" type="number" value={settings.max_delivery_distance_km ?? ""} onChange={(v) => setSettings({ ...settings, max_delivery_distance_km: v })} />
              </div>
            </Panel>

            <Panel index={1} title="Payments">
              <div style={{ display: "grid", gap: 12 }}>
                <Switch label="Manual bKash" hint="Customers send money and enter TrxID" checked={settings.bkash_enabled} onChange={(v) => setSettings({ ...settings, bkash_enabled: v })} />
                {settings.bkash_enabled ? <div className="gx-slot"><div style={{ flex: 1 }}><TextInput label="bKash number" value={settings.bkash_number || ""} onChange={(v) => setSettings({ ...settings, bkash_number: v })} /></div></div> : null}
                <Switch label="Manual Nagad" hint="Customers send money and enter TrxID" checked={settings.nagad_enabled} onChange={(v) => setSettings({ ...settings, nagad_enabled: v })} />
                {settings.nagad_enabled ? <div className="gx-slot"><div style={{ flex: 1 }}><TextInput label="Nagad number" value={settings.nagad_number || ""} onChange={(v) => setSettings({ ...settings, nagad_number: v })} /></div></div> : null}
              </div>
            </Panel>

            <Panel index={2} title="Delivery slots">
              <div style={{ display: "grid", gap: 10 }}>
                {(settings.delivery_slots || []).map((slot, i) => (
                  <div key={i} className="gx-slot">
                    <input className="gx-in" value={slot} placeholder="e.g. সকাল ৮টা - ১১টা" onChange={(e) => { const next = [...settings.delivery_slots]; next[i] = e.target.value; setSettings({ ...settings, delivery_slots: next }); }} />
                    <button type="button" className="gx-btn is-icon is-danger" aria-label="Remove slot" onClick={() => setSettings({ ...settings, delivery_slots: settings.delivery_slots.filter((_, x) => x !== i) })}><Icon name="close" size={16} /></button>
                  </div>
                ))}
                <div><button type="button" className="gx-btn is-sm" onClick={() => setSettings({ ...settings, delivery_slots: [...(settings.delivery_slots || []), ""] })}><Icon name="plus" size={14} /> Add slot</button></div>
              </div>
            </Panel>

            <Panel index={3} title="Customer notices">
              <div style={{ display: "grid", gap: 14 }}>
                <TextArea label="Service notice" value={settings.service_notice || ""} onChange={(v) => setSettings({ ...settings, service_notice: v })} />
                <TextArea label="Mandatory safety notice" value={settings.safety_notice || ""} onChange={(v) => setSettings({ ...settings, safety_notice: v })} />
              </div>
            </Panel>
          </div>

          <div className="gx-savebar">
            <span>{dirty ? <><i className="dirty" />Unsaved changes</> : <span className="gx-saved"><Icon name="check" size={15} />All changes saved</span>}</span>
            <div className="gx-tools">
              {dirty ? <button type="button" className="gx-btn" onClick={() => setSettings(JSON.parse(savedSettings))} disabled={saving}>Discard</button> : null}
              <button type="submit" className="gx-btn is-red" disabled={saving || !dirty}>{saving ? "Saving..." : "Save gas settings"}</button>
            </div>
          </div>
        </form>
      ) : null}

      {/* ---------------------------------------------- entity modal */}
      {editing ? (
        <Modal title={`${editing.id ? "Edit" : "Add"} ${tab === "products" ? "gas product" : "dealer"}`} subtitle={tab === "products" ? "Pricing, stock and visibility" : "Contact, location and status"} onClose={() => setEditing(null)}>
          <form onSubmit={saveEntity}>
            <div className="gx-m-body">
              {tab === "dealers" ? (
                <>
                  <Panel title="Business" index={0}>
                    <div className="gx-grid2">
                      <TextInput label="Dealer name" required value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
                      <TextInput label="Phone" required value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} />
                      <TextInput label="Email" value={editing.email || ""} onChange={(v) => setEditing({ ...editing, email: v })} />
                      <TextInput label="Trade license" value={editing.trade_license || ""} onChange={(v) => setEditing({ ...editing, trade_license: v })} />
                    </div>
                  </Panel>
                  <Panel title="Location" index={1}>
                    <div className="gx-grid2">
                      <div className="gx-span2"><TextArea label="Address" value={editing.address} onChange={(v) => setEditing({ ...editing, address: v })} /></div>
                      <TextInput label="Latitude" type="number" step="any" value={editing.lat || ""} onChange={(v) => setEditing({ ...editing, lat: v })} />
                      <TextInput label="Longitude" type="number" step="any" value={editing.lng || ""} onChange={(v) => setEditing({ ...editing, lng: v })} />
                    </div>
                  </Panel>
                  <Panel title="Status" index={2}>
                    <div className="gx-grid2">
                      <SelectField label="Status" value={editing.status} onChange={(v) => setEditing({ ...editing, status: v })}>
                        <option>active</option><option>inactive</option><option>suspended</option>
                      </SelectField>
                      <div style={{ display: "grid", gap: 10 }}>
                        <Switch label="Verified dealer" checked={editing.is_verified} onChange={(v) => setEditing({ ...editing, is_verified: v })} />
                        <Switch label="Delivery available" checked={editing.delivery_available} onChange={(v) => setEditing({ ...editing, delivery_available: v })} />
                      </div>
                    </div>
                  </Panel>
                </>
              ) : (
                <>
                  <Panel title="Product" index={0}>
                    <div className="gx-grid2">
                      <SelectField label="Dealer" required value={editing.gas_dealer_id} onChange={(v) => setEditing({ ...editing, gas_dealer_id: v })}>
                        <option value="">Select dealer</option>
                        {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </SelectField>
                      <TextInput label="Brand" required value={editing.brand} onChange={(v) => setEditing({ ...editing, brand: v })} />
                      <TextInput label="Product name" required value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
                      <TextInput label="Weight (kg)" type="number" step="0.1" required value={editing.weight_kg} onChange={(v) => setEditing({ ...editing, weight_kg: v })} />
                      <div className="gx-span2"><TextArea label="Description" value={editing.description || ""} onChange={(v) => setEditing({ ...editing, description: v })} /></div>
                    </div>
                  </Panel>
                  <Panel title="Pricing" index={1}>
                    <div className="gx-grid2">
                      <TextInput label="New cylinder price" type="number" required value={editing.new_cylinder_price} onChange={(v) => setEditing({ ...editing, new_cylinder_price: v })} />
                      <TextInput label="Refill price" type="number" required value={editing.refill_price} onChange={(v) => setEditing({ ...editing, refill_price: v })} />
                      <TextInput label="Security deposit" type="number" value={editing.security_deposit} onChange={(v) => setEditing({ ...editing, security_deposit: v })} />
                      <TextInput label="Sort order" type="number" value={editing.sort_order} onChange={(v) => setEditing({ ...editing, sort_order: v })} />
                    </div>
                  </Panel>
                  <Panel title="Stock" index={2}>
                    <div className="gx-grid2">
                      <TextInput label="New stock" type="number" value={editing.new_stock} onChange={(v) => setEditing({ ...editing, new_stock: v })} />
                      <TextInput label="Refill stock" type="number" value={editing.refill_stock} onChange={(v) => setEditing({ ...editing, refill_stock: v })} />
                    </div>
                  </Panel>
                  <Panel title="Image and visibility" index={3}>
                    <label className="gx-drop">
                      <span className="pv">{preview || editing.image_url ? <img src={preview || editing.image_url} alt="" /> : <Icon name="upload" size={24} />}</span>
                      <span>
                        <b>{image ? image.name : "Upload product image"}</b>
                        <small>{image ? "Will be uploaded when you save" : "PNG or JPG, click to choose"}</small>
                      </span>
                      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                    </label>
                    <div className="gx-grid2" style={{ marginTop: 14 }}>
                      <Switch label="Available" hint="Visible to customers" checked={editing.is_available} onChange={(v) => setEditing({ ...editing, is_available: v })} />
                      <Switch label="Promoted" hint="Highlight in the app" checked={editing.is_promoted} onChange={(v) => setEditing({ ...editing, is_promoted: v })} />
                    </div>
                  </Panel>
                </>
              )}
            </div>
            <div className="gx-m-foot">
              <button type="button" className="gx-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="gx-btn is-red" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {/* ------------------------------------------------ order modal */}
      {detail ? (
        <Modal wide title={`Order ${detail.order_no}`} subtitle={detail.created_at ? formatDateTime(detail.created_at) : ""} onClose={() => setDetail(null)}>
          <div className="gx-m-body">
            <div className="gx-ostrip">
              <div className="gx-os"><small>Status</small><b><Badge value={detail.status} /></b></div>
              <div className="gx-os"><small>Payment</small><b><Badge value={detail.payment_status} /></b></div>
              <div className="gx-os"><small>Rider</small><b>{detail.rider?.name || "Not assigned"}</b></div>
              <div className="gx-os is-red"><small>Grand total</small><b>{money(detail.grand_total)}</b></div>
            </div>

            {FLOW.includes(detail.status) ? (
              <div className="gx-steps">
                {FLOW.map((st, i) => {
                  const at = FLOW.indexOf(detail.status);
                  const cls = i < at ? "is-done" : i === at ? "is-now" : "";
                  return (
                    <div key={st} className={`gx-step ${cls}`}>
                      <div className="gx-dot">{i < at ? <Icon name="check" size={14} /> : i + 1}</div>
                      <span>{st.replaceAll("_", " ")}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="gx-alert" style={{ marginBottom: 16 }}><span>This order was {detail.status}.</span></div>
            )}

            <div className="gx-ogrid">
              <div style={{ display: "grid", gap: 0, alignContent: "start" }}>
                <Panel index={0} title="Customer and delivery">
                  <Info label="Customer" value={detail.receiver_name} />
                  <Info label="Phone" value={<a href={`tel:${detail.receiver_phone}`} style={{ color: "var(--red)", fontWeight: 800 }}>{detail.receiver_phone}</a>} />
                  <Info label="Address" value={detail.delivery_address} />
                  <Info label="Schedule" value={`${detail.delivery_date || "Today"} · ${detail.is_emergency ? "Emergency" : detail.delivery_slot || "Flexible"}`} />
                  {detail.delivery_map_url ? <div style={{ marginTop: 12 }}><a className="gx-btn is-sm" href={detail.delivery_map_url} target="_blank" rel="noreferrer"><Icon name="map" size={14} /> Open delivery map</a></div> : null}
                </Panel>

                <Panel index={1} title="Cylinder items">
                  <div>
                    {detail.items?.map((item, i) => (
                      <div key={item.id} className="gx-line" style={{ "--i": i }}>
                        <div>
                          <b>{item.brand} {item.product_name}</b>
                          <p>{item.weight_kg} kg · {item.purchase_type === "refill" ? `Refill, return ${item.empty_return_quantity} empty` : "New cylinder"} · Qty {item.quantity}</p>
                        </div>
                        <b>{money(item.total_price)}</b>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                    <Info label="Items" value={money(detail.items_total)} />
                    <Info label="Delivery" value={money(detail.delivery_fee)} />
                    <Info label="Emergency" value={money(detail.emergency_fee)} />
                    <Info label="Grand total" value={<b style={{ fontSize: 18, color: "var(--red)" }}>{money(detail.grand_total)}</b>} />
                  </div>
                </Panel>
              </div>

              <div style={{ display: "grid", gap: 0, alignContent: "start" }}>
                <Panel index={2} title="Fulfilment controls">
                  <div style={{ display: "grid", gap: 14 }}>
                    <SelectField label="Order status" disabled={saving || TERMINAL.includes(detail.status)} value={detail.status} onChange={(v) => updateOrder({ status: v })}>
                      {statuses.map((st) => <option key={st}>{st}</option>)}
                    </SelectField>
                    <SelectField label="Assigned rider" value={detail.rider_id || ""} onChange={(v) => assignRider(v)}>
                      <option value="">Not assigned</option>
                      {riders.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.phone}</option>)}
                    </SelectField>
                    <SelectField label="Payment status" value={detail.payment_status} onChange={(v) => updateOrder({ payment_status: v })}>
                      {PAYMENT_STATUSES.map((p) => <option key={p}>{p}</option>)}
                    </SelectField>
                  </div>
                </Panel>

                <Panel index={3} title="Payment">
                  <Info label="Method" value={detail.payment_method} />
                  <Info label="Transaction ID" value={detail.manual_transaction_id || "Not provided"} />
                </Panel>

                <Panel index={4} title="Notes">
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{detail.order_note || "No customer note"}</p>
                  <textarea className="gx-in" style={{ marginTop: 12 }} defaultValue={detail.admin_note || ""} onBlur={(e) => { if (e.target.value !== (detail.admin_note || "")) updateOrder({ admin_note: e.target.value }); }} placeholder="Internal admin note (saved when you click away)" />
                </Panel>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {confirmRow ? (
        <ConfirmDialog title={`Delete ${confirmRow.name}?`} text={`This will permanently remove this ${noun}. This action cannot be undone.`} busy={deleting} onCancel={() => setConfirmRow(null)} onConfirm={remove} />
      ) : null}

      {toast ? <div key={toast.id} className={`gx-toast ${toast.isErr ? "is-err" : ""}`} role="status"><Icon name={toast.isErr ? "alert" : "check"} size={16} />{toast.text}</div> : null}
    </div>
  );
}

export function GasOverviewPage(props) { return <GasDeliveryAdminPage {...props} section="dashboard" />; }
export function GasOrdersPage(props) { return <GasDeliveryAdminPage {...props} section="orders" />; }
export function GasProductsPage(props) { return <GasDeliveryAdminPage {...props} section="products" />; }
export function GasDealersPage(props) { return <GasDeliveryAdminPage {...props} section="dealers" />; }
export function GasSettingsPage(props) { return <GasDeliveryAdminPage {...props} section="settings" />; }
