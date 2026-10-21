import { useEffect, useRef, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../../components/BulkDeleteBar.jsx";
import Button from "../../components/Button.jsx";
import Pagination from "../../components/Pagination.jsx";
import ResourceSelect from "../../components/ResourceSelect.jsx";
import UserSelect from "../../components/UserSelect.jsx";
import { apiRequest, apiUpload } from "../../lib/api.js";

const DEFAULT_MAP_CENTER = { lat: 22.6859, lng: 90.6482 };
const GOOGLE_MAPS_WEB_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_WEB_API_KEY || "";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const emptyForm = {
  user_id: "",
  assigned_user_ids: [],
  assigned_users: [],
  category_id: "",
  name: "",
  description: "",
  address: "",
  lat: "",
  lng: "",
  phone: "",
  email: "",
  website: "",
  price_range: "",
  cuisines: "",
  features: "",
  delivery_available: false,
  accepts_food_orders: true,
  is_promoted: false,
  promotion_priority: "0",
  promotion_badge: "Featured",
  promotion_starts_at: "",
  promotion_ends_at: "",
  promotion_note: "",
  commission_enabled: true,
  commission_type: "percentage",
  commission_rate: "10",
  commission_fixed_fee: "0",
  settlement_cycle: "weekly",
  takeaway_available: false,
  dine_in_available: false,
  opening_hours: "",
  open_time: "",
  close_time: "",
  average_prep_minutes: "30",
  min_price: "",
  max_price: "",
  service_radius_km: "",
  approval_note: "",
  status: "active",
};

function RestaurantAccessUsers({ token, ownerId, value, users, onChange }) {
  const selectedIds = Array.from(new Set((value || []).map((id) => String(id)).filter(Boolean)));
  const userMap = new Map((users || []).map((user) => [String(user.id), user]));

  const addUser = (user) => {
    if (!user) return;
    const id = String(user.id);
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id], [...(users || []), user]);
  };

  const removeUser = (id) => {
    const key = String(id);
    if (key === String(ownerId || "")) return;
    onChange(selectedIds.filter((item) => item !== key), (users || []).filter((user) => String(user.id) !== key));
  };

  return (
    <section className="md:col-span-2 rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f172a]">Restaurant Access</p>
          <h4 className="mt-1 text-base font-black text-[#101827]">Assigned restaurant users</h4>
          <p className="mt-1 text-xs leading-5 text-[#64748b]">These users can manage orders, menu, coupons, reviews, settings and restaurant media from the app.</p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#0f172a] px-3 py-1 text-xs font-black text-white">{selectedIds.length} users</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {selectedIds.map((id) => {
          const user = userMap.get(id);
          const primary = id === String(ownerId || "");
          return (
            <div key={id} className="flex min-w-0 items-center gap-3 rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 text-xs font-black text-red-700">#{id}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#101827]">{user?.name || `User #${id}`}</p>
                <p className="truncate text-[11px] text-[#64748b]">{primary ? "Primary owner" : [user?.phone, user?.email].filter(Boolean).join(" / ") || "Full access"}</p>
              </div>
              {primary ? (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">OWNER</span>
              ) : (
                <button type="button" className="rounded-full border border-red-100 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-50" onClick={() => removeUser(id)}>Remove</button>
              )}
            </div>
          );
        })}
        {!selectedIds.length && <p className="sm:col-span-2 rounded-[14px] border border-dashed border-[#cbd5e1] bg-white px-4 py-5 text-center text-sm font-semibold text-[#64748b]">No users assigned yet.</p>}
      </div>

      <div className="mt-4 rounded-[14px] border border-[#dfe6ef] bg-white p-3">
        <UserSelect
          token={token}
          label="Add another user"
          value=""
          onChange={() => {}}
          onSelect={addUser}
          placeholder="Search by name, phone, or email"
        />
      </div>
    </section>
  );
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapsPointUrl(lat, lng) {
  const safeLat = numberOrNull(lat);
  const safeLng = numberOrNull(lng);
  if (safeLat === null || safeLng === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${safeLat},${safeLng}`;
}

function googleEmbedUrl(lat, lng) {
  const safeLat = numberOrNull(lat) ?? DEFAULT_MAP_CENTER.lat;
  const safeLng = numberOrNull(lng) ?? DEFAULT_MAP_CENTER.lng;
  return `https://maps.google.com/maps?q=${safeLat},${safeLng}&z=16&output=embed`;
}

function loadGoogleMaps() {
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

function RestaurantLocationPicker({ lat, lng, address, onChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const boxRef = useRef(null);
  const fallbackRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const safeLat = numberOrNull(lat);
  const safeLng = numberOrNull(lng);
  const selected = safeLat !== null && safeLng !== null;
  const center = selected ? { lat: safeLat, lng: safeLng } : DEFAULT_MAP_CENTER;
  const pointUrl = mapsPointUrl(lat, lng);

  useEffect(() => {
    let cancelled = false;
    setMapError("");
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !boxRef.current || mapRef.current) return;
        const map = new maps.Map(boxRef.current, {
          center,
          zoom: selected ? 17 : 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        map.addListener("click", (event) => {
          if (!event.latLng) return;
          const nextLat = Number(event.latLng.lat().toFixed(7));
          const nextLng = Number(event.latLng.lng().toFixed(7));
          onChange(nextLat, nextLng);
        });
        mapRef.current = map;
      })
      .catch((err) => setMapError(err.message || "Map could not be loaded."));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const maps = window.google?.maps;
    const map = mapRef.current;
    if (!maps || !map) return;
    if (selected) {
      const point = { lat: safeLat, lng: safeLng };
      if (!markerRef.current) {
        markerRef.current = new maps.Marker({
          position: point,
          map,
          draggable: true,
          title: "Restaurant pickup location",
        });
        markerRef.current.addListener("dragend", (event) => {
          if (!event.latLng) return;
          onChange(Number(event.latLng.lat().toFixed(7)), Number(event.latLng.lng().toFixed(7)));
        });
      } else {
        markerRef.current.setPosition(point);
      }
      map.setCenter(point);
      map.setZoom(Math.max(map.getZoom(), 16));
    } else if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  }, [lat, lng]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError("Browser location is not available.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(Number(position.coords.latitude.toFixed(7)), Number(position.coords.longitude.toFixed(7)));
      },
      () => setMapError("Could not read current location."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  return (
    <div className="md:col-span-2 rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0f172a]">Restaurant Location</p>
          <p className="mt-1 text-xs font-medium text-[#64748b]">Google map e click korle pickup location set hobe. Marker drag koreo adjust kora jabe.</p>
          {address ? <p className="mt-1 text-xs text-[#94a3b8]">{address}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={useCurrentLocation}>Use current</Button>
          {pointUrl && (
            <a className="rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm font-semibold text-[#24324a]" href={pointUrl} target="_blank" rel="noreferrer">
              Open map
            </a>
          )}
        </div>
      </div>
      <div ref={boxRef} className={`mt-3 h-72 overflow-hidden rounded-[14px] border border-[#dfe6ef] bg-white ${mapError ? "hidden" : ""}`} />
      {mapError && (
        <iframe
          ref={fallbackRef}
          title="Google map preview"
          src={googleEmbedUrl(lat, lng)}
          className="mt-3 h-72 w-full overflow-hidden rounded-[14px] border border-[#dfe6ef] bg-white"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
      {mapError && <p className="mt-2 text-xs font-semibold text-red-600">{mapError}</p>}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-xs font-bold text-[#64748b]">
          Latitude
          <input
            type="number"
            step="0.0000001"
            className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
            value={lat}
            onChange={(e) => onChange(e.target.value, lng)}
            placeholder="22.6859000"
          />
        </label>
        <label className="text-xs font-bold text-[#64748b]">
          Longitude
          <input
            type="number"
            step="0.0000001"
            className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
            value={lng}
            onChange={(e) => onChange(lat, e.target.value)}
            placeholder="90.6482000"
          />
        </label>
      </div>
    </div>
  );
}

export default function RestaurantsPage({ token }) {
  const [records, setRecords] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentMedia, setCurrentMedia] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef(null);

  const resetImageState = () => {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
    setCurrentMedia(null);
    setImageLoading(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        per_page: String(perPage),
      });
      const data = await apiRequest(`/admin/resources/restaurants?${params.toString()}`, { token });
      setRecords(data.data || []);
      setMeta(data.meta || null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Unable to load restaurants.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiRequest("/admin/resources/restaurant-categories", { token });
      setCategories(data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    load();
  }, [search, page, perPage, token]);

  useEffect(() => {
    loadCategories();
  }, [token]);

  const openCreate = () => {
    resetImageState();
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = async (r) => {
    resetImageState();
    setMode("edit");
    setEditingId(r.id);
    setForm({
      user_id: r.user_id || "",
      assigned_user_ids: Array.isArray(r.assigned_user_ids) ? r.assigned_user_ids.map(String) : [],
      assigned_users: Array.isArray(r.assigned_users) ? r.assigned_users : [],
      category_id: r.category_id || "",
      name: r.name || "",
      description: r.description || "",
      address: r.address || "",
      lat: r.lat ?? "",
      lng: r.lng ?? "",
      phone: r.phone || "",
      email: r.email || "",
      website: r.website || "",
      price_range: r.price_range || "",
      cuisines: Array.isArray(r.cuisines) ? r.cuisines.join(", ") : r.cuisines || "",
      features: Array.isArray(r.features) ? r.features.join(", ") : r.features || "",
      delivery_available: Boolean(r.delivery_available),
      accepts_food_orders: r.accepts_food_orders === undefined ? true : Boolean(r.accepts_food_orders),
      is_promoted: Boolean(r.is_promoted),
      promotion_priority: r.promotion_priority ?? "0",
      promotion_badge: r.promotion_badge || "Featured",
      promotion_starts_at: r.promotion_starts_at ? String(r.promotion_starts_at).replace(" ", "T").slice(0, 16) : "",
      promotion_ends_at: r.promotion_ends_at ? String(r.promotion_ends_at).replace(" ", "T").slice(0, 16) : "",
      promotion_note: r.promotion_note || "",
      commission_enabled: r.commission_enabled === undefined ? true : Boolean(r.commission_enabled),
      commission_type: r.commission_type || "percentage",
      commission_rate: r.commission_rate ?? "10",
      commission_fixed_fee: r.commission_fixed_fee ?? "0",
      settlement_cycle: r.settlement_cycle || "weekly",
      takeaway_available: Boolean(r.takeaway_available),
      dine_in_available: Boolean(r.dine_in_available),
      opening_hours: r.opening_hours || "",
      open_time: r.open_time ? String(r.open_time).slice(0, 5) : "",
      close_time: r.close_time ? String(r.close_time).slice(0, 5) : "",
      average_prep_minutes: r.average_prep_minutes || "30",
      min_price: r.min_price || "",
      max_price: r.max_price || "",
      service_radius_km: r.service_radius_km || "",
      approval_note: r.approval_note || "",
      status: r.status || "active",
    });
    setModalOpen(true);
    setImagePreview(r.image_url || "");
    setImageLoading(true);
    try {
      const media = await apiRequest(`/media/list?target_type=restaurant&target_id=${r.id}`, { token });
      const primary = (Array.isArray(media) ? media : []).find((item) => item.is_primary) || media?.[0] || null;
      setCurrentMedia(primary);
      setImagePreview(primary?.url || r.image_url || "");
    } catch (_) {
      setImagePreview(r.image_url || "");
    } finally {
      setImageLoading(false);
    }
  };

  const closeModal = () => {
    resetImageState();
    setModalOpen(false);
  };

  const selectImage = (file) => {
    if (!file) return;
    setError("");
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Restaurant image must be 5 MB or smaller.");
      return;
    }
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadRestaurantImage = async (restaurantId) => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append("section", "restaurant");
    formData.append("target_type", "restaurant");
    formData.append("target_id", String(restaurantId));
    formData.append("images[]", imageFile);
    formData.append("set_primary", "1");
    const data = await apiUpload("/media/upload", { token, formData });
    return data.media?.[0] || null;
  };

  const removeImage = async () => {
    if (imageFile) {
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePreview(currentMedia?.url || "");
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    if (!currentMedia?.id || !window.confirm("Remove this restaurant image?")) return;
    setImageLoading(true);
    setError("");
    try {
      await apiRequest(`/media/${currentMedia.id}`, { method: "DELETE", token });
      setCurrentMedia(null);
      setImagePreview("");
      setRecords((prev) => prev.map((record) => (record.id === editingId ? { ...record, image_url: null } : record)));
    } catch (err) {
      setError(err.message || "Image removal failed.");
    } finally {
      setImageLoading(false);
    }
  };

  const saveRestaurant = async () => {
    if (!form.name.trim()) {
      setError("Restaurant name is required.");
      return;
    }
    if (!form.open_time || !form.close_time) {
      setError("Opening time and closing/off time are required.");
      return;
    }
    setError("");
    setSaving(true);
    const payload = {
      user_id: form.user_id ? Number(form.user_id) : null,
      assigned_user_ids: Array.from(new Set([
        ...(form.assigned_user_ids || []).map(Number).filter(Boolean),
        ...(form.user_id ? [Number(form.user_id)] : []),
      ])),
      category_id: form.category_id ? Number(form.category_id) : null,
      name: form.name,
      description: form.description || null,
      address: form.address || null,
      lat: form.lat === "" || form.lat === null ? null : Number(form.lat),
      lng: form.lng === "" || form.lng === null ? null : Number(form.lng),
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      price_range: form.price_range || null,
      cuisines: form.cuisines ? form.cuisines.split(",").map((s) => s.trim()).filter(Boolean) : [],
      features: form.features ? form.features.split(",").map((s) => s.trim()).filter(Boolean) : [],
      delivery_available: Boolean(form.delivery_available),
      accepts_food_orders: Boolean(form.accepts_food_orders),
      is_promoted: Boolean(form.is_promoted),
      promotion_priority: form.promotion_priority ? Number(form.promotion_priority) : 0,
      promotion_badge: form.promotion_badge || null,
      promotion_starts_at: form.promotion_starts_at ? form.promotion_starts_at.replace("T", " ") : null,
      promotion_ends_at: form.promotion_ends_at ? form.promotion_ends_at.replace("T", " ") : null,
      promotion_note: form.promotion_note || null,
      commission_enabled: Boolean(form.commission_enabled),
      commission_type: form.commission_type || "percentage",
      commission_rate: form.commission_rate ? Number(form.commission_rate) : 0,
      commission_fixed_fee: form.commission_fixed_fee ? Number(form.commission_fixed_fee) : 0,
      settlement_cycle: form.settlement_cycle || "weekly",
      takeaway_available: Boolean(form.takeaway_available),
      dine_in_available: Boolean(form.dine_in_available),
      opening_hours: form.opening_hours || null,
      open_time: form.open_time || null,
      close_time: form.close_time || null,
      average_prep_minutes: form.average_prep_minutes ? Number(form.average_prep_minutes) : 30,
      min_price: form.min_price ? Number(form.min_price) : null,
      max_price: form.max_price ? Number(form.max_price) : null,
      service_radius_km: form.service_radius_km ? Number(form.service_radius_km) : null,
      approval_note: form.approval_note || null,
      status: form.status,
    };
    let savedRecord = null;
    try {
      if (mode === "create") {
        const data = await apiRequest("/admin/resources/restaurants", {
          method: "POST",
          token,
          body: payload,
        });
        savedRecord = data.record;
      } else if (editingId) {
        const data = await apiRequest(`/admin/resources/restaurants/${editingId}`, {
          method: "PUT",
          token,
          body: payload,
        });
        savedRecord = data.record;
      }
      if (savedRecord && imageFile) {
        const uploaded = await uploadRestaurantImage(savedRecord.id);
        savedRecord = { ...savedRecord, image_url: uploaded?.url || imagePreview };
      } else if (savedRecord) {
        savedRecord = { ...savedRecord, image_url: currentMedia?.url || savedRecord.image_url || imagePreview || null };
      }
      if (mode === "create") {
        setRecords((prev) => [savedRecord, ...prev]);
      } else {
        setRecords((prev) => prev.map((r) => (r.id === editingId ? savedRecord : r)));
      }
      closeModal();
    } catch (err) {
      if (savedRecord) {
        if (mode === "create") {
          setMode("edit");
          setEditingId(savedRecord.id);
          setRecords((prev) => [savedRecord, ...prev.filter((record) => record.id !== savedRecord.id)]);
        } else {
          setRecords((prev) => prev.map((record) => (record.id === savedRecord.id ? savedRecord : record)));
        }
        setError(`Restaurant details were saved, but the image could not be uploaded. ${err.message || "Please try saving the image again."}`);
      } else {
        setError(err.message || "Save failed.");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteRestaurant = async (id) => {
    await apiRequest(`/admin/resources/restaurants/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => toggleSelectedId(prev, id, false));
  };


  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected records? This action cannot be undone.`)) return;
    setBulkDeleting(true);
    setError("");
    try {
      await Promise.all(ids.map((id) => apiRequest(`/admin/resources/restaurants/${id}`, { method: "DELETE", token })));
      setRecords((prev) => prev.filter((record) => !selectedIds.includes(record.id)));
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Bulk delete failed.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const selectionState = visibleSelectionState(records, selectedIds);
  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <input
          placeholder="Search by name or phone"
          className="w-full md:max-w-sm rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Add Restaurant</Button>
        </div>
      </div>

      <BulkDeleteBar
        selectedCount={selectedIds.length}
        deleting={bulkDeleting}
        onClear={() => setSelectedIds([])}
        onDelete={bulkDelete}
      />
      <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[1120px] w-full text-xs md:text-sm">
          <thead className="bg-[#f8fafc] text-[#53637a]">
            <tr>
              <th className="w-10 px-3 py-2 md:px-4">
                <input
                  type="checkbox"
                  checked={selectionState.allVisibleSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = selectionState.someVisibleSelected;
                  }}
                  onChange={(e) => setSelectedIds((prev) => toggleVisibleIds(prev, records, e.target.checked))}
                  aria-label="Select all visible records"
                />
              </th>
              <th className="text-left px-3 py-2 md:px-4">ID</th>
              <th className="text-left px-3 py-2 md:px-4">Name</th>
              <th className="text-left px-3 py-2 md:px-4">Category</th>
              <th className="text-left px-3 py-2 md:px-4">Phone</th>
              <th className="text-left px-3 py-2 md:px-4">Food Orders</th>
              <th className="text-left px-3 py-2 md:px-4">Promotion</th>
              <th className="text-left px-3 py-2 md:px-4">Commission</th>
              <th className="text-left px-3 py-2 md:px-4">Prep</th>
              <th className="text-left px-3 py-2 md:px-4">Status</th>
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-[#edf1f6]">
                <td className="px-3 py-2 md:px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, r.id, e.target.checked))}
                    aria-label={`Select record ${r.id}`}
                  />
                </td>
                <td className="px-3 py-2 md:px-4">{r.id}</td>
                <td className="px-3 py-2 md:px-4">
                  <div className="flex min-w-[180px] items-center gap-3">
                    {r.image_url ? (
                      <img src={r.image_url} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-[#e2e8f0] object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-sm font-black text-[#64748b]">
                        {(r.name || "R").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold text-[#24324a]">{r.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 md:px-4">{r.category_id}</td>
                <td className="px-3 py-2 md:px-4">{r.phone || "-"}</td>
                <td className="px-3 py-2 md:px-4">{r.accepts_food_orders ? "Enabled" : "Disabled"}</td>
                <td className="px-3 py-2 md:px-4">
                  {r.is_promoted ? (
                    <div className="space-y-1">
                      <span className="inline-flex rounded-full bg-red-50 px-2 py-1 text-[11px] font-black text-red-700">
                        {r.promotion_badge || "Featured"} · #{r.promotion_priority || 0}
                      </span>
                      {(r.promotion_starts_at || r.promotion_ends_at) && (
                        <p className="text-[11px] text-[#64748b]">
                          {r.promotion_starts_at ? String(r.promotion_starts_at).slice(0, 10) : "Now"} - {r.promotion_ends_at ? String(r.promotion_ends_at).slice(0, 10) : "Open"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#94a3b8]">Not promoted</span>
                  )}
                </td>
                <td className="px-3 py-2 md:px-4">
                  {r.commission_enabled === false
                    ? "None"
                    : r.commission_type === "fixed"
                      ? `BDT ${r.commission_fixed_fee || 0}`
                      : r.commission_type === "percentage_plus_fixed"
                        ? `${r.commission_rate || 0}% + BDT ${r.commission_fixed_fee || 0}`
                        : `${r.commission_rate || 0}%`}
                </td>
                <td className="px-3 py-2 md:px-4">{r.average_prep_minutes ? `${r.average_prep_minutes} min` : "-"}</td>
                <td className="px-3 py-2 md:px-4">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${r.status === "active" ? "bg-emerald-50 text-emerald-700" : r.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
                    <Button variant="ghost" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteRestaurant(r.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td className="px-4 py-4 text-[#64748b]" colSpan={11}>
                  {loading ? "Loading..." : "No restaurants found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={mode === "create" ? "Add Restaurant" : "Edit Restaurant"}>
          <div className="w-full max-w-4xl rounded-[18px] border border-[#dfe6ef] bg-white p-6 shadow-2xl shadow-slate-900/15 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{mode === "create" ? "Add Restaurant" : "Edit Restaurant"}</h3>
              <button className="text-sm font-semibold text-[#64748b] hover:text-[#0f172a]" onClick={closeModal} disabled={saving}>
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-xs font-bold text-[#64748b]">Restaurant Image</p>
                <div className="mt-2 grid gap-4 rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] p-4 sm:grid-cols-[220px_1fr] sm:items-center">
                  <div className="aspect-[16/10] overflow-hidden rounded-xl border border-[#dfe6ef] bg-white">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Restaurant preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold text-[#94a3b8]">
                        {imageLoading ? "Loading image..." : "No restaurant image selected"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#24324a]">Upload a clear storefront or food image</p>
                    <p className="mt-1 text-xs leading-5 text-[#64748b]">JPG, PNG, or WebP. Maximum 5 MB. A landscape image works best in the app.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-[12px] bg-[#0f172a] px-4 py-2 text-sm font-bold text-white hover:bg-[#1e293b]">
                        {imagePreview ? "Replace Image" : "Choose Image"}
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(event) => selectImage(event.target.files?.[0])}
                          disabled={saving || imageLoading}
                        />
                      </label>
                      {imagePreview && (
                        <button
                          type="button"
                          className="rounded-[12px] border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          onClick={removeImage}
                          disabled={saving || imageLoading}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <UserSelect
                token={token}
                label="Restaurant owner"
                value={form.user_id}
                onChange={(userId) => setForm((current) => ({
                  ...current,
                  user_id: userId,
                  assigned_user_ids: userId
                    ? Array.from(new Set([...(current.assigned_user_ids || []).map(String), String(userId)]))
                    : current.assigned_user_ids,
                }))}
                onSelect={(user) => user && setForm((current) => ({
                  ...current,
                  assigned_users: [
                    ...(current.assigned_users || []).filter((item) => String(item.id) !== String(user.id)),
                    user,
                  ],
                }))}
              />
              <ResourceSelect
                token={token}
                resource="restaurant-categories"
                label="Category"
                value={form.category_id}
                onChange={(categoryId) => setForm({ ...form, category_id: categoryId })}
                placeholder="Search category"
              />
              <RestaurantAccessUsers
                token={token}
                ownerId={form.user_id}
                value={form.assigned_user_ids}
                users={form.assigned_users}
                onChange={(assignedUserIds, assignedUsers) => setForm((current) => ({
                  ...current,
                  assigned_user_ids: assignedUserIds,
                  assigned_users: assignedUsers,
                }))}
              />
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Restaurant Name</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Description</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Address</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <RestaurantLocationPicker
                lat={form.lat}
                lng={form.lng}
                address={form.address}
                onChange={(lat, lng) => setForm({ ...form, lat, lng })}
              />
              <div>
                <label className="text-xs text-[#64748b]">Phone</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Email</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Website</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Price Range</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.price_range}
                  onChange={(e) => setForm({ ...form, price_range: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Cuisines (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.cuisines}
                  onChange={(e) => setForm({ ...form, cuisines: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Features (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-[#64748b]">
                  Opening Time
                  <input
                    type="time"
                    className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                    value={form.open_time}
                    onChange={(e) => setForm({ ...form, open_time: e.target.value })}
                  />
                </label>
                <label className="text-xs text-[#64748b]">
                  Closing / Off Time
                  <input
                    type="time"
                    className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                    value={form.close_time}
                    onChange={(e) => setForm({ ...form, close_time: e.target.value })}
                  />
                </label>
                <p className="col-span-2 text-xs leading-5 text-[#64748b]">
                  Orders are automatically blocked outside this schedule. The same time supports overnight restaurants, for example 6:00 PM to 2:00 AM.
                </p>
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Average Prep Minutes</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.average_prep_minutes}
                  onChange={(e) => setForm({ ...form, average_prep_minutes: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Minimum Order</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.min_price}
                  onChange={(e) => setForm({ ...form, min_price: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Maximum Price</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.max_price}
                  onChange={(e) => setForm({ ...form, max_price: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Service Radius KM</label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.service_radius_km}
                  onChange={(e) => setForm({ ...form, service_radius_km: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.delivery_available}
                  onChange={(e) => setForm({ ...form, delivery_available: e.target.checked })}
                />
                <span className="text-sm">Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.accepts_food_orders}
                  onChange={(e) => setForm({ ...form, accepts_food_orders: e.target.checked })}
                />
                <span className="text-sm">Accept Food Orders</span>
              </div>
              <div className="md:col-span-2 rounded-[16px] border border-red-100 bg-red-50/60 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-700">Food Promotion</p>
                    <h4 className="mt-1 text-base font-black text-[#101827]">Featured restaurant placement</h4>
                    <p className="mt-1 text-xs text-[#64748b]">Active campaigns appear above normal restaurants and inside the app featured section.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#24324a]">
                    <input
                      type="checkbox"
                      checked={form.is_promoted}
                      onChange={(e) => setForm({ ...form, is_promoted: e.target.checked })}
                    />
                    Promote
                  </label>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <label className="text-xs font-bold text-[#64748b]">
                    Priority
                    <input
                      type="number"
                      className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
                      value={form.promotion_priority}
                      onChange={(e) => setForm({ ...form, promotion_priority: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-bold text-[#64748b]">
                    Badge
                    <input
                      className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
                      value={form.promotion_badge}
                      onChange={(e) => setForm({ ...form, promotion_badge: e.target.value })}
                      placeholder="Featured"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#64748b]">
                    Starts
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
                      value={form.promotion_starts_at}
                      onChange={(e) => setForm({ ...form, promotion_starts_at: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-bold text-[#64748b]">
                    Ends
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
                      value={form.promotion_ends_at}
                      onChange={(e) => setForm({ ...form, promotion_ends_at: e.target.value })}
                    />
                  </label>
                  <label className="md:col-span-4 text-xs font-bold text-[#64748b]">
                    Internal Note
                    <textarea
                      rows={2}
                      className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
                      value={form.promotion_note}
                      onChange={(e) => setForm({ ...form, promotion_note: e.target.value })}
                      placeholder="Campaign context for admin team"
                    />
                  </label>
                </div>
              </div>
              <div className="md:col-span-2 rounded-[16px] border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-800">Owner Commission</p>
                    <h4 className="mt-1 text-base font-black text-[#101827]">Restaurant settlement rule</h4>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#24324a]">
                    <input
                      type="checkbox"
                      checked={form.commission_enabled}
                      onChange={(e) => setForm({ ...form, commission_enabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <label className="text-xs font-bold text-[#64748b]">
                    Commission Type
                    <select
                      className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
                      value={form.commission_type}
                      onChange={(e) => setForm({ ...form, commission_type: e.target.value })}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed</option>
                      <option value="percentage_plus_fixed">Percentage + Fixed</option>
                      <option value="none">None</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-[#64748b]">
                    Percentage Rate
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
                      value={form.commission_rate}
                      onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-bold text-[#64748b]">
                    Fixed Fee
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
                      value={form.commission_fixed_fee}
                      onChange={(e) => setForm({ ...form, commission_fixed_fee: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-bold text-[#64748b]">
                    Settlement Cycle
                    <select
                      className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3 py-2 text-sm"
                      value={form.settlement_cycle}
                      onChange={(e) => setForm({ ...form, settlement_cycle: e.target.value })}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.takeaway_available}
                  onChange={(e) => setForm({ ...form, takeaway_available: e.target.checked })}
                />
                <span className="text-sm">Takeaway</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.dine_in_available}
                  onChange={(e) => setForm({ ...form, dine_in_available: e.target.checked })}
                />
                <span className="text-sm">Dine-in</span>
              </div>
              <div>
                <label className="text-xs text-[#64748b]">Status</label>
                <select
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending Approval</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#64748b]">Approval Note</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  value={form.approval_note}
                  onChange={(e) => setForm({ ...form, approval_note: e.target.value })}
                  placeholder="Optional note visible to owner when approval is pending or rejected"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveRestaurant} disabled={saving || imageLoading}>{saving ? "Saving..." : "Save Restaurant"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
