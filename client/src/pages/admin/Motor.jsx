import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Spinner,
  Table,
  Alert,
  Stack,
  Dialog,
  Portal,
  CloseButton,
  Input,
} from "@chakra-ui/react";

export default function MotorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [motors, setMotors] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMotor, setSelectedMotor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Add/Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMotor, setEditingMotor] = useState(null); // null = add new, object = edit existing
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/motor-data/`
      );
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API error: ${resp.status} ${text}`);
      }
      const data = await resp.json();
      console.log("data",data)
      // accept either { data: [...] } or an array
      const list = Array.isArray(data) ? data : data.data || [];
      setMotors(list);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load motors");
      setMotors([]);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (motorId) => {
    try {
      setDeletingIds((s) => [...s, motorId]);
      const resp = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/motor-data/${motorId}`,
        { method: "DELETE" }
      );
      if (!resp.ok) {
        const j = await resp.json().catch(() => null);
        throw new Error(j?.error || resp.statusText || "Delete failed");
      }
      await fetchData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Delete failed");
    } finally {
      setDeletingIds((s) => s.filter((x) => x !== motorId));
      setOpenDialog(false);
      setSelectedMotor(null);
    }
  };

  // Open Add modal
  const handleAddNew = () => {
    setEditingMotor(null);
    setFormData({});
    setEditModalOpen(true);
  };

  // Open Edit modal
  const handleEdit = (motor) => {
    setEditingMotor(motor);
    setFormData({ ...motor });
    setEditModalOpen(true);
  };

  // Handle form field change
  const handleFormChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Save (Create or Update)
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const isEdit = editingMotor !== null;
      const url = isEdit
        ? `${process.env.REACT_APP_API_BASE_URL}/api/motor-data/${editingMotor.id}`
        : `${process.env.REACT_APP_API_BASE_URL}/api/motor-data/`;

      const resp = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!resp.ok) {
        const j = await resp.json().catch(() => null);
        throw new Error(j?.error || resp.statusText || "Save failed");
      }

      setEditModalOpen(false);
      setEditingMotor(null);
      setFormData({});
      await fetchData(); // Refresh data
    } catch (e) {
      console.error(e);
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const formatValue = (v) => {
    if (v === null || v === undefined) return "-";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    if (typeof v === "number")
      return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
    return String(v);
  };

  // Format column names to be more human-friendly (similar to FanData.jsx)
  const formatColumnName = (k) => {
    if (!k && k !== 0) return "";
    // known mappings (keep consistent with FanData naming where applicable)
    const map = {
      airFlow: "Air Flow",
      totPressure: "Total Pressure",
      staticPressure: "Static Pressure",
      velPressure: "Velocity Pressure",
      fanInputPow: "Fan Input Power",
      Id: "Id",
      id: "Id",
      model: "Model",
      RPM: "RPM",
    };

    if (map[k]) return map[k];

    // If key already contains spaces or dashes, just Title Case the words
    const normalize = String(k)
      // convert snake_case to words
      .replace(/[_-]+/g, " ")
      // split camelCase boundaries
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .trim();

    // Title case each word
    return normalize
      .split(" ")
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  };

  // Calculated fields that should be read-only (server-side calculated)
  const CALCULATED_FIELDS = [
    "B3 Price with VAT & Factor (L.E)",
    "Other Price with VAT & Factor (L.E)",
    "Price With VAT Per Meter (Cable)",
    "U.P Price with VAT (Cable Lugs)",
    "T.P Price with VAT (Cable Lugs)",
    "U.P Price with VAT (Cable Heat Shrink)",
    "T.P Price with VAT (Cable Heat Shrink)",
    "U.P Price with VAT (Flexible Connector)",
    "T.P Price with VAT (Flexible Connector)",
    "U.P Price with VAT (Gland)",
    "T.P Price with VAT (Gland)",
    "U.P Price with VAT (Brass Bar)",
    "T.P Price with VAT (Brass Bar)",
    "U.P Price with VAT(Electrical Box)",
    "Price With VAT Per Meter (Total)",
  ];

  // Format currency value for display
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(num)) return "-";
    return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L.E`;
  };

  // Check if a column is a calculated field
  const isCalculatedField = (col) => CALCULATED_FIELDS.includes(col);

  // Columns that should have a white vertical separator line AFTER them
  const SEPARATOR_COLUMNS = [
    "No of Poles",
    "Rated Torque – Mn (Nm)",
    "Ma / Mn (DOL)",
    "Ma / Mn (Y / ∆ Starting)",
    "Weight (KG)",
    "Insulation Class",
    "Other Price with VAT & Factor (L.E)",
    "Price With VAT Per Meter (Cable)",
    "T.P Price with VAT (Cable Lugs)",
    "T.P Price with VAT (Cable Heat Shrink)",
    "T.P Price with VAT (Flexible Connector)",
    "T.P Price with VAT (Gland)",
    "T.P Price with VAT (Brass Bar)",
    "U.P Price with VAT(Electrical Box)",
    "Price With VAT Per Meter (Total)",
  ];

  // Check if a column should have a separator after it
  const hasSeparatorAfter = (col) => SEPARATOR_COLUMNS.includes(col);

  // Exact column order matching JSON file - columns use exact JSON key names
  const COLUMN_ORDER = [
    "id",
    "Material",
    "Model",
    "Power (kW)",
    "Speed (RPM)",
    "No of Poles",
    "Rated current-In (A)",
    "Rated Torque – Mn (Nm)",
    "Locked rotor Current – Ia (A) (DOL)",
    "Ia / In (DOL)",
    "Locked rotor Torque – Ma (Nm) (DOL)",
    "Ma / Mn (DOL)",
    "Locked rotor Current – Ia (A) (Y / ∆ Starting)",
    "Ia / I-n (Y / ∆ Starting)",
    "Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)",
    "Ma / Mn (Y / ∆ Starting)",
    "Power factor Cos φ",
    "Phase",
    "Frame Size (mm)",
    "Shaft Diameter (mm)",
    "Shaft Length (mm)",
    "Shaft Feather Key Length (mm)",
    "IE",
    "front Brearing",
    "Rear Bearing",
    "Noise Level (dB-A)",
    "Weight (KG)",
    "Efficiency @ 50 Hz",
    "Efficiency @ 37.5 Hz",
    "Efficiency @ 25 Hz",
    "Run Capacitor 400 V (µF)",
    "Start Capacitor 330 V (µF)",
    "No. of Capacitors",
    "No. of Phases",
    "Insulation Class",
    "B3 Price ($) w/o VAT",
    "B3 Price with VAT & Factor (L.E)",
    "Other Price ($) w/o VAT",
    "Other Price with VAT & Factor (L.E)",
    "Current (A) with S.F (25%)(Cable)",
    "Cable Size (mm2)(Cable)",
    "Price w/o VAT Per Meter (Cable)",
    "Price With VAT Per Meter (Cable)",
    "No.(Cable Lugs)",
    "U.P Price w/o VAT (Cable Lugs)",
    "U.P Price with VAT (Cable Lugs)",
    "T.P Price with VAT (Cable Lugs)",
    "No.(Cable Heat Shrink)",
    "U.P Price w/o VAT (Cable Heat Shrink)",
    "U.P Price with VAT (Cable Heat Shrink)",
    "T.P Price with VAT (Cable Heat Shrink)",
    "Meter (Flexible Connector)",
    "Size (mm) (Flexible Connector)",
    "U.P Price w/o VAT (Flexible Connector)",
    "U.P Price with VAT (Flexible Connector)",
    "T.P Price with VAT (Flexible Connector)",
    "No. (Gland)",
    "U.P Price w/o VAT (Gland)",
    "U.P Price with VAT (Gland)",
    "T.P Price with VAT (Gland)",
    "No. (Brass Bar)",
    "U.P Price w/o VAT (Brass Bar)",
    "U.P Price with VAT (Brass Bar)",
    "T.P Price with VAT (Brass Bar)",
    "Size (mm) (Electrical Box)",
    "U.P Price w/o VAT (Electrical Box)",
    "U.P Price with VAT(Electrical Box)",
    "Price With VAT Per Meter (Total)",
    "Power (HP)",
  ];

  // Build columns from the predefined order - use exact JSON column names
  const columns = React.useMemo(() => {
    // Filter to only include columns that exist in the data
    const existingKeys = new Set();
    motors.forEach((m) => Object.keys(m || {}).forEach((k) => existingKeys.add(k)));

    return COLUMN_ORDER
      .filter((col) => existingKeys.has(col))
      .map((col) => ({ key: col, label: col }));
  }, [motors]);

  const downloadMotorTemplate = async () => {
    // expects pre-made file at /templates/MotorData-template.xlsx in the client public folder
    try {
      const urlPath = `${process.env.PUBLIC_URL || ""
        }/templates/Motor-Data-Template.xlsx`;
      const resp = await fetch(urlPath);
      if (!resp.ok) throw new Error(`Template not found: ${resp.status}`);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Motor-Data-Template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setExportMessage(err.message || "Failed to download template");
    }
  };

  return (
    <Box p={4} bg="var(--bg-page)" color="var(--text-primary)">
      <Heading mb={4} fontSize={"4xl"} textAlign={"center"}>
        Motor Data
      </Heading>

      <Stack direction={"row"} justify="space-between">
        <Box mb={4} display="flex" gap={2} alignItems="center">
          <Button
            size="sm"
            bg="var(--success)"
            _hover={{ bg: "#059669" }}
            onClick={handleAddNew}
          >
            + Add Item
          </Button>
          <Button
            size="sm"
            bg="var(--accent)"
            _hover={{
              bg: "#2563eb",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            }}
            onClick={fetchData}
            isDisabled={loading}
          >
            Refresh
          </Button>
          {loading && <Spinner size="sm" />}
        </Box>
        <Box mb={4} display="flex" gap={2} alignItems="center">
          <Box mb={4} display="flex" gap={2} alignItems="center">
            <Button
              size="sm"
              bg="var(--success)"
              _hover={{ bg: "#059669" }}
              onClick={downloadMotorTemplate}
            >
              Download Template
            </Button>
            <Button
              size="sm"
              bg="var(--accent)"
              _hover={{
                bg: "#2563eb",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              isDisabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Motor Data"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              accept=".xlsx,.xls,.csv"
              onChange={async (e) => {
                const f = e.target.files && e.target.files[0];
                e.target.value = ""; // reset so same file can be re-picked later
                if (!f) return;
                try {
                  setUploading(true);
                  setUploadMessage(null);

                  // read file as data URL and strip prefix
                  const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(f);
                  });
                  const base64 = String(dataUrl).split(",")[1] || "";

                  const resp = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/api/motor-data/upload`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        fileBase64: base64,
                        filename: f.name,
                      }),
                    }
                  );
                  const json = await resp.json().catch(() => ({}));
                  if (!resp.ok) {
                    throw new Error(
                      json?.error ||
                      json?.details ||
                      resp.statusText ||
                      "Upload failed"
                    );
                  }
                  setUploadMessage("Import successful");
                  // refresh list
                  console.log("Fetching data after upload...");
                  await fetchData();
                  console.log("Data fetched after upload.");
                } catch (err) {
                  console.error(err);
                  setUploadMessage(err.message || "Upload failed");
                } finally {
                  console.log("Setting uploading to false");
                  setUploading(false);
                }
              }}
            />
          </Box>
          <Box mb={4} display="flex" gap={2} alignItems="center">
            <Button
              size="sm"
              bg="var(--accent)"
              isLoading={downloading}
              _hover={{
                bg: "#2563eb",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
              onClick={async () => {
                try {
                  setDownloading(true);
                  setExportMessage(null);
                  const resp = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/api/motor-data/export`
                  );
                  if (!resp.ok) {
                    const txt = await resp.text().catch(() => null);
                    throw new Error(txt || resp.statusText || "Export failed");
                  }

                  // try to determine filename from content-disposition
                  const cd = resp.headers.get("content-disposition") || "";
                  let filename = "MotorData-export.xlsx";
                  const m = cd.match(
                    /filename\*=UTF-8''(.+)$|filename="?([^";]+)"?/i
                  );
                  if (m) {
                    filename = decodeURIComponent(
                      (m[1] || m[2] || filename).trim()
                    );
                  }

                  const blob = await resp.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                  setExportMessage("Export downloaded");
                } catch (err) {
                  console.error(err);
                  setExportMessage(err.message || "Export failed");
                } finally {
                  setDownloading(false);
                }
              }}
            >
              Export Motor Data
            </Button>
          </Box>
        </Box>
      </Stack>

      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      )}

      {uploadMessage && (
        <Alert.Root
          status={/successful/i.test(uploadMessage) ? "success" : "error"}
          mb={4}
        >
          <Alert.Indicator />
          <Alert.Title>
            {/successful/i.test(uploadMessage) ? "Success" : "Error"}
          </Alert.Title>
          <Alert.Description>{uploadMessage}</Alert.Description>
        </Alert.Root>
      )}

      {!loading && motors.length === 0 && !error && (
        <Text>No motors returned from API.</Text>
      )}
      <Text mb={4}>{motors.length} Motors Found</Text>
      {motors.length > 0 && (
        <Box
          className="admin-table-container"
          overflowX="auto"
          borderWidth="1px"
          borderRadius="lg"
          borderColor="#e2e8f0"
          bg="#ffffff"
          boxShadow="0 1px 3px rgba(0,0,0,0.08)"
          >
          <Table.Root bg="transparent" w={"max-content"}>
            <Table.Header bg="#f1f5f9" color="var(--text-primary)">
              <Table.Row bg="#f1f5f9" color="var(--text-primary)">
                <Table.ColumnHeader color="#1e293b" fontWeight="600" borderBottom="2px solid #cbd5e1" textAlign="center" verticalAlign="middle">Actions</Table.ColumnHeader>

                {columns.map((col) => (
                  <Table.ColumnHeader
                    color="#1e293b"
                    fontWeight="600"
                    borderBottom="2px solid #cbd5e1"
                    key={`h-${col.key}`}
                    textAlign="center"
                    verticalAlign="middle"
                    borderRight={hasSeparatorAfter(col.key) ? "1px solid #e2e8f0" : undefined}
                  >
                    {col.label}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>

            <Table.Body borderColor="var(--border-color)">
              {motors.map((m, idx) => {
                const rowBg = idx % 2 === 0 ? "var(--bg-page)" : "var(--bg-card)";

                return (
                  <Table.Row key={`c-${m.id}`} color="var(--text-primary)" bg={rowBg}>
                    <Table.Cell borderColor="var(--border-color)" textAlign="center" verticalAlign="middle">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Button
                          size="xs"
                          bg="var(--accent)"
                          color="white"
                          _hover={{ bg: "var(--accent-hover)" }}
                          onClick={() => handleEdit(m)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="red"
                          isLoading={deletingIds.includes(m.id)}
                          onClick={() => {
                            setSelectedMotor(m);
                            setOpenDialog(true);
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Table.Cell>
                    {columns.map((col) => {
                      // Direct access using exact JSON column name
                      const val = m[col.key];
                      const isCalculated = isCalculatedField(col.key);

                      return (
                        <Table.Cell
                          borderColor="var(--border-color)"
                          key={`r-${col.key}-${m.id}`}
                          color={isCalculated ? "var(--success)" : "var(--text-primary)"}
                          fontWeight={isCalculated ? "medium" : "normal"}
                          textAlign="center"
                          verticalAlign="middle"
                          borderRight={hasSeparatorAfter(col.key) ? "1px solid var(--border-color)" : undefined}
                        >
                          {isCalculated ? formatCurrency(val) : formatValue(val)}
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                );
                // ) : (
                //   <></>
                // );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
      <Dialog.Root open={openDialog}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="var(--bg-card)" color="var(--text-primary)">
              <Dialog.Header>
                <Dialog.Title>Delete Motor</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {selectedMotor ? (
                  <Text>
                    Are you sure you want to delete motor ID{" "}
                    <strong>{selectedMotor.id}</strong>? This action cannot be
                    undone.
                  </Text>
                ) : (
                  <Text>No motor selected.</Text>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button
                    variant="solid"
                    color="var(--text-primary)"
                    bg="var(--bg-elevated)"
                    onClick={() => setOpenDialog(false)}
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  colorScheme="red"
                  onClick={() => handleDelete(selectedMotor?.id)}
                  isLoading={deletingIds.includes(selectedMotor?.id)}
                >
                  Delete
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  color="var(--text-primary)"
                  _hover={{ bg: "var(--bg-elevated)" }}
                  onClick={() => {
                    setOpenDialog(false);
                  }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Add/Edit Motor Modal */}
      <Dialog.Root open={editModalOpen}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="var(--bg-card)" color="var(--text-primary)" maxW="90vw" maxH="90vh">
              <Dialog.Header>
                <Dialog.Title>
                  {editingMotor ? `Edit Motor (ID: ${editingMotor.id})` : "Add New Motor"}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Box maxH="60vh" overflowY="auto" pr={2}>
                  <Stack gap={3}>
                    {COLUMN_ORDER.filter(col => col !== "id").map((col) => {
                      const isCalculated = isCalculatedField(col);
                      return (
                        <Box key={col}>
                          <Text fontSize="sm" mb={1} color={isCalculated ? "var(--success)" : "var(--text-muted)"}>
                            {col}
                            {isCalculated && (
                              <Text as="span" fontSize="xs" ml={2} color="var(--success)">
                                (Auto-calculated)
                              </Text>
                            )}
                          </Text>
                          {isCalculated ? (
                            <Box
                              px={3}
                              py={2}
                              bg="var(--bg-card)"
                              borderWidth="1px"
                              borderColor="var(--border-color)"
                              borderRadius="md"
                              fontSize="sm"
                              color="var(--success)"
                            >
                              {editingMotor
                                ? formatCurrency(editingMotor[col])
                                : "Will be calculated after save"}
                            </Box>
                          ) : (
                            <Input
                              size="sm"
                              bg="var(--bg-page)"
                              borderColor="var(--border-color)"
                              value={formData[col] ?? ""}
                              onChange={(e) => handleFormChange(col, e.target.value)}
                              placeholder={col}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="solid"
                  color="var(--text-primary)"
                  bg="var(--bg-elevated)"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingMotor(null);
                    setFormData({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  bg="var(--success)"
                  color="white"
                  _hover={{ bg: "#059669" }}
                  onClick={handleSave}
                  isLoading={saving}
                  ml={2}
                >
                  {editingMotor ? "Update" : "Create"}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  color="var(--text-primary)"
                  _hover={{ bg: "var(--bg-elevated)" }}
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingMotor(null);
                    setFormData({});
                  }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}
