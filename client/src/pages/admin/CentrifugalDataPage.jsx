import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Text,
  Heading,
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
import { FaDatabase, FaCog, FaList, FaFan } from "react-icons/fa";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";

const API = process.env.REACT_APP_API_BASE_URL || "";

const TABS = [
  { id: "fans", name: "Fans", icon: FaFan },
  { id: "pulleys", name: "Pulleys", icon: FaCog },
  { id: "belt-standards", name: "Belt Length Standard", icon: FaList },
  { id: "pulley-standards", name: "Pulley Standard", icon: FaDatabase },
];

const VALID_TABS = new Set(TABS.map((t) => t.id));

// ---------- Centrifugal Fans Tab ----------
const FAN_SCALAR_FIELDS = [
  { key: "bladesType", label: "Blades Type" },
  { key: "bladesModel", label: "Blades Model" },
  { key: "minSpeedRPM", label: "Min Speed RPM", type: "number" },
  { key: "highSpeedRPM", label: "High Speed RPM", type: "number" },
  { key: "impellerType", label: "Impeller Type" },
  { key: "fanShaftDiameter", label: "Fan Shaft Diameter", type: "number" },
  { key: "innerDiameter", label: "Inner Diameter", type: "number" },
  { key: "desigDensity", label: "Desig. Density", type: "number" },
  { key: "RPM", label: "RPM", type: "number" },
];

