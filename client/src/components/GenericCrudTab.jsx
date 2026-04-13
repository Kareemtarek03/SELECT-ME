import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  Button,
  Spinner,
  Alert,
  Table,
  Stack,
  Dialog,
  Portal,
  CloseButton,
  Input,
} from "@chakra-ui/react";
import ExportImportButtons from "./ExportImportButtons";

import { API_BASE as API } from "../utils/api";

export function getCellVal(row, key) {
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "" || value === "-")
      return "-";
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  if (key.includes(".")) {
    const value = key.split(".").reduce((o, k) => o?.[k], row) ?? "-";
    if (typeof value !== "number") return value;
    return formatNumber(value);
  }
  const value = row[key] ?? "-";
  if (typeof value !== "number") return value;
  return formatNumber(value);
}

export default function GenericCrudTab({
  listPath,
  createPath,
  updatePath,
  deletePath,
  columns,
  getRowId,
  formFields,
  exportPath,
  importPath,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [list, setList] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}${listPath}`);
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const rows = j.data || [];
      rows.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
      setList(rows);
    } catch (e) {
      setError(e.message || "Failed to load");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [listPath]);

  const openAdd = () => {
    setEditingRow(null);
    setForm(
      formFields
        ? formFields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {})
        : {}
    );
    setEditOpen(true);
  };
  const openEdit = (row) => {
    setEditingRow(row);
    setForm(
      formFields
        ? formFields.reduce(
          (acc, f) => ({ ...acc, [f.key]: row[f.key] ?? "" }),
          {}
        )
        : {}
    );
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!formFields?.length) return;
    setSaving(true);
    setError(null);
    try {
      const body = { ...form };
      formFields.forEach((f) => {
        if (f.type === "number" && body[f.key] !== "" && body[f.key] != null)
          body[f.key] = Number(body[f.key]);
      });
      if (editingRow) {
        const r = await fetch(
          `${API}${updatePath.replace(":id", getRowId(editingRow))}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        if (!r.ok)
          throw new Error(
            (await r.json().catch(() => ({}))).error || "Update failed"
          );
      } else {
        const r = await fetch(`${API}${createPath}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok)
          throw new Error(
            (await r.json().catch(() => ({}))).error || "Create failed"
          );
      }
      setEditOpen(false);
      setEditingRow(null);
      await fetchData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingIds((s) => [...s, id]);
      const r = await fetch(`${API}${deletePath.replace(":id", id)}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || "Delete failed");
      }
      await fetchData();
      setConfirmDelete(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingIds((s) => s.filter((x) => x !== id));
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <Alert status="error">{error}</Alert>;

  return (
    <Box>
      <Stack direction="row" mb={4} gap={2} flexWrap="wrap" alignItems="center">
        {formFields?.length > 0 && (
          <Button
            size="sm"
            bg="var(--btn-primary)"
            color="white"
            _hover={{ bg: "var(--btn-primary-hover)" }}
            onClick={openAdd}
          >
            Add
          </Button>
        )}
        <Button
          size="sm"
          bg="var(--btn-secondary)"
          color="white"
          _hover={{ bg: "var(--btn-secondary-hover)" }}
          onClick={fetchData}
        >
          Refresh
        </Button>
        {exportPath && importPath && (
          <ExportImportButtons
            exportPath={exportPath}
            importPath={importPath}
            onImportDone={fetchData}
          />
        )}
      </Stack>
      <Box
        className="admin-table-container"
        overflowX="auto"
        borderWidth="1px"
        borderRadius="lg"
        borderColor="var(--border-color)"
        bg="var(--bg-card)"
        boxShadow="sm"
      >
        <Table.Root size="sm">
          <Table.Header bg="var(--table-header-bg)">
            <Table.Row>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
              {(columns?.length ? columns : formFields).map((c) => (
                <Table.ColumnHeader key={c.key}>{c.label}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {list.length === 0 && (
              <Table.Row>
                <Table.Cell
                  colSpan={
                    columns?.length
                      ? columns.length + 1
                      : formFields?.length + 1
                  }
                >
                  <Text textAlign="center">No data.</Text>
                </Table.Cell>
              </Table.Row>
            )}
            {list.length > 0 &&
              list.map((row, idx) => (
                <Table.Row
                  key={getRowId(row)}
                  bg={idx % 2 === 0 ? "var(--bg-page)" : "var(--bg-card)"}
                >
                  <Table.Cell>
                    <Stack direction="row" gap={1}>
                      {formFields?.length > 0 && (
                        <Button
                          size="xs"
                          bg="var(--btn-secondary)"
                          color="white"
                          _hover={{ bg: "var(--btn-secondary-hover)" }}
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        size="xs"
                        bg="var(--btn-danger)"
                        color="white"
                        _hover={{ bg: "var(--btn-danger-hover)" }}
                        isLoading={deletingIds.includes(getRowId(row))}
                        onClick={() => setConfirmDelete(row)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Table.Cell>
                  {(columns?.length ? columns : formFields).map((c) => (
                    <Table.Cell key={c.key}>
                      {getCellVal(row, c.key)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
          </Table.Body>
        </Table.Root>
      </Box>
      {list.length === 0 && !editOpen && <Text mt={2}>No data.</Text>}
      {editOpen && formFields?.length > 0 && (
        <Dialog.Root open={editOpen}>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content
                bg="var(--bg-card)"
                color="var(--text-primary)"
                border="1px solid var(--border-color)"
                boxShadow="lg"
              >
                <Dialog.Header>
                  <Dialog.Title>{editingRow ? "Edit" : "Add"}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap={3}>
                    {formFields.map(({ key, label, type }) => (
                      <Box key={key}>
                        <Text fontSize="sm" mb={1}>
                          {label}
                        </Text>
                        <Input
                          type={type === "number" ? "number" : "text"}
                          value={form[key] ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [key]: e.target.value }))
                          }
                          size="sm"
                        />
                      </Box>
                    ))}
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button
                    variant="outline"
                    borderColor="var(--border-color)"
                    color="var(--text-primary)"
                    _hover={{ bg: "var(--bg-elevated)" }}
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    bg="var(--btn-primary)"
                    color="white"
                    _hover={{ bg: "var(--btn-primary-hover)" }}
                    onClick={handleSave}
                    isLoading={saving}
                  >
                    Save
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" onClick={() => setEditOpen(false)} />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
      {confirmDelete && (
        <Dialog.Root open={!!confirmDelete}>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content
                bg="var(--bg-card)"
                color="var(--text-primary)"
                border="1px solid var(--border-color)"
                boxShadow="lg"
              >
                <Dialog.Header>
                  <Dialog.Title>Delete?</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>This cannot be undone.</Dialog.Body>
                <Dialog.Footer>
                  <Button
                    variant="outline"
                    borderColor="var(--border-color)"
                    color="var(--text-primary)"
                    _hover={{ bg: "var(--bg-elevated)" }}
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    bg="var(--btn-danger)"
                    color="white"
                    _hover={{ bg: "var(--btn-danger-hover)" }}
                    onClick={() => handleDelete(getRowId(confirmDelete))}
                  >
                    Delete
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size="sm"
                    onClick={() => setConfirmDelete(null)}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </Box>
  );
}
