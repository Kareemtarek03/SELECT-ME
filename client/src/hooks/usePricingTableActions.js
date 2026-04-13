import { useState, useCallback } from "react";

import { API_BASE } from "../utils/api";

/**
 * Hook for CRUD actions on pricing tables (blades, hubs, frames, casings).
 * @param {string} basePath - API path e.g. "/api/pricing/axial-impeller/hubs"
 * @param {object} initialForm - Initial values for add/edit forms
 * @param {function} onUpdate - Callback after create/update/delete to refresh list
 * @param {function} getAuthHeaders - () => ({ Authorization: "Bearer ...", ... })
 * @param {function} setAlert - ({ type: "success"|"error", message: string }) => void
 * @param {string} entityName - e.g. "Hub", "Blade", "Casing"
 */
export function usePricingTableActions(
  basePath,
  initialForm,
  onUpdate,
  getAuthHeaders,
  setAlert,
  entityName
) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ ...initialForm });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ ...initialForm });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleEdit = useCallback(
    (item) => {
      setEditingId(item.id);
      // Convert null/undefined values to empty strings to prevent uncontrolled input warnings
      const sanitizedItem = {};
      for (const key of Object.keys(initialForm)) {
        sanitizedItem[key] = item[key] ?? "";
      }
      setEditForm({ ...initialForm, ...sanitizedItem });
    },
    [initialForm]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({ ...initialForm });
  }, [initialForm]);

  const handleSaveEdit = useCallback(
    async (id) => {
      const headers = {
        "Content-Type": "application/json",
        ...(typeof getAuthHeaders === "function" ? getAuthHeaders() : {}),
      };
      try {
        const res = await fetch(`${API_BASE}${basePath}/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(editForm),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAlert({
            type: "error",
            message: data.message || data.error || `Failed to update ${entityName}`,
          });
          return;
        }
        setAlert({ type: "success", message: `${entityName} updated successfully` });
        setEditingId(null);
        setEditForm({ ...initialForm });
        if (typeof onUpdate === "function") onUpdate();
      } catch (err) {
        setAlert({
          type: "error",
          message: err.message || `Failed to update ${entityName}`,
        });
      }
    },
    [basePath, editForm, entityName, getAuthHeaders, initialForm, onUpdate, setAlert]
  );

  const handleCreateNew = useCallback(
    async () => {
      const headers = {
        "Content-Type": "application/json",
        ...(typeof getAuthHeaders === "function" ? getAuthHeaders() : {}),
      };
      try {
        const res = await fetch(`${API_BASE}${basePath}`, {
          method: "POST",
          headers,
          body: JSON.stringify(newItem),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAlert({
            type: "error",
            message: data.message || data.error || `Failed to create ${entityName}`,
          });
          return;
        }
        setAlert({ type: "success", message: `${entityName} created successfully` });
        setShowAddForm(false);
        setNewItem({ ...initialForm });
        if (typeof onUpdate === "function") onUpdate();
      } catch (err) {
        setAlert({
          type: "error",
          message: err.message || `Failed to create ${entityName}`,
        });
      }
    },
    [basePath, newItem, entityName, getAuthHeaders, initialForm, onUpdate, setAlert]
  );

  const handleDelete = useCallback(
    async (id) => {
      const headers =
        typeof getAuthHeaders === "function" ? getAuthHeaders() : {};
      try {
        const res = await fetch(`${API_BASE}${basePath}/${id}`, {
          method: "DELETE",
          headers,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAlert({
            type: "error",
            message: data.message || data.error || `Failed to delete ${entityName}`,
          });
          return;
        }
        setAlert({ type: "success", message: `${entityName} deleted successfully` });
        setDeleteConfirm(null);
        if (typeof onUpdate === "function") onUpdate();
      } catch (err) {
        setAlert({
          type: "error",
          message: err.message || `Failed to delete ${entityName}`,
        });
      }
    },
    [basePath, entityName, getAuthHeaders, onUpdate, setAlert]
  );

  return {
    editingId,
    editForm,
    setEditForm,
    showAddForm,
    setShowAddForm,
    newItem,
    setNewItem,
    deleteConfirm,
    setDeleteConfirm,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleCreateNew,
    handleDelete,
  };
}
