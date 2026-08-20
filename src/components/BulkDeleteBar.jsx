import Button from "./Button.jsx";

export function toggleSelectedId(selectedIds, id, checked) {
  const next = new Set(selectedIds);
  const shouldSelect = checked ?? !next.has(id);
  if (shouldSelect) {
    next.add(id);
  } else {
    next.delete(id);
  }
  return Array.from(next);
}

export function toggleVisibleIds(selectedIds, records, checked) {
  const next = new Set(selectedIds);
  const ids = records
    .map((record) => record?.id)
    .filter((id) => id !== undefined && id !== null);
  const shouldSelect = checked ?? !ids.every((id) => next.has(id));
  ids.forEach((id) => {
    if (shouldSelect) {
      next.add(id);
    } else {
      next.delete(id);
    }
  });
  return Array.from(next);
}

export function visibleSelectionState(records, selectedIds) {
  const ids = records
    .map((record) => record?.id)
    .filter((id) => id !== undefined && id !== null);
  const selectedVisible = ids.filter((id) => selectedIds.includes(id)).length;
  return {
    ids,
    selectedVisible,
    allVisibleSelected: ids.length > 0 && selectedVisible === ids.length,
    someVisibleSelected: selectedVisible > 0 && selectedVisible < ids.length,
    checked: ids.length > 0 && selectedVisible === ids.length,
    indeterminate: selectedVisible > 0 && selectedVisible < ids.length,
  };
}

export default function BulkDeleteBar({
  selectedCount,
  deleting = false,
  itemLabel = "records",
  noun,
  onClear,
  onDelete,
}) {
  if (!selectedCount) return null;
  const label = noun || itemLabel;

  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-bold text-red-800">
          {selectedCount} {label} selected
        </div>
        <div className="text-xs text-red-700">Bulk delete cannot be undone.</div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onClear} disabled={deleting}>
          Clear
        </Button>
        <Button onClick={onDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete selected"}
        </Button>
      </div>
    </div>
  );
}
