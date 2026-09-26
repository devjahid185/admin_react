import { useEffect, useMemo, useState } from "react";
import BulkDeleteBar, { toggleSelectedId, toggleVisibleIds, visibleSelectionState } from "../../components/BulkDeleteBar.jsx";
import Button from "../../components/Button.jsx";
import ImageUploadPreview from "../../components/ImageUploadPreview.jsx";
import Input from "../../components/Input.jsx";
import Pagination from "../../components/Pagination.jsx";
import { apiRequest, apiUpload } from "../../lib/api.js";

const fd2Css = `
@keyframes fd2Rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fd2Pop{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes fd2Fade{from{opacity:0}to{opacity:1}}
@keyframes fd2Ring{0%{box-shadow:0 0 0 0 rgba(238,0,18,.4)}100%{box-shadow:0 0 0 8px rgba(238,0,18,0)}}
.fd2-rise{opacity:0;animation:fd2Rise .55s cubic-bezier(.2,.8,.2,1) var(--d,0ms) forwards}
.fd2-pop{opacity:0;animation:fd2Pop .35s cubic-bezier(.2,.8,.2,1) both}
.fd2-fade{animation:fd2Fade .2s ease both}
.fd2-ring{animation:fd2Ring 1.8s ease-out infinite}
@media (prefers-reduced-motion:reduce){.fd2-rise,.fd2-pop,.fd2-fade,.fd2-ring{animation:none!important;opacity:1!important}}
`;

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
    columns: ["id", "image_url", "name", "restaurant_id", "food_category_id", "price", "discount_price", "promotion_badge", "promotion_priority", "is_promoted", "is_available", "status"],
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
      { key: "notes", label: "Settlement Notes", type: "textarea" },
    ],
    columns: ["id", "code", "title", "discount_type", "discount_value", "applies_to", "funding_source", "minimum_order", "used_count", "usage_limit", "is_active"],
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
    columns: ["id", "order_no", "restaurant", "payment_method", "payment_status", "manual_transaction_id", "payment_proof_photo_url", "rider_assignment_label", "accepted_rider_name", "route_distance_km", "receiver_name", "status", "grand_total", "created_at"],
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
const dateFields = new Set([
  "created_at",
  "updated_at",
  "starts_at",
  "ends_at",
  "estimated_delivery_at",
  "accepted_at",
  "preparing_at",
  "picked_up_at",
  "on_the_way_at",
  "delivered_at",
  "cancelled_at",
  "rejected_at",
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
    return [
      {
        status: "payment_pending",
        label: "Payment Pending",
        timestamp: order?.created_at,
        completed: true,
        current: true,
      },
    ];
  }
  const terminalStep =
    currentStatus === "cancelled"
      ? [["cancelled", "Cancelled", "cancelled_at"]]
      : currentStatus === "rejected"
        ? [["rejected", "Rejected", "rejected_at"]]
        : [];
  const steps = [...baseSteps, ...terminalStep];
  const currentIndex = Math.max(
    0,
    steps.findIndex(([status]) => status === currentStatus),
  );

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
function OrderProgressTimeline({ order, isMedicine }) {
  const items = orderProgressItems(order, isMedicine);

  return (
    <div className="fd2-rise rounded-[22px] border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-black text-[#111]">Order Progress</h4>
          <p className="mt-1 text-sm font-medium text-[#6b7280]">
            Status update time and date are tracked from order placement to delivery.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#111] px-3 py-1 text-xs font-black capitalize text-white">
          {String(order?.status || "pending").replace(/_/g, " ")}
        </span>
      </div>

      <div className="mt-4 space-y-0">
        {items.map((item, index) => (
          <div key={item.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black transition ${
                  item.completed
                    ? item.current
                      ? "fd2-ring border-[#ee0012] bg-[#ee0012] text-white"
                      : "border-[#111] bg-[#111] text-white"
                    : "border-[#ececec] bg-[#fafafa] text-[#9ca3af]"
                }`}
              >
                {item.completed ? "✓" : index + 1}
              </div>
              {index !== items.length - 1 && (
                <div className={`h-11 w-px ${item.completed ? "bg-[#ee0012]/30" : "bg-[#ececec]"}`} />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-[#111]">{item.label}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#6b7280]">
                    <span>Time</span>
                    <span className="text-[#d1d5db]">•</span>
                    <span>{formatDateTime(item.timestamp)}</span>
                  </div>
                </div>
                {item.current && (
                  <span className="shrink-0 rounded-full bg-[#fef2f2] px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#ee0012]">
                    Current
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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
    <div className="fd2-rise rounded-[22px] border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-black text-[#111]">{pickupLabel} to Delivery Map</h4>
          <p className="mt-1 text-sm font-medium text-[#6b7280]">
            {pickupLabel} and customer delivery location together
            {order?.route_distance_km !== null && order?.route_distance_km !== undefined ? ` • ${order.route_distance_km} KM` : ""}.
          </p>
        </div>
        {routeUrl && (
          <a
            href={routeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-[#ee0012] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[#c8000f]"
          >
            Open route
          </a>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-3 text-sm">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">{pickupLabel}</div>
          <div className="mt-1 font-semibold text-[#111]">{order?.restaurant?.name || (isMedicine ? "Medicine Store" : "-")}</div>
          <div className="mt-1 text-xs text-[#9ca3af]">{restaurantLat !== null && restaurantLng !== null ? `${restaurantLat}, ${restaurantLng}` : "Location missing"}</div>
        </div>
        <div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-3 text-sm">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Customer</div>
          <div className="mt-1 font-semibold text-[#111]">{order?.receiver_name || "-"}</div>
          <div className="mt-1 text-xs text-[#9ca3af]">{deliveryLat !== null && deliveryLng !== null ? `${deliveryLat}, ${deliveryLng}` : "Location missing"}</div>
        </div>
        <div className="rounded-2xl border border-[#111] bg-[#111] p-3 text-sm text-white">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white/60">
            <span className="fd2-ring h-1.5 w-1.5 rounded-full bg-[#ee0012]" />
            Live Rider
          </div>
          <div className="mt-1 font-semibold">{order?.rider?.name || order?.accepted_rider_name || "-"}</div>
          <div className="mt-1 text-xs text-white/60">{riderLat !== null && riderLng !== null ? `${riderLat}, ${riderLng}` : "Location not started"}</div>
          <div className="mt-1 text-[11px] text-white/50">{order?.rider?.last_location_at ? `Updated ${formatDateTime(order.rider.last_location_at)}` : ""}</div>
        </div>
      </div>

      {embedUrl ? (
        <iframe
          title={`Route map ${order?.order_no || ""}`}
          src={embedUrl}
          className="mt-4 h-72 w-full rounded-2xl border border-[#ececec]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="mt-4 rounded-2xl border border-[#ee0012]/20 bg-[#fef2f2] p-4 text-sm font-semibold text-[#b91c1c]">
          Pickup and delivery coordinates are both required to show the route map.
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {restaurantUrl && (
          <a href={restaurantUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[#ececec] px-3 py-2 text-center text-sm font-semibold text-[#374151] transition hover:border-[#ee0012]/40 hover:text-[#ee0012]">
            Open pickup
          </a>
        )}
        {deliveryUrl && (
          <a href={deliveryUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[#ececec] px-3 py-2 text-center text-sm font-semibold text-[#374151] transition hover:border-[#ee0012]/40 hover:text-[#ee0012]">
            Open delivery
          </a>
        )}
        {riderUrl && (
          <a href={riderUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-[#111] px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-black">
            Open rider live
          </a>
        )}
      </div>
    </div>
  );
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

function normalizeRecord(record, config) {
  const form = emptyForm(config);
  config.fields.forEach((field) => {
    const value = record[field.key];
    if (field.type === "checkbox") form[field.key] = Boolean(value);
    else if (field.type === "tags") form[field.key] = Array.isArray(value) ? value.join(", ") : value || "";
    else if (field.type === "addons") form[field.key] = formatAddons(value);
    else if (field.type === "size_prices") form[field.key] = formatSizePrices(value);
    else if (field.type === "datetime-local") form[field.key] = value ? String(value).replace(" ", "T").slice(0, 16) : "";
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

function mapsEmbedRouteUrl(fromLat, fromLng, toLat, toLng) {
  if ([fromLat, fromLng, toLat, toLng].some((value) => value === null)) return null;
  return `https://maps.google.com/maps?saddr=${fromLat},${fromLng}&daddr=${toLat},${toLng}&output=embed`;
}

function mapsPointUrl(lat, lng) {
  if (lat === null || lng === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function FoodOrderViewModal({ loading, order, onClose }) {
  const items = order?.items || [];
  const paymentProofUrl = order?.payment_proof_photo_url || order?.payment_proof_photo;
  const deliveryProofUrl = order?.delivery_proof_photo_url || order?.delivery_proof_photo;
  const isMedicine = order?.service_type === "medicine" || order?.order_no?.startsWith?.("MD-") || items.some((item) => item.brand_name);
  const serviceLabel = isMedicine ? "Medicine" : "Food";
  const pickupLabel = isMedicine ? "Medicine Store" : "Restaurant";
  const detailRows = [
    ["Order No", order?.order_no],
    ["Status", order?.status],
    ["Payment", `${order?.payment_method || "-"} / ${order?.payment_status || "unpaid"}`],
    ["Transaction ID", order?.manual_transaction_id],
    ["Customer", `${order?.receiver_name || "-"} (${order?.receiver_phone || "-"})`],
    [pickupLabel, order?.restaurant?.name || order?.restaurant_id || (isMedicine ? "Medicine Store" : "-")],
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
    ["Picked Up", formatDateTime(order?.picked_up_at)],
    ["Delivered", formatDateTime(order?.delivered_at)],
    ["Order Note", order?.order_note],
  ];

  return (
    <div className="fd2-fade fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm">
      <div className="fd2-pop flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[26px] border border-[#ececec] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#ececec] px-5 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ee0012]">Order Details</p>
            <h3 className="mt-1 text-xl font-black text-[#111]">{order?.order_no || "Loading order"}</h3>
            <p className="mt-1 text-sm font-medium text-[#6b7280]">{serviceLabel} items, customer delivery location, rider requests, payment and totals.</p>
          </div>
          <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg font-bold text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#111]" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#ececec] bg-[#fafafa] p-5 text-sm font-semibold text-[#6b7280]">
              <span className="fd2-ring h-2.5 w-2.5 rounded-full bg-[#ee0012]" />
              Loading order details...
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1fr,0.85fr]">
              <div className="space-y-4">
                <div className="rounded-[22px] border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <h4 className="text-base font-black text-[#111]">Ordered {serviceLabel} Items</h4>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#f0f0f0]">
                    <table className="w-full text-sm">
                      <thead className="bg-[#fafafa] text-xs uppercase tracking-wide text-[#6b7280]">
                        <tr>
                          <th className="px-3 py-3 text-left">Item</th>
                          <th className="px-3 py-3 text-right">Qty</th>
                          <th className="px-3 py-3 text-right">Unit</th>
                          <th className="px-3 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-t border-[#f3f4f6]">
                            <td className="px-3 py-3">
                              <div className="font-semibold text-[#111]">{item.name || item.brand_name || "Medicine"}</div>
                              {(item.generic_name || item.strength || item.company) && (
                                <div className="mt-1 text-xs text-[#9ca3af]">
                                  {[item.generic_name, item.strength, item.company].filter(Boolean).join(" · ")}
                                </div>
                              )}
                              {item.note && <div className="mt-1 text-xs text-[#9ca3af]">Note: {item.note}</div>}
                            </td>
                            <td className="px-3 py-3 text-right">{item.quantity}</td>
                            <td className="px-3 py-3 text-right">BDT {item.unit_price}</td>
                            <td className="px-3 py-3 text-right font-semibold">BDT {item.total_price}</td>
                          </tr>
                        ))}
                        {!items.length && (
                          <tr>
                            <td className="px-3 py-6 text-center text-[#9ca3af]" colSpan={4}>No items found for this order.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <h4 className="text-base font-black text-[#111]">Billing Summary</h4>
                  <div className="mt-4 space-y-2 text-sm">
                    <SummaryLine label="Items Total" value={`BDT ${order?.items_total || 0}`} />
                    {order?.service_type !== "medicine" && (
                      <>
                        <SummaryLine label="Restaurant Commission" value={`BDT ${order?.restaurant_commission_amount || 0}`} />
                        <SummaryLine label="Restaurant Discount Cost" value={`BDT ${order?.restaurant_discount_amount || 0}`} />
                        <SummaryLine label="Restaurant Owner Payable" value={`BDT ${order?.restaurant_owner_payable || 0}`} />
                        <SummaryLine label="Restaurant Payout Status" value={order?.restaurant_payout_status || "pending"} />
                        {order?.restaurant_payout_reference && <SummaryLine label="Restaurant Payout Ref" value={order.restaurant_payout_reference} />}
                        <SummaryLine label="Admin Total Income" value={`BDT ${order?.admin_total_income || 0}`} />
                      </>
                    )}
                    <SummaryLine label="Delivery Fee" value={`BDT ${order?.delivery_fee || 0}`} />
                    <SummaryLine label="Rider Payout" value={`BDT ${order?.rider_earning || 0}`} />
                    <SummaryLine label="Admin Delivery Income" value={`BDT ${order?.admin_delivery_income || 0}`} />
                    <SummaryLine label="Discount" value={`BDT ${order?.discount_amount || 0}`} />
                    <SummaryLine label="Admin-funded Discount" value={`BDT ${order?.admin_discount_amount || 0}`} />
                    <SummaryLine label="Restaurant-funded Discount" value={`BDT ${order?.restaurant_discount_amount || 0}`} />
                    <SummaryLine label="Delivery Discount" value={`BDT ${order?.delivery_discount_amount || 0}`} />
                    <div className="border-t border-[#f3f4f6] pt-2">
                      <SummaryLine label="Grand Total" value={`BDT ${order?.grand_total || 0}`} strong />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <FoodOrderRouteMap order={order} />
                <OrderProgressTimeline order={order} isMedicine={isMedicine} />
                <div className="rounded-[22px] border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-[#111]">Payment Proof</h4>
                      <p className="mt-1 text-sm font-medium text-[#6b7280]">Customer submitted manual payment transaction and optional screenshot.</p>
                    </div>
                    <PaymentMethodBadge method={order?.payment_method} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#fafafa] p-3">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Transaction ID</div>
                      <div className="mt-1 break-words font-bold text-[#111]">{order?.manual_transaction_id || "-"}</div>
                    </div>
                    <div className="rounded-2xl bg-[#fafafa] p-3">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">Proof Status</div>
                      <div className={`mt-1 font-bold ${paymentProofUrl ? "text-[#ee0012]" : "text-[#9ca3af]"}`}>
                        {paymentProofUrl ? "Screenshot submitted" : "No screenshot"}
                      </div>
                    </div>
                  </div>
                  {paymentProofUrl && (
                    <a href={paymentProofUrl} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-2xl border border-[#ececec] bg-[#fafafa] transition hover:border-[#ee0012]/40">
                      <img src={paymentProofUrl} alt="Payment proof" className="h-56 w-full object-cover" />
                      <div className="flex items-center justify-between px-4 py-3 text-sm font-bold text-[#ee0012]">
                        <span>Open full payment proof</span>
                        <span>↗</span>
                      </div>
                    </a>
                  )}
                  {deliveryProofUrl && (
                    <a href={deliveryProofUrl} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-2xl border border-[#ececec] bg-[#fafafa] transition hover:border-[#111]/30">
                      <img src={deliveryProofUrl} alt="Delivery proof" className="h-56 w-full object-cover" />
                      <div className="flex items-center justify-between px-4 py-3 text-sm font-bold text-[#111]">
                        <span>Open full delivery proof</span>
                        <span>↗</span>
                      </div>
                    </a>
                  )}
                </div>
                <div className="rounded-[22px] border border-[#ececec] bg-[#fafafa] p-4">
                  <h4 className="text-base font-black text-[#111]">Delivery & Customer</h4>
                  <div className="mt-4 space-y-3 text-sm">
                    {detailRows.map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">{label}</div>
                        <div className="mt-1 break-words font-medium text-[#111]">{value || "-"}</div>
                      </div>
                    ))}
                  </div>
                  {order?.delivery_map_url && (
                    <a
                      href={order.delivery_map_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#ee0012] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#c8000f]"
                    >
                      View delivery location on map
                    </a>
                  )}
                </div>
                <div className="rounded-[22px] border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <h4 className="text-base font-black text-[#111]">Rider Assignment</h4>
                  <div className="mt-3 rounded-2xl border border-[#f0f0f0] bg-[#fafafa] p-3 text-sm">
                    <div className="font-bold text-[#111]">{order?.rider_assignment_label || "No rider accepted yet"}</div>
                    <div className="mt-1 text-[#6b7280]">
                      {order?.accepted_rider_name
                        ? `${order.accepted_rider_name} (${order.accepted_rider_phone || "-"}) accepted this order.`
                        : `${order?.pending_rider_requests_count || 0} rider request pending, ${order?.total_rider_requests_count || 0} total request sent.`}
                    </div>
                  </div>
                  {!!order?.rider_requests?.length && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-[#f0f0f0]">
                      <table className="w-full text-sm">
                        <thead className="bg-[#fafafa] text-xs uppercase tracking-wide text-[#6b7280]">
                          <tr>
                            <th className="px-3 py-2 text-left">Rider</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-right">Distance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.rider_requests.map((request) => (
                            <tr key={request.id} className="border-t border-[#f3f4f6]">
                              <td className="px-3 py-2">
                                <div className="font-semibold text-[#111]">{request.rider?.name || `Rider #${request.rider_id}`}</div>
                                <div className="text-xs text-[#9ca3af]">{request.rider?.phone || "-"}</div>
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

function FoodOrderFilterBar({ filters, onChange, hideRestaurant = false }) {
  const update = (key, value) => onChange((prev) => ({ ...prev, [key]: value }));
  const clear = () => onChange({ payment_method: "", payment_status: "", status: "", restaurant_id: "", date_from: "", date_to: "" });
  return (
    <div className="fd2-rise rounded-2xl border border-[#ececec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <FilterField label="Payment">
          <select value={filters.payment_method} onChange={(e) => update("payment_method", e.target.value)} className={filterInputClass}>
            <option value="">All methods</option>
            <option value="cash_on_delivery">COD</option>
            <option value="manual_bkash">Manual bKash</option>
            <option value="manual_nagad">Manual Nagad</option>
            <option value="online">Online</option>
          </select>
        </FilterField>
        <FilterField label="Payment Status">
          <select value={filters.payment_status} onChange={(e) => update("payment_status", e.target.value)} className={filterInputClass}>
            <option value="">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </FilterField>
        <FilterField label="Order Status">
          <select value={filters.status} onChange={(e) => update("status", e.target.value)} className={filterInputClass}>
            <option value="">All</option>
            {["pending", "accepted", "preparing", "picked_up", "on_the_way", "delivered", "cancelled", "rejected"].map((status) => (
              <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
            ))}
          </select>
        </FilterField>
        {!hideRestaurant && (
          <FilterField label="Restaurant ID">
            <input value={filters.restaurant_id} onChange={(e) => update("restaurant_id", e.target.value)} className={filterInputClass} placeholder="Restaurant ID" />
          </FilterField>
        )}
        <FilterField label="From">
          <input type="date" value={filters.date_from} onChange={(e) => update("date_from", e.target.value)} className={filterInputClass} />
        </FilterField>
        <FilterField label="To">
          <input type="date" value={filters.date_to} onChange={(e) => update("date_to", e.target.value)} className={filterInputClass} />
        </FilterField>
        <Button variant="ghost" onClick={clear}>Clear filters</Button>
      </div>
    </div>
  );
}

const filterInputClass = "mt-1.5 w-full rounded-xl border border-[#ececec] bg-white px-3 py-2 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10";

function FilterField({ label, children }) {
  return (
    <label className="min-w-[150px] flex-1 text-xs font-bold uppercase tracking-wide text-[#6b7280]">
      {label}
      {children}
    </label>
  );
}

function FoodPaymentSummaryPanel({ summary, loading }) {
  const totals = summary?.totals || {};
  const owners = summary?.by_owner || [];
  const methods = summary?.by_method || [];
  const services = summary?.by_service || [];
  const settings = summary?.settings || {};
  return (
    <div className="fd2-rise space-y-4 rounded-[26px] border border-[#ececec] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ee0012]">Income Reconciliation</p>
          <h3 className="text-lg font-black text-[#111]">Admin income, rider payout and delivery charge</h3>
        </div>
        {loading && (
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#6b7280]">
            <span className="fd2-ring h-2 w-2 rounded-full bg-[#ee0012]" />
            Refreshing...
          </span>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-12">
        <SummaryCard label="Orders" value={totals.orders_count || 0} />
        <SummaryCard label="Grand Total" value={money(totals.grand_total)} />
        <SummaryCard label="Owner Received" value={money(totals.owner_received_total)} tone="dark" />
        <SummaryCard label="COD Collectable" value={money(totals.cod_collectable_total)} tone="gray" />
        <SummaryCard label="Delivery Charge" value={money(totals.delivery_fee_total)} tone="gray" />
        <SummaryCard label="Discounts" value={money(totals.discount_total)} tone="gray" />
        <SummaryCard label="Admin Discount" value={money(totals.admin_discount_total)} tone="red" />
        <SummaryCard label="Restaurant Discount" value={money(totals.restaurant_discount_total)} tone="dark" />
        <SummaryCard label="Admin Income" value={money(totals.admin_delivery_income_total)} tone="red" />
        <SummaryCard label="Restaurant Commission" value={money(totals.restaurant_commission_total)} tone="gray" />
        <SummaryCard label="Total Admin Income" value={money(totals.admin_total_income)} tone="red" />
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <SummaryCard label="Rider Payout" value={money(totals.rider_payout_total)} tone="gray" />
        <SummaryCard label="Owner Payable" value={money(totals.restaurant_owner_payable_total)} tone="dark" />
        <SummaryCard label="COD Owner Due" value={money(totals.owner_settlement_due_total)} tone="gray" />
        <SummaryCard label="Delivered Orders" value={totals.delivered_orders_count ?? "-"} />
        <SummaryCard label="Current Rider Rule" value={`Fixed ${money(settings.rider_fixed_earning)} • KM ${money(settings.rider_per_km_earning)}`} tone="dark" />
      </div>
      {services.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((row) => (
            <div key={row.service_type} className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-black capitalize text-[#111]">{row.service_type} Delivery</h4>
                <span className="rounded-full border border-[#ececec] bg-white px-2.5 py-1 text-xs font-black text-[#6b7280]">{row.orders_count} orders</span>
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
        <div className="overflow-x-auto rounded-2xl border border-[#f0f0f0]">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-[#fafafa] text-xs uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-3 py-3 text-left">Owner / Restaurant</th>
                <th className="px-3 py-3 text-right">Orders</th>
                <th className="px-3 py-3 text-right">Owner Received</th>
                <th className="px-3 py-3 text-right">COD Collectable</th>
                <th className="px-3 py-3 text-right">Delivery Charge</th>
                <th className="px-3 py-3 text-right">Rider Payout</th>
                <th className="px-3 py-3 text-right">Admin Income</th>
                <th className="px-3 py-3 text-right">Restaurant Commission</th>
                <th className="px-3 py-3 text-right">Owner Payable</th>
                <th className="px-3 py-3 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((row) => (
                <tr key={row.restaurant_id || row.restaurant_name} className="border-t border-[#f3f4f6] transition hover:bg-[#fef2f2]/50">
                  <td className="px-3 py-3">
                    <div className="font-bold text-[#111]">{row.restaurant_name}</div>
                    <div className="mt-1 text-xs text-[#9ca3af]">Owner ID: {row.owner_user_id || "-"} · bKash: {row.bkash_number || "-"} · Nagad: {row.nagad_number || "-"}</div>
                  </td>
                  <td className="px-3 py-3 text-right">{row.orders_count}</td>
                  <td className="px-3 py-3 text-right font-bold text-[#111]">{money(row.owner_received_total)}</td>
                  <td className="px-3 py-3 text-right font-bold text-[#6b7280]">{money(row.cod_collectable_total)}</td>
                  <td className="px-3 py-3 text-right">{money(row.delivery_fee_total)}</td>
                  <td className="px-3 py-3 text-right">{money(row.rider_payout_total)}</td>
                  <td className="px-3 py-3 text-right font-bold text-[#ee0012]">{money(row.admin_total_income)}</td>
                  <td className="px-3 py-3 text-right">{money(row.restaurant_commission_total)}</td>
                  <td className="px-3 py-3 text-right font-bold text-[#111]">{money(row.restaurant_owner_payable_total)}</td>
                  <td className="px-3 py-3 text-right font-bold">{money(row.grand_total)}</td>
                </tr>
              ))}
              {!owners.length && (
                <tr><td colSpan={10} className="px-3 py-5 text-center text-[#9ca3af]">No payment data found for selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-[#f0f0f0] p-4">
          <h4 className="font-black text-[#111]">Payment method breakdown</h4>
          <div className="mt-3 space-y-3">
            {methods.map((row) => (
              <div key={row.payment_method} className="rounded-2xl bg-[#fafafa] p-3">
                <div className="flex items-center justify-between gap-3">
                  <PaymentMethodBadge method={row.payment_method} />
                  <span className="text-xs font-bold text-[#6b7280]">{row.orders_count} orders</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Total {money(row.grand_total)}</span>
                  <span>Admin {money(row.admin_total_income)}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-[#9ca3af]">
                  <span>Delivery {money(row.delivery_fee_total)}</span>
                  <span>Commission {money(row.restaurant_commission_total)}</span>
                </div>
              </div>
            ))}
            {!methods.length && <div className="text-sm text-[#9ca3af]">No method data.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone = "gray" }) {
  const tones = {
    gray: "border-[#ececec] bg-[#fafafa] text-[#111]",
    dark: "border-[#111] bg-[#111] text-white",
    red: "border-[#ee0012]/20 bg-[#fef2f2] text-[#ee0012]",
  };
  return (
    <div className={`rounded-2xl border p-3 ${tones[tone] || tones.gray}`}>
      <div className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280]">{label}</div>
      <div className="mt-1 text-base font-black text-[#111]">{value}</div>
    </div>
  );
}

function PaymentMethodBadge({ method }) {
  const map = {
    cash_on_delivery: ["COD", "border-[#ececec] bg-[#fafafa] text-[#374151]"],
    manual_bkash: ["Owner bKash", "border-[#ee0012]/20 bg-[#fef2f2] text-[#ee0012]"],
    manual_nagad: ["Owner Nagad", "border-[#111] bg-[#111] text-white"],
    online: ["Online", "border-[#ececec] bg-white text-[#111]"],
  };
  const [label, cls] = map[method] || [method || "-", "border-[#ececec] bg-[#fafafa] text-[#6b7280]"];
  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${cls}`}>{label}</span>;
}

function PaymentStatusBadge({ status }) {
  const map = {
    paid: "border-[#111] bg-[#111] text-white",
    unpaid: "border-[#ececec] bg-[#fafafa] text-[#6b7280]",
    refunded: "border-[#ee0012]/20 bg-[#fef2f2] text-[#ee0012]",
  };
  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold capitalize ${map[status] || map.unpaid}`}>{status || "unpaid"}</span>;
}

function money(value) {
  const amount = Number(value || 0);
  return `BDT ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SummaryLine({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-bold text-[#111]" : "text-[#6b7280]"}>{label}</span>
      <span className={strong ? "text-lg font-black text-[#111]" : "font-semibold text-[#111]"}>{value}</span>
    </div>
  );
}

export default function FoodAdminPage({ token, resource }) {
  const config = RESOURCE_CONFIG[resource] || RESOURCE_CONFIG["food-items"];
  const resourceGroup = resource.startsWith("medicine") ? "Medicine Delivery" : "Food Delivery";
  const resourceNoun = resource.startsWith("medicine") ? "medicine records" : "food records";
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
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [orderFilters, setOrderFilters] = useState({ payment_method: "", payment_status: "", status: "", restaurant_id: "", date_from: "", date_to: "" });

  const orderQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    if (search.trim()) params.set("search", search.trim());
    if (resource === "food-orders" || resource === "medicine-orders") {
      Object.entries(orderFilters).forEach(([key, value]) => {
        if (resource === "medicine-orders" && key === "restaurant_id") return;
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
  }, [resource, search, token, orderFilters, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [search, orderFilters]);

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
    if (!viewOpen || (resource !== "food-orders" && resource !== "medicine-orders") || !viewOrder?.id) return undefined;
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
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message || "Save failed.");
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
    if (field.type === "checkbox") {
      return (
        <label className="flex items-center gap-3 rounded-xl border border-[#ececec] bg-white px-3.5 py-3 text-sm font-semibold text-[#111] transition hover:border-[#ee0012]/30">
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
    if (field.type === "textarea" || field.type === "addons" || field.type === "size_prices") {
      return (
        <label className="block text-sm font-bold text-[#111]">
          {field.label}
          <textarea
            className="mt-1.5 min-h-[96px] w-full rounded-xl border border-[#ececec] bg-white px-3.5 py-2.5 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
            {...common}
          />
        </label>
      );
    }
    if (field.type === "select") {
      return (
        <label className="block text-sm font-bold text-[#111]">
          {field.label}
          <select
            className="mt-1.5 w-full rounded-xl border border-[#ececec] bg-white px-3.5 py-2.5 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
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
      return value ? <img src={value} alt="" className="h-12 w-16 rounded-lg border border-[#ececec] object-cover" /> : <span className="text-[#9ca3af]">No image</span>;
    }
    if (col === "payment_proof_photo_url") {
      return value ? (
        <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#ee0012]/20 bg-[#fef2f2] px-2.5 py-1 text-xs font-black text-[#ee0012]">
          <img src={value} alt="" className="h-7 w-9 rounded object-cover" />
          Proof
        </a>
      ) : <span className="text-[#9ca3af]">No proof</span>;
    }
    if (value === null || value === undefined || value === "") return "-";
    if (col === "restaurant") {
      return <span className="font-semibold text-[#111]">{value?.name || record.restaurant_id || "-"}</span>;
    }
    if (col === "payment_method") {
      return <PaymentMethodBadge method={value} />;
    }
    if (col === "payment_status") {
      return <PaymentStatusBadge status={value} />;
    }
    if (col === "rider_assignment_label") {
      const waiting = String(value).toLowerCase().includes("waiting");
      const accepted = String(value).toLowerCase().includes("accepted");
      const cls = accepted
        ? "border-[#111] bg-[#111] text-white"
        : waiting
          ? "border-[#ee0012]/20 bg-[#fef2f2] text-[#ee0012]"
          : "border-[#ececec] bg-[#fafafa] text-[#6b7280]";
      return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${cls}`}>{value}</span>;
    }
    if (col === "route_distance_km") {
      return `${value} KM`;
    }
    if (col === "delivery_map_url") {
      return (
        <a href={value} target="_blank" rel="noreferrer" className="font-semibold text-[#ee0012] hover:underline">
          View map
        </a>
      );
    }
    if (dateFields.has(col) || col.endsWith("_at")) return formatDateTime(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value).slice(0, 80);
    return String(value).length > 80 ? `${String(value).slice(0, 80)}...` : String(value);
  };

  const selectionState = visibleSelectionState(records, selectedIds);

  return (
    <div className="space-y-5">
      <style>{fd2Css}</style>
      <section className="fd2-rise overflow-hidden rounded-[26px] border border-[#ececec] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.06)]">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between sm:p-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ee0012]">{resourceGroup}</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#111]">{config.title}</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-[#6b7280]">{config.description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="9" r="6" />
                <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                placeholder={`Search ${resourceNoun}`}
                className="w-full rounded-xl border border-[#ececec] bg-white py-2.5 pl-10 pr-3 text-sm text-[#111] outline-none transition focus:border-[#ee0012]/50 focus:ring-4 focus:ring-[#ee0012]/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={openCreate}>Create New</Button>
          </div>
        </div>
      </section>

      {error && (
        <div className="fd2-rise rounded-2xl border border-[#ee0012]/20 bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]">{error}</div>
      )}

      {(resource === "food-orders" || resource === "medicine-orders") && (
        <FoodOrderFilterBar filters={orderFilters} onChange={setOrderFilters} hideRestaurant={resource === "medicine-orders"} />
      )}

      <div className="fd2-rise">
        <BulkDeleteBar selectedCount={selectedIds.length} deleting={bulkDeleting} onClear={() => setSelectedIds([])} onDelete={bulkDelete} />
      </div>

      <div className="fd2-rise overflow-x-auto rounded-2xl border border-[#ececec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]" style={{ "--d": "60ms" }}>
        <table className="min-w-[860px] w-full text-sm">
          <thead>
            <tr className="border-b border-[#f0f0f0] bg-[#fafafa] text-[11px] uppercase tracking-wider text-[#6b7280]">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#ee0012]"
                  checked={selectionState.allVisibleSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = selectionState.someVisibleSelected;
                  }}
                  onChange={(e) => setSelectedIds((prev) => toggleVisibleIds(prev, records, e.target.checked))}
                  aria-label="Select all visible records"
                />
              </th>
              {visibleColumns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-semibold capitalize">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, i) => (
              <tr key={record.id} className="fd2-fade border-t border-[#f3f4f6] transition hover:bg-[#fef2f2]/50" style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}>
                <td className="px-4 py-3 align-middle">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#ee0012]"
                    checked={selectedIds.includes(record.id)}
                    onChange={(e) => setSelectedIds((prev) => toggleSelectedId(prev, record.id, e.target.checked))}
                    aria-label={`Select record ${record.id}`}
                  />
                </td>
                {visibleColumns.map((col) => (
                  <td key={`${record.id}-${col}`} className="px-4 py-3 align-middle text-[#374151]">
                    {renderValue(record, col)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {(resource === "food-orders" || resource === "medicine-orders") && (
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
                <td colSpan={visibleColumns.length + 2} className="px-4 py-10 text-center text-sm text-[#9ca3af]">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="fd2-ring h-2 w-2 rounded-full bg-[#ee0012]" />
                      Loading...
                    </span>
                  ) : (
                    `No ${resourceNoun} found.`
                  )}
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
        <div className="fd2-fade fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm">
          <div className="fd2-pop flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[26px] border border-[#ececec] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ececec] px-5 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#ee0012]">{mode === "create" ? "New record" : "Edit record"}</p>
                <h3 className="mt-1 text-lg font-black text-[#111]">{mode === "create" ? `Create ${config.title}` : `Edit ${config.title}`}</h3>
                <p className="mt-1 text-xs font-medium text-[#9ca3af]">Manual form. No JSON editing required.</p>
              </div>
              <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg font-bold text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#111]" onClick={() => setModalOpen(false)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {config.imageTarget && (
                <div className="mb-5 rounded-2xl border border-[#ececec] bg-[#fafafa] p-4">
                  <p className="text-sm font-black text-[#111]">Image Upload</p>
                  <p className="mt-1 text-xs font-medium text-[#6b7280]">Upload a real image for this record. It will be saved after the record is created/updated.</p>
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
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="text-sm" />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {config.fields.map((field) => (
                  <div key={field.key} className={field.type === "textarea" || field.type === "addons" || field.type === "size_prices" ? "md:col-span-2" : ""}>
                    {renderField(field)}
                    {field.type === "addons" && <p className="mt-1 text-xs text-[#9ca3af]">One add-on per line, format: Extra Sauce:20</p>}
                    {field.type === "size_prices" && <p className="mt-1 text-xs text-[#9ca3af]">One size per line, format: Regular:120. Keep empty if this item has no size option.</p>}
                    {field.type === "tags" && <p className="mt-1 text-xs text-[#9ca3af]">Separate values with comma.</p>}
                    {fieldErrors[field.key] && <p className="mt-1 text-xs font-semibold text-[#ee0012]">{fieldErrors[field.key]}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#ececec] px-5 py-4">
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
          onClose={() => {
            setViewOpen(false);
            setViewOrder(null);
          }}
        />
      )}
    </div>
  );
}