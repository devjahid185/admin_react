import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest, apiUpload } from "../../lib/api.js";

const defaultForm = {
  is_enabled: true,
  charge_mode: "fixed",
  municipality_rule_enabled: true,
  municipality_fixed_charge: 50,
  rider_fixed_earning: 50,
  municipality_extra_per_km_charge: 15,
  municipality_long_distance_enabled: false,
  municipality_long_distance_threshold_km: 8,
  municipality_long_distance_per_km_charge: 15,
  rider_per_km_earning: 15,
  municipality_center_lat: 22.686,
  municipality_center_lng: 90.644,
  municipality_radius_km: 1.66,
  municipality_polygon: [
    { lat: 22.7044, lng: 90.6179 },
    { lat: 22.7049, lng: 90.6227 },
    { lat: 22.6996, lng: 90.6274 },
    { lat: 22.7016, lng: 90.6373 },
    { lat: 22.6993, lng: 90.6448 },
    { lat: 22.699, lng: 90.6511 },
    { lat: 22.7031, lng: 90.6525 },
    { lat: 22.705, lng: 90.6558 },
    { lat: 22.6987, lng: 90.6579 },
    { lat: 22.6961, lng: 90.6644 },
    { lat: 22.6901, lng: 90.6617 },
    { lat: 22.6835, lng: 90.6591 },
    { lat: 22.6755, lng: 90.6642 },
    { lat: 22.6603, lng: 90.6665 },
    { lat: 22.6487, lng: 90.6677 },
    { lat: 22.6449, lng: 90.6639 },
    { lat: 22.6465, lng: 90.6571 },
    { lat: 22.6552, lng: 90.6534 },
    { lat: 22.6645, lng: 90.65 },
    { lat: 22.6739, lng: 90.646 },
    { lat: 22.6746, lng: 90.6389 },
    { lat: 22.6791, lng: 90.6365 },
    { lat: 22.6812, lng: 90.6291 },
    { lat: 22.6852, lng: 90.625 },
    { lat: 22.688, lng: 90.6172 },
  ],
  fixed_charge: 40,
  base_charge: 0,
  per_km_charge: 15,
  minimum_charge: 30,
  free_delivery_min_order: "",
  max_delivery_distance_km: "",
  store_lat: "",
  store_lng: "",
  checkout_image_notice_enabled: true,
  checkout_image_notice_text:
    "খাবারের ছবিগুলো অনেক ক্ষেত্রে AI/ইলাস্ট্রেশন হিসেবে ব্যবহার করা হয়েছে। রেস্টুরেন্টের প্রস্তুত খাবার ছবির সাথে সামান্য ভিন্ন হতে পারে। অর্ডার নিশ্চিত করলে আপনি বিষয়টি বুঝে সম্মত হচ্ছেন।",
  messenger_enabled: false,
  messenger_url: "",
  user_manual_video_enabled: false,
  user_manual_video_url: "",
  user_manual_video_title: "কীভাবে খাবার অর্ডার করবেন",
  user_manual_video_description:
    "ভোলাবাসী অ্যাপে খুব সহজে খাবার অর্ডার করার পুরো নিয়ম এই ভিডিওতে দেখুন।",
  note: "",
};

const numericFields = [
  "fixed_charge",
  "municipality_fixed_charge",
  "rider_fixed_earning",
  "municipality_extra_per_km_charge",
  "municipality_long_distance_threshold_km",
  "municipality_long_distance_per_km_charge",
  "rider_per_km_earning",
  "municipality_center_lat",
  "municipality_center_lng",
  "municipality_radius_km",
  "base_charge",
  "per_km_charge",
  "minimum_charge",
  "free_delivery_min_order",
  "max_delivery_distance_km",
  "store_lat",
  "store_lng",
];

