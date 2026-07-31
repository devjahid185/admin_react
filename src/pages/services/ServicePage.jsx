import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button.jsx";
import { apiRequest } from "../../lib/api.js";

export default function ServicePage({ token, resource }) {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [editorText, setEditorText] = useState("{}");
  const [editorId, setEditorId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest(`/admin/resources/${resource}?search=${encodeURIComponent(search)}`, {
          token,
        });
        setRecords(data.data || []);
        setMeta(data.meta || null);
        setColumns(data.columns || []);
      } catch (err) {
        setError(err.message || "Unable to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [resource, search, token]);

  const openCreate = () => {
    setEditorMode("create");
    setEditorId(null);
    setEditorText("{}");
    setEditorOpen(true);
  };

  const openEdit = (record) => {
    setEditorMode("edit");
    setEditorId(record.id);
    setEditorText(JSON.stringify(record, null, 2));
    setEditorOpen(true);
  };

  const saveEditor = async () => {
    let payload;
    try {
      payload = JSON.parse(editorText);
    } catch (err) {
      setError("Invalid JSON. Please fix and try again.");
      return;
    }
    try {
      if (editorMode === "create") {
        const data = await apiRequest(`/admin/resources/${resource}`, {
          method: "POST",
          token,
          body: payload,
        });
        setRecords((prev) => [data.record, ...prev]);
      } else if (editorId) {
        const data = await apiRequest(`/admin/resources/${resource}/${editorId}`, {
          method: "PUT",
          token,
          body: payload,
        });
        setRecords((prev) => prev.map((r) => (r.id === editorId ? data.record : r)));
      }
      setEditorOpen(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    }
  };

  const deleteRow = async (id) => {
    await apiRequest(`/admin/resources/${resource}/${id}`, { method: "DELETE", token });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const resourceColumns = useMemo(() => {
    const preferred = [
      "id",
      "name",
      "title",
      "phone",
      "email",
      "category_id",
      "status",
      "type",
      "price",
      "fees",
      "district",
      "upazila",
      "created_at",
    ];
    const set = new Set(columns);
    const picked = preferred.filter((col) => set.has(col));
    if (picked.length >= 6) return picked.slice(0, 6);
    const rest = columns.filter((c) => !picked.includes(c));
    return [...picked, ...rest].slice(0, 6);
  }, [columns]);

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <input
          placeholder="Search"
          className="w-full md:max-w-sm rounded-[14px] border border-[#dfe6ef] px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">Total: {meta?.total || records.length}</span>
          <Button onClick={openCreate}>Create</Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[16px] border border-[#dfe6ef] bg-white shadow-sm">
        <table className="min-w-[720px] w-full text-xs md:text-sm">
          <thead className="bg-[#f8fafc] text-[#53637a]">
            <tr>
              {resourceColumns.map((col) => (
                <th key={col} className="text-left px-3 py-2 md:px-4">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
              <th className="text-right px-3 py-2 md:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-[#edf1f6]">
                {resourceColumns.map((col) => {
                  const value = record[col];
                  const text =
                    value === null || value === undefined
                      ? "-"
                      : typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value);
                  return (
                    <td key={`${record.id}-${col}`} className="px-3 py-2 md:px-4">
                      {text.length > 60 ? `${text.slice(0, 60)}...` : text}
                    </td>
                  );
                })}
                <td className="px-3 py-2 md:px-4 md:text-right">
                  <div className="flex flex-col md:flex-row md:justify-end gap-2">
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
                <td className="px-4 py-4 text-[#64748b]" colSpan={resourceColumns.length + 1}>
                  {loading ? "Loading..." : "No records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-[18px] border border-[#dfe6ef] bg-white p-6 shadow-2xl shadow-slate-900/15 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editorMode === "create" ? "Create Record" : "Edit Record"}
              </h3>
              <button className="text-sm text-[#64748b]" onClick={() => setEditorOpen(false)}>
                Close
              </button>
            </div>
            <p className="mt-1 text-xs text-[#64748b]">Edit the JSON fields below. Keep valid JSON.</p>
            <textarea
              className="mt-4 h-72 w-full rounded-[14px] border border-[#dfe6ef] p-3 font-mono text-xs"
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEditor}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



