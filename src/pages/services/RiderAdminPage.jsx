import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { apiRequest } from "../../lib/api.js";

const statusBn = {
  draft: "খসড়া",
  pending: "অপেক্ষমাণ",
  approved: "অনুমোদিত",
  rejected: "বাতিল",
  active: "সক্রিয়",
  suspended: "সাময়িক বন্ধ",
  blocked: "ব্লক",
  offline: "অফলাইন",
  online: "অনলাইন",
  busy: "ব্যস্ত",
};

const vehicleBn = { cycle: "সাইকেল", bike: "মোটরসাইকেল", car: "গাড়ি" };
const money = (value) => `৳${Number(value || 0).toLocaleString("bn-BD")}`;
const toCoord = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const mapsPointUrl = (lat, lng) => {
  if (lat === null || lng === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};
const mapsEmbedPointUrl = (lat, lng) => {
  if (lat === null || lng === null) return null;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
};

function Field({ label, children }) {
  return (
    <label className="block text-sm font-semibold text-[#24324a]">
      {label}
      {children}
    </label>
  );
}

function inputClass() {
  return "mt-1.5 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-500/10";
}

function InfoCard({ label, value, tone = "default" }) {
  const toneClass = tone === "red" ? "bg-red-50 text-red-700 border-red-100" : "bg-[#f8fafc] text-[#24324a] border-[#edf1f6]";
  return (
    <div className={`rounded-[14px] border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold opacity-70">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function RiderLiveMapCard({ rider }) {
  const lat = toCoord(rider.last_lat);
  const lng = toCoord(rider.last_lng);
  const pointUrl = mapsPointUrl(lat, lng);
  const embedUrl = mapsEmbedPointUrl(lat, lng);

  return (
    <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-lg font-black text-[#101827]">লাইভ লোকেশন</h4>
          <p className="mt-1 text-sm text-[#64748b]">
            {lat !== null && lng !== null
              ? `${lat}, ${lng}${rider.last_location_at ? ` • Updated ${rider.last_location_at}` : ""}`
              : "রাইডার এখনো live location পাঠায়নি।"}
          </p>
        </div>
        {pointUrl && (
          <a
            href={pointUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
          >
            Open Map
          </a>
        )}
      </div>
      {embedUrl ? (
        <iframe
          title={`Rider live map ${rider.id}`}
          src={embedUrl}
          className="mt-4 h-72 w-full rounded-[14px] border border-[#dfe6ef]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="mt-4 rounded-[14px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-5 text-sm text-[#64748b]">
          Location available হলে এখানে map preview দেখা যাবে।
        </div>
      )}
    </div>
  );
}

function RiderDetails({ rider, token, onClose, onSaved }) {
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
  const docs = rider.documents || [];

  const save = async (patch = {}) => {
    setSaving(true);
    try {
      await apiRequest(`/admin/resources/riders/${rider.id}`, {
        method: "PUT",
        token,
        body: { ...form, ...patch },
      });
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[20px] border border-[#dfe6ef] bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf1f6] px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#ee0012]">Rider Management</p>
            <h3 className="mt-1 text-2xl font-black text-[#101827]">{rider.name}</h3>
            <p className="mt-1 text-sm text-[#64748b]">{rider.phone} • {vehicleBn[rider.vehicle_type] || rider.vehicle_type} • {rider.upazila || "উপজেলা নেই"}</p>
          </div>
          <button className="rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm font-semibold" onClick={onClose}>Close</button>
        </div>

        <div className="border-b border-[#edf1f6] px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {[
              ["overview", "ওভারভিউ"],
              ["kyc", "KYC ডকুমেন্ট"],
              ["deal", "চুক্তি ও কমিশন"],
              ["wallet", "ওয়ালেট"],
              ["support", "সাপোর্ট"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-[12px] border px-4 py-2 text-sm font-bold ${tab === key ? "border-red-200 bg-red-50 text-red-700" : "border-[#dfe6ef] bg-white text-[#53637a]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto p-5">
          {tab === "overview" && (
            <div className="grid gap-5 xl:grid-cols-[0.8fr,1.2fr]">
              <div className="rounded-[18px] border border-[#dfe6ef] bg-[#f8fafc] p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard label="KYC" value={statusBn[rider.kyc_status] || rider.kyc_status} />
                  <InfoCard label="অ্যাকাউন্ট" value={statusBn[rider.account_status] || rider.account_status} />
                  <InfoCard label="অনলাইন অবস্থা" value={statusBn[rider.availability_status] || rider.availability_status} />
                  <InfoCard label="রেটিং" value={rider.rating || "0.00"} />
                </div>
                <div className="mt-4 rounded-[14px] bg-white p-4 text-sm text-[#53637a]">
                  <p><b>ঠিকানা:</b> {[rider.district, rider.upazila, rider.address].filter(Boolean).join(", ") || "-"}</p>
                  <p className="mt-2"><b>যানবাহন:</b> {vehicleBn[rider.vehicle_type] || "-"} • {rider.vehicle_number || "নম্বর নেই"}</p>
                  <p className="mt-2"><b>জরুরি যোগাযোগ:</b> {rider.emergency_contact_name || "-"} • {rider.emergency_contact_phone || "-"}</p>
                  <p className="mt-2"><b>bKash/Nagad:</b> {rider.bkash_number || "-"} • {rider.nagad_number || "-"}</p>
                </div>
              </div>

              <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5">
                <h4 className="text-lg font-black text-[#101827]">দ্রুত অ্যাকশন</h4>
                <p className="mt-1 text-sm text-[#64748b]">KYC approve/reject, account status, online status এক জায়গা থেকে control করুন।</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field label="KYC স্ট্যাটাস">
                    <select className={inputClass()} value={form.kyc_status} onChange={(e) => setForm({ ...form, kyc_status: e.target.value })}>
                      <option value="pending">পর্যালোচনায়</option>
                      <option value="approved">অনুমোদিত</option>
                      <option value="rejected">বাতিল</option>
                    </select>
                  </Field>
                  <Field label="অ্যাকাউন্ট স্ট্যাটাস">
                    <select className={inputClass()} value={form.account_status} onChange={(e) => setForm({ ...form, account_status: e.target.value })}>
                      <option value="pending">অপেক্ষমাণ</option>
                      <option value="active">সক্রিয়</option>
                      <option value="suspended">সাময়িক বন্ধ</option>
                      <option value="blocked">ব্লক</option>
                    </select>
                  </Field>
                  <Field label="অনলাইন অবস্থা">
                    <select className={inputClass()} value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value })}>
                      <option value="offline">অফলাইন</option>
                      <option value="online">অনলাইন</option>
                      <option value="busy">ব্যস্ত</option>
                    </select>
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="অ্যাডমিন নোট">
                    <textarea className={`${inputClass()} min-h-[90px]`} value={form.admin_note} onChange={(e) => setForm({ ...form, admin_note: e.target.value })} />
                  </Field>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => save()} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                  <Button variant="ghost" onClick={() => save({ kyc_status: "approved", account_status: "active", agreement_status: "active" })}>Approve Rider</Button>
                  <Button variant="ghost" onClick={() => save({ account_status: "blocked", availability_status: "offline" })}>Block</Button>
                </div>
              </div>
              <div className="xl:col-span-2">
                <RiderLiveMapCard rider={rider} />
              </div>
            </div>
          )}

          {tab === "kyc" && (
            <div className="space-y-4">
              <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5">
                <h4 className="text-lg font-black text-[#101827]">KYC ডকুমেন্ট যাচাই</h4>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {docs.map((doc) => (
                    <div key={doc.id} className="overflow-hidden rounded-[16px] border border-[#edf1f6] bg-[#f8fafc]">
                      {doc.file_url && /\.(jpg|jpeg|png|webp)$/i.test(doc.file_url) && (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="block bg-white">
                          <img src={doc.file_url} alt={doc.title || doc.type} className="h-44 w-full object-cover" />
                        </a>
                      )}
                      {doc.file_url && !/\.(jpg|jpeg|png|webp)$/i.test(doc.file_url) && (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="flex h-44 items-center justify-center bg-white text-sm font-bold text-red-700">
                          PDF ডকুমেন্ট খুলুন
                        </a>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-[#101827]">{doc.type_bn || doc.title}</p>
                            <p className="mt-1 text-xs text-[#64748b]">{doc.title}</p>
                          </div>
                          <StatusBadge value={doc.status} />
                        </div>
                        {doc.file_url && (
                          <a className="mt-4 inline-flex rounded-[12px] border border-red-100 bg-white px-3 py-2 text-sm font-bold text-red-700" href={doc.file_url} target="_blank" rel="noreferrer">
                            ডকুমেন্ট দেখুন
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {!docs.length && <div className="rounded-[16px] border border-dashed border-[#cbd5e1] p-6 text-sm text-[#64748b]">এখনো KYC ডকুমেন্ট আপলোড হয়নি।</div>}
                </div>
              </div>
              <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5">
                <h4 className="text-lg font-black text-[#101827]">রাইডার পেমেন্ট তথ্য</h4>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="bKash Number">
                    <input className={inputClass()} value={form.bkash_number} onChange={(e) => setForm({ ...form, bkash_number: e.target.value })} />
                  </Field>
                  <Field label="Nagad Number">
                    <input className={inputClass()} value={form.nagad_number} onChange={(e) => setForm({ ...form, nagad_number: e.target.value })} />
                  </Field>
                  <Field label="Bank Account Name">
                    <input className={inputClass()} value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} />
                  </Field>
                  <Field label="Bank Account Number">
                    <input className={inputClass()} value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
                  </Field>
                  <Field label="Bank Name">
                    <input className={inputClass()} value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
                  </Field>
                  <Field label="Branch">
                    <input className={inputClass()} value={form.bank_branch} onChange={(e) => setForm({ ...form, bank_branch: e.target.value })} />
                  </Field>
                </div>
                <div className="mt-4">
                  <Button onClick={() => save()} disabled={saving}>{saving ? "Saving..." : "Save Payment Info"}</Button>
                </div>
              </div>
              <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5">
                <Field label="KYC নোট">
                  <textarea className={`${inputClass()} min-h-[90px]`} value={form.kyc_note} onChange={(e) => setForm({ ...form, kyc_note: e.target.value })} />
                </Field>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => save({ kyc_status: "approved", account_status: "active" })}>KYC Approve</Button>
                  <Button variant="ghost" onClick={() => save({ kyc_status: "rejected", account_status: "pending" })}>Reject</Button>
                </div>
              </div>
            </div>
          )}

          {tab === "deal" && (
            <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5">
              <h4 className="text-lg font-black text-[#101827]">চুক্তি, কমিশন ও পেমেন্ট</h4>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="কমিশন ধরন">
                  <select className={inputClass()} value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value })}>
                    <option value="fixed">প্রতি ডেলিভারিতে নির্দিষ্ট</option>
                    <option value="percentage">শতকরা</option>
                    <option value="zone_based">এলাকা অনুযায়ী</option>
                  </select>
                </Field>
                <Field label="কমিশন ভ্যালু">
                  <input className={inputClass()} type="number" value={form.commission_value} onChange={(e) => setForm({ ...form, commission_value: e.target.value })} />
                </Field>
                <Field label="পেমেন্ট সাইকেল">
                  <select className={inputClass()} value={form.payment_cycle} onChange={(e) => setForm({ ...form, payment_cycle: e.target.value })}>
                    <option value="daily">দৈনিক</option>
                    <option value="weekly">সাপ্তাহিক</option>
                    <option value="monthly">মাসিক</option>
                  </select>
                </Field>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <InfoCard label="চুক্তি" value={rider.agreement_accepted ? "গ্রহণ করেছে" : "গ্রহণ করেনি"} />
                <InfoCard label="পেন্ডিং পেআউট" value={money(rider.pending_payout)} />
                <InfoCard label="ক্যাশ ইন হ্যান্ড" value={money(rider.cash_in_hand)} />
              </div>
              <div className="mt-4">
                <Button onClick={() => save()} disabled={saving}>Save Deal</Button>
              </div>
            </div>
          )}

          {tab === "wallet" && (
            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard label="Wallet Balance" value={money(rider.wallet_balance)} />
              <InfoCard label="Pending Payout" value={money(rider.pending_payout)} />
              <InfoCard label="Cash In Hand" value={money(rider.cash_in_hand)} tone="red" />
            </div>
          )}

          {tab === "support" && (
            <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 text-sm text-[#64748b]">
              Rider support tickets menu থেকে সব ticket manage করা যাবে। এই rider-এর ID: <b>{rider.id}</b>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RiderAdminPage({ token }) {
  const [riders, setRiders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/admin/resources/riders?search=${encodeURIComponent(search)}&per_page=100`, { token });
      setRiders(data.data || []);
    } catch (err) {
      setError(err.message || "রাইডার লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, token]);

  const openRider = async (rider) => {
    setDetailLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/admin/resources/riders/${rider.id}`, { token });
      setSelected(data);
    } catch (err) {
      setError(err.message || "রাইডার বিস্তারিত লোড করা যায়নি।");
    } finally {
      setDetailLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total: riders.length,
    pending: riders.filter((r) => r.kyc_status === "pending").length,
    active: riders.filter((r) => r.account_status === "active").length,
    online: riders.filter((r) => r.availability_status === "online").length,
  }), [riders]);

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ee0012]">Rider System</p>
            <h2 className="mt-1 text-2xl font-black text-[#101827]">রাইডার ম্যানেজমেন্ট</h2>
            <p className="mt-1 text-sm text-[#64748b]">KYC, চুক্তি, অনলাইন অবস্থা, কমিশন, পেআউট ও পারফরম্যান্স এক জায়গায়।</p>
          </div>
          <input
            placeholder="নাম, ফোন, উপজেলা বা যানবাহন নম্বর খুঁজুন"
            className="w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm lg:w-80"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <InfoCard label="মোট রাইডার" value={stats.total} />
        <InfoCard label="KYC Pending" value={stats.pending} />
        <InfoCard label="Active" value={stats.active} />
        <InfoCard label="Online" value={stats.online} />
      </div>

      {error && <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 xl:grid-cols-2">
        {riders.map((rider) => (
          <div key={rider.id} className="rounded-[18px] border border-[#dfe6ef] bg-white p-5 shadow-sm transition hover:border-red-100 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#101827]">{rider.name}</h3>
                <p className="mt-1 text-sm text-[#64748b]">{rider.phone} • {rider.upazila || "উপজেলা নেই"} • {vehicleBn[rider.vehicle_type] || rider.vehicle_type}</p>
              </div>
              <StatusBadge value={rider.account_status} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-[12px] bg-[#f8fafc] p-3 text-sm"><b>KYC</b><br />{statusBn[rider.kyc_status] || rider.kyc_status}</div>
              <div className="rounded-[12px] bg-[#f8fafc] p-3 text-sm"><b>অবস্থা</b><br />{statusBn[rider.availability_status] || rider.availability_status}</div>
              <div className="rounded-[12px] bg-[#f8fafc] p-3 text-sm"><b>পেআউট</b><br />{money(rider.pending_payout)}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => openRider(rider)} disabled={detailLoading}>Manage Rider</Button>
              {rider.last_lat && rider.last_lng && (
                <a className="inline-flex items-center rounded-[14px] border border-[#dfe6ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#24324a]" href={mapsPointUrl(rider.last_lat, rider.last_lng)} target="_blank" rel="noreferrer">
                  Live Map
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {!riders.length && (
        <div className="rounded-[18px] border border-dashed border-[#cbd5e1] bg-white p-8 text-center text-sm text-[#64748b]">
          {loading ? "রাইডার লোড হচ্ছে..." : "কোনো রাইডার পাওয়া যায়নি।"}
        </div>
      )}

      {selected && <RiderDetails rider={selected} token={token} onClose={() => setSelected(null)} onSaved={load} />}
    </div>
  );
}