const pageCss = `
@keyframes fdRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fdFade{from{opacity:0}to{opacity:1}}
@keyframes fdDraw{to{stroke-dashoffset:0}}
@keyframes fdRing{0%{box-shadow:0 0 0 0 rgba(238,0,18,.4)}100%{box-shadow:0 0 0 8px rgba(238,0,18,0)}}
.fd-rise{opacity:0;animation:fdRise .55s cubic-bezier(.2,.8,.2,1) var(--d,0ms) forwards}
.fd-fade{animation:fdFade .3s ease both}
.fd-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:fdDraw 1.4s ease-out .1s forwards}
.fd-ring{animation:fdRing 1.8s ease-out infinite}
@media (prefers-reduced-motion:reduce){.fd-rise,.fd-fade,.fd-draw,.fd-ring{animation:none!important;opacity:1!important;stroke-dashoffset:0!important}}
`;

function Toggle({ checked, onChange }) {
  return (
    <span className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-[#ee0012]" : "bg-[#e5e7eb]"}`}>
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${checked ? "left-6" : "left-1"}`} />
    </span>
  );
}

function FieldGroup({ label, children, hint, span }) {
  return (
    <label className={`block text-xs font-bold uppercase tracking-wide text-[#6b7280] ${span ? `md:col-span-${span}` : ""}`}>
      {label}
      <div className="mt-1.5 normal-case tracking-normal">{children}</div>
      {hint && <span className="mt-1.5 block text-[11px] font-medium normal-case tracking-normal text-[#9ca3af]">{hint}</span>}
    </label>
  );
}

function PolygonMap({ polygon, center, radiusKm }) {
  const pts = Array.isArray(polygon) ? polygon.filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number") : [];
  const W = 280, H = 220, pad = 16;

  if (!pts.length) {
    return (
      <div className="grid h-56 place-items-center rounded-2xl border border-dashed border-[#d1d5db] bg-[#fafafa] text-xs font-semibold text-[#9ca3af]">
        No valid polygon points to preview.
      </div>
    );
  }

  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 0.01;
  const spanLng = maxLng - minLng || 0.01;

  const x = (lng) => pad + ((lng - minLng) / spanLng) * (W - pad * 2);
  const y = (lat) => H - pad - ((lat - minLat) / spanLat) * (H - pad * 2);

  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p.lng).toFixed(1)},${y(p.lat).toFixed(1)}`).join(" ") + " Z";
  const showCenter = typeof center?.lat === "number" && typeof center?.lng === "number";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full rounded-2xl border border-[#ececec] bg-[#fafafa]">
      <defs>
        <pattern id="fd-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#eee" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#fd-grid)" />
      <path d={path} fill="#ee0012" fillOpacity="0.08" stroke="#ee0012" strokeWidth="2" strokeLinejoin="round" className="fd-draw" pathLength="1" />
      {pts.map((p, i) => (
        <circle key={i} cx={x(p.lng)} cy={y(p.lat)} r="2.5" fill="#111" />
      ))}
      {showCenter && (
        <>
          <circle cx={x(center.lng)} cy={y(center.lat)} r="5" fill="#ee0012" />
          <circle cx={x(center.lng)} cy={y(center.lat)} r="9" fill="none" stroke="#ee0012" strokeWidth="1.5" strokeDasharray="3 2" />
        </>
      )}
      <text x={pad} y={H - 5} fontSize="9" fill="#9ca3af">{pts.length} points{radiusKm ? ` / radius ${radiusKm}km` : ""}</text>
    </svg>
  );
}

export default function FoodDeliverySettingsPage({ token, onUnauthorized }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [polygonText, setPolygonText] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/food-delivery-settings", { token });
      const next = { ...defaultForm, ...(data.settings || {}) };
      setForm(next);
      setPolygonText(JSON.stringify(next.municipality_polygon || [], null, 2));
    } catch (err) {
      const msg = err.message || "Unable to load delivery settings.";
      setError(msg);
      if (/unauthorized|forbidden/i.test(msg)) onUnauthorized?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const uploadManualVideo = async () => {
    if (!videoFile || videoUploading) return;
    if (videoFile.size > 100 * 1024 * 1024) {
      setError("Video file 100 MB-এর মধ্যে হতে হবে।");
      return;
    }
    setVideoUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("title", form.user_manual_video_title || "");
      formData.append("description", form.user_manual_video_description || "");
      const data = await apiUpload("/admin/food-delivery-settings/user-manual-video", { token, formData });
      setForm((prev) => ({ ...prev, ...(data.settings || {}) }));
      setVideoFile(null);
    } catch (err) {
      setError(err.message || "Video upload করা যায়নি।");
    } finally {
      setVideoUploading(false);
    }
  };

  const removeManualVideo = async () => {
    if (!form.user_manual_video_url || !window.confirm("Uploaded user manual video remove করবেন?")) return;
    setVideoUploading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/food-delivery-settings/user-manual-video", {
        method: "DELETE",
        token,
      });
      setForm((prev) => ({ ...prev, ...(data.settings || {}) }));
      setVideoFile(null);
    } catch (err) {
      setError(err.message || "Video remove করা যায়নি।");
    } finally {
      setVideoUploading(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      numericFields.forEach((key) => {
        payload[key] = payload[key] === "" || payload[key] === null ? null : Number(payload[key]);
      });
      try {
        payload.municipality_polygon = polygonText.trim() ? JSON.parse(polygonText) : [];
      } catch {
        throw new Error("Municipality polygon must be valid JSON.");
      }
      const data = await apiRequest("/admin/food-delivery-settings", {
        method: "PUT",
        token,
        body: payload,
      });
      const next = { ...defaultForm, ...(data.settings || {}) };
      setForm(next);
      setPolygonText(JSON.stringify(next.municipality_polygon || [], null, 2));
    } catch (err) {
      setError(err.message || "Unable to save delivery settings.");
    } finally {
      setSaving(false);
    }
  };

  const previewPolygon = useMemo(() => {
    try {
      return polygonText.trim() ? JSON.parse(polygonText) : [];
    } catch {
      return [];
    }
  }, [polygonText]);

  const polygonValid = polygonText.trim() ? previewPolygon.length > 0 || polygonText.trim() === "[]" : true;

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[#ececec] bg-[#fafafa] p-6 text-sm font-semibold text-[#6b7280]">
        <span className="fd-ring h-2.5 w-2.5 rounded-full bg-[#ee0012]" />
        Loading delivery settings...
      </div>
    );
  }

  const ruleTitle = form.municipality_rule_enabled
    ? "Bhola Sadar Pourashava rule"
    : form.charge_mode === "fixed"
    ? "Fixed delivery fee"
    : "Distance based fee";

  const ruleText = form.municipality_rule_enabled
    ? `Inside pourashava BDT ${form.municipality_fixed_charge || 0}; outside extra BDT ${form.municipality_extra_per_km_charge || 0}/KM. ${
        form.municipality_long_distance_enabled
          ? `If outside distance is above ${form.municipality_long_distance_threshold_km || 0} KM, total route distance uses BDT ${form.municipality_long_distance_per_km_charge || 0}/KM.`
          : "Long distance slab is off."
      } Rider gets fixed BDT ${form.rider_fixed_earning || 0} and BDT ${form.rider_per_km_earning || 0}/KM where applicable.`
    : form.charge_mode === "fixed"
    ? `Every delivery order gets BDT ${form.fixed_charge || 0}; rider gets BDT ${form.rider_fixed_earning || 0}.`
    : `Fee = base ${form.base_charge || 0} + distance x ${form.per_km_charge || 0}; rider gets fixed BDT ${form.rider_fixed_earning || 0} + BDT ${form.rider_per_km_earning || 0}/KM.`;

  const inputCls =
    "w-full rounded-xl border border-[#ececec] bg-white px-3.5 py-2.5 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10";

  return (
    <div className="space-y-5">
      <style>{pageCss}</style>
      {error && (
        <div className="fd-rise rounded-2xl border border-[#ee0012]/20 bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]">{error}</div>
      )}

      <section className="fd-rise overflow-hidden rounded-[26px] border border-[#ececec] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.06)]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#ee0012]">Food Delivery</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#111] sm:text-3xl">Delivery Charge Rules</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-[#6b7280]">Control how the delivery fee and rider earning are calculated at checkout.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#ececec] bg-[#fafafa] px-4 py-3">
            <span className="text-sm font-bold text-[#111]">{form.is_enabled ? "Enabled" : "Disabled"}</span>
            <Toggle checked={form.is_enabled} onChange={(v) => updateField("is_enabled", v)} />
          </div>
        </div>
      </section>

      <form onSubmit={save} className="grid gap-5 xl:grid-cols-[1.35fr,0.9fr]">
        <div className="space-y-5">
          <section className="fd-rise rounded-[26px] border border-[#ececec] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6" style={{ "--d": "60ms" }}>
            <h2 className="text-sm font-black uppercase tracking-wide text-[#111]">Charge mode</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FieldGroup label="Charge mode">
                <select className={inputCls} value={form.charge_mode} onChange={(e) => updateField("charge_mode", e.target.value)}>
                  <option value="fixed">Fixed rate</option>
                  <option value="per_km">Per kilometer</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Fixed charge">
                <input className={inputCls} type="number" value={form.fixed_charge ?? ""} onChange={(e) => updateField("fixed_charge", e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Base charge">
                <input className={inputCls} type="number" value={form.base_charge ?? ""} onChange={(e) => updateField("base_charge", e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Per KM charge">
                <input className={inputCls} type="number" value={form.per_km_charge ?? ""} onChange={(e) => updateField("per_km_charge", e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Minimum charge">
                <input className={inputCls} type="number" value={form.minimum_charge ?? ""} onChange={(e) => updateField("minimum_charge", e.target.value)} />
              </FieldGroup>
              {!form.municipality_rule_enabled && (
                <>
                  <FieldGroup label="Rider fixed earning">
                    <input className={inputCls} type="number" value={form.rider_fixed_earning ?? ""} onChange={(e) => updateField("rider_fixed_earning", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Rider per KM earning">
                    <input className={inputCls} type="number" value={form.rider_per_km_earning ?? ""} onChange={(e) => updateField("rider_per_km_earning", e.target.value)} />
                  </FieldGroup>
                </>
              )}
              <FieldGroup label="Free delivery minimum order" hint="Optional">
                <input className={inputCls} type="number" value={form.free_delivery_min_order ?? ""} onChange={(e) => updateField("free_delivery_min_order", e.target.value)} placeholder="Optional" />
              </FieldGroup>
              <FieldGroup label="Max delivery distance (KM)" hint="Optional">
                <input className={inputCls} type="number" value={form.max_delivery_distance_km ?? ""} onChange={(e) => updateField("max_delivery_distance_km", e.target.value)} placeholder="Optional" />
              </FieldGroup>
              <FieldGroup label="Fallback store latitude" hint="Optional">
                <input className={inputCls} type="number" value={form.store_lat ?? ""} onChange={(e) => updateField("store_lat", e.target.value)} placeholder="Optional" />
              </FieldGroup>
              <FieldGroup label="Fallback store longitude" hint="Optional">
                <input className={inputCls} type="number" value={form.store_lng ?? ""} onChange={(e) => updateField("store_lng", e.target.value)} placeholder="Optional" />
              </FieldGroup>
              <FieldGroup label="Internal note" span={2}>
                <textarea
                  className={`${inputCls} min-h-24`}
                  value={form.note || ""}
                  onChange={(e) => updateField("note", e.target.value)}
                  placeholder="Example: Fixed rate for Bhola Sadar, per-KM outside city."
                />
              </FieldGroup>
            </div>
          </section>

          <section className="fd-rise rounded-[26px] border border-[#ececec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ "--d": "120ms" }}>
            <div className="flex flex-col gap-3 border-b border-[#ececec] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-[#111]">Bhola Sadar Pourashava rule</h2>
                <p className="mt-1 text-xs font-semibold text-[#6b7280]">Inside fixed, outside fixed + extra per KM.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#111]">{form.municipality_rule_enabled ? "On" : "Off"}</span>
                <Toggle checked={form.municipality_rule_enabled} onChange={(v) => updateField("municipality_rule_enabled", v)} />
              </div>
            </div>

            {form.municipality_rule_enabled && (
              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr,280px]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup label="Pourashava fixed charge">
                    <input className={inputCls} type="number" value={form.municipality_fixed_charge ?? ""} onChange={(e) => updateField("municipality_fixed_charge", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Rider gets from fixed">
                    <input className={inputCls} type="number" value={form.rider_fixed_earning ?? ""} onChange={(e) => updateField("rider_fixed_earning", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Outside extra per KM">
                    <input className={inputCls} type="number" value={form.municipality_extra_per_km_charge ?? ""} onChange={(e) => updateField("municipality_extra_per_km_charge", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Rider gets per KM">
                    <input className={inputCls} type="number" value={form.rider_per_km_earning ?? ""} onChange={(e) => updateField("rider_per_km_earning", e.target.value)} />
                  </FieldGroup>
                  <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 sm:col-span-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wide text-[#111]">Outside long distance slab</div>
                        <p className="mt-1 text-xs font-semibold leading-5 text-[#6b7280]">
                          Outside distance threshold cross korle fixed + outside extra bad diye total route distance x long distance rate hobe.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#111]">{form.municipality_long_distance_enabled ? "On" : "Off"}</span>
                        <Toggle checked={form.municipality_long_distance_enabled} onChange={(v) => updateField("municipality_long_distance_enabled", v)} />
                      </div>
                    </div>
                    {form.municipality_long_distance_enabled && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <FieldGroup label="Long distance starts after (KM)">
                          <input className={inputCls} type="number" value={form.municipality_long_distance_threshold_km ?? ""} onChange={(e) => updateField("municipality_long_distance_threshold_km", e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="Long distance rate per KM">
                          <input className={inputCls} type="number" value={form.municipality_long_distance_per_km_charge ?? ""} onChange={(e) => updateField("municipality_long_distance_per_km_charge", e.target.value)} />
                        </FieldGroup>
                      </div>
                    )}
                  </div>
                  <FieldGroup label="Boundary radius (KM)" hint="Optional">
                    <input className={inputCls} type="number" value={form.municipality_radius_km ?? ""} onChange={(e) => updateField("municipality_radius_km", e.target.value)} placeholder="Optional" />
                  </FieldGroup>
                  <FieldGroup label="Boundary center latitude" hint="Optional">
                    <input className={inputCls} type="number" value={form.municipality_center_lat ?? ""} onChange={(e) => updateField("municipality_center_lat", e.target.value)} placeholder="Optional" />
                  </FieldGroup>
                  <FieldGroup label="Boundary center longitude" hint="Optional" span={2}>
                    <input className={inputCls} type="number" value={form.municipality_center_lng ?? ""} onChange={(e) => updateField("municipality_center_lng", e.target.value)} placeholder="Optional" />
                  </FieldGroup>
                  <FieldGroup
                    label="Pourashava polygon JSON"
                    span={2}
                    hint="Polygon দিলে সেটাই boundary হবে। Polygon খালি থাকলে center + radius দিয়ে হিসাব হবে।"
                  >
                    <textarea
                      className={`${inputCls} min-h-28 font-mono text-xs ${polygonValid ? "" : "border-[#ee0012]/60"}`}
                      value={polygonText}
                      onChange={(e) => setPolygonText(e.target.value)}
                      placeholder='[{"lat":22.69,"lng":90.64},{"lat":22.68,"lng":90.66},{"lat":22.66,"lng":90.64}]'
                    />
                  </FieldGroup>
                </div>
                <div className="fd-fade">
                  <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-[#6b7280]">Boundary preview</p>
                  <PolygonMap
                    polygon={previewPolygon}
                    center={{ lat: Number(form.municipality_center_lat), lng: Number(form.municipality_center_lng) }}
                    radiusKm={form.municipality_radius_km}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="fd-rise rounded-[26px] border border-[#ececec] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6" style={{ "--d": "140ms" }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-[#111]">Checkout image notice</h2>
                <p className="mt-1 text-xs font-semibold text-[#6b7280]">
                  Customer order confirm করার আগে AI/illustration image notice দেখাবে।
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#ececec] bg-[#fafafa] px-4 py-3">
                <span className="text-sm font-bold text-[#111]">{form.checkout_image_notice_enabled ? "On" : "Off"}</span>
                <Toggle checked={form.checkout_image_notice_enabled} onChange={(v) => updateField("checkout_image_notice_enabled", v)} />
              </div>
            </div>
            <div className="mt-4">
              <FieldGroup label="Notice text">
                <textarea
                  className={`${inputCls} min-h-24`}
                  value={form.checkout_image_notice_text || ""}
                  onChange={(e) => updateField("checkout_image_notice_text", e.target.value)}
                  placeholder="Checkout image notice text"
                />
              </FieldGroup>
            </div>
          </section>

          <section className="fd-rise rounded-[26px] border border-[#ececec] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6" style={{ "--d": "150ms" }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-[#111]">Food ordering video guide</h2>
                <p className="mt-1 text-xs font-semibold text-[#6b7280]">
                  App-এর Food Home page-এ “অর্ডার গাইড” FAB থেকে এই ভিডিওটি খুলবে।
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#ececec] bg-[#fafafa] px-4 py-3">
                <span className="text-sm font-bold text-[#111]">{form.user_manual_video_enabled ? "On" : "Off"}</span>
                <Toggle checked={form.user_manual_video_enabled} onChange={(v) => updateField("user_manual_video_enabled", v)} />
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
              <div className="space-y-4">
                <FieldGroup label="বাংলা শিরোনাম" hint="Customer ভিডিও window-এর ওপরে এটি দেখবে।">
                  <input
                    className={inputCls}
                    value={form.user_manual_video_title || ""}
                    onChange={(e) => updateField("user_manual_video_title", e.target.value)}
                    maxLength={200}
                    placeholder="কীভাবে খাবার অর্ডার করবেন"
                  />
                </FieldGroup>
                <FieldGroup label="বাংলা বিবরণ" hint="ভিডিওতে কী শেখানো হয়েছে, সংক্ষেপে লিখুন।">
                  <textarea
                    className={`${inputCls} min-h-24`}
                    value={form.user_manual_video_description || ""}
                    onChange={(e) => updateField("user_manual_video_description", e.target.value)}
                    maxLength={1000}
                    placeholder="খুব সহজে খাবার অর্ডার করার নিয়ম এই ভিডিওতে দেখুন।"
                  />
                </FieldGroup>
                <FieldGroup label="Video file" hint="MP4 (H.264), সর্বোচ্চ 100 MB। ছোট optimized video ব্যবহার করলে customer-এর data কম খরচ হবে।">
                  <input
                    className={inputCls}
                    type="file"
                    accept="video/mp4,.mp4"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                </FieldGroup>
                {videoFile && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                    <span className="min-w-0 flex-1 truncate">Selected: {videoFile.name}</span>
                    <span>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={!videoFile || videoUploading} onClick={uploadManualVideo}>
                    {videoUploading ? "Uploading..." : form.user_manual_video_url ? "Replace video" : "Upload video"}
                  </Button>
                  {form.user_manual_video_url && (
                    <Button type="button" variant="ghost" disabled={videoUploading} onClick={removeManualVideo}>Remove video</Button>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-[#6b7280]">Current video preview</p>
                {form.user_manual_video_url ? (
                  <video
                    key={form.user_manual_video_url}
                    src={form.user_manual_video_url}
                    controls
                    preload="metadata"
                    className="aspect-video w-full rounded-2xl border border-[#ececec] bg-black object-contain"
                  />
                ) : (
                  <div className="grid aspect-video w-full place-items-center rounded-2xl border border-dashed border-[#d1d5db] bg-[#fafafa] px-6 text-center text-xs font-semibold text-[#9ca3af]">
                    এখনো কোনো user manual video upload করা হয়নি।
                  </div>
                )}
                <div className="mt-3 rounded-xl border border-[#ececec] bg-[#fafafa] p-3">
                  <p className="font-black text-[#111]">{form.user_manual_video_title || "ভিডিও শিরোনাম"}</p>
                  <p className="mt-1 text-xs leading-5 text-[#6b7280]">{form.user_manual_video_description || "ভিডিওর সংক্ষিপ্ত বিবরণ"}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="fd-rise rounded-[26px] border border-[#ececec] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6" style={{ "--d": "150ms" }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-[#111]">Messenger contact</h2>
                <p className="mt-1 text-xs font-semibold text-[#6b7280]">
                  Food home page-e customer-er jonno Messenger chat icon দেখাবে।
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#ececec] bg-[#fafafa] px-4 py-3">
                <span className="text-sm font-bold text-[#111]">{form.messenger_enabled ? "On" : "Off"}</span>
                <Toggle checked={form.messenger_enabled} onChange={(v) => updateField("messenger_enabled", v)} />
              </div>
            </div>
            <div className="mt-4">
              <FieldGroup label="Messenger page or chat link" hint="Use an HTTPS link such as https://m.me/your-page-username">
                <input
                  className={inputCls}
                  type="url"
                  value={form.messenger_url || ""}
                  onChange={(e) => updateField("messenger_url", e.target.value)}
                  placeholder="https://m.me/your-page-username"
                  required={Boolean(form.messenger_enabled)}
                />
              </FieldGroup>
            </div>
          </section>

          <div className="fd-rise flex justify-end" style={{ "--d": "160ms" }}>
            <Button disabled={saving}>{saving ? "Saving..." : "Save delivery settings"}</Button>
          </div>
        </div>

        <div className="space-y-5">
          <section className="fd-rise rounded-[26px] border border-[#111] bg-[#111] p-6 text-white" style={{ "--d": "90ms" }}>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">Current rule</p>
            <h3 className="mt-2 text-xl font-black">{ruleTitle}</h3>
            <p className="mt-3 text-sm font-medium leading-6 text-white/75">{ruleText}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#ee0012] px-3 py-1 text-xs font-black uppercase tracking-wide">{form.is_enabled ? "Live" : "Paused"}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide">{form.charge_mode.replace("_", " ")}</span>
            </div>
          </section>

          <section className="fd-rise rounded-[26px] border border-[#ececec] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ "--d": "150ms" }}>
            <h3 className="text-sm font-black uppercase tracking-wide text-[#111]">How checkout uses this</h3>
            <ul className="mt-4 space-y-3">
              {[
                "User must tap current location before placing a delivery order.",
                "Admin receives saved latitude, longitude and a Google Maps link in the order record.",
                "Per-KM mode uses restaurant coordinates first. If missing, fallback store coordinates are used.",
                "Rider earning is calculated from the rider fixed/per-KM values. The remaining delivery fee becomes admin delivery income.",
              ].map((line) => (
                <li key={line} className="flex gap-2.5 text-sm font-medium leading-5 text-[#374151]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ee0012]" />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </form>
    </div>
  );
}
