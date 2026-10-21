import { API_BASE } from "./config.js";

function parseSseChunk(buffer, onEvent) {
  const parts = buffer.split(/\r?\n\r?\n/);
  const rest = parts.pop() || "";

  parts.forEach((part) => {
    let event = "message";
    const dataLines = [];
    part.split(/\n/).forEach((line) => {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    });
    if (!dataLines.length) return;
    try {
      onEvent(event, JSON.parse(dataLines.join("\n")));
    } catch {
      onEvent(event, dataLines.join("\n"));
    }
  });

  return rest;
}

export function connectAdminLive({ token, onUpdate, onStatus }) {
  let stopped = false;
  let retryTimer = null;
  let pollTimer = null;
  let streamController = null;
  let retryAttempt = 0;
  let lastVersion = null;
  let lastModuleVersions = {};

  const emitUpdate = (data) => {
    if (!data || typeof data !== "object") return;
    if (data.version && data.version === lastVersion) return;
    const moduleVersions = data.module_versions && typeof data.module_versions === "object"
      ? data.module_versions
      : {};
    const changedModules = lastVersion === null
      ? (Array.isArray(data.modules) ? data.modules : [])
      : Object.entries(moduleVersions)
          .filter(([module, version]) => lastModuleVersions[module] !== version)
          .map(([module]) => module);
    if (data.version) lastVersion = data.version;
    lastModuleVersions = { ...moduleVersions };
    onUpdate?.({
      ...data,
      modules: changedModules.length > 0
        ? changedModules
        : (Array.isArray(data.modules) ? data.modules : []),
    });
  };

  const pollState = async () => {
    if (stopped) return;
    try {
      const res = await fetch(`${API_BASE}/admin/live/state`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      emitUpdate(await res.json());
    } catch (_) {}
  };

  const connect = async () => {
    if (stopped) return;
    onStatus?.("connecting");
    streamController = new AbortController();

    try {
      const res = await fetch(`${API_BASE}/admin/live/events`, {
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
        },
        signal: streamController.signal,
      });

      if (!res.ok || !res.body) throw new Error("Live stream unavailable");
      onStatus?.("connected");
      retryAttempt = 0;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!stopped) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = parseSseChunk(buffer, (event, data) => {
          if (event === "admin-update") emitUpdate(data);
        });
      }
    } catch (_) {
      if (stopped) return;
      onStatus?.("reconnecting");
    }

    if (!stopped) {
      retryAttempt += 1;
      const delay = Math.min(15000, 1500 * 2 ** Math.min(retryAttempt - 1, 4));
      retryTimer = window.setTimeout(connect, delay);
    }
  };

  connect();
  pollState();
  pollTimer = window.setInterval(pollState, 15000);

  return () => {
    stopped = true;
    if (retryTimer) window.clearTimeout(retryTimer);
    if (pollTimer) window.clearInterval(pollTimer);
    streamController?.abort();
    onStatus?.("closed");
  };
}
