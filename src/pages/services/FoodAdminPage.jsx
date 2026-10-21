import { useEffect, useMemo, useRef, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../../components/BulkDeleteBar.jsx";
import ImageUploadPreview from "../../components/ImageUploadPreview.jsx";
import Pagination from "../../components/Pagination.jsx";
import ResourceSelect from "../../components/ResourceSelect.jsx";
import UserSelect from "../../components/UserSelect.jsx";
import { apiRequest, apiUpload } from "../../lib/api.js";
import { API_BASE } from "../../lib/config.js";

const DEFAULT_MAP_CENTER = { lat: 22.6859, lng: 90.6482 };
const GOOGLE_MAPS_WEB_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_WEB_API_KEY || "";

/* ==========================================================================
   DESIGN SYSTEM  ·  Red + White  ·  flat colors only (no gradients)
   ========================================================================== */
const fdCss = `
.fd{
  --red:#E10613;--red-600:#C40411;--red-50:#FFF4F4;--red-100:#FFE1E3;--red-200:#FFC2C6;
  --ink:#111216;--g7:#3E424A;--g5:#6C717A;--g4:#9AA0A8;--g3:#D6D9DE;--line:#ECEDF0;--soft:#F7F7F8;
  --ease:cubic-bezier(.2,.8,.2,1);--spring:cubic-bezier(.34,1.56,.64,1);
  color:var(--ink);
}
.fd *::-webkit-scrollbar{height:8px;width:8px}
.fd *::-webkit-scrollbar-thumb{background:var(--g3);border-radius:99px}
.fd *::-webkit-scrollbar-thumb:hover{background:var(--red)}

@keyframes fdRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes fdPop{from{opacity:0;transform:translateY(26px) scale(.95)}to{opacity:1;transform:none}}
@keyframes fdFade{from{opacity:0}to{opacity:1}}
@keyframes fdRing{0%{box-shadow:0 0 0 0 rgba(225,6,19,.45)}100%{box-shadow:0 0 0 10px rgba(225,6,19,0)}}
@keyframes fdSpin{to{transform:rotate(360deg)}}
@keyframes fdFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes fdBar{0%{transform:translateX(-100%)}100%{transform:translateX(260%)}}
@keyframes fdGrowY{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes fdGrowX{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes fdBlink{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes fdNodePop{from{transform:scale(0)}to{transform:scale(1)}}

.fd-rise{opacity:0;animation:fdRise .6s var(--ease) calc(var(--d,0)*1ms) forwards}
.fd-pop{animation:fdPop .45s var(--spring) both}
.fd-fade{animation:fdFade .25s ease both}
.fd-ring{animation:fdRing 1.8s ease-out infinite}
.fd-blink{animation:fdBlink 1.2s ease-in-out infinite}
.fd-float{animation:fdFloat 3.2s ease-in-out infinite}
.fd-spin{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid var(--red-100);border-top-color:var(--red);animation:fdSpin .7s linear infinite}

/* surfaces */
.fd-card{background:#fff;border:1px solid var(--line);border-radius:20px;transition:border-color .25s,box-shadow .25s,transform .3s var(--ease)}
.fd-card-hover:hover{border-color:var(--red-200);box-shadow:0 12px 32px rgba(17,18,22,.07);transform:translateY(-2px)}
.fd-soft{background:var(--soft);border:1px solid var(--line);border-radius:16px}

/* hero */
.fd-hero{position:relative;overflow:hidden;border-radius:26px}
.fd-hero::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--red);transform-origin:top;animation:fdGrowY .8s var(--ease) .1s both}
.fd-orbit{position:absolute;right:-80px;top:-90px;width:280px;height:280px;pointer-events:none}
.fd-orbit i{position:absolute;border-radius:50%;border:1.5px solid var(--red-100)}
.fd-orbit i:nth-child(1){inset:0}
.fd-orbit i:nth-child(2){inset:40px;border-style:dashed;border-color:var(--red-200);animation:fdSpin 40s linear infinite}
.fd-orbit i:nth-child(3){inset:80px}
.fd-orbit-spin{position:absolute;inset:0;animation:fdSpin 12s linear infinite}
.fd-orbit-spin b{position:absolute;left:50%;top:0;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:var(--red)}
.fd-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:900;letter-spacing:.28em;text-transform:uppercase;color:var(--red)}
.fd-eyebrow::before{content:"";width:22px;height:2px;background:var(--red);transform-origin:left;animation:fdGrowX .7s var(--ease) .3s both}
.fd-count{display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid var(--red-100);background:var(--red-50);color:var(--red);padding:4px 11px;font-size:12px;font-weight:800}

/* buttons */
.fd-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;border:1px solid transparent;padding:11px 18px;font-size:14px;font-weight:800;line-height:1;white-space:nowrap;cursor:pointer;transition:transform .2s var(--ease),background .2s,color .2s,border-color .2s,box-shadow .2s}
.fd-btn:active:not(:disabled){transform:scale(.95)}
.fd-btn:disabled{opacity:.45;cursor:not-allowed}
.fd-btn svg{transition:transform .3s var(--spring)}
.fd-btn:hover:not(:disabled) svg{transform:scale(1.15) rotate(-6deg)}
.fd-btn-primary{background:var(--red);color:#fff}
.fd-btn-primary:hover:not(:disabled){background:var(--red-600);transform:translateY(-2px);box-shadow:0 10px 22px rgba(225,6,19,.28)}
.fd-btn-ghost{background:#fff;color:var(--ink);border-color:var(--line)}
.fd-btn-ghost:hover:not(:disabled){border-color:var(--red);color:var(--red);transform:translateY(-2px)}
.fd-btn-danger{background:#fff;color:var(--red);border-color:var(--red-100)}
.fd-btn-danger:hover:not(:disabled){background:var(--red);border-color:var(--red);color:#fff;transform:translateY(-2px)}
.fd-btn-sm{padding:8px 12px;font-size:12.5px;border-radius:10px;gap:6px}

/* fields */
.fd-label{display:block;font-size:12.5px;font-weight:800;color:var(--g7)}
.fd-label em{color:var(--red);font-style:normal;margin-left:3px}
.fd-input{display:block;width:100%;margin-top:6px;background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:10px 13px;font-size:14px;color:var(--ink);outline:none;transition:border-color .2s,box-shadow .2s}
.fd-input:hover{border-color:var(--g3)}
.fd-input:focus{border-color:var(--red);box-shadow:0 0 0 4px rgba(225,6,19,.12)}
.fd-input::placeholder{color:var(--g4)}
.fd-input.is-error{border-color:var(--red);background:var(--red-50)}
textarea.fd-input{min-height:96px;resize:vertical}
.fd-input-sm{margin-top:0;padding:8px 10px;font-size:13px;border-radius:10px}
.fd-error{margin-top:5px;font-size:12px;font-weight:700;color:var(--red);animation:fdRise .3s var(--ease) both}
.fd-hint{margin-top:5px;font-size:12px;color:var(--g4)}
.fd-search{position:relative}
.fd-search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--g4);transition:color .2s}
.fd-search:focus-within svg{color:var(--red)}
.fd-search .fd-input{margin-top:0;padding-left:40px;border-radius:14px;padding-top:11px;padding-bottom:11px}
.fd-cb{width:16px;height:16px;accent-color:var(--red);cursor:pointer}

/* toggle switch */
.fd-switch-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1.5px solid var(--line);border-radius:12px;padding:11px 14px;font-size:14px;font-weight:700;cursor:pointer;background:#fff;transition:border-color .2s,background .2s}
.fd-switch-row:hover{border-color:var(--red-200)}
.fd-switch-row.is-on{border-color:var(--red-200);background:var(--red-50)}
.fd-switch{position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0}
.fd-switch input{position:absolute;inset:0;opacity:0;cursor:pointer;margin:0}
.fd-switch-track{position:absolute;inset:0;border-radius:99px;background:var(--g3);transition:background .25s}
.fd-switch-knob{position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .35s var(--spring)}
.fd-switch input:checked + .fd-switch-track{background:var(--red)}
.fd-switch input:checked + .fd-switch-track .fd-switch-knob{transform:translateX(18px)}
.fd-switch input:focus-visible + .fd-switch-track{box-shadow:0 0 0 4px rgba(225,6,19,.18)}

/* table */
.fd-tablecard{position:relative;overflow:hidden;border-radius:22px}
.fd-loadbar{position:absolute;left:0;right:0;top:0;height:3px;overflow:hidden;background:var(--red-100);z-index:3}
.fd-loadbar::after{content:"";position:absolute;top:0;bottom:0;width:40%;background:var(--red);animation:fdBar 1.1s var(--ease) infinite}
.fd-scroll{overflow-x:auto}
.fd-table{width:100%;min-width:860px;border-collapse:separate;border-spacing:0;font-size:13.5px}
.fd-table thead th{position:sticky;top:0;background:var(--soft);color:var(--g5);font-size:11px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;padding:14px 16px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap}
.fd-table td{padding:13px 16px;border-top:1px solid var(--line);color:var(--g7);vertical-align:middle}
.fd-row{opacity:0;animation:fdRise .45s var(--ease) calc(var(--i,0)*30ms) forwards;transition:background .2s}
.fd-row td:first-child{box-shadow:inset 0 0 0 0 var(--red);transition:box-shadow .3s var(--ease)}
.fd-row:hover{background:var(--red-50)}
.fd-row:hover td:first-child{box-shadow:inset 4px 0 0 0 var(--red)}
.fd-row.is-selected{background:var(--red-50)}
.fd-skel{display:block;height:14px;border-radius:8px;background:var(--line);animation:fdBlink 1.2s ease-in-out infinite}
.fd-thumb{display:block;width:58px;height:44px;border-radius:10px;border:1px solid var(--line);object-fit:cover;transition:transform .35s var(--ease),box-shadow .35s;position:relative}
.fd-thumb:hover{transform:scale(1.7);z-index:5;box-shadow:0 14px 30px rgba(17,18,22,.22)}
.fd-empty{padding:56px 16px;text-align:center;color:var(--g4);font-size:14px;font-weight:600}
.fd-empty-icon{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 12px;border-radius:50%;background:var(--red-50);color:var(--red);border:1px solid var(--red-100)}

/* badges */
.fd-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid transparent;padding:4px 10px;font-size:11.5px;font-weight:800;text-transform:capitalize;white-space:nowrap}
.fd-badge-red{background:var(--red);color:#fff}
.fd-badge-soft{background:var(--red-50);color:var(--red);border-color:var(--red-100)}
.fd-badge-ink{background:var(--ink);color:#fff}
.fd-badge-gray{background:var(--soft);color:var(--g5);border-color:var(--line)}
.fd-badge-line{background:#fff;color:var(--ink);border-color:var(--g3)}
.fd-dot{width:6px;height:6px;border-radius:50%;background:currentColor}

/* modal */
.fd-backdrop{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(17,18,22,.58);backdrop-filter:blur(6px);animation:fdFade .25s ease both}
.fd-modal{display:flex;flex-direction:column;width:100%;max-height:92vh;overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:26px;box-shadow:0 30px 80px rgba(17,18,22,.3);animation:fdPop .5s var(--spring) both}
.fd-modal-head{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid var(--line)}
.fd-modal-head::after{content:"";position:absolute;left:24px;bottom:-1px;width:72px;height:3px;background:var(--red);border-radius:3px;transform-origin:left;animation:fdGrowX .7s var(--ease) .2s both}
.fd-modal-body{overflow-y:auto;padding:22px 24px}
.fd-modal-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:16px 24px;border-top:1px solid var(--line);background:#fff}
.fd-close{display:grid;place-items:center;flex-shrink:0;width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--g5);font-size:20px;line-height:1;cursor:pointer;transition:all .3s var(--ease)}
.fd-close:hover{background:var(--red);border-color:var(--red);color:#fff;transform:rotate(90deg)}
.fd-panel{background:#fff;border:1px solid var(--line);border-radius:20px;padding:18px}
.fd-panel-title{font-size:15px;font-weight:900;color:var(--ink)}
.fd-panel-sub{margin-top:3px;font-size:12.5px;font-weight:500;color:var(--g5)}

/* tiles + stats */
.fd-tile{background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:11px 13px;transition:border-color .25s,transform .25s var(--ease)}
.fd-tile:hover{border-color:var(--red-200);transform:translateY(-1px)}
.fd-tile-k{font-size:10.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--g5)}
.fd-tile-v{margin-top:4px;font-size:13.5px;font-weight:700;color:var(--ink);word-break:break-word}
.fd-tile-dark{background:var(--ink);border-color:var(--ink)}
.fd-tile-dark .fd-tile-k{color:rgba(255,255,255,.6)}
.fd-tile-dark .fd-tile-v{color:#fff}
.fd-stat{border:1px solid var(--line);background:#fff;border-radius:16px;padding:14px 16px;transition:transform .3s var(--ease),border-color .25s,box-shadow .25s}
.fd-stat:hover{transform:translateY(-3px);border-color:var(--red-200);box-shadow:0 12px 26px rgba(17,18,22,.08)}
.fd-stat-k{font-size:10.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:var(--g5)}
.fd-stat-v{margin-top:6px;font-size:21px;font-weight:900;letter-spacing:-.01em;color:var(--ink);font-variant-numeric:tabular-nums}
.fd-stat-red{background:var(--red);border-color:var(--red)}
.fd-stat-red .fd-stat-k{color:rgba(255,255,255,.75)}
.fd-stat-red .fd-stat-v{color:#fff}
.fd-stat-dark{background:var(--ink);border-color:var(--ink)}
.fd-stat-dark .fd-stat-k{color:rgba(255,255,255,.6)}
.fd-stat-dark .fd-stat-v{color:#fff}
.fd-stat-soft{background:var(--red-50);border-color:var(--red-100)}
.fd-stat-soft .fd-stat-v{color:var(--red)}
.fd-line-row{display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:13.5px}
.fd-line-row span:first-child{color:var(--g5)}
.fd-line-row span:last-child{font-weight:800;color:var(--ink)}
.fd-line-row.is-strong span:first-child{color:var(--ink);font-weight:900}
.fd-line-row.is-strong span:last-child{font-size:19px;color:var(--red)}

/* timeline */
.fd-tl{display:flex;gap:14px}
.fd-tl-rail{display:flex;flex-direction:column;align-items:center}
.fd-node{display:grid;place-items:center;flex-shrink:0;width:30px;height:30px;border-radius:50%;border:2px solid var(--line);background:#fff;color:var(--g4);font-size:12px;font-weight:900}
.fd-node.is-done{background:var(--red);border-color:var(--red);color:#fff;animation:fdNodePop .5s var(--spring) calc(var(--i,0)*90ms) both}
.fd-node.is-current{animation:fdNodePop .5s var(--spring) calc(var(--i,0)*90ms) both,fdRing 1.8s ease-out calc(var(--i,0)*90ms + 600ms) infinite}
.fd-line{position:relative;flex:1;width:2px;min-height:36px;background:var(--line);overflow:hidden}
.fd-line i{position:absolute;inset:0;background:var(--red);transform-origin:top;animation:fdGrowY .5s var(--ease) calc(var(--i,0)*90ms + 200ms) both}

/* order details modal */
.fd-sumstrip{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:18px;overflow:hidden}
.fd-sum{display:flex;flex-direction:column;gap:6px;min-width:0;padding:14px 16px;background:#fff}
.fd-sum-k{font-size:10.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--g5)}
.fd-sum-v{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:14px;font-weight:800;color:var(--ink);word-break:break-word}
.fd-sum-v small{display:block;width:100%;font-size:12px;font-weight:600;color:var(--g5)}
.fd-sum-total{grid-column:1/-1;background:var(--red)}
.fd-sum-total .fd-sum-k{color:rgba(255,255,255,.78)}
.fd-sum-total .fd-sum-v{font-size:21px;font-weight:900;color:#fff}
@media (min-width:900px){
  .fd-sumstrip{grid-template-columns:1fr 1.2fr 1.3fr 1.2fr 1fr}
  .fd-sum-total{grid-column:auto}
}
.fd-tabs{display:flex;gap:4px;overflow-x:auto;border-bottom:1px solid var(--line)}
.fd-tab{position:relative;display:inline-flex;align-items:center;gap:8px;padding:12px 16px;border:0;background:none;font-size:14px;font-weight:800;color:var(--g5);white-space:nowrap;cursor:pointer;transition:color .2s}
.fd-tab:hover{color:var(--ink)}
.fd-tab.is-active{color:var(--red)}
.fd-tab::after{content:"";position:absolute;left:12px;right:12px;bottom:-1px;height:3px;border-radius:3px 3px 0 0;background:var(--red);transform:scaleX(0);transition:transform .35s var(--ease)}
.fd-tab.is-active::after{transform:scaleX(1)}
.fd-tab-n{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:99px;border:1px solid var(--line);background:var(--soft);font-size:11px;font-weight:900;color:var(--g5);transition:all .25s}
.fd-tab.is-active .fd-tab-n{background:var(--red);border-color:var(--red);color:#fff}
.fd-tabpane{animation:fdRise .4s var(--ease) both}
.fd-kvlist{margin:0}
.fd-kv{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:10px 0;border-top:1px solid var(--line);font-size:13.5px}
.fd-kv:first-child{padding-top:0;border-top:0}
.fd-kv dt{flex:0 0 38%;font-weight:600;color:var(--g5)}
.fd-kv dd{flex:1;margin:0;text-align:right;font-weight:700;color:var(--ink);word-break:break-word}
.fd-group{margin-top:16px;padding-top:16px;border-top:1px dashed var(--g3)}
.fd-group:first-child{margin-top:0;padding-top:0;border-top:0}
.fd-group-title{margin-bottom:10px;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--g5)}
.fd-group-body{display:flex;flex-direction:column;gap:10px}
.fd-itemtable{width:100%;font-size:13.5px;border-collapse:collapse}
.fd-itemtable th{padding:0 0 10px;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--g5);text-align:left;border-bottom:1px solid var(--line)}
.fd-itemtable td{padding:12px 0;border-bottom:1px solid var(--line);vertical-align:top}
.fd-itemtable tr:last-child td{border-bottom:0}
.fd-qty{display:inline-grid;grid-template-columns:30px 34px 30px;align-items:center;height:30px;overflow:hidden;border:1px solid var(--g3);border-radius:9px;background:#fff}
.fd-qty button{display:grid;place-items:center;width:30px;height:30px;border:0;background:var(--soft);color:var(--ink);font-size:18px;font-weight:800;line-height:1;cursor:pointer;transition:background .2s,color .2s}
.fd-qty button:hover:not(:disabled){background:var(--red);color:#fff}
.fd-qty button:disabled{cursor:not-allowed;opacity:.4}
.fd-qty span{display:grid;place-items:center;height:30px;font-weight:900;color:var(--ink);font-variant-numeric:tabular-nums}

/* media */
.fd-zoom{display:block;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:var(--soft);transition:border-color .25s}
.fd-zoom:hover{border-color:var(--red)}
.fd-zoom img{display:block;width:100%;height:220px;object-fit:cover;transition:transform .6s var(--ease)}
.fd-zoom:hover img{transform:scale(1.06)}

/* ---------- record form (create / edit) ---------- */
.fd-form{display:grid;gap:22px;grid-template-columns:minmax(0,1fr)}
@media (min-width:900px){.fd-form.has-rail{grid-template-columns:260px minmax(0,1fr);gap:26px}}
.fd-rail{display:flex;flex-direction:column;gap:14px;align-self:start}
@media (min-width:900px){.fd-rail{position:sticky;top:0;max-height:calc(92vh - 210px);overflow-y:auto;padding-right:2px}}
.fd-railcard{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px}
.fd-railtitle{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--g5)}
.fd-rail-nav{display:none;flex-direction:column;gap:2px}
@media (min-width:900px){.fd-rail-nav{display:flex}}
.fd-navitem{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;border-radius:12px;background:none;text-align:left;font-size:13.5px;font-weight:800;color:var(--g5);cursor:pointer;transition:background .2s,color .2s}
.fd-navitem:hover{background:var(--soft);color:var(--ink)}
.fd-navitem.is-active{background:var(--red-50);color:var(--red)}
.fd-navdot{display:grid;place-items:center;flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1.5px solid var(--g3);background:#fff;font-size:11px;font-weight:900;color:var(--g5);transition:all .3s var(--spring)}
.fd-navitem.is-active .fd-navdot{border-color:var(--red);color:var(--red)}
.fd-navitem.is-done .fd-navdot{border-color:var(--red);background:var(--red);color:#fff}
.fd-navitem.is-error .fd-navdot{border-color:var(--red);background:var(--red);color:#fff;animation:fdRing 1.4s ease-out 2}
.fd-section{scroll-margin-top:4px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px;transition:border-color .25s}
.fd-section:focus-within{border-color:var(--red-200)}
.fd-section + .fd-section{margin-top:16px}
.fd-section-head{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.fd-section-num{display:grid;place-items:center;flex-shrink:0;width:30px;height:30px;border-radius:10px;background:var(--red);color:#fff;font-size:13px;font-weight:900}
.fd-section-title{font-size:15px;font-weight:900;color:var(--ink)}
.fd-section-sub{margin-top:2px;font-size:12.5px;font-weight:500;color:var(--g5)}
.fd-fields{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@media (min-width:640px){.fd-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}
.fd-span2{grid-column:1/-1}
.fd-banner{display:flex;align-items:flex-start;gap:10px;margin-bottom:16px;padding:12px 14px;border:1px solid var(--red-200);border-radius:14px;background:var(--red-50);font-size:13.5px;font-weight:700;color:var(--red-600);animation:fdRise .3s var(--ease) both}
.fd-banner b{display:grid;place-items:center;flex-shrink:0;width:20px;height:20px;margin-top:1px;border-radius:50%;background:var(--red);color:#fff;font-size:12px}
.fd-progress{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:800;color:var(--g5)}
.fd-progress-bar{width:120px;height:6px;overflow:hidden;border-radius:99px;background:var(--line)}
.fd-progress-bar i{display:block;height:100%;border-radius:99px;background:var(--red);transition:width .5s var(--ease)}

/* money input */
.fd-money{position:relative;display:block;margin-top:6px}
.fd-money.is-sm{margin-top:0}
.fd-money > span{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:900;letter-spacing:.04em;color:var(--g4);pointer-events:none}
.fd-money .fd-input{margin-top:0;padding-left:46px}

/* rows editor (sizes, add-ons) */
.fd-rows{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.fd-rowline{display:grid;grid-template-columns:minmax(0,1fr) 132px 38px;gap:8px;align-items:center;animation:fdRise .3s var(--ease) both}
.fd-rowline .fd-input{margin-top:0}
.fd-rm{display:grid;place-items:center;width:38px;height:38px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--g5);font-size:18px;line-height:1;cursor:pointer;transition:all .25s var(--ease)}
.fd-rm:hover{border-color:var(--red);background:var(--red);color:#fff;transform:rotate(90deg)}
.fd-addrow{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:10px;border:1.5px dashed var(--g3);border-radius:12px;background:#fff;font-size:13px;font-weight:800;color:var(--g5);cursor:pointer;transition:all .25s var(--ease)}
.fd-addrow:hover{border-color:var(--red);background:var(--red-50);color:var(--red)}
.fd-rows-empty{padding:14px;border:1px dashed var(--g3);border-radius:12px;background:var(--soft);font-size:12.5px;font-weight:600;color:var(--g5);text-align:center}
.fd-fieldhead{display:flex;align-items:center;justify-content:space-between;gap:10px}

/* chips editor (spice options) */
.fd-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:6px;padding:8px;border:1.5px solid var(--line);border-radius:12px;background:#fff;cursor:text;transition:border-color .2s,box-shadow .2s}
.fd-chips:focus-within{border-color:var(--red);box-shadow:0 0 0 4px rgba(225,6,19,.12)}
.fd-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 5px 4px 11px;border:1px solid var(--red-100);border-radius:99px;background:var(--red-50);font-size:12.5px;font-weight:800;color:var(--red);animation:fdPop .3s var(--spring) both}
.fd-chip button{display:grid;place-items:center;width:18px;height:18px;border:0;border-radius:50%;background:none;font-size:14px;line-height:1;color:var(--red);cursor:pointer;transition:all .2s}
.fd-chip button:hover{background:var(--red);color:#fff}
.fd-chips input{flex:1;min-width:130px;padding:4px;border:0;outline:0;background:none;font-size:13.5px;color:var(--ink)}
.fd-suggest{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px}
.fd-suggest span{font-size:11.5px;font-weight:700;color:var(--g4)}
.fd-suggest button{padding:3px 10px;border:1px dashed var(--g3);border-radius:99px;background:#fff;font-size:12px;font-weight:800;color:var(--g5);cursor:pointer;transition:all .2s}
.fd-suggest button:hover{border-color:var(--red);color:var(--red)}

/* live preview */
.fd-preview{overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:16px}
.fd-preview-img{position:relative;display:grid;place-items:center;height:124px;overflow:hidden;background:var(--soft);font-size:12px;font-weight:700;color:var(--g4)}
.fd-preview-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fd-preview-tags{position:absolute;left:10px;top:10px;z-index:1;display:flex;flex-wrap:wrap;gap:6px}
.fd-preview-body{padding:12px 14px 14px}
.fd-preview-name{font-size:15px;font-weight:900;line-height:1.25;color:var(--ink)}
.fd-preview-name.is-empty{color:var(--g4)}
.fd-preview-desc{display:-webkit-box;overflow:hidden;margin-top:4px;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:12.5px;color:var(--g5)}
.fd-preview-price{display:flex;align-items:baseline;gap:8px;margin-top:10px}
.fd-preview-price b{font-size:18px;font-weight:900;color:var(--red);font-variant-numeric:tabular-nums}
.fd-preview-price s{font-size:13px;color:var(--g4)}
.fd-preview-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}

/* ---------- AI menu import ---------- */
.fd-stepper{display:flex;align-items:center;padding:14px 18px;border:1px solid var(--line);border-radius:16px;background:var(--soft)}
.fd-step{display:flex;flex:1;align-items:center;gap:10px;font-size:13px;font-weight:800;color:var(--g4);transition:color .3s}
.fd-step:last-child{flex:none}
.fd-step-n{display:grid;place-items:center;flex-shrink:0;width:26px;height:26px;border:1.5px solid var(--g3);border-radius:50%;background:#fff;font-size:12px;font-weight:900;transition:all .35s var(--spring)}
.fd-step:not(:last-child)::after{content:"";flex:1;min-width:20px;height:2px;margin:0 6px;border-radius:2px;background:var(--g3);transition:background .4s}
.fd-step.is-active{color:var(--ink)}
.fd-step.is-active .fd-step-n{border-color:var(--red);background:var(--red);color:#fff;animation:fdRing 1.8s ease-out infinite}
.fd-step.is-done{color:var(--ink)}
.fd-step.is-done .fd-step-n{border-color:var(--ink);background:var(--ink);color:#fff}
.fd-step.is-done::after{background:var(--red)}
@media (max-width:640px){.fd-step-l{display:none}.fd-step.is-active .fd-step-l{display:inline}}
.fd-ai{display:grid;gap:20px;margin-top:20px;grid-template-columns:minmax(0,1fr)}
@media (min-width:960px){.fd-ai{grid-template-columns:300px minmax(0,1fr)}}
.fd-ai-side{display:flex;flex-direction:column;gap:16px;align-self:start}
@media (min-width:960px){.fd-ai-side{position:sticky;top:0}}
.fd-draftlist{display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;padding-right:2px}
.fd-draft{display:block;width:100%;padding:10px 12px;border:1.5px solid var(--line);border-radius:14px;background:#fff;text-align:left;cursor:pointer;transition:all .25s var(--ease)}
.fd-draft:hover{border-color:var(--red-200);transform:translateY(-1px)}
.fd-draft.is-active{border-color:var(--red);background:var(--red-50)}
.fd-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:14px}
.fd-toolbar .fd-search{flex:1;min-width:200px}
.fd-itemlist{display:flex;flex-direction:column;gap:12px}
.fd-itemcard{display:grid;grid-template-columns:104px minmax(0,1fr);gap:16px;padding:14px;border:1.5px solid var(--line);border-radius:18px;background:#fff;transition:border-color .25s,box-shadow .25s,opacity .25s}
.fd-itemcard:hover{box-shadow:0 10px 26px rgba(17,18,22,.06)}
.fd-itemcard.is-on{border-color:var(--red)}
.fd-itemcard:not(.is-on) .fd-iright{opacity:.62}
.fd-itemcard:not(.is-on) .fd-iright:focus-within,.fd-itemcard:not(.is-on) .fd-iright:hover{opacity:1}
.fd-ileft{display:flex;flex-direction:column;gap:6px}
.fd-dthumb{position:relative;display:grid;place-items:center;height:92px;overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--soft);font-size:11px;font-weight:700;color:var(--g4)}
.fd-dthumb img{width:100%;height:100%;object-fit:cover}
.fd-dcheck{position:absolute;left:6px;top:6px;z-index:2;display:grid;place-items:center;width:24px;height:24px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer}
.fd-itemgrid{display:grid;gap:10px;grid-template-columns:repeat(12,minmax(0,1fr))}
.fd-itemgrid .c12{grid-column:span 12}
.fd-itemgrid .c6{grid-column:span 6}
.fd-itemgrid .c3{grid-column:span 3}
@media (max-width:640px){.fd-itemgrid .c6,.fd-itemgrid .c3{grid-column:span 12}.fd-itemcard{grid-template-columns:84px minmax(0,1fr);gap:12px}}
.fd-itemgrid .fd-input{margin-top:5px}
.fd-itemgrid .fd-money{margin-top:5px}
.fd-itemgrid .fd-money .fd-input{margin-top:0}
.fd-imeta{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:12px}
.fd-conf{display:flex;align-items:center;gap:8px;min-width:150px;font-size:11.5px;font-weight:800;color:var(--g5)}
.fd-conf-bar{flex:1;height:5px;overflow:hidden;border-radius:99px;background:var(--line)}
.fd-conf-bar i{display:block;height:100%;border-radius:99px;background:var(--ink);transform-origin:left;animation:fdGrowX .8s var(--ease) both}
.fd-conf-bar i.is-low{background:var(--red)}
.fd-more{display:inline-flex;align-items:center;gap:6px;margin-left:auto;padding:4px 2px;border:0;background:none;font-size:12.5px;font-weight:800;color:var(--g5);cursor:pointer;transition:color .2s}
.fd-more:hover{color:var(--red)}
.fd-more svg{transition:transform .3s var(--ease)}
.fd-more.is-open svg{transform:rotate(180deg)}
.fd-collapse{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s var(--ease)}
.fd-collapse.is-open{grid-template-rows:1fr}
.fd-collapse > div{min-height:0;overflow:hidden}
.fd-collapse-inner{display:grid;gap:12px;padding-top:12px;grid-template-columns:minmax(0,1fr)}
@media (min-width:720px){.fd-collapse-inner{grid-template-columns:repeat(2,minmax(0,1fr))}}
.fd-dropzone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:56px 20px;border:2px dashed var(--g3);border-radius:22px;background:var(--soft);text-align:center}

@media (prefers-reduced-motion:reduce){
  .fd *,.fd *::before,.fd *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
  .fd-rise,.fd-row{opacity:1!important}
}
`;

/* ==========================================================================
   Helpers
   ========================================================================== */
const mediaUrl = (url) => {
  if (!url) return "";
  const value = String(url);
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/storage/")) return `${new URL(API_BASE).origin}${value}`;
  return value;
};

const RESOURCE_CONFIG = {
  "food-categories": {
    title: "Food Categories",
    description: "Create delivery categories with a real image. Icon is not needed here.",
    imageTarget: "food_category",
    fields: [
      { key: "name", label: "Category Name", required: true },
      { key: "slug", label: "Slug", placeholder: "auto from name" },
      { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
      { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
    ],
    columns: ["id", "image_url", "name", "slug", "sort_order", "is_active"],
  },
  "food-banners": {
    title: "Food Banners",
    description: "Landscape promotional banners for the food delivery home page.",
    imageTarget: "food_banner",
    fields: [
      { key: "title", label: "Banner Title", required: true },
      { key: "subtitle", label: "Subtitle" },
      { key: "details", label: "Details", type: "textarea" },
      { key: "link_url", label: "External Link URL" },
      { key: "button_text", label: "Button Text" },
      { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
      { key: "starts_at", label: "Starts At", type: "datetime-local" },
      { key: "ends_at", label: "Ends At", type: "datetime-local" },
      { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
    ],
    columns: ["id", "image_url", "title", "subtitle", "link_url", "sort_order", "is_active", "starts_at", "ends_at"],
  },
  "food-items": {
    title: "Food Items",
    description: "Add menu items, price, options and upload item image without touching JSON.",
    imageTarget: "food_item",
    fields: [
      { key: "restaurant_id", label: "Restaurant ID", type: "number", required: true },
      { key: "food_category_id", label: "Food Category ID", type: "number" },
      { key: "name", label: "Food Name", required: true },
      { key: "slug", label: "Slug", placeholder: "auto from name" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "price", label: "Regular Price", type: "number", required: true },
      { key: "discount_price", label: "Discount Price", type: "number" },
      { key: "preparation_minutes", label: "Preparation Minutes", type: "number", defaultValue: 25 },
      { key: "size_options", label: "Size & Price Options", type: "size_prices", placeholder: "Regular:120" },
      { key: "spice_options", label: "Spice Options", type: "tags", placeholder: "Normal, Medium, Hot" },
      { key: "add_ons", label: "Add-ons", type: "addons", placeholder: "Extra Sauce:20" },
      { key: "is_available", label: "Available", type: "checkbox", defaultValue: true },
      { key: "is_popular", label: "Popular", type: "checkbox", defaultValue: false },
      { key: "is_promoted", label: "Promotion Campaign", type: "checkbox", defaultValue: false },
      { key: "promotion_priority", label: "Promotion Priority", type: "number", defaultValue: 0 },
      { key: "promotion_badge", label: "Promotion Badge", placeholder: "Featured, Best deal, Sponsor" },
      { key: "promotion_starts_at", label: "Promotion Starts", type: "datetime-local" },
      { key: "promotion_ends_at", label: "Promotion Ends", type: "datetime-local" },
      { key: "promotion_note", label: "Promotion Note", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["active", "pending", "inactive"], defaultValue: "active" },
    ],
    columns: ["id", "image_url", "name", "restaurant_id", "food_category_id", "price", "discount_price", "promotion_badge", "promotion_priority", "is_promoted", "is_available", "status", "updated_at"],
  },
  "food-coupons": {
    title: "Food Coupons",
    description: "Create delivery offers, free delivery and percentage/fixed discounts.",
    fields: [
      { key: "code", label: "Coupon Code", required: true },
      { key: "title", label: "Offer Title", required: true },
      { key: "discount_type", label: "Discount Type", type: "select", options: ["fixed", "percent", "free_delivery"], defaultValue: "fixed" },
      { key: "discount_value", label: "Discount Value", type: "number", defaultValue: 0 },
      { key: "applies_to", label: "Applies To", type: "select", options: ["order_items", "delivery", "total"], defaultValue: "order_items" },
      { key: "funding_source", label: "Who Pays Discount", type: "select", options: ["admin", "restaurant"], defaultValue: "admin" },
      { key: "source", label: "Created By", type: "select", options: ["admin", "restaurant"], defaultValue: "admin" },
      { key: "minimum_order", label: "Minimum Order", type: "number", defaultValue: 0 },
      { key: "max_discount", label: "Max Discount", type: "number" },
      { key: "restaurant_id", label: "Restaurant ID", type: "number" },
      { key: "owner_user_id", label: "Owner User ID", type: "number" },
      { key: "usage_limit", label: "Usage Limit", type: "number" },
      { key: "per_user_limit", label: "Per User Limit", type: "number" },
      { key: "starts_at", label: "Starts At", type: "datetime-local" },
      { key: "ends_at", label: "Ends At", type: "datetime-local" },
      { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
      { key: "auto_apply", label: "Auto Apply (customer does not enter code)", type: "checkbox", defaultValue: false },
      { key: "notes", label: "Settlement Notes", type: "textarea" },
    ],
    columns: ["id", "code", "title", "discount_type", "discount_value", "applies_to", "funding_source", "minimum_order", "used_count", "usage_limit", "auto_apply", "is_active"],
  },
  "food-orders": {
    title: "Food Orders",
    description: "Manual order creation and status control for special support cases.",
    fields: [
      { key: "order_no", label: "Order No", placeholder: "auto if empty" },
      { key: "user_id", label: "User ID", type: "number", required: true },
      { key: "restaurant_id", label: "Restaurant ID", type: "number", required: true },
      { key: "rider_id", label: "Rider ID", type: "number" },
      { key: "receiver_name", label: "Receiver Name", required: true },
      { key: "receiver_phone", label: "Receiver Phone", required: true },
      { key: "delivery_address", label: "Delivery Address", type: "textarea", required: true },
      { key: "delivery_area", label: "Delivery Area" },
      { key: "delivery_lat", label: "Delivery Latitude", type: "number" },
      { key: "delivery_lng", label: "Delivery Longitude", type: "number" },
      { key: "delivery_map_url", label: "Delivery Map URL" },
      { key: "order_type", label: "Order Type", type: "select", options: ["delivery", "pickup"], defaultValue: "delivery" },
      { key: "status", label: "Status", type: "select", options: ["pending", "accepted", "preparing", "picked_up", "on_the_way", "delivered", "cancelled", "rejected"], defaultValue: "pending" },
      { key: "payment_method", label: "Payment Method", type: "select", options: ["cash_on_delivery", "manual_bkash", "manual_nagad", "online"], defaultValue: "cash_on_delivery" },
      { key: "payment_status", label: "Payment Status", type: "select", options: ["unpaid", "paid", "refunded"], defaultValue: "unpaid" },
      { key: "items_total", label: "Items Total", type: "number", defaultValue: 0 },
      { key: "restaurant_commission_type", label: "Restaurant Commission Type", type: "select", options: ["percentage", "fixed", "percentage_plus_fixed", "none"], defaultValue: "percentage" },
      { key: "restaurant_commission_rate", label: "Restaurant Commission Rate", type: "number", defaultValue: 0 },
      { key: "restaurant_commission_fixed_fee", label: "Restaurant Commission Fixed Fee", type: "number", defaultValue: 0 },
      { key: "restaurant_commission_amount", label: "Restaurant Commission Amount", type: "number", defaultValue: 0 },
      { key: "restaurant_owner_payable", label: "Restaurant Owner Payable", type: "number", defaultValue: 0 },
      { key: "delivery_fee", label: "Delivery Fee", type: "number", defaultValue: 0 },
      { key: "rider_earning", label: "Rider Earning", type: "number", defaultValue: 0 },
      { key: "admin_delivery_income", label: "Admin Delivery Income", type: "number", defaultValue: 0 },
      { key: "cash_collected", label: "Cash Collected", type: "number", defaultValue: 0 },
      { key: "delivery_distance_km", label: "Delivery Distance KM", type: "number" },
      { key: "delivery_charge_mode", label: "Delivery Charge Mode" },
      { key: "discount_amount", label: "Discount", type: "number", defaultValue: 0 },
      { key: "admin_discount_amount", label: "Admin Discount", type: "number", defaultValue: 0 },
      { key: "restaurant_discount_amount", label: "Restaurant Discount", type: "number", defaultValue: 0 },
      { key: "delivery_discount_amount", label: "Delivery Discount", type: "number", defaultValue: 0 },
      { key: "grand_total", label: "Grand Total", type: "number", defaultValue: 0 },
      { key: "coupon_code", label: "Coupon Code" },
      { key: "restaurant_payout_status", label: "Restaurant Payout Status", type: "select", options: ["pending", "processing", "paid", "hold"], defaultValue: "pending" },
      { key: "restaurant_payout_reference", label: "Restaurant Payout Reference" },
      { key: "restaurant_paid_out_at", label: "Restaurant Paid At", type: "datetime-local" },
      { key: "order_note", label: "Order Note", type: "textarea" },
    ],
    columns: ["id", "order_no", "restaurant", "receiver_name", "receiver_phone", "accepted_rider_name", "route_distance_km", "payment_status", "status", "grand_total", "created_at"],
  },
  "medicine-items": {
    title: "Medicine Items",
    description: "Manage Bangladeshi medicine catalog, per-piece price, stock, image and promotion status.",
    fields: [
      { key: "brand_name", label: "Brand Name", required: true },
      { key: "generic_name", label: "Generic Name" },
      { key: "dosage_form", label: "Dosage Form" },
      { key: "strength", label: "Strength" },
      { key: "company", label: "Company" },
      { key: "unit_price", label: "Per Piece Price", type: "number" },
      { key: "price_text", label: "Price Text" },
      { key: "pack_sizes", label: "Pack Sizes" },
      { key: "image_url", label: "Image URL" },
      { key: "therapeutic_class", label: "Therapeutic Class" },
      { key: "indications", label: "Indications", type: "textarea" },
      { key: "composition", label: "Composition", type: "textarea" },
      { key: "dosage_and_administration", label: "Dosage & Administration", type: "textarea" },
      { key: "side_effects", label: "Side Effects", type: "textarea" },
      { key: "storage_conditions", label: "Storage Conditions", type: "textarea" },
      { key: "stock_quantity", label: "Stock Quantity", type: "number" },
      { key: "prescription_required", label: "Prescription Required", type: "checkbox", defaultValue: false },
      { key: "is_available", label: "Available", type: "checkbox", defaultValue: true },
      { key: "is_promoted", label: "Promoted on Top", type: "checkbox", defaultValue: false },
    ],
    columns: ["id", "image_url", "brand_name", "generic_name", "dosage_form", "strength", "company", "unit_price", "is_promoted", "is_available", "stock_quantity"],
  },
  "medicine-orders": {
    title: "Medicine Orders",
    description: "Track medicine delivery orders with customer, payment and delivery status.",
    fields: [
      { key: "order_no", label: "Order No" },
      { key: "user_id", label: "User ID", type: "number", required: true },
      { key: "rider_id", label: "Rider ID", type: "number" },
      { key: "receiver_name", label: "Receiver Name", required: true },
      { key: "receiver_phone", label: "Receiver Phone", required: true },
      { key: "delivery_address", label: "Delivery Address", type: "textarea", required: true },
      { key: "delivery_area", label: "Delivery Area" },
      { key: "delivery_lat", label: "Delivery Latitude", type: "number" },
      { key: "delivery_lng", label: "Delivery Longitude", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["pending", "accepted", "preparing", "picked_up", "on_the_way", "delivered", "cancelled"], defaultValue: "pending" },
      { key: "payment_method", label: "Payment Method", type: "select", options: ["cash_on_delivery", "manual_bkash", "manual_nagad", "online"], defaultValue: "cash_on_delivery" },
      { key: "payment_status", label: "Payment Status", type: "select", options: ["unpaid", "paid", "refunded"], defaultValue: "unpaid" },
      { key: "items_total", label: "Items Total", type: "number", defaultValue: 0 },
      { key: "delivery_fee", label: "Delivery Fee", type: "number", defaultValue: 0 },
      { key: "rider_earning", label: "Rider Earning", type: "number", defaultValue: 0 },
      { key: "admin_delivery_income", label: "Admin Delivery Income", type: "number", defaultValue: 0 },
      { key: "grand_total", label: "Grand Total", type: "number", defaultValue: 0 },
      { key: "order_note", label: "Order Note", type: "textarea" },
    ],
    columns: ["id", "order_no", "payment_method", "payment_status", "rider_assignment_label", "accepted_rider_name", "receiver_name", "receiver_phone", "status", "items_total", "grand_total", "created_at"],
  },
  riders: {
    title: "রাইডার তালিকা",
    description: "রাইডার KYC, অ্যাকাউন্ট স্ট্যাটাস, চুক্তি, কমিশন ও লাইভ অবস্থা পরিচালনা করুন।",
    fields: [
      { key: "user_id", label: "User ID", type: "number", required: true },
      { key: "name", label: "নাম", required: true },
      { key: "phone", label: "মোবাইল নম্বর", required: true },
      { key: "email", label: "ইমেইল" },
      { key: "district", label: "জেলা", defaultValue: "Bhola" },
      { key: "upazila", label: "উপজেলা" },
      { key: "address", label: "ঠিকানা", type: "textarea" },
      { key: "vehicle_type", label: "যানবাহন", type: "select", options: ["cycle", "bike", "car"], defaultValue: "bike" },
      { key: "vehicle_number", label: "যানবাহনের নম্বর" },
      { key: "emergency_contact_name", label: "জরুরি যোগাযোগের নাম" },
      { key: "emergency_contact_phone", label: "জরুরি মোবাইল" },
      { key: "kyc_status", label: "KYC স্ট্যাটাস", type: "select", options: ["draft", "pending", "approved", "rejected"], defaultValue: "pending" },
      { key: "kyc_note", label: "KYC নোট", type: "textarea" },
      { key: "agreement_accepted", label: "চুক্তি গ্রহণ করেছে", type: "checkbox", defaultValue: false },
      { key: "agreement_status", label: "চুক্তির অবস্থা", type: "select", options: ["pending", "active", "suspended", "ended"], defaultValue: "pending" },
      { key: "commission_type", label: "কমিশন ধরন", type: "select", options: ["fixed", "percentage", "zone_based"], defaultValue: "fixed" },
      { key: "commission_value", label: "কমিশন ভ্যালু", type: "number", defaultValue: 0 },
      { key: "payment_cycle", label: "পেমেন্ট সাইকেল", type: "select", options: ["daily", "weekly", "monthly"], defaultValue: "weekly" },
      { key: "responsibility_terms", label: "রাইডারের দায়িত্ব", type: "textarea" },
      { key: "penalty_policy", label: "পেনাল্টি/বাতিল নীতি", type: "textarea" },
      { key: "availability_status", label: "অনলাইন অবস্থা", type: "select", options: ["offline", "online", "busy"], defaultValue: "offline" },
      { key: "account_status", label: "অ্যাকাউন্ট স্ট্যাটাস", type: "select", options: ["pending", "active", "suspended", "blocked"], defaultValue: "pending" },
      { key: "admin_note", label: "অ্যাডমিন নোট", type: "textarea" },
      { key: "pending_payout", label: "Pending Payout", type: "number", defaultValue: 0 },
      { key: "cash_in_hand", label: "Cash In Hand", type: "number", defaultValue: 0 },
    ],
    columns: ["id", "name", "phone", "vehicle_type_bn", "kyc_status_bn", "account_status_bn", "availability_status_bn", "rating", "pending_payout", "cash_in_hand", "created_at"],
  },
  "rider-documents": {
    title: "রাইডার KYC ডকুমেন্ট",
    description: "NID, সেলফি, লাইসেন্স, গাড়ির কাগজ ও ব্যাংক/MFS ডকুমেন্ট যাচাই করুন।",
    fields: [
      { key: "rider_id", label: "Rider ID", type: "number", required: true },
      { key: "type", label: "ডকুমেন্ট টাইপ", type: "select", options: ["nid_front", "nid_back", "selfie", "driving_license", "vehicle_paper", "bank_mfs"], defaultValue: "nid_front" },
      { key: "title", label: "শিরোনাম", required: true },
      { key: "file_path", label: "File Path", required: true },
      { key: "status", label: "স্ট্যাটাস", type: "select", options: ["pending", "approved", "rejected"], defaultValue: "pending" },
      { key: "note", label: "নোট", type: "textarea" },
    ],
    columns: ["id", "rider_id", "type_bn", "title", "status_bn", "file_url", "created_at"],
  },
  "rider-wallet": {
    title: "রাইডার ওয়ালেট",
    description: "আয়, ক্যাশ কালেকশন, পেআউট, অ্যাডজাস্টমেন্ট ও পেনাল্টি লেজার।",
    fields: [
      { key: "rider_id", label: "Rider ID", type: "number", required: true },
      { key: "food_order_id", label: "Food Order ID", type: "number" },
      { key: "type", label: "টাইপ", type: "select", options: ["earning", "cash_collection", "payout", "adjustment", "penalty"], defaultValue: "adjustment" },
      { key: "amount", label: "টাকা", type: "number", required: true },
      { key: "balance_after", label: "Balance After", type: "number", defaultValue: 0 },
      { key: "payout_status", label: "Payout Status", type: "select", options: ["pending", "processing", "paid", "hold", "not_applicable"], defaultValue: "pending" },
      { key: "payout_reference", label: "Payout Reference" },
      { key: "paid_out_at", label: "Paid Out At", type: "datetime-local" },
      { key: "title", label: "শিরোনাম", required: true },
      { key: "note", label: "নোট", type: "textarea" },
    ],
    columns: ["id", "rider_id", "food_order_id", "type", "amount", "payout_status", "balance_after", "title", "created_at"],
  },
  "rider-support-tickets": {
    title: "রাইডার সাপোর্ট",
    description: "রাইডারের অভিযোগ, সমস্যা ও অ্যাডমিন রিপ্লাই পরিচালনা করুন।",
    fields: [
      { key: "rider_id", label: "Rider ID", type: "number", required: true },
      { key: "food_order_id", label: "Food Order ID", type: "number" },
      { key: "subject", label: "বিষয়", required: true },
      { key: "message", label: "মেসেজ", type: "textarea", required: true },
      { key: "status", label: "স্ট্যাটাস", type: "select", options: ["open", "reviewing", "resolved", "closed"], defaultValue: "open" },
      { key: "admin_reply", label: "অ্যাডমিন রিপ্লাই", type: "textarea" },
    ],
    columns: ["id", "rider_id", "food_order_id", "subject", "status", "admin_reply", "created_at"],
  },
  "rider-ratings": {
    title: "রাইডার রেটিং",
    description: "গ্রাহকের রাইডার রিভিউ ও পারফরম্যান্স পর্যবেক্ষণ করুন।",
    fields: [
      { key: "rider_id", label: "Rider ID", type: "number", required: true },
      { key: "user_id", label: "User ID", type: "number" },
      { key: "food_order_id", label: "Food Order ID", type: "number" },
      { key: "rating", label: "রেটিং", type: "number", required: true, defaultValue: 5 },
      { key: "review", label: "রিভিউ", type: "textarea" },
    ],
    columns: ["id", "rider_id", "user_id", "food_order_id", "rating", "review", "created_at"],
  },
  "food-reviews": {
    title: "Customer Food Reviews",
    description: "See who reviewed which restaurant, item and order, then moderate the feedback.",
    fields: [
      { key: "user_id", label: "User ID", type: "number", required: true },
      { key: "restaurant_id", label: "Restaurant ID", type: "number" },
      { key: "food_item_id", label: "Food Item ID", type: "number" },
      { key: "food_order_id", label: "Food Order ID", type: "number" },
      { key: "rating", label: "Rating", type: "number", required: true, defaultValue: 5 },
      { key: "comment", label: "Comment", type: "textarea" },
      { key: "owner_reply", label: "Restaurant Owner Reply", type: "textarea" },
      { key: "is_verified_order", label: "Verified Order", type: "checkbox", defaultValue: false },
      { key: "status", label: "Status", type: "select", options: ["active", "hidden"], defaultValue: "active" },
    ],
    columns: ["id", "customer_name", "restaurant_name", "food_item_name", "order_no", "rating", "comment", "is_verified_order", "status", "created_at"],
  },
  "food-addresses": {
    title: "Food Addresses",
    description: "Manage saved customer delivery addresses.",
    fields: [
      { key: "user_id", label: "User ID", type: "number", required: true },
      { key: "label", label: "Label", defaultValue: "Home" },
      { key: "receiver_name", label: "Receiver Name", required: true },
      { key: "receiver_phone", label: "Receiver Phone", required: true },
      { key: "district", label: "District", defaultValue: "Bhola" },
      { key: "upazila", label: "Upazila" },
      { key: "area", label: "Area" },
      { key: "landmark", label: "Landmark" },
      { key: "address", label: "Full Address", type: "textarea", required: true },
      { key: "is_default", label: "Default Address", type: "checkbox", defaultValue: false },
    ],
    columns: ["id", "user_id", "receiver_name", "receiver_phone", "area", "is_default"],
  },
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const parseTags = (value) =>
  String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const parseAddons = (value) =>
  String(value || "")
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [name, price = "0"] = row.split(":");
      return { name: name.trim(), price: Number(price) || 0 };
    });

const formatAddons = (value) =>
  Array.isArray(value) ? value.map((item) => `${item.name || ""}:${item.price || 0}`).join("\n") : "";

const parseSizePrices = (value) =>
  String(value || "")
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [name, price = ""] = row.split(":");
      return { name: name.trim(), price: price === "" ? null : Number(price) || 0 };
    })
    .filter((item) => item.name);

const formatSizePrices = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (typeof item === "string") return item;
          return `${item.name || item.label || ""}:${item.price ?? ""}`;
        })
        .join("\n")
    : "";

const relationLabel = (item) => {
  if (!item) return "";
  const primary =
    item.name ||
    item.title ||
    item.order_no ||
    item.code ||
    item.brand_name ||
    item.receiver_name ||
    `#${item.id}`;
  const meta = [
    item.phone,
    item.receiver_phone,
    item.restaurant?.name,
    item.status,
    item.user?.name,
  ].filter(Boolean);
  return meta.length ? `${primary} (${meta.join(" / ")})` : `${primary} (#${item.id})`;
};

function relationForField(activeResource, field) {
  if (field.key === "restaurant_id") {
    return { resource: "restaurants", placeholder: "Search restaurant name or phone", selectedFallback: (id) => `Restaurant #${id}` };
  }
  if (field.key === "food_category_id") {
    return { resource: "food-categories", placeholder: "Search food category", selectedFallback: (id) => `Food category #${id}` };
  }
  if (field.key === "rider_id") {
    return { resource: "riders", placeholder: "Search rider name or phone", selectedFallback: (id) => `Rider #${id}` };
  }
  if (field.key === "food_item_id") {
    return { resource: "food-items", placeholder: "Search food item", selectedFallback: (id) => `Food item #${id}` };
  }
  if (field.key === "food_order_id") {
    return { resource: "food-orders", placeholder: "Search food order number or customer", selectedFallback: (id) => `Food order #${id}` };
  }
  if (field.key === "medicine_order_id") {
    return { resource: "medicine-orders", placeholder: "Search medicine order number or customer", selectedFallback: (id) => `Medicine order #${id}` };
  }
  if (field.key === "category_id") {
    const resourceMap = {
      restaurants: "restaurant-categories",
      businesses: "business-categories",
      marketplace: "marketplace-categories",
      workers: "worker-categories",
      doctors: "doctor-categories",
      hospitals: "hospital-categories",
      hotels: "hotel-categories",
      property: "property-categories",
      education: "education-categories",
    };
    const categoryResource = resourceMap[activeResource];
    if (categoryResource) {
      return { resource: categoryResource, placeholder: "Search category name", selectedFallback: (id) => `Category #${id}` };
    }
  }
  return null;
}

const dateFields = new Set([
  "created_at", "updated_at", "starts_at", "ends_at", "estimated_delivery_at", "accepted_at",
  "preparing_at", "picked_up_at", "on_the_way_at", "delivered_at", "cancelled_at", "rejected_at",
]);

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function money(value) {
  const amount = Number(value || 0);
  return `BDT ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toCoord(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapsRouteUrl(fromLat, fromLng, toLat, toLng) {
  if ([fromLat, fromLng, toLat, toLng].some((value) => value === null)) return null;
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`;
}

function mapsEmbedRouteUrl(fromLat, fromLng, toLat, toLng) {
  if ([fromLat, fromLng, toLat, toLng].some((value) => value === null)) return null;
  return `https://maps.google.com/maps?saddr=${fromLat},${fromLng}&daddr=${toLat},${toLng}&output=embed`;
}

function mapsPointUrl(lat, lng) {
  if (lat === null || lng === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function googlePointEmbedUrl(lat, lng) {
  const safeLat = toCoord(lat) ?? DEFAULT_MAP_CENTER.lat;
  const safeLng = toCoord(lng) ?? DEFAULT_MAP_CENTER.lng;
  return `https://maps.google.com/maps?q=${safeLat},${safeLng}&z=16&output=embed`;
}

function loadFoodGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!GOOGLE_MAPS_WEB_API_KEY) return Promise.reject(new Error("Google Maps API key missing."));
  if (window.__googleMapsLoading) return window.__googleMapsLoading;
  window.__googleMapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_WEB_API_KEY}`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google map could not be loaded."));
    document.body.appendChild(script);
  });
  return window.__googleMapsLoading;
}

const foodProgressSteps = [
  ["pending", "Waiting for Restaurant Acceptance", "created_at"],
  ["accepted", "Accepted", "accepted_at"],
  ["preparing", "Preparing", "preparing_at"],
  ["picked_up", "Picked Up", "picked_up_at"],
  ["on_the_way", "On The Way", "on_the_way_at"],
  ["delivered", "Delivered", "delivered_at"],
];

const medicineProgressSteps = [
  ["pending", "Waiting for Store Acceptance", "created_at"],
  ["accepted", "Accepted", "accepted_at"],
  ["preparing", "Processing", "preparing_at"],
  ["picked_up", "Picked Up", "picked_up_at"],
  ["on_the_way", "On The Way", "on_the_way_at"],
  ["delivered", "Delivered", "delivered_at"],
];

function orderProgressItems(order, isMedicine) {
  if (Array.isArray(order?.status_timeline) && order.status_timeline.length) {
    return order.status_timeline.map((item) => ({
      status: item.status,
      label: item.label || String(item.status || "").replace(/_/g, " "),
      timestamp: item.timestamp,
      completed: Boolean(item.completed),
      current: Boolean(item.current),
    }));
  }

  const baseSteps = isMedicine ? medicineProgressSteps : foodProgressSteps;
  const currentStatus = order?.status || "pending";
  if (currentStatus === "payment_pending") {
    return [{ status: "payment_pending", label: "Payment Pending", timestamp: order?.created_at, completed: true, current: true }];
  }
  const terminalStep =
    currentStatus === "cancelled"
      ? [["cancelled", "Cancelled", "cancelled_at"]]
      : currentStatus === "rejected"
        ? [["rejected", "Rejected", "rejected_at"]]
        : [];
  const steps = [...baseSteps, ...terminalStep];
  const currentIndex = Math.max(0, steps.findIndex(([status]) => status === currentStatus));

  return steps.map(([status, label, key], index) => {
    const apiItem = Array.isArray(order?.status_timeline)
      ? order.status_timeline.find((item) => item?.status === status)
      : null;
    const timestamp = apiItem?.timestamp || order?.[key];
    return {
      status,
      label: apiItem?.label || label,
      timestamp,
      completed: Boolean(apiItem?.completed) || index <= currentIndex || Boolean(timestamp),
      current: Boolean(apiItem?.current) || index === currentIndex,
    };
  });
}

function emptyForm(config) {
  return config.fields.reduce((acc, field) => {
    if (field.type === "checkbox") acc[field.key] = Boolean(field.defaultValue);
    else if (field.type === "tags") acc[field.key] = "";
    else if (field.type === "addons" || field.type === "size_prices") acc[field.key] = "";
    else acc[field.key] = field.defaultValue ?? "";
    return acc;
  }, {});
}

function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace(" ", "T").slice(0, 16);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function normalizeRecord(record, config) {
  const form = emptyForm(config);
  config.fields.forEach((field) => {
    const value = record[field.key];
    if (field.type === "checkbox") form[field.key] = Boolean(value);
    else if (field.type === "tags") form[field.key] = Array.isArray(value) ? value.join(", ") : value || "";
    else if (field.type === "addons") form[field.key] = formatAddons(value);
    else if (field.type === "size_prices") form[field.key] = formatSizePrices(value);
    else if (field.type === "datetime-local") form[field.key] = toLocalDateTimeInput(value);
    else form[field.key] = value ?? "";
  });
  return form;
}

function buildPayload(form, config) {
  const payload = {};
  config.fields.forEach((field) => {
    let value = form[field.key];
    if (field.type === "number") {
      value = value === "" || value === null || value === undefined ? null : Number(value);
    } else if (field.type === "checkbox") {
      value = Boolean(value);
    } else if (field.type === "tags") {
      value = parseTags(value);
    } else if (field.type === "addons") {
      value = parseAddons(value);
    } else if (field.type === "size_prices") {
      value = parseSizePrices(value);
    } else if (field.type === "datetime-local") {
      value = value ? new Date(value).toISOString() : null;
    } else if (typeof value === "string") {
      value = value.trim();
      if (value === "" && !field.required) value = null;
    }
    payload[field.key] = value;
  });
  if (config === RESOURCE_CONFIG["food-orders"] && !payload.order_no) {
    payload.order_no = `FD-MANUAL-${Date.now().toString().slice(-8)}`;
  }
  return payload;
}

/* ==========================================================================
   Motion hook
   ========================================================================== */
function useCountUp(target, duration = 800) {
  const to = Number(target) || 0;
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      fromRef.current = to;
      setVal(to);
      return undefined;
    }
    const from = fromRef.current;
    let raf;
    let start;
    const step = (t) => {
      if (start === undefined) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from + (to - from) * eased;
      fromRef.current = next;
      setVal(next);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return val;
}

/* ==========================================================================
   UI primitives
   ========================================================================== */
const Icon = {
  search: (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="9" r="6" />
      <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor">
      <path d="M10 1.5l1.9 5.1 5.1 1.9-5.1 1.9L10 15.5l-1.9-5.1L3 8.5l5.1-1.9L10 1.5zM15.5 13l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 10S4.6 4.5 10 4.5 18.5 10 18.5 10 15.4 15.5 10 15.5 1.5 10 1.5 10z" />
      <circle cx="10" cy="10" r="2.4" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 3.5l3 3L7 16l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 5.5h13M8 5.5V3.5h4v2M5.5 5.5l.7 11h7.6l.7-11" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z" />
      <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" />
    </svg>
  ),
};

function Btn({ variant = "primary", size = "md", className = "", children, type = "button", ...props }) {
  return (
    <button type={type} className={`fd-btn fd-btn-${variant} ${size === "sm" ? "fd-btn-sm" : ""} ${className}`} {...props}>
      {children}
    </button>
  );
}

function TextField({ label, error, required, type = "text", ...props }) {
  return (
    <label className="fd-label">
      {label}
      {required && <em>*</em>}
      <input type={type} step={type === "number" ? "any" : undefined} className={`fd-input ${error ? "is-error" : ""}`} {...props} />
      {error && <p className="fd-error">{error}</p>}
    </label>
  );
}

function ModalShell({ eyebrow, title, subtitle, onClose, children, footer, maxWidth = "max-w-5xl", closeOnBackdrop = false }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fd-backdrop"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className={`fd-modal ${maxWidth}`} role="dialog" aria-modal="true">
        <div className="fd-modal-head">
          <div className="min-w-0">
            <p className="fd-eyebrow">{eyebrow}</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-[#111216]">{title}</h3>
            {subtitle && <p className="mt-1 text-sm font-medium text-[#6C717A]">{subtitle}</p>}
          </div>
          <button className="fd-close" onClick={onClose} aria-label="Close" type="button">×</button>
        </div>
        <div className="fd-modal-body">{children}</div>
        {footer && <div className="fd-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, action, children, delay = 0, className = "" }) {
  return (
    <div className={`fd-panel fd-rise ${className}`} style={{ "--d": delay }}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h4 className="fd-panel-title">{title}</h4>
            {subtitle && <p className="fd-panel-sub">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Tile({ label, children, dark = false, className = "" }) {
  return (
    <div className={`fd-tile ${dark ? "fd-tile-dark" : ""} ${className}`}>
      <div className="fd-tile-k">{label}</div>
      <div className="fd-tile-v">{children}</div>
    </div>
  );
}

function StatCard({ label, value, tone = "gray", kind, delay = 0 }) {
  const animated = useCountUp(kind ? Number(value || 0) : 0);
  const display = kind === "money" ? money(animated) : kind === "count" ? Math.round(animated).toLocaleString("en-US") : value;
  const toneClass = tone === "red" ? "fd-stat-red" : tone === "dark" ? "fd-stat-dark" : tone === "soft" ? "fd-stat-soft" : "";
  return (
    <div className={`fd-stat fd-rise ${toneClass}`} style={{ "--d": delay }}>
      <div className="fd-stat-k">{label}</div>
      <div className="fd-stat-v">{display}</div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="fd-tile">
      <div className="fd-tile-k">{label}</div>
      <div className="mt-1 text-base font-black text-[#111216]">{value}</div>
    </div>
  );
}

function SummaryLine({ label, value, strong = false }) {
  return (
    <div className={`fd-line-row ${strong ? "is-strong" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PaymentMethodBadge({ method }) {
  const map = {
    cash_on_delivery: ["COD", "fd-badge-gray"],
    manual_bkash: ["Owner bKash", "fd-badge-soft"],
    manual_nagad: ["Owner Nagad", "fd-badge-ink"],
    online: ["Online", "fd-badge-line"],
  };
  const [label, cls] = map[method] || [method || "-", "fd-badge-gray"];
  return <span className={`fd-badge ${cls}`}>{label}</span>;
}

function PaymentStatusBadge({ status }) {
  const map = { paid: "fd-badge-ink", unpaid: "fd-badge-gray", refunded: "fd-badge-soft" };
  return <span className={`fd-badge ${map[status] || map.unpaid}`}>{status || "unpaid"}</span>;
}

function statusTone(value) {
  const s = String(value || "").toLowerCase();
  if (/(deliver|paid|active|approved|resolved|online|accept|verified)/.test(s) && !/unpaid|inactive/.test(s)) return "fd-badge-ink";
  if (/(cancel|reject|block|suspend|hidden|hold|refund|closed|inactive|ended)/.test(s)) return "fd-badge-red";
  if (/(pending|open|review|process|busy|draft|unpaid|prepar|picked|way|waiting)/.test(s)) return "fd-badge-soft";
  return "fd-badge-gray";
}

function StatusBadge({ value, tone }) {
  return (
    <span className={`fd-badge ${tone || statusTone(value)}`}>
      <span className="fd-dot" />
      {String(value).replace(/_/g, " ")}
    </span>
  );
}

function CouponTag({ children }) {
  return <span className="fd-badge fd-badge-line capitalize">{children}</span>;
}

/* ==========================================================================
   Order view pieces
   ========================================================================== */
function OrderProgressTimeline({ order, isMedicine }) {
  const items = orderProgressItems(order, isMedicine);

  return (
    <Panel
      title="Order Progress"
      subtitle="Status update time and date are tracked from order placement to delivery."
      delay={60}
      action={<span className="fd-badge fd-badge-ink">{String(order?.status || "pending").replace(/_/g, " ")}</span>}
    >
      <div>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          const lineDone = item.completed && items[index + 1]?.completed;
          return (
            <div key={item.status} className="fd-tl" style={{ "--i": index }}>
              <div className="fd-tl-rail">
                <div className={`fd-node ${item.completed ? (item.current ? "is-current" : "is-done") : ""}`}>
                  {item.completed ? "✓" : index + 1}
                </div>
                {!last && (
                  <div className="fd-line">{lineDone && <i />}</div>
                )}
              </div>
              <div className="min-w-0 flex-1 pb-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`font-extrabold ${item.completed ? "text-[#111216]" : "text-[#9AA0A8]"}`}>{item.label}</div>
                    <div className="mt-1 text-xs font-semibold text-[#6C717A]">{formatDateTime(item.timestamp)}</div>
                  </div>
                  {item.current && <span className="fd-badge fd-badge-soft">Current</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function FoodOrderRouteMap({ order }) {
  const isMedicine = order?.service_type === "medicine" || order?.order_no?.startsWith?.("MD-");
  const pickupLabel = isMedicine ? "Pickup" : "Restaurant";
  const restaurantLat = toCoord(order?.restaurant?.lat);
  const restaurantLng = toCoord(order?.restaurant?.lng);
  const deliveryLat = toCoord(order?.delivery_lat);
  const deliveryLng = toCoord(order?.delivery_lng);
  const riderLat = toCoord(order?.rider?.last_lat);
  const riderLng = toCoord(order?.rider?.last_lng);
  const routeUrl = mapsRouteUrl(restaurantLat, restaurantLng, deliveryLat, deliveryLng);
  const embedUrl = mapsEmbedRouteUrl(restaurantLat, restaurantLng, deliveryLat, deliveryLng);
  const deliveryUrl = mapsPointUrl(deliveryLat, deliveryLng) || order?.delivery_map_url;
  const restaurantUrl = mapsPointUrl(restaurantLat, restaurantLng);
  const riderUrl = mapsPointUrl(riderLat, riderLng);

  return (
    <Panel
      title={`${pickupLabel} to Delivery Map`}
      subtitle={`${pickupLabel} and customer delivery location together${
        order?.route_distance_km !== null && order?.route_distance_km !== undefined ? ` • ${order.route_distance_km} KM` : ""
      }.`}
      action={
        routeUrl && (
          <a href={routeUrl} target="_blank" rel="noreferrer" className="fd-btn fd-btn-primary fd-btn-sm">
            Open route
          </a>
        )
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label={pickupLabel}>
          {order?.restaurant?.name || (isMedicine ? "Medicine Store" : "-")}
          <div className="mt-1 text-xs font-medium text-[#9AA0A8]">{restaurantLat !== null && restaurantLng !== null ? `${restaurantLat}, ${restaurantLng}` : "Location missing"}</div>
        </Tile>
        <Tile label="Customer">
          {order?.receiver_name || "-"}
          <div className="mt-1 text-xs font-medium text-[#9AA0A8]">{deliveryLat !== null && deliveryLng !== null ? `${deliveryLat}, ${deliveryLng}` : "Location missing"}</div>
        </Tile>
        <Tile
          dark
          label={
            <span className="inline-flex items-center gap-1.5">
              <span className="fd-ring inline-block h-1.5 w-1.5 rounded-full bg-[#E10613]" />
              Live Rider
            </span>
          }
        >
          {order?.rider?.name || order?.accepted_rider_name || "-"}
          <div className="mt-1 text-xs font-medium text-white/60">{riderLat !== null && riderLng !== null ? `${riderLat}, ${riderLng}` : "Location not started"}</div>
          {order?.rider?.last_location_at && <div className="mt-1 text-[11px] text-white/50">Updated {formatDateTime(order.rider.last_location_at)}</div>}
        </Tile>
      </div>

      {embedUrl ? (
        <iframe
          title={`Route map ${order?.order_no || ""}`}
          src={embedUrl}
          className="mt-4 h-72 w-full rounded-2xl border border-[#ECEDF0]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="mt-4 rounded-2xl border border-[#FFE1E3] bg-[#FFF4F4] p-4 text-sm font-semibold text-[#C40411]">
          Pickup and delivery coordinates are both required to show the route map.
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {restaurantUrl && <a href={restaurantUrl} target="_blank" rel="noreferrer" className="fd-btn fd-btn-ghost fd-btn-sm flex-1">Open pickup</a>}
        {deliveryUrl && <a href={deliveryUrl} target="_blank" rel="noreferrer" className="fd-btn fd-btn-ghost fd-btn-sm flex-1">Open delivery</a>}
        {riderUrl && <a href={riderUrl} target="_blank" rel="noreferrer" className="fd-btn fd-btn-primary fd-btn-sm flex-1">Open rider live</a>}
      </div>
    </Panel>
  );
}

function OrderDeliveryLocationEditor({ order, onPreview, onSave }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const boxRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [lat, setLat] = useState(order?.delivery_lat ?? "");
  const [lng, setLng] = useState(order?.delivery_lng ?? "");
  const [preview, setPreview] = useState(null);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [mapError, setMapError] = useState("");
  const status = String(order?.status || "");
  const editable = order?.order_type === "delivery"
    && ["pending", "accepted", "preparing"].includes(status)
    && String(order?.payment_status || "") !== "paid";

  useEffect(() => {
    setLat(order?.delivery_lat ?? "");
    setLng(order?.delivery_lng ?? "");
    setPreview(null);
    setError("");
  }, [order?.id, order?.delivery_lat, order?.delivery_lng]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setMapError("");
    loadFoodGoogleMaps()
      .then((maps) => {
        if (cancelled || !boxRef.current || mapRef.current) return;
        const safeLat = toCoord(lat);
        const safeLng = toCoord(lng);
        const selected = safeLat !== null && safeLng !== null;
        const map = new maps.Map(boxRef.current, {
          center: selected ? { lat: safeLat, lng: safeLng } : DEFAULT_MAP_CENTER,
          zoom: selected ? 17 : 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        map.addListener("click", (event) => {
          if (!event.latLng) return;
          setLat(Number(event.latLng.lat().toFixed(7)));
          setLng(Number(event.latLng.lng().toFixed(7)));
          setPreview(null);
          setError("");
        });
        mapRef.current = map;
      })
      .catch((err) => setMapError(err.message || "Google map could not be loaded."));

    return () => {
      cancelled = true;
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    const maps = window.google?.maps;
    const map = mapRef.current;
    const safeLat = toCoord(lat);
    const safeLng = toCoord(lng);
    if (!maps || !map || safeLat === null || safeLng === null) return;
    const point = { lat: safeLat, lng: safeLng };
    if (!markerRef.current) {
      markerRef.current = new maps.Marker({ position: point, map, draggable: true, title: "Customer delivery location" });
      markerRef.current.addListener("dragend", (event) => {
        if (!event.latLng) return;
        setLat(Number(event.latLng.lat().toFixed(7)));
        setLng(Number(event.latLng.lng().toFixed(7)));
        setPreview(null);
        setError("");
      });
    } else {
      markerRef.current.setPosition(point);
    }
    map.setCenter(point);
    map.setZoom(Math.max(map.getZoom(), 16));
  }, [lat, lng]);

  const changeCoordinate = (setter, value) => {
    setter(value);
    setPreview(null);
    setError("");
  };

  const calculate = async () => {
    if (toCoord(lat) === null || toCoord(lng) === null) {
      setError("Valid latitude and longitude are required.");
      return;
    }
    setWorking("preview");
    setError("");
    try {
      const result = await onPreview?.({ delivery_lat: Number(lat), delivery_lng: Number(lng) });
      setPreview(result?.comparison || null);
    } catch (err) {
      setError(err.message || "Unable to calculate the new delivery charge.");
    } finally {
      setWorking("");
    }
  };

  const save = async () => {
    if (!preview) return;
    setWorking("save");
    setError("");
    try {
      await onSave?.({ delivery_lat: Number(lat), delivery_lng: Number(lng) });
      setOpen(false);
      setPreview(null);
    } catch (err) {
      setError(err.message || "Unable to update the delivery location.");
    } finally {
      setWorking("");
    }
  };

  const lockMessage = String(order?.payment_status || "") === "paid"
    ? "Paid order location is locked because changing it would change an already paid total."
    : !["pending", "accepted", "preparing"].includes(status)
      ? "Location is locked after rider pickup, cancellation or delivery."
      : "Only delivery orders have a changeable map location.";

  return (
    <div className="fd-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="fd-panel-title">Customer delivery location</h4>
          <p className="mt-1 text-sm font-semibold text-[#6C717A]">
            Admin can correct a wrong map pin. The server recalculates distance, charge, discount and total before saving.
          </p>
        </div>
        <Btn variant={open ? "ghost" : "primary"} disabled={!editable} onClick={() => setOpen((value) => !value)}>
          {open ? "Cancel change" : "Change map location"}
        </Btn>
      </div>

      {!editable && <div className="mt-4 rounded-xl border border-[#FFE1E3] bg-[#FFF4F4] px-4 py-3 text-sm font-bold text-[#C40411]">{lockMessage}</div>}

      {open && editable && (
        <div className="mt-5 border-t border-[#ECEDF0] pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-extrabold text-[#111216]">Select the corrected delivery point</div>
            {mapsPointUrl(toCoord(lat), toCoord(lng)) && (
              <a href={mapsPointUrl(toCoord(lat), toCoord(lng))} target="_blank" rel="noreferrer" className="fd-btn fd-btn-ghost fd-btn-sm">Open Google Maps</a>
            )}
          </div>
          <div ref={boxRef} className={`h-80 w-full overflow-hidden rounded-lg border border-[#D6D9DE] bg-white ${mapError ? "hidden" : ""}`} />
          {mapError && (
            <iframe
              title="Customer delivery map preview"
              src={googlePointEmbedUrl(lat, lng)}
              className="h-80 w-full rounded-lg border border-[#D6D9DE] bg-white"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
          {mapError && <p className="mt-2 text-xs font-bold text-[#C40411]">{mapError} Coordinates can still be entered below.</p>}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="fd-label">Latitude
              <input type="number" step="0.0000001" className="fd-input mt-1" value={lat} onChange={(event) => changeCoordinate(setLat, event.target.value)} />
            </label>
            <label className="fd-label">Longitude
              <input type="number" step="0.0000001" className="fd-input mt-1" value={lng} onChange={(event) => changeCoordinate(setLng, event.target.value)} />
            </label>
          </div>

          {preview && (
            <div className="mt-5 rounded-lg border border-[#D6D9DE] bg-[#F7F7F8] p-4">
              <div className="fd-eyebrow">Charge preview</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MiniMetric label="Distance" value={`${preview.before?.delivery_distance_km ?? "-"} → ${preview.after?.delivery_distance_km ?? "-"} KM`} />
                <MiniMetric label="Delivery fee" value={`${money(preview.before?.delivery_fee)} → ${money(preview.after?.delivery_fee)}`} />
                <MiniMetric label="Discount" value={`${money(preview.before?.discount_amount)} → ${money(preview.after?.discount_amount)}`} />
                <MiniMetric label="Grand total" value={`${money(preview.before?.grand_total)} → ${money(preview.after?.grand_total)}`} />
              </div>
              <p className="mt-3 text-xs font-bold text-[#6C717A]">{preview.after?.delivery_charge_label || String(preview.after?.delivery_charge_mode || "").replace(/_/g, " ")}</p>
            </div>
          )}

          {error && <div className="mt-3 rounded-xl border border-[#FFC2C6] bg-[#FFF4F4] px-3 py-2 text-xs font-bold text-[#C40411]">{error}</div>}
          <div className="mt-4 flex flex-col justify-end gap-2 sm:flex-row">
            <Btn variant="ghost" disabled={Boolean(working)} onClick={calculate}>{working === "preview" ? "Calculating..." : "Calculate new charge"}</Btn>
            <Btn disabled={!preview || Boolean(working)} onClick={save}>{working === "save" ? "Saving..." : "Save location & new charge"}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function CouponUsageCard({ order }) {
  const breakdown = order?.discount_breakdown && typeof order.discount_breakdown === "object" ? order.discount_breakdown : {};
  const code = order?.coupon_code || breakdown.code || "";
  const title = order?.coupon_title || breakdown.title || "";
  const discount = Number(order?.discount_amount || 0);
  const used = Boolean(code) || discount > 0;
  const autoApplied = breakdown.auto_applied === true;
  const firstOrderOnly = breakdown.first_order_only === true;
  const discountType = breakdown.discount_type ? String(breakdown.discount_type).replace(/_/g, " ") : "-";
  const discountValue = breakdown.discount_value !== undefined && breakdown.discount_value !== null ? breakdown.discount_value : "-";
  const fundingSource = breakdown.funding_source ? String(breakdown.funding_source).replace(/_/g, " ") : "-";

  if (!used) {
    return (
      <div className="fd-soft flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#ECEDF0] bg-white font-black text-[#9AA0A8]">%</span>
        <div>
          <div className="font-black text-[#111216]">No coupon used</div>
          <div className="mt-0.5 text-xs font-semibold text-[#6C717A]">Customer did not use any coupon on this order.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#FFC2C6] bg-[#FFF4F4] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="fd-ring grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E10613] text-lg font-black text-white">%</span>
          <div>
            <div className="fd-eyebrow">Coupon Used</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-xl border border-dashed border-[#E10613] bg-white px-3 py-1.5 text-lg font-black tracking-wide text-[#111216]">{code || "Coupon"}</span>
              {title ? <span className="text-sm font-bold text-[#3E424A]">{title}</span> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <CouponTag>{autoApplied ? "Auto applied" : "Customer entered"}</CouponTag>
              {firstOrderOnly ? <CouponTag>First order offer</CouponTag> : null}
              <CouponTag>{discountType}</CouponTag>
              <CouponTag>{fundingSource} funded</CouponTag>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#FFE1E3] bg-white px-4 py-3 text-right">
          <div className="fd-tile-k">Total discount</div>
          <div className="mt-1 text-2xl font-black text-[#E10613]">-{money(discount)}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <MiniMetric label="Coupon value" value={discountValue === "-" ? "-" : String(discountValue)} />
        <MiniMetric label="Admin paid" value={money(order?.admin_discount_amount)} />
        <MiniMetric label="Restaurant paid" value={money(order?.restaurant_discount_amount)} />
        <MiniMetric label="Delivery discount" value={money(order?.delivery_discount_amount)} />
      </div>
    </div>
  );
}

function KV({ label, children }) {
  const empty = children === null || children === undefined || children === "" || children === false;
  return (
    <div className="fd-kv">
      <dt>{label}</dt>
      <dd>{empty ? <span className="text-[#C4C8CE]">—</span> : children}</dd>
    </div>
  );
}

function BillGroup({ title, children }) {
  return (
    <div className="fd-group">
      <div className="fd-group-title">{title}</div>
      <div className="fd-group-body">{children}</div>
    </div>
  );
}

function FoodReviewViewModal({ loading, review, onClose, onEdit }) {
  const rating = Math.max(0, Math.min(5, Number(review?.rating || 0)));
  const target = review?.food_item_name || review?.restaurant_name || "Restaurant review";

  return (
    <ModalShell
      eyebrow="Customer feedback"
      title={loading ? "Loading review" : `${rating}/5 rating for ${target}`}
      subtitle={review?.created_at ? `Submitted ${formatDateTime(review.created_at)}` : "Review details"}
      onClose={onClose}
      closeOnBackdrop
      maxWidth="max-w-3xl"
      footer={review && (
        <div className="ml-auto flex gap-2">
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
          <Btn onClick={() => onEdit(review)}>{Icon.edit} Moderate Review</Btn>
        </div>
      )}
    >
      {loading ? (
        <div className="fd-soft flex items-center gap-3 p-5 text-sm font-semibold text-[#6C717A]"><span className="fd-spin" />Loading review details...</div>
      ) : review ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Customer">
              {review.customer_name || review.user?.name || `Customer #${review.user_id}`}
              <small>{review.customer_phone || review.user?.phone || review.user?.email || "No contact"}</small>
            </Tile>
            <Tile label="Restaurant">
              {review.restaurant_name || review.restaurant?.name || "Not specified"}
              <small>{review.restaurant?.phone || "Restaurant review"}</small>
            </Tile>
            <Tile label="Food item">
              {review.food_item_name || review.food_item?.name || "Overall restaurant"}
              <small>{review.food_item_id ? `Item #${review.food_item_id}` : "No specific item"}</small>
            </Tile>
            <Tile label="Order">
              {review.order_no || review.food_order?.order_no || `#${review.food_order_id || "-"}`}
              <small>{review.food_order?.status ? String(review.food_order.status).replace(/_/g, " ") : "Order reference"}</small>
            </Tile>
          </div>

          <Panel
            title="Customer review"
            subtitle={review.is_verified_order ? "Submitted from a verified Bholavashi order" : "Order could not be verified"}
            action={<span className="fd-badge fd-badge-soft text-base">{"★".repeat(rating)}{"☆".repeat(5 - rating)} {rating}/5</span>}
          >
            <p className="whitespace-pre-wrap text-[15px] font-semibold leading-7 text-[#24262B]">{review.comment || "Customer submitted a rating without a written comment."}</p>
            {review.image_url && <img src={mediaUrl(review.image_url)} alt="Customer review" className="mt-4 max-h-72 w-full rounded-lg object-contain bg-[#F4F5F7]" />}
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2">
            <Panel title="Moderation" subtitle="Current public visibility">
              <StatusBadge value={review.status || "active"} />
            </Panel>
            <Panel title="Restaurant reply" subtitle={review.owner_replied_at ? formatDateTime(review.owner_replied_at) : "No reply time recorded"}>
              <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-[#24262B]">{review.owner_reply || "Restaurant has not replied yet."}</p>
            </Panel>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}

function FoodOrderViewModal({ loading, order, riders = [], assigning = false, assignError = "", updatingItemId = null, itemUpdateError = "", onAssignRider, onUpdateItemQuantity, onPreviewDeliveryLocation, onUpdateDeliveryLocation, onClose }) {
  const items = order?.items || [];
  const paymentProofUrl = order?.payment_proof_photo_url || order?.payment_proof_photo;
  const deliveryProofUrl = order?.delivery_proof_photo_url || order?.delivery_proof_photo;
  const isMedicine = order?.service_type === "medicine" || order?.order_no?.startsWith?.("MD-") || items.some((item) => item.brand_name);
  const serviceLabel = isMedicine ? "Medicine" : "Food";
  const pickupLabel = isMedicine ? "Medicine Store" : "Restaurant";
  const [tab, setTab] = useState("overview");
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const assignable = order && !["delivered", "cancelled", "rejected"].includes(String(order.status || ""));
  const riderName = order?.accepted_rider_name || order?.rider?.name;
  const pendingRequests = Number(order?.pending_rider_requests_count || 0);
  const discount = Number(order?.discount_amount || 0);
  const pickupName = order?.restaurant?.name || order?.restaurant_id || (isMedicine ? "Medicine Store" : "-");
  const canEditItems = !isMedicine
    && ["pending", "accepted", "preparing"].includes(String(order?.status || ""))
    && String(order?.payment_status || "") !== "paid";

  const changeItemQuantity = (item, nextQuantity) => {
    if (!onUpdateItemQuantity || updatingItemId !== null) return;
    if (nextQuantity === 0 && !window.confirm(`Remove ${item.name || "this item"} from the order?`)) return;
    onUpdateItemQuantity(item, nextQuantity);
  };

  const tabs = [
    ["overview", "Overview", items.length || null],
    ["delivery", "Delivery & Rider", !riderName && pendingRequests ? pendingRequests : null],
    ["payment", "Payment & Billing", null],
    ["timeline", "Timeline", null],
  ];

  return (
    <ModalShell
      eyebrow={`${serviceLabel} order`}
      title={order?.order_no || "Loading order"}
      subtitle={order?.created_at ? `Placed on ${formatDateTime(order.created_at)}` : "Loading details..."}
      onClose={onClose}
      closeOnBackdrop
    >
      {loading ? (
        <div className="fd-soft flex items-center gap-3 p-5 text-sm font-semibold text-[#6C717A]">
          <span className="fd-spin" />
          Loading order details...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary strip: the 5 things an admin checks first */}
          <div className="fd-sumstrip fd-rise">
            <div className="fd-sum">
              <span className="fd-sum-k">Order status</span>
              <span className="fd-sum-v"><StatusBadge value={order?.status || "pending"} /></span>
            </div>
            <div className="fd-sum">
              <span className="fd-sum-k">Customer</span>
              <span className="fd-sum-v">{order?.receiver_name || "-"}<small>{order?.receiver_phone || "-"}</small></span>
            </div>
            <div className="fd-sum">
              <span className="fd-sum-k">Payment</span>
              <span className="fd-sum-v">
                <PaymentMethodBadge method={order?.payment_method} />
                <PaymentStatusBadge status={order?.payment_status} />
              </span>
            </div>
            <div className="fd-sum">
              <span className="fd-sum-k">Rider</span>
              <span className="fd-sum-v">{riderName || "Not assigned"}<small>{order?.rider_assignment_label || "-"}</small></span>
            </div>
            <div className="fd-sum fd-sum-total">
              <span className="fd-sum-k">Grand total</span>
              <span className="fd-sum-v">BDT {order?.grand_total || 0}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="fd-tabs" role="tablist">
            {tabs.map(([key, label, count]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} className={`fd-tab ${tab === key ? "is-active" : ""}`} onClick={() => setTab(key)}>
                {label}
                {count ? <span className="fd-tab-n">{count}</span> : null}
              </button>
            ))}
          </div>

          <div key={tab} className="fd-tabpane">
            {/* ---------------- OVERVIEW ---------------- */}
            {tab === "overview" && (
              <div className="grid gap-5 lg:grid-cols-[1.35fr,1fr]">
                <div className="fd-panel">
                  <h4 className="fd-panel-title">Ordered {serviceLabel.toLowerCase()} items</h4>
                  <table className="fd-itemtable mt-4">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Unit</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="font-bold text-[#111216]">{item.name || item.brand_name || "Medicine"}</div>
                            {(item.generic_name || item.strength || item.company) && (
                              <div className="mt-0.5 text-xs text-[#9AA0A8]">{[item.generic_name, item.strength, item.company].filter(Boolean).join(" · ")}</div>
                            )}
                            {item.note && <div className="mt-0.5 text-xs text-[#9AA0A8]">Note: {item.note}</div>}
                          </td>
                          <td className="text-right font-semibold">
                            {canEditItems ? (
                              <span className="fd-qty ml-auto" aria-label={`Quantity for ${item.name || "order item"}`}>
                                <button type="button" title={Number(item.quantity) === 1 ? "Remove item" : "Decrease quantity"} disabled={updatingItemId !== null} onClick={() => changeItemQuantity(item, Number(item.quantity) - 1)}>−</button>
                                <span>{updatingItemId === item.id ? <i className="fd-spin" /> : item.quantity}</span>
                                <button type="button" title="Increase quantity" disabled={updatingItemId !== null || Number(item.quantity) >= 99} onClick={() => changeItemQuantity(item, Number(item.quantity) + 1)}>+</button>
                              </span>
                            ) : item.quantity}
                          </td>
                          <td className="text-right text-[#6C717A]">{item.unit_price}</td>
                          <td className="text-right font-extrabold text-[#111216]">{item.total_price}</td>
                        </tr>
                      ))}
                      {!items.length && (
                        <tr><td colSpan={4} className="!py-8 text-center text-[#9AA0A8]">No items found for this order.</td></tr>
                      )}
                    </tbody>
                  </table>
                  {itemUpdateError ? <p className="fd-error mt-3">{itemUpdateError}</p> : null}
                  {canEditItems ? <p className="fd-hint">Quantity changes recalculate discount, commission and the order total automatically.</p> : null}
                  <div className="mt-4 space-y-2.5 border-t border-[#ECEDF0] pt-4">
                    <SummaryLine label="Items total" value={`BDT ${order?.items_total || 0}`} />
                    <SummaryLine label="Delivery fee" value={`BDT ${order?.delivery_fee || 0}`} />
                    {discount > 0 && <SummaryLine label="Discount" value={`- BDT ${discount}`} />}
                    <div className="border-t border-dashed border-[#D6D9DE] pt-3">
                      <SummaryLine label="Grand total" value={`BDT ${order?.grand_total || 0}`} strong />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="fd-panel">
                    <h4 className="fd-panel-title mb-4">Customer & delivery address</h4>
                    <dl className="fd-kvlist">
                      <KV label="Name">{order?.receiver_name}</KV>
                      <KV label="Phone">{order?.receiver_phone}</KV>
                      <KV label="Area">{order?.delivery_area}</KV>
                      <KV label="Address">{order?.delivery_address}</KV>
                      <KV label="Landmark">{order?.landmark}</KV>
                      <KV label="Order note">{order?.order_note}</KV>
                    </dl>
                  </div>
                  <div className="fd-panel">
                    <h4 className="fd-panel-title mb-4">Order info</h4>
                    <dl className="fd-kvlist">
                      <KV label={pickupLabel}>{pickupName}</KV>
                      <KV label="Order no">{order?.order_no}</KV>
                      <KV label="Placed">{formatDateTime(order?.created_at)}</KV>
                      <KV label="Estimated delivery">{formatDateTime(order?.estimated_delivery_at)}</KV>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- DELIVERY & RIDER ---------------- */}
            {tab === "delivery" && (
              <div className="space-y-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="fd-panel">
                    <h4 className="fd-panel-title">Rider assignment</h4>
                    <div className="fd-soft mt-4 p-3.5 text-sm">
                      <div className="font-extrabold text-[#111216]">{order?.rider_assignment_label || "No rider accepted yet"}</div>
                      <div className="mt-1 text-[#6C717A]">
                        {order?.accepted_rider_name
                          ? `${order.accepted_rider_name} (${order.accepted_rider_phone || "-"}) accepted this order.`
                          : `${pendingRequests} rider request pending, ${order?.total_rider_requests_count || 0} total request sent.`}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="fd-label">Assign a rider manually</div>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <select
                          value={selectedRiderId}
                          onChange={(event) => setSelectedRiderId(event.target.value)}
                          disabled={!assignable || assigning}
                          className="fd-input fd-input-sm flex-1 disabled:bg-[#F7F7F8] disabled:text-[#9AA0A8]"
                        >
                          <option value="">{assignable ? "Select rider" : "Assignment locked for this status"}</option>
                          {riders.map((rider) => (
                            <option key={rider.id} value={rider.id}>
                              #{rider.id} {rider.name || "Rider"} - {rider.phone || "no phone"} ({rider.kyc_status || "-"} / {rider.account_status || "-"} / {rider.availability_status || "-"})
                            </option>
                          ))}
                        </select>
                        <Btn disabled={!assignable || !selectedRiderId || assigning} onClick={() => onAssignRider?.(selectedRiderId)}>
                          {assigning ? (<><span className="fd-spin" style={{ borderColor: "rgba(255,255,255,.35)", borderTopColor: "#fff" }} /> Assigning</>) : "Assign"}
                        </Btn>
                      </div>
                      {assignError && <div className="mt-2 rounded-xl border border-[#FFC2C6] bg-[#FFF4F4] px-3 py-2 text-xs font-bold text-[#C40411]">{assignError}</div>}
                      {!riders.length && <div className="fd-hint">No rider found. Add or approve riders first.</div>}
                    </div>

                    {!!order?.rider_requests?.length && (
                      <div className="mt-5">
                        <div className="fd-group-title">Rider requests</div>
                        <table className="fd-itemtable">
                          <thead>
                            <tr>
                              <th>Rider</th>
                              <th>Status</th>
                              <th className="text-right">Distance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.rider_requests.map((request) => (
                              <tr key={request.id}>
                                <td>
                                  <div className="font-bold text-[#111216]">{request.rider?.name || `Rider #${request.rider_id}`}</div>
                                  <div className="text-xs text-[#9AA0A8]">{request.rider?.phone || "-"}</div>
                                </td>
                                <td><StatusBadge value={request.status || "-"} /></td>
                                <td className="text-right">{request.distance_km ? `${request.distance_km} KM` : "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="fd-panel">
                    <h4 className="fd-panel-title mb-4">Delivery details</h4>
                    <dl className="fd-kvlist">
                      <KV label="Route distance">{order?.route_distance_km !== null && order?.route_distance_km !== undefined ? `${order.route_distance_km} KM` : null}</KV>
                      <KV label="Charged distance">{order?.delivery_distance_km ? `${order.delivery_distance_km} KM` : null}</KV>
                      <KV label="Charge mode">{order?.delivery_charge_mode}</KV>
                      <KV label="Rider location">{order?.rider?.last_lat && order?.rider?.last_lng ? `${order.rider.last_lat}, ${order.rider.last_lng}` : null}</KV>
                      <KV label="Location updated">{order?.rider?.last_location_at ? formatDateTime(order.rider.last_location_at) : null}</KV>
                      <KV label="Accepted at">{order?.accepted_at ? formatDateTime(order.accepted_at) : null}</KV>
                      <KV label="Picked up at">{order?.picked_up_at ? formatDateTime(order.picked_up_at) : null}</KV>
                      <KV label="Delivered at">{order?.delivered_at ? formatDateTime(order.delivered_at) : null}</KV>
                    </dl>
                    {order?.delivery_map_url && (
                      <a href={order.delivery_map_url} target="_blank" rel="noreferrer" className="fd-btn fd-btn-ghost fd-btn-sm mt-4 w-full">
                        View delivery location on map
                      </a>
                    )}
                  </div>
                </div>

                {!isMedicine && (
                  <OrderDeliveryLocationEditor
                    order={order}
                    onPreview={onPreviewDeliveryLocation}
                    onSave={onUpdateDeliveryLocation}
                  />
                )}
                <FoodOrderRouteMap order={order} />
              </div>
            )}

            {/* ---------------- PAYMENT & BILLING ---------------- */}
            {tab === "payment" && (
              <div className="space-y-5">
                <CouponUsageCard order={order} />
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="fd-panel">
                    <h4 className="fd-panel-title mb-4">Payment</h4>
                    <dl className="fd-kvlist">
                      <KV label="Method"><PaymentMethodBadge method={order?.payment_method} /></KV>
                      <KV label="Status"><PaymentStatusBadge status={order?.payment_status} /></KV>
                      <KV label="Transaction ID">{order?.manual_transaction_id}</KV>
                      <KV label="Screenshot">
                        <span className={paymentProofUrl ? "text-[#E10613]" : "text-[#9AA0A8]"}>{paymentProofUrl ? "Submitted" : "Not submitted"}</span>
                      </KV>
                    </dl>
                    {paymentProofUrl && (
                      <a href={paymentProofUrl} target="_blank" rel="noreferrer" className="fd-zoom mt-4">
                        <img src={paymentProofUrl} alt="Payment proof" />
                        <div className="flex items-center justify-between px-4 py-3 text-sm font-extrabold text-[#E10613]">
                          <span>Open full payment proof</span>
                          <span>↗</span>
                        </div>
                      </a>
                    )}
                    {deliveryProofUrl && (
                      <a href={deliveryProofUrl} target="_blank" rel="noreferrer" className="fd-zoom mt-4">
                        <img src={deliveryProofUrl} alt="Delivery proof" />
                        <div className="flex items-center justify-between px-4 py-3 text-sm font-extrabold text-[#111216]">
                          <span>Open full delivery proof</span>
                          <span>↗</span>
                        </div>
                      </a>
                    )}
                  </div>

                  <div className="fd-panel">
                    <h4 className="fd-panel-title mb-4">Billing breakdown</h4>
                    <BillGroup title="Customer pays">
                      <SummaryLine label="Items total" value={`BDT ${order?.items_total || 0}`} />
                      <SummaryLine label="Delivery fee" value={`BDT ${order?.delivery_fee || 0}`} />
                      <SummaryLine label="Discount" value={`- BDT ${discount}`} />
                      <div className="border-t border-[#ECEDF0] pt-3">
                        <SummaryLine label="Grand total" value={`BDT ${order?.grand_total || 0}`} strong />
                      </div>
                    </BillGroup>
                    {discount > 0 && (
                      <BillGroup title="Who paid the discount">
                        <SummaryLine label="Admin" value={`BDT ${order?.admin_discount_amount || 0}`} />
                        {!isMedicine && <SummaryLine label="Restaurant" value={`BDT ${order?.restaurant_discount_amount || 0}`} />}
                        <SummaryLine label="Delivery discount" value={`BDT ${order?.delivery_discount_amount || 0}`} />
                      </BillGroup>
                    )}
                    {!isMedicine && (
                      <BillGroup title="Restaurant settlement">
                        <SummaryLine label="Commission" value={`BDT ${order?.restaurant_commission_amount || 0}`} />
                        <SummaryLine label="Owner payable" value={`BDT ${order?.restaurant_owner_payable || 0}`} />
                        <SummaryLine label="Payout status" value={<StatusBadge value={order?.restaurant_payout_status || "pending"} />} />
                        {order?.restaurant_payout_reference && <SummaryLine label="Payout reference" value={order.restaurant_payout_reference} />}
                      </BillGroup>
                    )}
                    <BillGroup title="Admin & rider">
                      <SummaryLine label="Rider payout" value={`BDT ${order?.rider_earning || 0}`} />
                      <SummaryLine label="Admin delivery income" value={`BDT ${order?.admin_delivery_income || 0}`} />
                      {!isMedicine && <SummaryLine label="Admin total income" value={`BDT ${order?.admin_total_income || 0}`} />}
                    </BillGroup>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- TIMELINE ---------------- */}
            {tab === "timeline" && (
              <div className="mx-auto max-w-2xl">
                <OrderProgressTimeline order={order} isMedicine={isMedicine} />
              </div>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

/* ==========================================================================
   Filters + summary
   ========================================================================== */
function FilterField({ label, children }) {
  return (
    <label className="fd-label min-w-[150px] flex-1">
      {label}
      {children}
    </label>
  );
}

function FoodOrderFilterBar({ token, filters, onChange, hideRestaurant = false }) {
  const update = (key, value) => onChange((prev) => ({ ...prev, [key]: value }));
  const clear = () => onChange({ payment_method: "", payment_status: "", status: "", restaurant_id: "", date_from: "", date_to: "" });
  const activeCount = Object.values(filters).filter((v) => String(v || "").trim()).length;
  return (
    <div className="fd-card fd-rise p-4" style={{ "--d": 40 }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <FilterField label="Payment">
          <select value={filters.payment_method} onChange={(e) => update("payment_method", e.target.value)} className="fd-input">
            <option value="">All methods</option>
            <option value="cash_on_delivery">COD</option>
            <option value="manual_bkash">Manual bKash</option>
            <option value="manual_nagad">Manual Nagad</option>
            <option value="online">Online</option>
          </select>
        </FilterField>
        <FilterField label="Payment Status">
          <select value={filters.payment_status} onChange={(e) => update("payment_status", e.target.value)} className="fd-input">
            <option value="">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </FilterField>
        <FilterField label="Order Status">
          <select value={filters.status} onChange={(e) => update("status", e.target.value)} className="fd-input">
            <option value="">All</option>
            {["pending", "accepted", "preparing", "picked_up", "on_the_way", "delivered", "cancelled", "rejected"].map((status) => (
              <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
            ))}
          </select>
        </FilterField>
        {!hideRestaurant && (
          <div className="min-w-[230px] flex-1">
            <ResourceSelect
              token={token}
              resource="restaurants"
              label="Restaurant"
              value={filters.restaurant_id}
              onChange={(id) => update("restaurant_id", id)}
              placeholder="Search restaurant"
              formatLabel={relationLabel}
              selectedFallback={(id) => `Restaurant #${id}`}
            />
          </div>
        )}
        <FilterField label="From">
          <input type="date" value={filters.date_from} onChange={(e) => update("date_from", e.target.value)} className="fd-input" />
        </FilterField>
        <FilterField label="To">
          <input type="date" value={filters.date_to} onChange={(e) => update("date_to", e.target.value)} className="fd-input" />
        </FilterField>
        <Btn variant="ghost" onClick={clear}>
          Clear{activeCount ? ` (${activeCount})` : ""}
        </Btn>
      </div>
    </div>
  );
}

function FoodItemFilterBar({ token, filters, onChange }) {
  const update = (key, value) => onChange((prev) => ({ ...prev, [key]: value }));
  const clear = () => onChange({ restaurant_id: "", food_category_id: "", is_available: "", is_popular: "", is_promoted: "", status: "" });
  const activeCount = Object.values(filters).filter((value) => String(value || "").trim()).length;

  return (
    <div className="fd-card fd-rise p-4" style={{ "--d": 40 }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-[230px] flex-[1.4]">
          <ResourceSelect
            token={token}
            resource="restaurants"
            label="Restaurant"
            value={filters.restaurant_id}
            onChange={(id) => update("restaurant_id", id)}
            placeholder="Search restaurant"
            formatLabel={relationLabel}
            selectedFallback={(id) => `Restaurant #${id}`}
          />
        </div>
        <div className="min-w-[220px] flex-[1.2]">
          <ResourceSelect
            token={token}
            resource="food-categories"
            label="Category"
            value={filters.food_category_id}
            onChange={(id) => update("food_category_id", id)}
            placeholder="Search category"
            formatLabel={relationLabel}
            selectedFallback={(id) => `Category #${id}`}
          />
        </div>
        <FilterField label="Availability">
          <select value={filters.is_available} onChange={(event) => update("is_available", event.target.value)} className="fd-input">
            <option value="">All items</option>
            <option value="1">Available</option>
            <option value="0">Unavailable</option>
          </select>
        </FilterField>
        <FilterField label="Popular">
          <select value={filters.is_popular} onChange={(event) => update("is_popular", event.target.value)} className="fd-input">
            <option value="">All</option>
            <option value="1">Popular only</option>
            <option value="0">Not popular</option>
          </select>
        </FilterField>
        <FilterField label="Promotion">
          <select value={filters.is_promoted} onChange={(event) => update("is_promoted", event.target.value)} className="fd-input">
            <option value="">All</option>
            <option value="1">Promoted only</option>
            <option value="0">Not promoted</option>
          </select>
        </FilterField>
        <FilterField label="Status">
          <select value={filters.status} onChange={(event) => update("status", event.target.value)} className="fd-input">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </FilterField>
        <Btn variant="ghost" onClick={clear}>
          Clear{activeCount ? ` (${activeCount})` : ""}
        </Btn>
      </div>
    </div>
  );
}

function FoodReviewFilterBar({ token, filters, onChange }) {
  const update = (key, value) => onChange((prev) => ({ ...prev, [key]: value }));
  const clear = () => onChange({ restaurant_id: "", rating: "", verified: "", status: "" });
  const activeCount = Object.values(filters).filter((value) => String(value || "").trim()).length;

  return (
    <div className="fd-card fd-rise p-4" style={{ "--d": 40 }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-[240px] flex-[1.4]">
          <ResourceSelect
            token={token}
            resource="restaurants"
            label="Restaurant"
            value={filters.restaurant_id}
            onChange={(id) => update("restaurant_id", id)}
            placeholder="Search restaurant"
            formatLabel={relationLabel}
            selectedFallback={(id) => `Restaurant #${id}`}
          />
        </div>
        <FilterField label="Rating">
          <select value={filters.rating} onChange={(event) => update("rating", event.target.value)} className="fd-input">
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star</option>)}
          </select>
        </FilterField>
        <FilterField label="Order verification">
          <select value={filters.verified} onChange={(event) => update("verified", event.target.value)} className="fd-input">
            <option value="">All reviews</option>
            <option value="1">Verified order</option>
            <option value="0">Unverified</option>
          </select>
        </FilterField>
        <FilterField label="Visibility">
          <select value={filters.status} onChange={(event) => update("status", event.target.value)} className="fd-input">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </FilterField>
        <Btn variant="ghost" onClick={clear}>Clear{activeCount ? ` (${activeCount})` : ""}</Btn>
      </div>
    </div>
  );
}

function FoodPaymentSummaryPanel({ summary, loading }) {
  const totals = summary?.totals || {};
  const owners = summary?.by_owner || [];
  const methods = summary?.by_method || [];
  const services = summary?.by_service || [];
  const settings = summary?.settings || {};
  return (
    <div className="fd-card fd-rise space-y-5 p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="fd-eyebrow">Income Reconciliation</p>
          <h3 className="mt-2 text-lg font-black text-[#111216]">Admin income, rider payout and delivery charge</h3>
        </div>
        {loading && (
          <span className="inline-flex items-center gap-2 text-xs font-bold text-[#6C717A]">
            <span className="fd-spin" />
            Refreshing...
          </span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders" value={totals.orders_count} kind="count" delay={0} />
        <StatCard label="Grand Total" value={totals.grand_total} kind="money" delay={40} />
        <StatCard label="Owner Received" value={totals.owner_received_total} kind="money" tone="dark" delay={80} />
        <StatCard label="COD Collectable" value={totals.cod_collectable_total} kind="money" delay={120} />
        <StatCard label="Delivery Charge" value={totals.delivery_fee_total} kind="money" delay={160} />
        <StatCard label="Discounts" value={totals.discount_total} kind="money" delay={200} />
        <StatCard label="Admin Discount" value={totals.admin_discount_total} kind="money" tone="soft" delay={240} />
        <StatCard label="Restaurant Discount" value={totals.restaurant_discount_total} kind="money" tone="dark" delay={280} />
        <StatCard label="Admin Income" value={totals.admin_delivery_income_total} kind="money" tone="soft" delay={320} />
        <StatCard label="Restaurant Commission" value={totals.restaurant_commission_total} kind="money" delay={360} />
        <StatCard label="Total Admin Income" value={totals.admin_total_income} kind="money" tone="red" delay={400} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Rider Payout" value={totals.rider_payout_total} kind="money" delay={0} />
        <StatCard label="Owner Payable" value={totals.restaurant_owner_payable_total} kind="money" tone="dark" delay={40} />
        <StatCard label="COD Owner Due" value={totals.owner_settlement_due_total} kind="money" delay={80} />
        <StatCard label="Delivered Orders" value={totals.delivered_orders_count} kind={totals.delivered_orders_count === undefined ? undefined : "count"} delay={120} />
        <StatCard label="Current Rider Rule" value={`Fixed ${money(settings.rider_fixed_earning)} • KM ${money(settings.rider_per_km_earning)}`} tone="dark" delay={160} />
      </div>
      {services.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((row) => (
            <div key={row.service_type} className="fd-soft p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-black capitalize text-[#111216]">{row.service_type} Delivery</h4>
                <span className="fd-badge fd-badge-line">{row.orders_count} orders</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MiniMetric label="Fee" value={money(row.delivery_fee_total)} />
                <MiniMetric label="Rider" value={money(row.rider_payout_total)} />
                <MiniMetric label="Admin" value={money(row.admin_total_income)} />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-[1fr,0.55fr]">
        <div className="fd-tablecard border border-[#ECEDF0]">
          <div className="fd-scroll">
            <table className="fd-table" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Owner / Restaurant</th>
                  <th className="text-right">Orders</th>
                  <th className="text-right">Owner Received</th>
                  <th className="text-right">COD Collectable</th>
                  <th className="text-right">Delivery Charge</th>
                  <th className="text-right">Rider Payout</th>
                  <th className="text-right">Admin Income</th>
                  <th className="text-right">Commission</th>
                  <th className="text-right">Owner Payable</th>
                  <th className="text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((row, i) => (
                  <tr key={row.restaurant_id || row.restaurant_name} className="fd-row" style={{ "--i": Math.min(i, 12) }}>
                    <td>
                      <div className="font-extrabold text-[#111216]">{row.restaurant_name}</div>
                      <div className="mt-1 text-xs text-[#9AA0A8]">Owner ID: {row.owner_user_id || "-"} · bKash: {row.bkash_number || "-"} · Nagad: {row.nagad_number || "-"}</div>
                    </td>
                    <td className="text-right">{row.orders_count}</td>
                    <td className="text-right font-extrabold text-[#111216]">{money(row.owner_received_total)}</td>
                    <td className="text-right font-bold text-[#6C717A]">{money(row.cod_collectable_total)}</td>
                    <td className="text-right">{money(row.delivery_fee_total)}</td>
                    <td className="text-right">{money(row.rider_payout_total)}</td>
                    <td className="text-right font-extrabold text-[#E10613]">{money(row.admin_total_income)}</td>
                    <td className="text-right">{money(row.restaurant_commission_total)}</td>
                    <td className="text-right font-extrabold text-[#111216]">{money(row.restaurant_owner_payable_total)}</td>
                    <td className="text-right font-extrabold">{money(row.grand_total)}</td>
                  </tr>
                ))}
                {!owners.length && (
                  <tr><td colSpan={10} className="fd-empty">No payment data found for selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl border border-[#ECEDF0] p-4">
          <h4 className="font-black text-[#111216]">Payment method breakdown</h4>
          <div className="mt-3 space-y-3">
            {methods.map((row) => (
              <div key={row.payment_method} className="fd-soft p-3">
                <div className="flex items-center justify-between gap-3">
                  <PaymentMethodBadge method={row.payment_method} />
                  <span className="text-xs font-bold text-[#6C717A]">{row.orders_count} orders</span>
                </div>
                <div className="mt-2 flex justify-between text-sm font-semibold">
                  <span>Total {money(row.grand_total)}</span>
                  <span className="text-[#E10613]">Admin {money(row.admin_total_income)}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-[#9AA0A8]">
                  <span>Delivery {money(row.delivery_fee_total)}</span>
                  <span>Commission {money(row.restaurant_commission_total)}</span>
                </div>
              </div>
            ))}
            {!methods.length && <div className="text-sm text-[#9AA0A8]">No method data.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   AI menu import
   ========================================================================== */
function AiMenuImportModal({ token, onClose, onCreated }) {
  const [restaurantId, setRestaurantId] = useState("");
  const [currentImport, setCurrentImport] = useState(null);
  const [imports, setImports] = useState([]);
  const [draftItems, setDraftItems] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);

  const selectedCount = draftItems.filter((item) => item.selected).length;
  const visibleDraftItems = draftItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (selectedOnly && !item.selected) return false;
      const term = draftSearch.trim().toLowerCase();
      if (!term) return true;
      return [item.name, item.category_name, item.description, item.notes]
        .some((value) => String(value || "").toLowerCase().includes(term));
    });

  const loadImports = async () => {
    try {
      const data = await apiRequest("/admin/food-menu-imports?limit=20", { token });
      setImports(data.data || []);
    } catch (err) {
      setError(err.message || "Unable to load menu import drafts.");
    }
  };

  useEffect(() => {
    loadImports();
  }, []);

  const loadImport = async (entry) => {
    setCurrentImport(entry);
    setRestaurantId(entry.restaurant_id ? String(entry.restaurant_id) : "");
    setDraftItems((entry.extracted_items || []).map((item) => ({ ...item, selected: Boolean(item.selected) })));
    setDraftSearch("");
    setSelectedOnly(false);
    setError("");
  };

  const updateDraft = (index, patch) => {
    setDraftItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const uploadDraftImage = async (index, file) => {
    if (!currentImport?.id || !file) return;
    setError("");
    setBusy(`image-${index}`);
    try {
      const formData = new FormData();
      formData.append("index", String(index));
      formData.append("image", file);
      const data = await apiUpload(`/admin/food-menu-imports/${currentImport.id}/upload-item-image`, { token, formData });
      const image = data.image || {};
      updateDraft(index, {
        image_url: image.image_url || "",
        image_path: image.image_path || "",
        image_name: image.image_name || file.name,
      });
      if (data.import) {
        setCurrentImport(data.import);
        setImports((prev) => prev.map((entry) => (entry.id === data.import.id ? data.import : entry)));
      }
    } catch (err) {
      setError(err.message || "Unable to upload draft item image.");
    } finally {
      setBusy("");
    }
  };

  const createItems = async () => {
    if (!currentImport?.id) return;
    if (!restaurantId) {
      setError("Select the target restaurant before approving this draft.");
      return;
    }
    if (!selectedCount) {
      setError("Select at least one draft item to create.");
      return;
    }
    setError("");
    setBusy("create");
    try {
      await apiRequest(`/admin/food-menu-imports/${currentImport.id}/create-items`, {
        method: "POST",
        token,
        body: { restaurant_id: restaurantId, items: draftItems },
      });
      await onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message || "Unable to create food items.");
    } finally {
      setBusy("");
    }
  };

  return (
    <ModalShell
      eyebrow="AI menu import"
      title="Create food items from restaurant menu card"
      subtitle="Admin review required. AI draft will not publish anything until you create selected items."
      onClose={onClose}
      maxWidth="max-w-7xl"
      footer={
        <>
          <p className="text-sm font-bold text-[#6C717A]">
            <span className="text-[#E10613]">{selectedCount}</span> selected from {draftItems.length} draft items
          </p>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={createItems} disabled={!selectedCount || Boolean(busy)}>
              {busy === "create" ? (<><span className="fd-spin" style={{ borderColor: "rgba(255,255,255,.35)", borderTopColor: "#fff" }} /> Creating</>) : "Create Selected Items"}
            </Btn>
          </div>
        </>
      }
    >
      {error && <div className="fd-error mb-4 rounded-2xl border border-[#FFC2C6] bg-[#FFF4F4] px-4 py-3 text-sm font-bold">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="fd-soft p-4">
          <h4 className="font-black text-[#111216]">Approve chat draft</h4>
          <p className="mt-2 text-sm font-medium text-[#6C717A]">
            Send menu-card image in chat. I will create an editable draft here. Then select restaurant, check rows, and approve selected items.
          </p>
          <div className="mt-4">
            <ResourceSelect
              token={token}
              resource="restaurants"
              label="Target restaurant"
              value={restaurantId}
              onChange={setRestaurantId}
              placeholder="Search restaurant name or phone"
              required
              formatLabel={relationLabel}
              selectedFallback={(id) => `Restaurant #${id}`}
            />
          </div>
          {currentImport ? (
            <div className="fd-rise mt-4 rounded-2xl border border-[#FFC2C6] bg-[#FFF4F4] p-3 text-sm">
              <div className="font-black text-[#111216]">Selected import #{currentImport.id}</div>
              <div className="mt-1 text-[#6C717A]">{(currentImport.extracted_items || []).length} draft items ready for review</div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[#D6D9DE] bg-white p-4 text-sm font-semibold text-[#9AA0A8]">
              Select a draft from the list.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#ECEDF0] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-black text-[#111216]">Draft imports</h4>
            <button type="button" className="text-xs font-black text-[#E10613] transition hover:underline" onClick={loadImports}>Refresh</button>
          </div>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {imports.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => loadImport(entry)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition duration-200 hover:-translate-y-0.5 ${
                  currentImport?.id === entry.id ? "border-[#E10613] bg-[#FFF4F4]" : "border-[#ECEDF0] bg-[#F7F7F8] hover:border-[#FFC2C6]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-[#111216]">Import #{entry.id}</span>
                  <StatusBadge value={entry.status} />
                </div>
                <div className="mt-1 truncate text-xs font-semibold text-[#6C717A]">
                  {entry.restaurant?.name || "Restaurant not selected"} · {(entry.extracted_items || []).length} items
                </div>
                {entry.notes ? <div className="mt-1 line-clamp-1 text-xs text-[#9AA0A8]">{entry.notes}</div> : null}
              </button>
            ))}
            {!imports.length && <div className="fd-soft p-3 text-sm text-[#9AA0A8]">No draft import found yet.</div>}
          </div>
        </div>
      </div>

      <section className="mt-5">
        <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-[#ECEDF0] bg-[#F7F7F8] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="text-base font-black text-[#111216]">Review menu items</h4>
            <p className="mt-1 text-xs font-semibold text-[#6C717A]">Edit every item before creating it. Changes here apply only to this draft.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="fd-search min-w-0 sm:w-64">
              {Icon.search}
              <input
                className="fd-input"
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Search item or category"
              />
            </div>
            <Btn variant="ghost" size="sm" onClick={() => setSelectedOnly((value) => !value)}>
              {selectedOnly ? "Show all" : `Selected (${selectedCount})`}
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => setDraftItems((items) => items.map((item) => ({ ...item, selected: selectedCount !== items.length })))}
            >
              {draftItems.length > 0 && selectedCount === draftItems.length ? "Deselect all" : "Select all"}
            </Btn>
          </div>
        </div>

        <div className="space-y-3">
          {visibleDraftItems.map(({ item, index }) => (
            <article
              key={`${item.name}-${index}`}
              className={`rounded-2xl border bg-white p-4 transition ${item.selected ? "border-[#E10613] shadow-[0_8px_24px_rgba(17,18,22,0.06)]" : "border-[#D6D9DE]"}`}
            >
              <div className="grid gap-4 md:grid-cols-[144px_minmax(0,1fr)]">
                <div>
                  <div className="relative overflow-hidden rounded-xl border border-[#ECEDF0] bg-[#F7F7F8]">
                    {item.image_url ? (
                      <img src={mediaUrl(item.image_url)} alt={item.name || "Draft item"} className="h-32 w-full object-cover" />
                    ) : (
                      <div className="flex h-32 items-center justify-center px-3 text-center text-xs font-bold text-[#9AA0A8]">No item image</div>
                    )}
                    <label className="absolute left-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-white/80 bg-white shadow-md">
                      <input
                        type="checkbox"
                        className="fd-cb"
                        checked={Boolean(item.selected)}
                        onChange={(event) => updateDraft(index, { selected: event.target.checked })}
                        aria-label={`Use ${item.name || `item ${index + 1}`}`}
                      />
                    </label>
                  </div>
                  <label className="fd-btn fd-btn-ghost fd-btn-sm mt-2 w-full cursor-pointer">
                    {busy === `image-${index}` ? "Uploading..." : item.image_url ? "Replace image" : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={busy === `image-${index}`}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        uploadDraftImage(index, file);
                      }}
                    />
                  </label>
                  {item.image_url ? (
                    <button type="button" className="mt-1 w-full text-xs font-bold text-[#9AA0A8] hover:text-[#E10613]" onClick={() => updateDraft(index, { image_url: "", image_path: "", image_name: "" })}>
                      Remove image
                    </button>
                  ) : null}
                </div>

                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-[#9AA0A8]">ITEM {String(index + 1).padStart(2, "0")}</span>
                    <span className="fd-badge fd-badge-soft">{Math.round(Number(item.confidence || 0) * 100)}% confidence</span>
                    <span className={`fd-badge ${item.selected ? "fd-badge-ink" : "fd-badge-gray"}`}>{item.selected ? "Selected" : "Skipped"}</span>
                    {item.duplicate_food_item_id ? <span className="fd-badge fd-badge-red">Duplicate #{item.duplicate_food_item_id}</span> : null}
                  </div>

                  <label className="fd-label block">
                    Item name
                    <input
                      className="fd-input text-base font-black text-[#111216]"
                      value={item.name || ""}
                      onChange={(event) => updateDraft(index, { name: event.target.value })}
                      placeholder="Enter item name"
                    />
                  </label>

                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)]">
                    <div>
                      <ResourceSelect
                        token={token}
                        resource="food-categories"
                        label="Existing category"
                        value={item.food_category_id || ""}
                        onChange={(id) => updateDraft(index, { food_category_id: id, category_name: item.category_name || "" })}
                        placeholder="Search category"
                        formatLabel={relationLabel}
                        selectedFallback={(id) => `Category #${id}`}
                      />
                      <label className="fd-label mt-2 block">
                        Category name
                        <input className="fd-input" value={item.category_name || ""} onChange={(event) => updateDraft(index, { category_name: event.target.value })} placeholder="Enter new category" />
                      </label>
                    </div>
                    <label className="fd-label block">
                      Regular price
                      <input className="fd-input font-black text-[#111216]" type="number" value={item.price ?? ""} onChange={(event) => updateDraft(index, { price: event.target.value })} />
                    </label>
                    <label className="fd-label block">
                      Discount price
                      <input className="fd-input font-black text-[#111216]" type="number" value={item.discount_price ?? ""} onChange={(event) => updateDraft(index, { discount_price: event.target.value })} placeholder="Optional" />
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <label className="fd-label block">
                      Size and price options
                      <textarea
                        className="fd-input"
                        style={{ minHeight: 92 }}
                        value={formatSizePrices(item.size_options)}
                        onChange={(event) => updateDraft(index, { size_options: parseSizePrices(event.target.value) })}
                        placeholder={"Regular:120\nLarge:180"}
                      />
                    </label>
                    <label className="fd-label block">
                      Description or review note
                      <textarea
                        className="fd-input"
                        style={{ minHeight: 92 }}
                        value={item.description || item.notes || ""}
                        onChange={(event) => updateDraft(index, { description: event.target.value })}
                        placeholder="Item details, ingredients, or anything requiring review"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {!draftItems.length && (
            <div className="rounded-2xl border border-dashed border-[#D6D9DE] bg-[#F7F7F8] px-5 py-14 text-center text-sm font-bold text-[#9AA0A8]">
              Select a draft import to review its menu items.
            </div>
          )}
          {draftItems.length > 0 && !visibleDraftItems.length && (
            <div className="rounded-2xl border border-dashed border-[#D6D9DE] bg-[#F7F7F8] px-5 py-10 text-center text-sm font-bold text-[#9AA0A8]">
              No draft item matches this filter.
            </div>
          )}
        </div>
      </section>
    </ModalShell>
  );
}

/* ==========================================================================
   Page
   ========================================================================== */
export default function FoodAdminPage({ token, resource }) {
  const config = RESOURCE_CONFIG[resource] || RESOURCE_CONFIG["food-items"];
  const resourceGroup = resource.startsWith("medicine") ? "Medicine Delivery" : resource.startsWith("rider") || resource === "riders" ? "Rider Management" : "Food Delivery";
  const resourceNoun = resource === "food-reviews" ? "customer reviews" : resource.startsWith("medicine") ? "medicine records" : "food records";
  const [records, setRecords] = useState([]);
  const [columns, setColumns] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => emptyForm(config));
  const [fieldErrors, setFieldErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewReview, setViewReview] = useState(null);
  const [reviewViewOpen, setReviewViewOpen] = useState(false);
  const [reviewViewLoading, setReviewViewLoading] = useState(false);
  const [riders, setRiders] = useState([]);
  const [assigningRider, setAssigningRider] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [updatingOrderItemId, setUpdatingOrderItemId] = useState(null);
  const [itemUpdateError, setItemUpdateError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [orderFilters, setOrderFilters] = useState({ payment_method: "", payment_status: "", status: "", restaurant_id: "", date_from: "", date_to: "" });
  const [foodItemFilters, setFoodItemFilters] = useState({ restaurant_id: "", food_category_id: "", is_available: "", is_popular: "", is_promoted: "", status: "" });
  const [reviewFilters, setReviewFilters] = useState({ restaurant_id: "", rating: "", verified: "", status: "" });

  const isOrderResource = resource === "food-orders" || resource === "medicine-orders";

  const orderQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    if (search.trim()) params.set("search", search.trim());
    if (isOrderResource) {
      Object.entries(orderFilters).forEach(([key, value]) => {
        if (resource === "medicine-orders" && key === "restaurant_id") return;
        if (String(value || "").trim()) params.set(key, String(value).trim());
      });
    }
    if (resource === "food-items") {
      Object.entries(foodItemFilters).forEach(([key, value]) => {
        if (String(value || "").trim()) params.set(key, String(value).trim());
      });
    }
    if (resource === "food-reviews") {
      Object.entries(reviewFilters).forEach(([key, value]) => {
        if (String(value || "").trim()) params.set(key, String(value).trim());
      });
    }
    return params.toString();
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const qs = orderQueryString();
      const data = await apiRequest(`/admin/resources/${resource}${qs ? `?${qs}` : ""}`, { token });
      setRecords(data.data || []);
      setColumns(data.columns || []);
      setMeta(data.meta || null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Unable to load food data.");
    } finally {
      setLoading(false);
    }
  };

  const loadRiders = async () => {
    try {
      const data = await apiRequest("/admin/resources/riders?per_page=100", { token });
      setRiders(data.data || []);
    } catch (err) {
      console.warn("Unable to load riders", err);
      setRiders([]);
    }
  };

  useEffect(() => {
    setForm(emptyForm(config));
    setEditingId(null);
    setModalOpen(false);
    setImageFile(null);
    setImagePreview("");
    setPage(1);
  }, [resource]);

  useEffect(() => {
    load();
  }, [resource, search, token, orderFilters, foodItemFilters, reviewFilters, page, perPage]);

  useEffect(() => {
    if (isOrderResource) loadRiders();
  }, [resource, token]);

  useEffect(() => {
    setPage(1);
  }, [search, orderFilters, foodItemFilters, reviewFilters]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if ((resource === "food-items" || resource === "food-categories") && !form.slug && form.name) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [form.name, form.slug, resource]);

  useEffect(() => {
    if (!viewOpen || !isOrderResource || !viewOrder?.id) return undefined;
    const timer = window.setInterval(async () => {
      try {
        const data = await apiRequest(`/admin/resources/${resource}/${viewOrder.id}`, { token });
        setViewOrder(data);
      } catch (err) {
        console.warn("Unable to refresh food order tracking", err);
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [resource, token, viewOpen, viewOrder?.id]);

  const visibleColumns = useMemo(() => {
    const preferred = config.columns || [];
    const picked = preferred.filter((col) => columns.includes(col) || records.some((row) => row[col] !== undefined));
    return picked.length ? picked : columns.slice(0, 7);
  }, [columns, config.columns, records]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm(config));
    setFieldErrors({});
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setMode("edit");
    setEditingId(record.id);
    setForm(normalizeRecord(record, config));
    setFieldErrors({});
    setImageFile(null);
    setImagePreview(record.image_url || "");
    setModalOpen(true);
  };

  const openViewOrder = async (record) => {
    setViewOpen(true);
    setViewOrder(null);
    setViewLoading(true);
    setAssignError("");
    setItemUpdateError("");
    setError("");
    try {
      if (!riders.length) loadRiders();
      const data = await apiRequest(`/admin/resources/${resource}/${record.id}`, { token });
      setViewOrder(data);
    } catch (err) {
      setError(err.message || "Unable to load order details.");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const openViewReview = async (record) => {
    setReviewViewOpen(true);
    setViewReview(record);
    setReviewViewLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/admin/resources/food-reviews/${record.id}`, { token });
      setViewReview(data);
    } catch (err) {
      setError(err.message || "Unable to load review details.");
      setReviewViewOpen(false);
    } finally {
      setReviewViewLoading(false);
    }
  };

  const assignRiderToOrder = async (riderId) => {
    if (!viewOrder?.id || !riderId) return;
    setAssigningRider(true);
    setAssignError("");
    try {
      const data = await apiRequest(`/admin/resources/${resource}/${viewOrder.id}/assign-rider`, {
        method: "POST",
        token,
        body: { rider_id: Number(riderId) },
      });
      setViewOrder(data.record || data);
      await load();
    } catch (err) {
      setAssignError(err.message || "Unable to assign rider.");
    } finally {
      setAssigningRider(false);
    }
  };

  const previewOrderDeliveryLocation = async (body) => {
    if (!viewOrder?.id) throw new Error("Order details are not available.");
    return apiRequest(`/admin/food-orders/${viewOrder.id}/delivery-location/preview`, {
      method: "POST",
      token,
      body,
    });
  };

  const updateOrderDeliveryLocation = async (body) => {
    if (!viewOrder?.id) throw new Error("Order details are not available.");
    const data = await apiRequest(`/admin/food-orders/${viewOrder.id}/delivery-location`, {
      method: "PUT",
      token,
      body,
    });
    setViewOrder(data.record || viewOrder);
    await load();
    return data;
  };

  const updateOrderItemQuantity = async (item, quantity) => {
    if (!viewOrder?.id || !item?.id) return;
    setUpdatingOrderItemId(item.id);
    setItemUpdateError("");
    try {
      const data = await apiRequest(`/admin/food-orders/${viewOrder.id}/items/${item.id}`, {
        method: "PUT",
        token,
        body: { quantity },
      });
      setViewOrder(data.record || viewOrder);
      await load();
    } catch (err) {
      setItemUpdateError(err.message || "Unable to update the item quantity.");
    } finally {
      setUpdatingOrderItemId(null);
    }
  };

  const uploadImage = async (id) => {
    if (!imageFile || !config.imageTarget) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("section", "food");
      formData.append("target_type", config.imageTarget);
      formData.append("target_id", String(id));
      formData.append("images[]", imageFile);
      formData.append("set_primary", "true");
      const data = await apiUpload("/media/upload", { token, formData });
      return data?.media?.[0]?.url || null;
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setError("");
    const errors = {};
    config.fields.forEach((field) => {
      if (field.required && (form[field.key] === "" || form[field.key] === null || form[field.key] === undefined)) {
        errors[field.key] = `${field.label} is required.`;
      }
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const payload = buildPayload(form, config);
      const request = {
        method: mode === "create" ? "POST" : "PUT",
        token,
        body: payload,
      };
      const path = mode === "create" ? `/admin/resources/${resource}` : `/admin/resources/${resource}/${editingId}`;
      const data = await apiRequest(path, request);
      let record = data.record;
      const uploadedUrl = await uploadImage(record.id);
      if (uploadedUrl) {
        const update = await apiRequest(`/admin/resources/${resource}/${record.id}`, {
          method: "PUT",
          token,
          body: { image_url: uploadedUrl },
        });
        record = update.record;
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (id) => {
    if (!window.confirm(`Delete this ${resourceNoun.slice(0, -1)}? This action cannot be undone.`)) return;
    await apiRequest(`/admin/resources/${resource}/${id}`, { method: "DELETE", token });
    setSelectedIds((prev) => toggleSelectedId(prev, id, false));
    await load();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected records? This action cannot be undone.`)) return;
    setBulkDeleting(true);
    setError("");
    try {
      await Promise.all(ids.map((id) => apiRequest(`/admin/resources/${resource}/${id}`, { method: "DELETE", token })));
      setSelectedIds([]);
      await load();
    } catch (err) {
      setError(err.message || "Bulk delete failed.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const renderField = (field) => {
    const common = {
      value: form[field.key] ?? "",
      onChange: (e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value })),
      placeholder: field.placeholder || "",
    };
    const relation = relationForField(resource, field);
    if (field.key === "user_id" || field.key === "owner_user_id") {
      return (
        <UserSelect
          token={token}
          label={field.label}
          value={form[field.key] ?? ""}
          onChange={(userId) => setForm((prev) => ({ ...prev, [field.key]: userId }))}
          required={Boolean(field.required)}
          error={fieldErrors[field.key]}
        />
      );
    }
    if (relation) {
      return (
        <ResourceSelect
          token={token}
          resource={relation.resource}
          label={field.label.replace(/\s*ID$/i, "")}
          value={form[field.key] ?? ""}
          onChange={(id) => setForm((prev) => ({ ...prev, [field.key]: id }))}
          placeholder={relation.placeholder}
          required={Boolean(field.required)}
          error={fieldErrors[field.key]}
          formatLabel={relationLabel}
          selectedFallback={relation.selectedFallback}
        />
      );
    }
    if (field.type === "checkbox") {
      const on = Boolean(form[field.key]);
      return (
        <label className={`fd-switch-row ${on ? "is-on" : ""}`}>
          <span>{field.label}</span>
          <span className="fd-switch">
            <input type="checkbox" checked={on} onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.checked }))} />
            <span className="fd-switch-track"><span className="fd-switch-knob" /></span>
          </span>
        </label>
      );
    }
    if (field.type === "textarea" || field.type === "addons" || field.type === "size_prices") {
      return (
        <label className="fd-label">
          {field.label}
          {field.required && <em>*</em>}
          <textarea className={`fd-input ${fieldErrors[field.key] ? "is-error" : ""}`} {...common} />
        </label>
      );
    }
    if (field.type === "select") {
      return (
        <label className="fd-label">
          {field.label}
          <select className="fd-input" {...common}>
            {field.options.map((option) => (
              <option key={option} value={option}>{option.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
      );
    }
    return <TextField label={field.label} required={field.required} type={field.type || "text"} {...common} />;
  };

  const renderValue = (record, col) => {
    const value = record[col];
    if (col === "receiver_phone") {
      const phone = String(value || "").trim();
      const dialNumber = phone.replace(/[^+\d]/g, "");
      return phone ? (
        <a
          href={`tel:${dialNumber}`}
          className="inline-flex items-center gap-2 whitespace-nowrap font-black text-[#111216] transition hover:text-[#E10613] hover:underline"
          aria-label={`Call ${phone}`}
          title={`Call ${phone}`}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#111216] text-xs text-white" aria-hidden="true">☎</span>
          {phone}
        </a>
      ) : <span className="text-[#C4C8CE]">—</span>;
    }
    if (col === "customer_name") {
      return (
        <span className="font-bold text-[#111216]">
          {value || record.user?.name || `Customer #${record.user_id}`}
          <small className="mt-0.5 block font-semibold text-[#8A9099]">{record.customer_phone || record.user?.phone || record.user?.email || "No contact"}</small>
        </span>
      );
    }
    if (col === "restaurant_name") return <span className="font-bold text-[#111216]">{value || record.restaurant?.name || "Not specified"}</span>;
    if (col === "food_item_name") return <span className="font-semibold text-[#3D4148]">{value || record.food_item?.name || "Overall restaurant"}</span>;
    if (col === "order_no") return <span className="font-black text-[#111216]">{value || record.food_order?.order_no || `#${record.food_order_id || "-"}`}</span>;
    if (col === "rating") {
      const score = Math.max(0, Math.min(5, Number(value || 0)));
      return <span className="whitespace-nowrap font-black text-[#111216]"><span className="text-[#E10613]">{"★".repeat(score)}</span><span className="text-[#D5D8DD]">{"★".repeat(5 - score)}</span> {score}/5</span>;
    }
    if (col === "comment") return <span className="block min-w-[220px] max-w-[360px] whitespace-normal font-medium leading-5 text-[#4B5058]">{value || "No written comment"}</span>;
    if (col === "image_url") {
      return value ? <img src={mediaUrl(value)} alt="" className="fd-thumb" /> : <span className="text-xs font-semibold text-[#9AA0A8]">No image</span>;
    }
    if (col === "restaurant_id") {
      const name = record.restaurant?.name || record.restaurant_name;
      return (
        <span className="font-bold text-[#111216]">
          {value || "-"}{name ? ` (${name})` : ""}
        </span>
      );
    }
    if (col === "payment_proof_photo_url") {
      return value ? (
        <a href={value} target="_blank" rel="noreferrer" className="fd-badge fd-badge-soft transition hover:bg-[#E10613] hover:text-white">
          <img src={value} alt="" className="h-6 w-8 rounded object-cover" />
          Proof
        </a>
      ) : <span className="text-xs font-semibold text-[#9AA0A8]">No proof</span>;
    }
    if (value === null || value === undefined || value === "") return <span className="text-[#C4C8CE]">—</span>;
    if (col === "restaurant") {
      return <span className="font-bold text-[#111216]">{value?.name || record.restaurant_id || "-"}</span>;
    }
    if (col === "payment_method") return <PaymentMethodBadge method={value} />;
    if (col === "payment_status") return <PaymentStatusBadge status={value} />;
    if (col === "rider_assignment_label") {
      const text = String(value).toLowerCase();
      const cls = text.includes("accepted") ? "fd-badge-ink" : text.includes("waiting") ? "fd-badge-soft" : "fd-badge-gray";
      return <span className={`fd-badge ${cls}`}>{value}</span>;
    }
    if (col === "route_distance_km") return `${value} KM`;
    if (col === "delivery_map_url") {
      return <a href={value} target="_blank" rel="noreferrer" className="font-bold text-[#E10613] hover:underline">View map</a>;
    }
    if (col === "status" || col.endsWith("_status") || col.endsWith("_status_bn")) {
      const rawKey = col.replace(/_bn$/, "");
      return <StatusBadge value={value} tone={statusTone(record[rawKey] ?? value)} />;
    }
    if (dateFields.has(col) || col.endsWith("_at")) return <span className="whitespace-nowrap">{formatDateTime(value)}</span>;
    if (typeof value === "boolean") {
      return <span className={`fd-badge ${value ? "fd-badge-ink" : "fd-badge-gray"}`}><span className="fd-dot" />{value ? "Yes" : "No"}</span>;
    }
    if (col === "id") return <span className="font-black text-[#111216]">#{value}</span>;
    if (typeof value === "object") return JSON.stringify(value).slice(0, 80);
    return String(value).length > 80 ? `${String(value).slice(0, 80)}...` : String(value);
  };

  const selectionState = visibleSelectionState(records, selectedIds);
  const totalCount = meta?.total ?? records.length;

  return (
    <div className="fd space-y-5">
      <style>{fdCss}</style>

      {/* Header */}
      <section className="fd-card fd-hero fd-rise">
        <div className="fd-orbit" aria-hidden="true">
          <i /><i /><i />
          <div className="fd-orbit-spin"><b /></div>
        </div>
        <div className="relative flex flex-col gap-5 p-6 pl-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="fd-eyebrow">{resourceGroup}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-black leading-none tracking-tight text-[#111216]">{config.title}</h1>
              <span className="fd-count">
                <span className={`fd-dot ${loading ? "fd-blink" : ""}`} />
                {totalCount} records
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#6C717A]">{config.description}</p>
          </div>
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="fd-search w-full sm:w-72">
              {Icon.search}
              <input
                placeholder={`Search ${resourceNoun}`}
                className="fd-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {resource !== "food-reviews" && <Btn onClick={openCreate}>{Icon.plus} Create New</Btn>}
            {resource === "food-items" && (
              <Btn variant="ghost" onClick={() => setAiImportOpen(true)}>{Icon.spark} AI Menu Import</Btn>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="fd-rise flex items-start gap-3 rounded-2xl border border-[#FFC2C6] bg-[#FFF4F4] px-4 py-3 text-sm font-bold text-[#C40411]">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#E10613] text-xs text-white">!</span>
          {error}
        </div>
      )}

      {isOrderResource && (
        <FoodOrderFilterBar token={token} filters={orderFilters} onChange={setOrderFilters} hideRestaurant={resource === "medicine-orders"} />
      )}

      {resource === "food-items" && (
        <FoodItemFilterBar token={token} filters={foodItemFilters} onChange={setFoodItemFilters} />
      )}

      {resource === "food-reviews" && (
        <FoodReviewFilterBar token={token} filters={reviewFilters} onChange={setReviewFilters} />
      )}

      <div className="fd-rise" style={{ "--d": 40 }}>
        <BulkDeleteBar selectedCount={selectedIds.length} deleting={bulkDeleting} onClear={() => setSelectedIds([])} onDelete={bulkDelete} />
      </div>

      {/* Table */}
      <div className="fd-card fd-tablecard fd-rise" style={{ "--d": 80 }}>
        {loading && <div className="fd-loadbar" />}
        <div className="fd-scroll">
          <table className="fd-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="fd-cb"
                    checked={selectionState.allVisibleSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = selectionState.someVisibleSelected;
                    }}
                    onChange={(e) => setSelectedIds((prev) => toggleVisibleIds(prev, records, e.target.checked))}
                    aria-label="Select all visible records"
                  />
                </th>
                {visibleColumns.map((col) => (
                  <th key={col}>{col.replace(/_/g, " ")}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, i) => (
                <tr key={record.id} className={`fd-row ${selectedIds.includes(record.id) ? "is-selected" : ""}`} style={{ "--i": Math.min(i, 12) }}>
                  <td>
                    <input
                      type="checkbox"
                      className="fd-cb"
                      checked={selectedIds.includes(record.id)}
                      onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, record.id, e.target.checked))}
                      aria-label={`Select record ${record.id}`}
                    />
                  </td>
                  {visibleColumns.map((col) => (
                    <td key={`${record.id}-${col}`}>{renderValue(record, col)}</td>
                  ))}
                  <td>
                    <div className="flex justify-end gap-2">
                      {isOrderResource && (
                        <Btn variant="ghost" size="sm" onClick={() => openViewOrder(record)}>{Icon.eye} View</Btn>
                      )}
                      {resource === "food-reviews" && (
                        <Btn variant="ghost" size="sm" onClick={() => openViewReview(record)}>{Icon.eye} View</Btn>
                      )}
                      <Btn variant="ghost" size="sm" onClick={() => openEdit(record)}>{Icon.edit} Edit</Btn>
                      <Btn variant="danger" size="sm" onClick={() => deleteRow(record.id)}>{Icon.trash} Delete</Btn>
                    </div>
                  </td>
                </tr>
              ))}

              {!records.length && loading &&
                Array.from({ length: 6 }).map((_, row) => (
                  <tr key={`skel-${row}`}>
                    <td><span className="fd-skel" style={{ width: 16 }} /></td>
                    {visibleColumns.map((col, c) => (
                      <td key={col}><span className="fd-skel" style={{ width: `${55 + ((row + c) % 4) * 12}%`, animationDelay: `${row * 90}ms` }} /></td>
                    ))}
                    <td><span className="fd-skel ml-auto" style={{ width: 120 }} /></td>
                  </tr>
                ))}

              {!records.length && !loading && (
                <tr>
                  <td colSpan={visibleColumns.length + 2}>
                    <div className="fd-empty">
                      <div className="fd-empty-icon fd-float">{Icon.box}</div>
                      <div className="text-base font-black text-[#111216]">No {resourceNoun} found</div>
                      <div className="mt-1 text-sm font-medium">Try a different search or create a new record.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        meta={meta}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(value) => {
          setPerPage(value);
          setPage(1);
        }}
      />

      {/* Create / Edit */}
      {modalOpen && (
        <ModalShell
          eyebrow={mode === "create" ? "New record" : "Edit record"}
          title={mode === "create" ? `Create ${config.title}` : `Edit ${config.title}`}
          subtitle="Manual form. No JSON editing required."
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <span className="text-xs font-semibold text-[#9AA0A8]">
                <span className="text-[#E10613]">*</span> required fields
              </span>
              <div className="flex gap-2">
                <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Btn>
                <Btn onClick={save} disabled={uploading || saving}>
                  {uploading || saving ? (
                    <>
                      <span className="fd-spin" style={{ borderColor: "rgba(255,255,255,.35)", borderTopColor: "#fff" }} />
                      {uploading ? "Uploading" : "Saving"}
                    </>
                  ) : "Save Record"}
                </Btn>
              </div>
            </>
          }
        >
          {config.imageTarget && (
            <div className="fd-soft mb-5 p-4">
              <p className="text-sm font-black text-[#111216]">Image Upload</p>
              <p className="mt-1 text-xs font-medium text-[#6C717A]">Upload a real image for this record. It will be saved after the record is created/updated.</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="w-full sm:w-48">
                  <ImageUploadPreview
                    file={imageFile}
                    url={imageFile ? "" : imagePreview}
                    heightClass="h-32"
                    hint="No image selected"
                    onClear={() => {
                      setImageFile(null);
                      setImagePreview(mode === "edit" ? form.image_url || "" : "");
                    }}
                  />
                </div>
                <label className="fd-btn fd-btn-ghost cursor-pointer">
                  Choose image
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
                {imageFile && <span className="max-w-[220px] truncate text-xs font-bold text-[#6C717A]">{imageFile.name}</span>}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {config.fields.map((field, i) => (
              <div
                key={field.key}
                className={`fd-rise ${field.type === "textarea" || field.type === "addons" || field.type === "size_prices" ? "md:col-span-2" : ""}`}
                style={{ "--d": Math.min(i, 14) * 25 }}
              >
                {renderField(field)}
                {field.type === "addons" && <p className="fd-hint">One add-on per line, format: Extra Sauce:20</p>}
                {field.type === "size_prices" && <p className="fd-hint">One size per line, format: Regular:120. Keep empty if this item has no size option.</p>}
                {field.type === "tags" && <p className="fd-hint">Separate values with comma.</p>}
                {["textarea", "addons", "size_prices", "select", "checkbox"].includes(field.type) && fieldErrors[field.key] && (
                  <p className="fd-error">{fieldErrors[field.key]}</p>
                )}
              </div>
            ))}
          </div>
        </ModalShell>
      )}

      {aiImportOpen && (
        <AiMenuImportModal token={token} onClose={() => setAiImportOpen(false)} onCreated={load} />
      )}

      {viewOpen && (
        <FoodOrderViewModal
          loading={viewLoading}
          order={viewOrder}
          riders={riders}
          assigning={assigningRider}
          assignError={assignError}
          updatingItemId={updatingOrderItemId}
          itemUpdateError={itemUpdateError}
          onAssignRider={assignRiderToOrder}
          onUpdateItemQuantity={updateOrderItemQuantity}
          onPreviewDeliveryLocation={previewOrderDeliveryLocation}
          onUpdateDeliveryLocation={updateOrderDeliveryLocation}
          onClose={() => {
            setViewOpen(false);
            setViewOrder(null);
            setAssignError("");
            setItemUpdateError("");
          }}
        />
      )}

      {reviewViewOpen && (
        <FoodReviewViewModal
          loading={reviewViewLoading}
          review={viewReview}
          onClose={() => {
            setReviewViewOpen(false);
            setViewReview(null);
          }}
          onEdit={(review) => {
            setReviewViewOpen(false);
            setViewReview(null);
            openEdit(review);
          }}
        />
      )}
    </div>
  );
}
