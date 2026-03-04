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
import {
  FaDatabase,
  FaCog,
  FaList,
  FaFan,
  FaBox,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";
import ExportImportButtons from "../../components/ExportImportButtons.jsx";
import GenericCrudTab from "../../components/GenericCrudTab.jsx";
import CentrifugalCasingPricingSection from "./CentrifugalCasingPricingSection.jsx";
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

const FAN_ARRAY_FIELDS = [
  { key: "airFlow", label: "Air Flow" },
  { key: "totPressure", label: "Total Pressure" },
  { key: "velPressure", label: "Velocity Pressure" },
  { key: "fanInputPow", label: "Fan Input Power" },
  { key: "staticPressure", label: "Static Pressure" },
];

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || value === "" || value === "-")
    return "-";
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function parseArrayVal(val) {
  if (val == null || val === "") return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getMaxArrayLengths(list) {
  const max = {};
  FAN_ARRAY_FIELDS.forEach(({ key }) => {
    max[key] = 0;
  });
  list.forEach((row) => {
    FAN_ARRAY_FIELDS.forEach(({ key }) => {
      const arr = parseArrayVal(row[key]);
      if (arr.length > max[key]) max[key] = arr.length;
    });
  });
  return max;
}

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
      console.log(j.data);
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
    setForm({
      airFlow: "[]",
      totPressure: "[]",
      velPressure: "[]",
      staticPressure: "[]",
      fanInputPow: "[]",
    });
    setEditOpen(true);
  };
  const openEdit = (row) => {
    setEditingRow(row);
    const f = { ...row };
    [
      "airFlow",
      "totPressure",
      "velPressure",
      "staticPressure",
      "fanInputPow",
    ].forEach((k) => {
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
      [
        "minSpeedRPM",
        "highSpeedRPM",
        "fanShaftDiameter",
        "innerDiameter",
        "desigDensity",
        "RPM",
      ].forEach((k) => {
        if (body[k] !== undefined && body[k] !== "") body[k] = Number(body[k]);
      });
      if (editingRow) {
        const r = await fetch(
          `${API}/api/centrifugal/fan-data/${editingRow.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        if (!r.ok)
          throw new Error(
            (await r.json().catch(() => ({}))).error || "Update failed",
          );
      } else {
        const r = await fetch(`${API}/api/centrifugal/fan-data/fan-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok)
          throw new Error(
            (await r.json().catch(() => ({}))).error || "Create failed",
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
      const r = await fetch(`${API}/api/centrifugal/fan-data/${id}`, {
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

  const maxArrayLengths = getMaxArrayLengths(list);

  return (
    <Box>
      <Stack direction="row" mb={4} gap={2} flexWrap="wrap" alignItems="center">
        <Button
          size="sm"
          bg="var(--btn-primary)"
          color="white"
          _hover={{ bg: "var(--btn-primary-hover)" }}
          onClick={openAdd}
        >
          Add Fan
        </Button>
        <Button
          size="sm"
          bg="var(--btn-secondary)"
          color="white"
          _hover={{ bg: "var(--btn-secondary-hover)" }}
          onClick={fetchData}
        >
          Refresh
        </Button>
        <ExportImportButtons
          exportPath="/api/centrifugal/data/export/centrifugal-fans"
          importPath="/api/centrifugal/data/import/centrifugal-fans"
          onImportDone={fetchData}
        />
      </Stack>
      <Box
        className="admin-table-container admin-table-fit-content"
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
              {FAN_SCALAR_FIELDS.map(({ key, label }) => (
                <Table.ColumnHeader key={key}>{label}</Table.ColumnHeader>
              ))}
              {FAN_ARRAY_FIELDS.flatMap(({ key, label }) =>
                Array.from(
                  { length: Math.max(1, maxArrayLengths[key]) },
                  (_, i) => (
                    <Table.ColumnHeader
                      key={`${key}-${i}`}
                      style={{
                        borderRight:
                          i !== Math.max(1, maxArrayLengths[key]) - 1
                            ? "none"
                            : "1px solid var(--border-color)",
                      }}
                    >
                      {label} {i + 1}
                    </Table.ColumnHeader>
                  ),
                ),
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {list.map((row, idx) => (
              <Table.Row
                key={row.id}
                bg={idx % 2 === 0 ? "var(--bg-page)" : "var(--bg-card)"}
              >
                <Table.Cell>
                  <Stack direction="row" gap={1}>
                    <Button
                      size="xs"
                      bg="var(--btn-secondary)"
                      color="white"
                      _hover={{ bg: "var(--btn-secondary-hover)" }}
                      onClick={() => openEdit(row)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      bg="var(--btn-danger)"
                      color="white"
                      _hover={{ bg: "var(--btn-danger-hover)" }}
                      isLoading={deletingIds.includes(row.id)}
                      onClick={() => setConfirmDelete(row)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Table.Cell>
                {FAN_SCALAR_FIELDS.map(({ key }) => (
                  <Table.Cell key={key}>{row[key] ?? "-"}</Table.Cell>
                ))}
                {FAN_ARRAY_FIELDS.flatMap(({ key }) => {
                  const arr = parseArrayVal(row[key]);
                  const maxLen = Math.max(1, maxArrayLengths[key]);
                  return Array.from({ length: maxLen }, (_, i) => (
                    <Table.Cell
                      key={`${key}-${i}`}
                      style={{
                        borderRight:
                          i !== Math.max(1, maxArrayLengths[key]) - 1
                            ? "none"
                            : "1px solid var(--border-color)",
                      }}
                    >
                      {formatNumber(arr[i] ?? "-", 2)}
                    </Table.Cell>
                  ));
                })}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      {list.length === 0 && !editOpen && (
        <Text mt={2}>No centrifugal fan data. Click Add Fan or use seed.</Text>
      )}
      {editOpen && (
        <Box
          bg="var(--bg-card)"
          borderRadius="lg"
          border="1px solid var(--border-color)"
          p={6}
          mb={4}
          boxShadow="0 1px 3px rgba(0,0,0,0.08)"
        >
          <Heading as="h3" size="md" color="var(--text-primary)" mb={4}>
            {editingRow ? "Edit Fan" : "Add Fan"}
          </Heading>
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(180px, 1fr))"
            gap={4}
          >
            {FAN_SCALAR_FIELDS.map(({ key, label, type }) => (
              <Box key={key}>
                <Text fontSize="sm" mb={1} color="var(--text-primary)">
                  {label}
                </Text>
                <Input
                  type={type === "number" ? "number" : "text"}
                  value={form[key] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  size="sm"
                  bg="var(--bg-page)"
                  border="1px solid var(--border-color)"
                />
              </Box>
            ))}
            {[
              "airFlow",
              "totPressure",
              "velPressure",
              "staticPressure",
              "fanInputPow",
            ].map((key) => (
              <Box key={key} gridColumn="1 / -1">
                <Text fontSize="sm" mb={1} color="var(--text-primary)">
                  {key} (JSON array)
                </Text>
                <Box
                  as="textarea"
                  rows={2}
                  value={form[key] ?? "[]"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  w="100%"
                  p={2}
                  fontSize="sm"
                  fontFamily="monospace"
                  bg="var(--bg-page)"
                  border="1px solid var(--border-color)"
                  borderRadius="md"
                  color="var(--text-primary)"
                />
              </Box>
            ))}
          </Box>
          <Stack direction="row" gap={3} mt={4}>
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
              onClick={handleSaveFan}
              isLoading={saving}
            >
              Save
            </Button>
          </Stack>
        </Box>
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
                  <Dialog.Title>Delete fan?</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  {confirmDelete.bladesModel || "No model"}. This cannot be
                  undone.
                </Dialog.Body>
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
                    onClick={() => handleDelete(confirmDelete.id)}
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

export default function CentrifugalDataPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && VALID_TABS.has(tabFromUrl) ? tabFromUrl : "fans",
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
      <Box
        pt={{ base: "80px", md: "100px" }}
        pb={8}
        px={{ base: 4, md: 6, lg: 8 }}
      >
        <Box w="100%" mx="auto">
          <Box
            mb={6}
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            flexWrap="wrap"
            gap={4}
          >
            <Box>
              <Heading
                as="h1"
                size="xl"
                color="var(--text-primary)"
                fontWeight="bold"
                mb={2}
              >
                Centrifugal Data
              </Heading>
              <Text color="var(--text-muted)" fontSize="md">
                Manage centrifugal fans, pulleys, belt length standard, pulley
                standard, and casing pricing
              </Text>
            </Box>
            <Button
              size="sm"
              variant="outline"
              borderColor="#1e293b"
              color="#1e293b"
              _hover={{ bg: "#f1f5f9" }}
              onClick={() => navigate("/admin/pricing")}
            >
              Open Pricing
            </Button>
          </Box>
          <Box
            display="flex"
            gap={2}
            borderBottom="1px solid var(--border-color)"
            pb={4}
          >
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
                exportPath="/api/centrifugal/data/export/pulleys"
                importPath="/api/centrifugal/data/import/pulleys"
                columns={[
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
                  {
                    key: "pitchDiameter",
                    label: "Pitch Diameter",
                    type: "number",
                  },
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
                exportPath="/api/centrifugal/data/export/belt-standards"
                importPath="/api/centrifugal/data/import/belt-standards"
                columns={[
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
                exportPath="/api/centrifugal/data/export/pulley-standards"
                importPath="/api/centrifugal/data/import/pulley-standards"
                columns={[
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
