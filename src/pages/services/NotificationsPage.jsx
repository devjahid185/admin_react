import { useEffect, useMemo, useState } from "react";
import { apiRequest, apiUpload } from "../../lib/api.js";
import Button from "../../components/Button.jsx";
import ImageUploadPreview from "../../components/ImageUploadPreview.jsx";

export default function NotificationsPage({ token, onUnauthorized }) {
  const [target, setTarget] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");

  const canSend = useMemo(() => {
    if (target === "user" && !selectedUser) return false;
    return Boolean(title.trim() || message.trim() || imageFile);
  }, [target, selectedUser, title, message, imageFile]);

  const loadNotifications = async () => {
    setLoadingList(true);
    setError("");
    try {
      const data = await apiRequest("/admin/notifications?per_page=10", { token });
      setNotifications(data?.data || []);
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
      if (err.message?.toLowerCase().includes("forbidden")) {
        onUnauthorized?.();
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      if (target !== "user" || userSearch.trim().length < 2) {
        setUserResults([]);
        return;
      }
      try {
        const data = await apiRequest(`/admin/users?search=${encodeURIComponent(userSearch.trim())}`, { token });
        setUserResults(data?.data || []);
      } catch (err) {
        if (err.message?.toLowerCase().includes("forbidden")) {
          onUnauthorized?.();
        }
      }
    };

    const timer = setTimeout(loadUsers, 350);
    return () => clearTimeout(timer);
  }, [userSearch, target]);

  const sendNotification = async () => {
    if (!canSend) return;
    setSending(true);
    setStatus("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("target", target);
      if (target === "user" && selectedUser) {
        formData.append("user_id", String(selectedUser.id));
      }
      if (title.trim()) formData.append("title", title.trim());
      if (message.trim()) formData.append("message", message.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await apiUpload("/admin/notifications/send", { token, formData });
      setStatus(res?.message || "Notification sent.");
      setTitle("");
      setMessage("");
      setImageFile(null);
      if (target === "user") {
        setUserSearch("");
        setSelectedUser(null);
        setUserResults([]);
      }
      loadNotifications();
    } catch (err) {
      setError(err.message || "Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#101827]">Send notification</h2>
            <p className="text-sm text-[#64748b]">
              Title, message, or image can be sent. Image-only notifications are supported.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr,1fr]">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#64748b]">Target</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTarget("all")}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  target === "all" ? "border-red-700 bg-red-700 text-white" : "border-[#dfe6ef] text-[#53637a]"
                }`}
              >
                All users
              </button>
              <button
                type="button"
                onClick={() => setTarget("user")}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  target === "user" ? "border-red-700 bg-red-700 text-white" : "border-[#dfe6ef] text-[#53637a]"
                }`}
              >
                Single user
              </button>
            </div>

            {target === "user" && (
              <div className="space-y-2">
                <input
                  className="w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
                  placeholder="Search user by name, phone, email"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {selectedUser && (
                  <div className="rounded-[14px] border border-[#dfe6ef] bg-[#f8fafc] px-3 py-2 text-xs">
                    Selected: {selectedUser.name || "Unnamed"} ({selectedUser.email || selectedUser.phone || "N/A"})
                  </div>
                )}
                {userResults.length > 0 && (
                  <div className="max-h-40 overflow-auto rounded-[14px] border border-[#dfe6ef]">
                    {userResults.map((user) => (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setUserResults([]);
                        }}
                        className="flex w-full items-center justify-between border-b border-[#edf1f6] px-3 py-2 text-left text-xs hover:bg-[#f8fafc]"
                      >
                        <span>{user.name || "Unnamed"}</span>
                        <span className="text-[#8b98ab]">{user.email || user.phone || "N/A"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#64748b]">Notification content</label>
            <input
              className="w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="min-h-[120px] w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
              placeholder="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
            />
            <ImageUploadPreview
              file={imageFile}
              label="Notification image preview"
              hint="Notification image preview"
              heightClass="h-36"
              onClear={() => setImageFile(null)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={sendNotification} disabled={!canSend || sending}>
            {sending ? "Sending..." : "Send notification"}
          </Button>
          {status && <span className="text-xs text-emerald-600">{status}</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>

      <div className="rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#101827]">Recent notifications</h3>
          <button
            type="button"
            onClick={loadNotifications}
            className="text-xs font-semibold text-[#64748b]"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[720px] w-full text-xs md:text-sm">
            <thead className="bg-[#f8fafc] text-[#53637a]">
              <tr>
                <th className="text-left px-3 py-2 md:px-4">Title</th>
                <th className="text-left px-3 py-2 md:px-4">Message</th>
                <th className="text-left px-3 py-2 md:px-4">User</th>
                <th className="text-left px-3 py-2 md:px-4">Sent</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className="border-t border-[#edf1f6]">
                  <td className="px-3 py-2 md:px-4">{n.title || "-"}</td>
                  <td className="px-3 py-2 md:px-4">{n.message || "-"}</td>
                  <td className="px-3 py-2 md:px-4">{n.user?.name || n.user_id || "-"}</td>
                  <td className="px-3 py-2 md:px-4">{n.created_at || "-"}</td>
                </tr>
              ))}
              {!notifications.length && (
                <tr>
                  <td className="px-4 py-4 text-[#64748b]" colSpan={4}>
                    {loadingList ? "Loading..." : "No notifications found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


