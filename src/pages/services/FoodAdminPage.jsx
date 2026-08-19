import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { apiRequest, apiUpload } from "../../lib/api.js";

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
      { key: "size_options", label: "Size Options", type: "tags", placeholder: "Regular, Large, Family" },
      { key: "spice_options", label: "Spice Options", type: "tags", placeholder: "Normal, Medium, Hot" },
      { key: "add_ons", label: "Add-ons", type: "addons", placeholder: "Extra Sauce:20" },
      { key: "is_available", label: "Available", type: "checkbox", defaultValue: true },
      { key: "is_popular", label: "Popular", type: "checkbox", defaultValue: false },
      { key: "status", label: "Status", type: "select", options: ["active", "pending", "inactive"], defaultValue: "active" },
    ],
    columns: ["id", "image_url", "name", "restaurant_id", "food_category_id", "price", "discount_price", "is_available", "status"],
  },
  "food-coupons": {
    title: "Food Coupons",
    description: "Create delivery offers, free delivery and percentage/fixed discounts.",
    fields: [
      { key: "code", label: "Coupon Code", required: true },
      { key: "title", label: "Offer Title", required: true },
      { key: "discount_type", label: "Discount Type", type: "select", options: ["fixed", "percent", "free_delivery"], defaultValue: "fixed" },
      { key: "discount_value", label: "Discount Value", type: "number", defaultValue: 0 },
      { key: "minimum_order", label: "Minimum Order", type: "number", defaultValue: 0 },
      { key: "max_discount", label: "Max Discount", type: "number" },
      { key: "restaurant_id", label: "Restaurant ID", type: "number" },
      { key: "usage_limit", label: "Usage Limit", type: "number" },
      { key: "starts_at", label: "Starts At", type: "datetime-local" },
      { key: "ends_at", label: "Ends At", type: "datetime-local" },
      { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
    ],
    columns: ["id", "code", "title", "discount_type", "discount_value", "minimum_order", "is_active"],
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
      { key: "payment_method", label: "Payment Method", type: "select", options: ["cash_on_delivery", "online"], defaultValue: "cash_on_delivery" },
      { key: "payment_status", label: "Payment Status", type: "select", options: ["unpaid", "paid", "refunded"], defaultValue: "unpaid" },
      { key: "items_total", label: "Items Total", type: "number", defaultValue: 0 },
      { key: "delivery_fee", label: "Delivery Fee", type: "number", defaultValue: 0 },
      { key: "rider_earning", label: "Rider Earning", type: "number", defaultValue: 0 },
      { key: "cash_collected", label: "Cash Collected", type: "number", defaultValue: 0 },
      { key: "delivery_distance_km", label: "Delivery Distance KM", type: "number" },
      { key: "delivery_charge_mode", label: "Delivery Charge Mode" },
      { key: "discount_amount", label: "Discount", type: "number", defaultValue: 0 },
      { key: "grand_total", label: "Grand Total", type: "number", defaultValue: 0 },
      { key: "coupon_code", label: "Coupon Code" },
      { key: "order_note", label: "Order Note", type: "textarea" },
    ],
    columns: ["id", "order_no", "rider_assignment_label", "accepted_rider_name", "route_distance_km", "receiver_name", "receiver_phone", "status", "delivery_fee", "grand_total", "created_at"],
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
      { key: "responsibility_terms", label: "রাইডারের দায়িত্ব", type: "textarea" },
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
    description: "NID, সেলফি, লাইসেন্স, গাড়ির কাগজ ও ব্যাংক/MFS ডকুমেন্ট যাচাই করুন।",
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
    title: "রাইডার ওয়ালেট",
    description: "আয়, ক্যাশ কালেকশন, পেআউট, অ্যাডজাস্টমেন্ট ও পেনাল্টি লেজার।",
    fields: [
      { key: "rider_id", label: "Rider ID", type: "number", required: true },
      { key: "food_order_id", label: "Food Order ID", type: "number" },
      { key: "type", label: "টাইপ", type: "select", options: ["earning", "cash_collection", "payout", "adjustment", "penalty"], defaultValue: "adjustment" },
      { key: "amount", label: "টাকা", type: "number", required: true },
      { key: "balance_after", label: "Balance After", type: "number", defaultValue: 0 },
      { key: "title", label: "শিরোনাম", required: true },
      { key: "note", label: "নোট", type: "textarea" },
    ],
    columns: ["id", "rider_id", "food_order_id", "type", "amount", "balance_after", "title", "created_at"],
  },
  "rider-support-tickets": {
    title: "রাইডার সাপোর্ট",
    description: "রাইডারের অভিযোগ, সমস্যা ও অ্যাডমিন রিপ্লাই পরিচালনা করুন।",
    fields: [
      { key: "rider_id", label: "Rider ID", type: "number", required: true },
      { key: "food_order_id", label: "Food Order ID", type: "number" },
      { key: "subject", label: "বিষয়", required: true },
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
    title: "Food Reviews",
    description: "Moderate customer ratings and feedback.",
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
    columns: ["id", "user_id", "restaurant_id", "food_item_id", "rating", "owner_reply", "status", "created_at"],
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

const dateFields = new Set([
  "created_at",
  "updated_at",
  "starts_at",
  "ends_at",
  "estimated_delivery_at",
  "accepted_at",
  "delivered_at",
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

function emptyForm(config) {
  return config.fields.reduce((acc, field) => {
    if (field.type === "checkbox") acc[field.key] = Boolean(field.defaultValue);
    else if (field.type === "tags") acc[field.key] = "";
    else if (field.type === "addons") acc[field.key] = "";
    else acc[field.key] = field.defaultValue ?? "";
    return acc;
  }, {});
}

function normalizeRecord(record, config) {
  const form = emptyForm(config);
  config.fields.forEach((field) => {
    const value = record[field.key];
    if (field.type === "checkbox") form[field.key] = Boolean(value);
    else if (field.type === "tags") form[field.key] = Array.isArray(value) ? value.join(", ") : value || "";
    else if (field.type === "addons") form[field.key] = formatAddons(value);
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
    } else if (field.type === "datetime-local") {
      value = value ? value.replace("T", " ") : null;
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

function toCoord(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapsRouteUrl(fromLat, fromLng, toLat, toLng) {
  if ([fromLat, fromLng, toLat, toLng].some((value) => value === null)) return null;
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`;
}

function mapsEmbedRouteUrl(fromLat, fromLng, toLat, toLng, mapSettings) {
  if ([fromLat, fromLng, toLat, toLng].some((value) => value === null)) return null;
  const key = mapSettings?.is_enabled && mapSettings?.embed_enabled ? mapSettings?.browser_api_key : "";
  if (key) {
    const params = new URLSearchParams({
      key,
      origin: `${fromLat},${fromLng}`,
      destination: `${toLat},${toLng}`,
      mode: "driving",
    });
    return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
  }
  return `https://maps.google.com/maps?saddr=${fromLat},${fromLng}&daddr=${toLat},${toLng}&output=embed`;
}

function mapsPointUrl(lat, lng) {
  if (lat === null || lng === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function FoodOrderRouteMap({ order, mapSettings }) {
  const restaurantLat = toCoord(order?.restaurant?.lat);
  const restaurantLng = toCoord(order?.restaurant?.lng);
  const deliveryLat = toCoord(order?.delivery_lat);
  const deliveryLng = toCoord(order?.delivery_lng);
  const riderLat = toCoord(order?.rider?.last_lat);
  const riderLng = toCoord(order?.rider?.last_lng);
  const routeUrl = mapsRouteUrl(restaurantLat, restaurantLng, deliveryLat, deliveryLng);
  const embedUrl = mapsEmbedRouteUrl(restaurantLat, restaurantLng, deliveryLat, deliveryLng, mapSettings);
  const deliveryUrl = mapsPointUrl(deliveryLat, deliveryLng) || order?.delivery_map_url;
  const restaurantUrl = mapsPointUrl(restaurantLat, restaurantLng);
  const riderUrl = mapsPointUrl(riderLat, riderLng);

  return (
    <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-bold text-[#111827]">Restaurant to Delivery Map</h4>
          <p className="mt-1 text-sm text-[#64748b]">
            Restaurant pickup and customer delivery location together
            {order?.route_distance_km !== null && order?.route_distance_km !== undefined ? ` • ${order.route_distance_km} KM` : ""}.
          </p>
        </div>
        {routeUrl && (
          <a
            href={routeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            Open route
          </a>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] p-3 text-sm">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748b]">Restaurant</div>
          <div className="mt-1 font-semibold text-[#111827]">{order?.restaurant?.name || "-"}</div>
          <div className="mt-1 text-xs text-[#64748b]">{restaurantLat !== null && restaurantLng !== null ? `${restaurantLat}, ${restaurantLng}` : "Location missing"}</div>
        </div>
        <div className="rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] p-3 text-sm">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748b]">Customer</div>
          <div className="mt-1 font-semibold text-[#111827]">{order?.receiver_name || "-"}</div>
          <div className="mt-1 text-xs text-[#64748b]">{deliveryLat !== null && deliveryLng !== null ? `${deliveryLat}, ${deliveryLng}` : "Location missing"}</div>
        </div>
        <div className="rounded-[12px] border border-emerald-100 bg-emerald-50 p-3 text-sm">
          <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Live Rider</div>
          <div className="mt-1 font-semibold text-[#111827]">{order?.rider?.name || order?.accepted_rider_name || "-"}</div>
          <div className="mt-1 text-xs text-emerald-700">{riderLat !== null && riderLng !== null ? `${riderLat}, ${riderLng}` : "Location not started"}</div>
          <div className="mt-1 text-[11px] text-emerald-700">{order?.rider?.last_location_at ? `Updated ${formatDateTime(order.rider.last_location_at)}` : ""}</div>
        </div>
      </div>

      {embedUrl ? (
        <iframe
          title={`Route map ${order?.order_no || ""}`}
          src={embedUrl}
          className="mt-4 h-72 w-full rounded-[14px] border border-[#dfe6ef]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Restaurant and delivery coordinates are both required to show the route map.
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {restaurantUrl && (
          <a href={restaurantUrl} target="_blank" rel="noreferrer" className="rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-center text-sm font-semibold text-[#24324a] hover:bg-[#f8fafc]">
            Open restaurant
          </a>
        )}
        {deliveryUrl && (
          <a href={deliveryUrl} target="_blank" rel="noreferrer" className="rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-center text-sm font-semibold text-[#24324a] hover:bg-[#f8fafc]">
            Open delivery
          </a>
        )}
        {riderUrl && (
          <a href={riderUrl} target="_blank" rel="noreferrer" className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
            Open rider live
          </a>
        )}
      </div>
    </div>
  );
}

function FoodOrderViewModal({ loading, order, mapSettings, onClose }) {
  const items = order?.items || [];
  const detailRows = [
    ["Order No", order?.order_no],
    ["Status", order?.status],
    ["Payment", `${order?.payment_method || "-"} / ${order?.payment_status || "unpaid"}`],
    ["Customer", `${order?.receiver_name || "-"} (${order?.receiver_phone || "-"})`],
    ["Restaurant", order?.restaurant?.name || order?.restaurant_id],
    ["Rider Status", order?.rider_assignment_label],
    ["Accepted Rider", order?.accepted_rider_name ? `${order.accepted_rider_name} (${order.accepted_rider_phone || "-"})` : "-"],
    ["Rider Last Location", order?.rider?.last_lat && order?.rider?.last_lng ? `${order.rider.last_lat}, ${order.rider.last_lng}` : "-"],
    ["Rider Location Updated", formatDateTime(order?.rider?.last_location_at)],
    ["Pending Rider Requests", order?.pending_rider_requests_count ?? 0],
    ["Delivery Area", order?.delivery_area],
    ["Delivery Address", order?.delivery_address],
    ["Landmark", order?.landmark],
    ["Route Distance", order?.route_distance_km !== null && order?.route_distance_km !== undefined ? `${order.route_distance_km} KM` : "-"],
    ["Stored Charge Distance", order?.delivery_distance_km ? `${order.delivery_distance_km} KM` : "-"],
    ["Charge Mode", order?.delivery_charge_mode],
    ["Created", formatDateTime(order?.created_at)],
    ["Estimated Delivery", formatDateTime(order?.estimated_delivery_at)],
    ["Accepted", formatDateTime(order?.accepted_at)],
    ["Delivered", formatDateTime(order?.delivered_at)],
    ["Order Note", order?.order_note],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[18px] border border-[#dfe6ef] bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf1f6] px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ee0012]">Order Details</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">{order?.order_no || "Loading order"}</h3>
            <p className="mt-1 text-sm text-[#64748b]">Food items, customer delivery location, payment and totals.</p>
          </div>
          <button className="rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {loading ? (
            <div className="rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] p-5 text-sm text-[#64748b]">Loading order details...</div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1fr,0.85fr]">
              <div className="space-y-4">
                <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-4 shadow-sm">
                  <h4 className="text-base font-bold text-[#111827]">Ordered Items</h4>
                  <div className="mt-4 overflow-hidden rounded-[14px] border border-[#edf1f6]">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#53637a]">
                        <tr>
                          <th className="px-3 py-3 text-left">Item</th>
                          <th className="px-3 py-3 text-right">Qty</th>
                          <th className="px-3 py-3 text-right">Unit</th>
                          <th className="px-3 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-t border-[#edf1f6]">
                            <td className="px-3 py-3">
                              <div className="font-semibold text-[#111827]">{item.name}</div>
                              {item.note && (
                                <div className="mt-1 text-xs text-[#64748b]">
                                  Note: {item.note}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">{item.quantity}</td>
                            <td className="px-3 py-3 text-right">BDT {item.unit_price}</td>
                            <td className="px-3 py-3 text-right font-semibold">BDT {item.total_price}</td>
                          </tr>
                        ))}
                        {!items.length && (
                          <tr>
                            <td className="px-3 py-6 text-center text-[#64748b]" colSpan={4}>No items found for this order.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-4 shadow-sm">
                  <h4 className="text-base font-bold text-[#111827]">Billing Summary</h4>
                  <div className="mt-4 space-y-2 text-sm">
                    <SummaryLine label="Items Total" value={`BDT ${order?.items_total || 0}`} />
                    <SummaryLine label="Delivery Fee" value={`BDT ${order?.delivery_fee || 0}`} />
                    <SummaryLine label="Discount" value={`BDT ${order?.discount_amount || 0}`} />
                    <div className="border-t border-[#edf1f6] pt-2">
                      <SummaryLine label="Grand Total" value={`BDT ${order?.grand_total || 0}`} strong />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <FoodOrderRouteMap order={order} mapSettings={mapSettings} />
                <div className="rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] p-4">
                  <h4 className="text-base font-bold text-[#111827]">Delivery & Customer</h4>
                  <div className="mt-4 space-y-3 text-sm">
                    {detailRows.map(([label, value]) => (
                      <div key={label} className="rounded-[12px] bg-white p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748b]">{label}</div>
                        <div className="mt-1 break-words font-medium text-[#111827]">{value || "-"}</div>
                      </div>
                    ))}
                  </div>
                  {order?.delivery_map_url && (
                    <a
                      href={order.delivery_map_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-[12px] border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
                    >
                      View delivery location on map
                    </a>
                  )}
                </div>
                <div className="rounded-[16px] border border-[#dfe6ef] bg-white p-4 shadow-sm">
                  <h4 className="text-base font-bold text-[#111827]">Rider Assignment</h4>
                  <div className="mt-3 rounded-[12px] border border-[#edf1f6] bg-[#f8fafc] p-3 text-sm">
                    <div className="font-bold text-[#111827]">{order?.rider_assignment_label || "No rider accepted yet"}</div>
                    <div className="mt-1 text-[#64748b]">
                      {order?.accepted_rider_name
                        ? `${order.accepted_rider_name} (${order.accepted_rider_phone || "-"}) accepted this order.`
                        : `${order?.pending_rider_requests_count || 0} rider request pending, ${order?.total_rider_requests_count || 0} total request sent.`}
                    </div>
                  </div>
                  {!!order?.rider_requests?.length && (
                    <div className="mt-3 overflow-hidden rounded-[12px] border border-[#edf1f6]">
                      <table className="w-full text-sm">
                        <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#53637a]">
                          <tr>
                            <th className="px-3 py-2 text-left">Rider</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-right">Distance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.rider_requests.map((request) => (
                            <tr key={request.id} className="border-t border-[#edf1f6]">
                              <td className="px-3 py-2">
                                <div className="font-semibold text-[#111827]">{request.rider?.name || `Rider #${request.rider_id}`}</div>
                                <div className="text-xs text-[#64748b]">{request.rider?.phone || "-"}</div>
                              </td>
                              <td className="px-3 py-2 capitalize">{String(request.status || "-").replace(/_/g, " ")}</td>
                              <td className="px-3 py-2 text-right">{request.distance_km ? `${request.distance_km} KM` : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryLine({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-bold text-[#111827]" : "text-[#64748b]"}>{label}</span>
      <span className={strong ? "text-lg font-black text-[#111827]" : "font-semibold text-[#111827]"}>{value}</span>
    </div>
  );
}

export default function FoodAdminPage({ token, resource }) {
  const config = RESOURCE_CONFIG[resource] || RESOURCE_CONFIG["food-items"];
  const [records, setRecords] = useState([]);
  const [columns, setColumns] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
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
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [mapSettings, setMapSettings] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/admin/resources/${resource}?search=${encodeURIComponent(search)}`, { token });
      setRecords(data.data || []);
      setColumns(data.columns || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message || "Unable to load food data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm(emptyForm(config));
    setEditingId(null);
    setModalOpen(false);
    setImageFile(null);
    setImagePreview("");
    load();
  }, [resource]);

  useEffect(() => {
    load();
  }, [search, token]);

  useEffect(() => {
    if (resource !== "food-orders" || mapSettings) return undefined;
    let alive = true;
    apiRequest("/map-settings")
      .then((data) => {
        if (alive) setMapSettings(data.settings || null);
      })
      .catch(() => {
        if (alive) setMapSettings(null);
      });
    return () => {
      alive = false;
    };
  }, [resource, mapSettings]);

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
    if (!viewOpen || resource !== "food-orders" || !viewOrder?.id) return undefined;
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
    setError("");
    try {
      const data = await apiRequest(`/admin/resources/${resource}/${record.id}`, { token });
      setViewOrder(data);
    } catch (err) {
      setError(err.message || "Unable to load order details.");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
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

    try {
      let payload = buildPayload(form, config);
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
      setRecords((prev) => (mode === "create" ? [record, ...prev] : prev.map((row) => (row.id === record.id ? record : row))));
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    }
  };

  const deleteRow = async (id) => {
    if (!window.confirm("Delete this food record? This action cannot be undone.")) return;
    await apiRequest(`/admin/resources/${resource}/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((row) => row.id !== id));
  };

  const renderField = (field) => {
    const common = {
      value: form[field.key] ?? "",
      onChange: (e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value })),
      placeholder: field.placeholder || "",
    };
    if (field.type === "checkbox") {
      return (
        <label className="flex items-center gap-3 rounded-[12px] border border-[#dfe6ef] bg-white px-3 py-3 text-sm font-semibold text-[#24324a]">
          <input
            type="checkbox"
            checked={Boolean(form[field.key])}
            onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.checked }))}
            className="h-4 w-4 accent-[#ee0012]"
          />
          {field.label}
        </label>
      );
    }
    if (field.type === "textarea" || field.type === "addons") {
      return (
        <label className="block text-sm font-semibold text-[#24324a]">
          {field.label}
          <textarea
            className="mt-1.5 min-h-[96px] w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] shadow-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
            {...common}
          />
        </label>
      );
    }
    if (field.type === "select") {
      return (
        <label className="block text-sm font-semibold text-[#24324a]">
          {field.label}
          <select
            className="mt-1.5 w-full rounded-[14px] border border-[#dfe6ef] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] shadow-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10"
            {...common}
          >
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      );
    }
    return <Input label={field.label} type={field.type || "text"} {...common} />;
  };

  const renderValue = (record, col) => {
    const value = record[col];
    if (col === "image_url") {
      return value ? <img src={value} alt="" className="h-12 w-16 rounded-[10px] object-cover" /> : <span className="text-[#94a3b8]">No image</span>;
    }
    if (value === null || value === undefined || value === "") return "-";
    if (col === "rider_assignment_label") {
      const waiting = String(value).toLowerCase().includes("waiting");
      const accepted = String(value).toLowerCase().includes("accepted");
      const cls = accepted
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : waiting
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600";
      return <span className={`inline-flex rounded-[10px] border px-2.5 py-1 text-xs font-bold ${cls}`}>{value}</span>;
    }
    if (col === "route_distance_km") {
      return `${value} KM`;
    }
    if (col === "delivery_map_url") {
      return (
        <a href={value} target="_blank" rel="noreferrer" className="font-semibold text-red-700 hover:underline">
          View map
        </a>
      );
    }
    if (dateFields.has(col) || col.endsWith("_at")) return formatDateTime(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value).slice(0, 80);
    return String(value).length > 80 ? `${String(value).slice(0, 80)}...` : String(value);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-[#dfe6ef] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ee0012]">Food Delivery</p>
            <h2 className="mt-1 text-xl font-bold text-[#111827]">{config.title}</h2>
            <p className="mt-1 text-sm text-[#64748b]">{config.description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              placeholder="Search food records"
              className="w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm sm:w-72"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button onClick={openCreate}>Create New</Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[860px] w-full text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#53637a]">
            <tr>
              {visibleColumns.map((col) => (
                <th key={col} className="px-4 py-3 text-left">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-[#edf1f6]">
                {visibleColumns.map((col) => (
                  <td key={`${record.id}-${col}`} className="px-4 py-3 align-middle">
                    {renderValue(record, col)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {resource === "food-orders" && (
                      <Button variant="ghost" onClick={() => openViewOrder(record)}>
                        View
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => openEdit(record)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => deleteRow(record.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="px-4 py-8 text-center text-[#64748b]">
                  {loading ? "Loading..." : "No food records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-[#64748b]">Total records: {meta?.total || records.length}</div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[18px] border border-[#dfe6ef] bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-center justify-between border-b border-[#edf1f6] px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">{mode === "create" ? `Create ${config.title}` : `Edit ${config.title}`}</h3>
                <p className="text-xs text-[#64748b]">Manual form. No JSON editing required.</p>
              </div>
              <button className="rounded-[12px] border border-[#dfe6ef] px-3 py-2 text-sm" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {config.imageTarget && (
                <div className="mb-5 rounded-[16px] border border-[#dfe6ef] bg-[#f8fafc] p-4">
                  <p className="text-sm font-bold text-[#24324a]">Image Upload</p>
                  <p className="mt-1 text-xs text-[#64748b]">Upload a real image for this record. It will be saved after the record is created/updated.</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="h-28 w-36 overflow-hidden rounded-[14px] border border-[#dfe6ef] bg-white">
                      {imagePreview ? <img src={imagePreview} className="h-full w-full object-cover" alt="" /> : <div className="grid h-full place-items-center text-xs text-[#94a3b8]">No image</div>}
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="text-sm" />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {config.fields.map((field) => (
                  <div key={field.key} className={field.type === "textarea" || field.type === "addons" ? "md:col-span-2" : ""}>
                    {renderField(field)}
                    {field.type === "addons" && <p className="mt-1 text-xs text-[#64748b]">One add-on per line, format: Extra Sauce:20</p>}
                    {field.type === "tags" && <p className="mt-1 text-xs text-[#64748b]">Separate values with comma.</p>}
                    {fieldErrors[field.key] && <p className="mt-1 text-xs text-red-600">{fieldErrors[field.key]}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#edf1f6] px-5 py-4">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={uploading}>
                {uploading ? "Uploading..." : "Save Record"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {viewOpen && (
        <FoodOrderViewModal
          loading={viewLoading}
          order={viewOrder}
          mapSettings={mapSettings}
          onClose={() => {
            setViewOpen(false);
            setViewOrder(null);
          }}
        />
      )}
    </div>
  );
}