function CentrifugalFansTab() {
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
      const r = await fetch(`${API}/api/centrifugal/fan-data/fan-data`);
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setList(j.data || []);
    } catch (e) {
      setError(e.message || "Failed to load");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditingRow(null);
    setForm({ airFlow: "[]", totPressure: "[]", velPressure: "[]", staticPressure: "[]", fanInputPow: "[]" });
    setEditOpen(true);
  };
  const openEdit = (row) => {
    setEditingRow(row);
    const f = { ...row };
    ["airFlow", "totPressure", "velPressure", "staticPressure", "fanInputPow"].forEach((k) => {
      f[k] = typeof row[k] === "string" ? row[k] : JSON.stringify(row[k] || []);
    });
    setForm(f);
    setEditOpen(true);
  };

  const handleSaveFan = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = { ...form };
      ["minSpeedRPM", "highSpeedRPM", "fanShaftDiameter", "innerDiameter", "desigDensity", "RPM"].forEach((k) => {
        if (body[k] !== undefined && body[k] !== "") body[k] = Number(body[k]);
      });
      if (editingRow) {
        const r = await fetch(`${API}/api/centrifugal/fan-data/${editingRow.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Update failed");
      } else {
        const r = await fetch(`${API}/api/centrifugal/fan-data/fan-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Create failed");
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
      const r = await fetch(`${API}/api/centrifugal/fan-data/${id}`, { method: "DELETE" });
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
      <Stack direction="row" mb={4} gap={2}>
        <Button size="sm" bg="#1e293b" color="white" _hover={{ bg: "#0f172a" }} onClick={openAdd}>Add Fan</Button>
        <Button size="sm" onClick={fetchData}>Refresh</Button>
      </Stack>
      <Box className="admin-table-container" overflowX="auto" borderWidth="1px" borderRadius="lg" borderColor="#e2e8f0" bg="#fff" boxShadow="sm">
        <Table.Root size="sm">
          <Table.Header bg="#f1f5f9">
            <Table.Row>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>Blades Type</Table.ColumnHeader>
              <Table.ColumnHeader>Blades Model</Table.ColumnHeader>
              <Table.ColumnHeader>RPM</Table.ColumnHeader>
              <Table.ColumnHeader>Inner Diameter</Table.ColumnHeader>
              <Table.ColumnHeader>Desig. Density</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {list.map((row, idx) => (
              <Table.Row key={row.id} bg={idx % 2 === 0 ? "#f8fafc" : "#fff"}>
                <Table.Cell>
                  <Stack direction="row" gap={1}>
                    <Button size="xs" variant="outline" onClick={() => openEdit(row)}>Edit</Button>
                    <Button
                      size="xs"
                      bg="#1e293b"
                      color="white"
                      _hover={{ bg: "#0f172a" }}
                      isLoading={deletingIds.includes(row.id)}
                      onClick={() => setConfirmDelete(row)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Table.Cell>
                <Table.Cell>{row.id}</Table.Cell>
                <Table.Cell>{row.bladesType ?? "-"}</Table.Cell>
                <Table.Cell>{row.bladesModel ?? "-"}</Table.Cell>
                <Table.Cell>{row.RPM ?? "-"}</Table.Cell>
                <Table.Cell>{row.innerDiameter ?? "-"}</Table.Cell>
                <Table.Cell>{row.desigDensity ?? "-"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      {list.length === 0 && !editOpen && <Text mt={2}>No centrifugal fan data. Click Add Fan or use seed.</Text>}
      {editOpen && (
        <Dialog.Root open={editOpen}>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content bg="#fff" color="#1e293b" maxW="500px" border="1px solid #e2e8f0" boxShadow="lg">
                <Dialog.Header>
                  <Dialog.Title>{editingRow ? "Edit Fan" : "Add Fan"}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap={3}>
                    {FAN_SCALAR_FIELDS.map(({ key, label, type }) => (
                      <Box key={key}>
                        <Text fontSize="sm" mb={1}>{label}</Text>
                        <Input
                          type={type === "number" ? "number" : "text"}
                          value={form[key] ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          size="sm"
                        />
                      </Box>
                    ))}
                    {["airFlow", "totPressure", "velPressure", "staticPressure", "fanInputPow"].map((key) => (
                      <Box key={key}>
                        <Text fontSize="sm" mb={1}>{key} (JSON array)</Text>
                        <textarea
                          rows={2}
                          value={form[key] ?? "[]"}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            fontSize: "13px",
                            fontFamily: "monospace",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                  <Button bg="#1e293b" color="white" _hover={{ bg: "#0f172a" }} onClick={handleSaveFan} isLoading={saving}>Save</Button>
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
              <Dialog.Content bg="#fff" color="#1e293b" border="1px solid #e2e8f0" boxShadow="lg">
                <Dialog.Header>
                  <Dialog.Title>Delete fan?</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>ID {confirmDelete.id} – {confirmDelete.bladesModel || "No model"}. This cannot be undone.</Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                  <Button bg="#1e293b" color="white" _hover={{ bg: "#0f172a" }} onClick={() => handleDelete(confirmDelete.id)}>Delete</Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" onClick={() => setConfirmDelete(null)} />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </Box>
  );
}

// ---------- Generic CRUD Table (Pulleys, Belt Standard, Pulley Standard) ----------
// formFields: [{ key, label, type: 'number'|'text' }] - used for Add/Edit form (exclude id)
function GenericCrudTab({ title, listPath, createPath, updatePath, deletePath, columns, getRowId, formFields }) {
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
      setList(j.data || []);
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
    setForm(formFields ? formFields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {}) : {});
    setEditOpen(true);
  };
  const openEdit = (row) => {
    setEditingRow(row);
    setForm(formFields ? formFields.reduce((acc, f) => ({ ...acc, [f.key]: row[f.key] ?? "" }), {}) : {});
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!formFields?.length) return;
    setSaving(true);
    setError(null);
    try {
      const body = { ...form };
      formFields.forEach((f) => {
        if (f.type === "number" && body[f.key] !== "" && body[f.key] != null) body[f.key] = Number(body[f.key]);
      });
      if (editingRow) {
        const r = await fetch(`${API}${updatePath.replace(":id", getRowId(editingRow))}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Update failed");
      } else {
        const r = await fetch(`${API}${createPath}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Create failed");
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
      const r = await fetch(`${API}${deletePath.replace(":id", id)}`, { method: "DELETE" });
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
      <Stack direction="row" mb={4} gap={2}>
        {formFields?.length > 0 && (
          <Button size="sm" bg="#1e293b" color="white" _hover={{ bg: "#0f172a" }} onClick={openAdd}>Add</Button>
        )}
        <Button size="sm" onClick={fetchData}>Refresh</Button>
      </Stack>
      <Box className="admin-table-container" overflowX="auto" borderWidth="1px" borderRadius="lg" borderColor="#e2e8f0" bg="#fff" boxShadow="sm">
        <Table.Root size="sm">
          <Table.Header bg="#f1f5f9">
            <Table.Row>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
              {columns.map((c) => (
                <Table.ColumnHeader key={c.key}>{c.label}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {list.map((row, idx) => (
              <Table.Row key={getRowId(row)} bg={idx % 2 === 0 ? "#f8fafc" : "#fff"}>
                <Table.Cell>
                  <Stack direction="row" gap={1}>
                    {formFields?.length > 0 && (
                      <Button size="xs" variant="outline" onClick={() => openEdit(row)}>Edit</Button>
                    )}
                    <Button
                      size="xs"
                      bg="#1e293b"
                      color="white"
                      _hover={{ bg: "#0f172a" }}
                      isLoading={deletingIds.includes(getRowId(row))}
                      onClick={() => setConfirmDelete(row)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Table.Cell>
                {columns.map((c) => (
                  <Table.Cell key={c.key}>{row[c.key] ?? "-"}</Table.Cell>
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
              <Dialog.Content bg="#fff" color="#1e293b" border="1px solid #e2e8f0" boxShadow="lg">
                <Dialog.Header>
                  <Dialog.Title>{editingRow ? "Edit" : "Add"}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap={3}>
                    {formFields.map(({ key, label, type }) => (
                      <Box key={key}>
                        <Text fontSize="sm" mb={1}>{label}</Text>
                        <Input
                          type={type === "number" ? "number" : "text"}
                          value={form[key] ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          size="sm"
                        />
                      </Box>
                    ))}
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                  <Button bg="#1e293b" color="white" _hover={{ bg: "#0f172a" }} onClick={handleSave} isLoading={saving}>Save</Button>
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
              <Dialog.Content bg="#fff" color="#1e293b" border="1px solid #e2e8f0" boxShadow="lg">
                <Dialog.Header>
                  <Dialog.Title>Delete?</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>ID {getRowId(confirmDelete)}. This cannot be undone.</Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                  <Button bg="#1e293b" color="white" _hover={{ bg: "#0f172a" }} onClick={() => handleDelete(getRowId(confirmDelete))}>Delete</Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" onClick={() => setConfirmDelete(null)} />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </Box>
  );
}

export default function CentrifugalDataPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && VALID_TABS.has(tabFromUrl) ? tabFromUrl : "fans"
  );

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.has(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const setActiveTabAndUrl = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
  };

  return (
    <Box minH="100vh" bg="var(--bg-page)" display="flex" flexDirection="column">
      <HamburgerMenu />
      <Box pt={{ base: "80px", md: "100px" }} pb={8} px={{ base: 4, md: 6, lg: 8 }}>
        <Box w="100%" mx="auto">
          <Box mb={6} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={4}>
            <Box>
              <Heading as="h1" size="xl" color="var(--text-primary)" fontWeight="bold" mb={2}>
                Centrifugal Data
              </Heading>
              <Text color="var(--text-muted)" fontSize="md">
                Manage centrifugal fans, pulleys, belt length standard, and pulley standard
              </Text>
            </Box>
            <Button
              size="sm"
              variant="outline"
              borderColor="#1e293b"
              color="#1e293b"
              _hover={{ bg: "#f1f5f9" }}
              onClick={() => navigate("/admin/common")}
            >
              Open Common Data (Motor & Pricing Items)
            </Button>
          </Box>
          <Box display="flex" gap={2} borderBottom="1px solid var(--border-color)" pb={4}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTabAndUrl(tab.id)}
                  bg={isActive ? "#1e293b" : "#ffffff"}
                  color={isActive ? "white" : "#1e293b"}
                  border="1px solid"
                  borderColor={isActive ? "#1e293b" : "#e2e8f0"}
                  _hover={{
                    bg: isActive ? "#0f172a" : "#f1f5f9",
                    color: isActive ? "white" : "#1e293b",
                    borderColor: isActive ? "#0f172a" : "#cbd5e1",
                  }}
                  px={6}
                  py={5}
                  borderRadius="lg"
                  fontWeight={isActive ? "600" : "normal"}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  boxShadow={isActive ? "sm" : "none"}
                >
                  <Icon />
                  {tab.name}
                </Button>
              );
            })}
          </Box>
          <Box mt={6}>
            {activeTab === "fans" && <CentrifugalFansTab />}
            {activeTab === "pulleys" && (
              <GenericCrudTab
                listPath="/api/centrifugal/data/pulleys"
                createPath="/api/centrifugal/data/pulleys"
                updatePath="/api/centrifugal/data/pulleys/:id"
                deletePath="/api/centrifugal/data/pulleys/:id"
                getRowId={(r) => r.id}
                columns={[
                  { key: "id", label: "ID" },
                  { key: "beltType", label: "Belt Type" },
                  { key: "grooves", label: "Grooves" },
                  { key: "pitchDiameter", label: "Pitch Diameter" },
                  { key: "minBore", label: "Min Bore" },
                  { key: "maxBore", label: "Max Bore" },
                ]}
                formFields={[
                  { key: "no", label: "No", type: "number" },
                  { key: "beltType", label: "Belt Type", type: "text" },
                  { key: "grooves", label: "Grooves", type: "number" },
                  { key: "pitchDiameter", label: "Pitch Diameter", type: "number" },
                  { key: "bushNo", label: "Bush No", type: "text" },
                  { key: "minBore", label: "Min Bore", type: "number" },
                  { key: "maxBore", label: "Max Bore", type: "number" },
                  { key: "widthF", label: "Width F", type: "number" },
                  { key: "condition", label: "Condition", type: "text" },
                ]}
              />
            )}
            {activeTab === "belt-standards" && (
              <GenericCrudTab
                listPath="/api/centrifugal/data/belt-standards"
                createPath="/api/centrifugal/data/belt-standards"
                updatePath="/api/centrifugal/data/belt-standards/:id"
                deletePath="/api/centrifugal/data/belt-standards/:id"
                getRowId={(r) => r.id}
                columns={[
                  { key: "id", label: "ID" },
                  { key: "spz", label: "SPZ" },
                  { key: "spa", label: "SPA" },
                  { key: "spb", label: "SPB" },
                  { key: "spc", label: "SPC" },
                ]}
                formFields={[
                  { key: "spz", label: "SPZ", type: "number" },
                  { key: "spa", label: "SPA", type: "number" },
                  { key: "spb", label: "SPB", type: "number" },
                  { key: "spc", label: "SPC", type: "number" },
                ]}
              />
            )}
            {activeTab === "pulley-standards" && (
              <GenericCrudTab
                listPath="/api/centrifugal/data/pulley-standards"
                createPath="/api/centrifugal/data/pulley-standards"
                updatePath="/api/centrifugal/data/pulley-standards/:id"
                deletePath="/api/centrifugal/data/pulley-standards/:id"
                getRowId={(r) => r.id}
                columns={[
                  { key: "id", label: "ID" },
                  { key: "no", label: "No" },
                  { key: "spz", label: "SPZ" },
                  { key: "spa", label: "SPA" },
                  { key: "spb", label: "SPB" },
                  { key: "spc", label: "SPC" },
                ]}
                formFields={[
                  { key: "no", label: "No", type: "number" },
                  { key: "spz", label: "SPZ", type: "number" },
                  { key: "spa", label: "SPA", type: "number" },
                  { key: "spb", label: "SPB", type: "number" },
                  { key: "spc", label: "SPC", type: "number" },
                ]}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
