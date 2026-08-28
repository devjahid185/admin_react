import { API_BASE } from "./config.js";
import { pushToast } from "../components/ToastCenter.jsx";

function notifySuccess(method, data) {
  if (method === "GET") return;
  if (data?.message) pushToast(data.message, "success");
}

function notifyError(message) {
  pushToast(message, "error");
}

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  const trimmed = raw.replace(/^\uFEFF/, "").trimStart();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    const msg = "Server returned HTML. Check API base URL or server error.";
    notifyError(msg);
    throw new Error(msg);
  }

  let data = null;
  if (trimmed) {
    try {
      data = JSON.parse(trimmed);
    } catch (_) {
      const msg = "Invalid JSON response from server.";
      notifyError(msg);
      throw new Error(msg);
    }
  }

  if (!res.ok) {
    const msg =
      (data && data.message) ||
      (data && data.error) ||
      "Request failed. Please try again.";
    notifyError(msg);
    throw new Error(msg);
  }

  notifySuccess(method, data);
  return data;
}

export async function apiUpload(path, { token, formData } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const raw = await res.text();
  const trimmed = raw.replace(/^\uFEFF/, "").trimStart();
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    const msg = "Server returned HTML. Check API base URL or server error.";
    notifyError(msg);
    throw new Error(msg);
  }

  let data = null;
  if (trimmed) {
    try {
      data = JSON.parse(trimmed);
    } catch (_) {
      const msg = "Invalid JSON response from server.";
      notifyError(msg);
      throw new Error(msg);
    }
  }

  if (!res.ok) {
    const msg =
      (data && data.message) ||
      (data && data.error) ||
      "Upload failed. Please try again.";
    notifyError(msg);
    throw new Error(msg);
  }

  notifySuccess("POST", data);
  return data;
}
