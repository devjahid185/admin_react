import { API_BASE } from "./config.js";

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
    throw new Error("Server returned HTML. Check API base URL or server error.");
  }

  let data = null;
  if (trimmed) {
    try {
      data = JSON.parse(trimmed);
    } catch (_) {
      throw new Error("Invalid JSON response from server.");
    }
  }

  if (!res.ok) {
    const msg =
      (data && data.message) ||
      (data && data.error) ||
      "Request failed. Please try again.";
    throw new Error(msg);
  }

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
    throw new Error("Server returned HTML. Check API base URL or server error.");
  }

  let data = null;
  if (trimmed) {
    try {
      data = JSON.parse(trimmed);
    } catch (_) {
      throw new Error("Invalid JSON response from server.");
    }
  }

  if (!res.ok) {
    const msg =
      (data && data.message) ||
      (data && data.error) ||
      "Upload failed. Please try again.";
    throw new Error(msg);
  }

  return data;
}
