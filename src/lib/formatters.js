export const BD_TIME_ZONE = "Asia/Dhaka";
export const BD_UTC_OFFSET = "+06:00";

export function formatDateTime(value) {
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
    timeZone: BD_TIME_ZONE,
  }).format(date);
}

export function formatShortDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-BD", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: BD_TIME_ZONE,
  }).format(date);
}

export function formatBdTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-BD", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: BD_TIME_ZONE,
  }).format(date);
}

function bdParts(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: BD_TIME_ZONE,
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

export function formatBdDateInput(value = new Date()) {
  const parts = bdParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
}

export function toBdDateTimeInput(value) {
  if (!value) return "";
  const parts = bdParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` : "";
}

export function bdDateTimeInputToIso(value) {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) return normalized;
  const date = new Date(`${normalized.slice(0, 16)}:00${BD_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? normalized : date.toISOString();
}

export function isDateTimeKey(key) {
  return key === "created_at" || key === "updated_at" || key.endsWith("_at");
}
