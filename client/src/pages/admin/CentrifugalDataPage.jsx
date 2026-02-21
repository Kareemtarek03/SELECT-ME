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
import { FaDatabase, FaCog, FaList, FaFan, FaBox, FaSave, FaTimes } from "react-icons/fa";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";

const API = process.env.REACT_APP_API_BASE_URL || "";

const TABS = [
  { id: "fans", name: "Fans", icon: FaFan },
  { id: "pulleys", name: "Pulleys", icon: FaCog },
  { id: "belt-standards", name: "Belt Length Standard", icon: FaList },
  { id: "pulley-standards", name: "Pulley Standard", icon: FaDatabase },
  { id: "casing", name: "Casing Pricing", icon: FaBox },
];

const CASING_SUB_TABS = [
  { id: "casing-pricing", name: "Casing (Parent)", path: "casing-pricing" },
  { id: "volutes", name: "Volute", path: "casing-volutes" },
  { id: "frames", name: "Frame", path: "casing-frames" },
  { id: "impellers", name: "Impeller", path: "casing-impellers" },
  { id: "funnels", name: "Funnels", path: "casing-funnels" },
  { id: "sleeve-shafts", name: "Sleeve+Shaft", path: "casing-sleeve-shafts" },
  {
    id: "matching-flanges",
    name: "Matching Flange",
    path: "casing-matching-flanges",
  },
  {
    id: "bearing-assemblies",
    name: "Bearing Assembly",
    path: "casing-bearing-assemblies",
  },
  { id: "fan-bases", name: "Fan Base", path: "casing-fan-bases" },
  { id: "belt-covers", name: "Belt Cover", path: "casing-belt-covers" },
  { id: "motor-bases", name: "Motor Base", path: "casing-motor-bases" },
  { id: "accessories", name: "Accessories", path: "casing-accessories" },
];

const VALID_TABS = new Set(TABS.map((t) => t.id));

// Price w/ VAT and Price w/ VAT Scrap are CALCULATED (equations to be added later) - not stored
const CASING_TAB_CONFIG = {
  "casing-pricing": {
    columns: [
      { key: "id", label: "ID" },
      { key: "type", label: "Type" },
      { key: "model", label: "Model" },
      { key: "sizeMm", label: "Size (mm)" },
      { key: "modelAndSize", label: "Model & Size" },
    ],
    formFields: [
      { key: "type", label: "Type", type: "text" },
      { key: "model", label: "Model", type: "text" },
      { key: "sizeMm", label: "Size (mm)", type: "number" },
      { key: "modelAndSize", label: "Model & Size", type: "text" },
    ],
  },
  "casing-volutes": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "volute2mmWeightKgWithoutScrap", label: "2mm Weight" },
      { key: "volute1mmWeightKgWithoutScrap", label: "1mm Weight" },
      { key: "volute1mmLaserTimeMin", label: "1mm Laser" },
      { key: "volute1mmRolling", label: "1mm Rolling" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      {
        key: "volute2mmWeightKgWithoutScrap",
        label: "2mm Weight w/o Scrap",
        type: "number",
      },
      { key: "volute2mmScrapPct", label: "2mm Scrap %", type: "number" },
      {
        key: "volute2mmSheetMetalDimensionsMm",
        label: "2mm Dimensions",
        type: "text",
      },
      {
        key: "volute1mmWeightKgWithoutScrap",
        label: "1mm Weight w/o Scrap",
        type: "number",
      },
      { key: "volute1mmScrapPct", label: "1mm Scrap %", type: "number" },
      {
        key: "volute1mmSheetMetalDimensionsMm",
        label: "1mm Dimensions",
        type: "text",
      },
      { key: "volute1mmLaserTimeMin", label: "1mm Laser Time", type: "number" },
      { key: "volute1mmRolling", label: "1mm Rolling", type: "number" },
      {
        key: "volute1mmSheetMetalOverlapping",
        label: "1mm Overlapping",
        type: "number",
      },
    ],
  },
  "casing-frames": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "angleBarWeightKgWithoutScrap", label: "Angle Bar Weight" },
      { key: "supportWeightKgWithoutScrap", label: "Support Weight" },
      { key: "supportLaserTimeMin", label: "Support Laser" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      {
        key: "angleBarWeightKgWithoutScrap",
        label: "Angle Bar Weight",
        type: "number",
      },
      { key: "angleBarDimensionsMm", label: "Angle Bar Dims", type: "text" },
      {
        key: "supportWeightKgWithoutScrap",
        label: "Support Weight",
        type: "number",
      },
      {
        key: "supportSheetMetalDimensionsMm",
        label: "Support Dims",
        type: "text",
      },
      { key: "supportLaserTimeMin", label: "Support Laser", type: "number" },
      {
        key: "supportCasingCircumferenceM",
        label: "Support Circumf",
        type: "number",
      },
      { key: "supportPaintingLe", label: "Support Painting", type: "number" },
    ],
  },
  "casing-impellers": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "bladesWeightKgWithoutScrap", label: "Blades Weight" },
      { key: "plateWeightKgWithoutScrap", label: "Plate Weight" },
      { key: "plateLaserTimeMin", label: "Plate Laser" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      {
        key: "bladesWeightKgWithoutScrap",
        label: "Blades Weight",
        type: "number",
      },
      {
        key: "bladesSheetMetalDimensionsMm",
        label: "Blades Dims",
        type: "text",
      },
      {
        key: "plateWeightKgWithoutScrap",
        label: "Plate Weight",
        type: "number",
      },
      { key: "plateSheetMetalDimensionsMm", label: "Plate Dims", type: "text" },
      {
        key: "plateCentrifugalImpellerRigCostPcs",
        label: "Plate Rig Cost",
        type: "number",
      },
      { key: "plateLaserTimeMin", label: "Plate Laser", type: "number" },
      {
        key: "plateCasingCircumferenceM",
        label: "Plate Circumf",
        type: "number",
      },
      { key: "platePaintingLe", label: "Plate Painting", type: "number" },
    ],
  },
  "casing-funnels": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "funnel15mmWeightKgWithoutScrap", label: "1.5mm Weight" },
      { key: "funnel3mmWeightKgWithoutScrap", label: "3mm Weight" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      {
        key: "funnel15mmWeightKgWithoutScrap",
        label: "1.5mm Weight",
        type: "number",
      },
      {
        key: "funnel15mmSheetMetalDimensionsMm",
        label: "1.5mm Dims",
        type: "text",
      },
      {
        key: "funnel15mmDieCastingLePc",
        label: "1.5mm Die Casting",
        type: "number",
      },
      {
        key: "funnel15mmGalvanizeLe",
        label: "1.5mm Galvanize",
        type: "number",
      },
      {
        key: "funnel3mmWeightKgWithoutScrap",
        label: "3mm Weight",
        type: "number",
      },
      {
        key: "funnel3mmSheetMetalDimensionsMm",
        label: "3mm Dims",
        type: "text",
      },
      { key: "funnel3mmPaintingLe", label: "3mm Painting", type: "number" },
    ],
  },
  "casing-sleeve-shafts": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "sleeveWeightKgWithoutScrap", label: "Sleeve Weight" },
      { key: "shaftWeightKgWithoutScrap", label: "Shaft Weight" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      {
        key: "sleeveWeightKgWithoutScrap",
        label: "Sleeve Weight",
        type: "number",
      },
      {
        key: "sleeveSheetMetalDimensionsMm",
        label: "Sleeve Dims",
        type: "text",
      },
      { key: "sleeveManufacturingLePc", label: "Sleeve Mfg", type: "number" },
      {
        key: "shaftWeightKgWithoutScrap",
        label: "Shaft Weight",
        type: "number",
      },
      { key: "shaftSheetMetalDimensionsMm", label: "Shaft Dims", type: "text" },
      { key: "shaftManufacturingLePc", label: "Shaft Mfg", type: "number" },
    ],
  },
  "casing-matching-flanges": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "flange3mmWeightKgWithoutScrap", label: "Flange Weight" },
      { key: "flange3mmLaserTimeMin", label: "Laser" },
      { key: "flange3mmRolling", label: "Rolling" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      {
        key: "flange3mmWeightKgWithoutScrap",
        label: "Flange Weight",
        type: "number",
      },
      {
        key: "flange3mmSheetMetalDimensionsMm",
        label: "Flange Dims",
        type: "text",
      },
      { key: "flange3mmLaserTimeMin", label: "Laser Time", type: "number" },
      { key: "flange3mmRolling", label: "Rolling", type: "number" },
      {
        key: "flange3mmCasingCircumferenceM",
        label: "Circumf",
        type: "number",
      },
      {
        key: "selfAligningBearingHousingLe",
        label: "Bearing Housing",
        type: "number",
      },
    ],
  },
  "casing-bearing-assemblies": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "boltsNutsKg", label: "Bolts+Nuts (kg)" },
      { key: "assemblyLaboursPerShaft", label: "Assembly Labours" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      { key: "boltsNutsKg", label: "Bolts+Nuts (kg)", type: "number" },
      {
        key: "assemblyLaboursPerShaft",
        label: "Assembly Labours/Shaft",
        type: "number",
      },
    ],
  },
  "casing-fan-bases": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "weightKgWithoutScrap", label: "Weight" },
      { key: "laserTimeMin", label: "Laser" },
      { key: "bendingLine", label: "Bending" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      {
        key: "weightKgWithoutScrap",
        label: "Weight w/o Scrap",
        type: "number",
      },
      { key: "scrapPct", label: "Scrap %", type: "number" },
      { key: "sheetMetalDimensionsMm", label: "Dimensions", type: "text" },
      { key: "laserTimeMin", label: "Laser Time", type: "number" },
      { key: "bendingLine", label: "Bending Line", type: "number" },
      { key: "paintingLe", label: "Painting", type: "number" },
    ],
  },
  "casing-belt-covers": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "weightKgWithoutScrap", label: "Weight" },
      { key: "laserTimeMin", label: "Laser" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      {
        key: "weightKgWithoutScrap",
        label: "Weight w/o Scrap",
        type: "number",
      },
      { key: "scrapPct", label: "Scrap %", type: "number" },
      { key: "sheetMetalDimensionsMm", label: "Dimensions", type: "text" },
      { key: "laserTimeMin", label: "Laser Time", type: "number" },
      { key: "casingCircumferenceM", label: "Circumf", type: "number" },
      { key: "paintingLe", label: "Painting", type: "number" },
    ],
  },
  "casing-motor-bases": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "weightKgWithoutScrap", label: "Weight" },
      { key: "laserTimeMin", label: "Laser" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      {
        key: "weightKgWithoutScrap",
        label: "Weight w/o Scrap",
        type: "number",
      },
      { key: "scrapPct", label: "Scrap %", type: "number" },
      { key: "sheetMetalDimensionsMm", label: "Dimensions", type: "text" },
      { key: "laserTimeMin", label: "Laser Time", type: "number" },
      { key: "bendingLine", label: "Bending Line", type: "number" },
      { key: "studNutPriceLe", label: "Stud & Nut", type: "number" },
      { key: "paintingLe", label: "Painting", type: "number" },
    ],
  },
  "casing-accessories": {
    columns: [
      { key: "id", label: "ID" },
      { key: "casing.modelAndSize", label: "Casing" },
      { key: "vibrationIsolatorsLe", label: "Vibration Isol" },
      { key: "labourCostLe", label: "Labour" },
    ],
    formFields: [
      { key: "casingId", label: "Casing ID", type: "number" },
      {
        key: "vibrationIsolatorsLe",
        label: "Vibration Isolators",
        type: "number",
      },
      { key: "vinylStickersLe", label: "Vinyl Stickers", type: "number" },
      { key: "namePlateLe", label: "Name Plate", type: "number" },
      { key: "packingLe", label: "Packing", type: "number" },
      { key: "labourCostLe", label: "Labour Cost", type: "number" },
      {
        key: "internalTransportationLe",
        label: "Internal Transport",
        type: "number",
      },
    ],
  },
};

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

  return (
    <Box>
      <Stack direction="row" mb={4} gap={2}>
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
      {list.length === 0 && !editOpen && (
        <Text mt={2}>No centrifugal fan data. Click Add Fan or use seed.</Text>
      )}
      {editOpen && (
        <Dialog.Root open={editOpen}>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content
                bg="var(--bg-card)"
                color="var(--text-primary)"
                maxW="500px"
                border="1px solid var(--border-color)"
                boxShadow="lg"
              >
                <Dialog.Header>
                  <Dialog.Title>
                    {editingRow ? "Edit Fan" : "Add Fan"}
                  </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap={3}>
                    {FAN_SCALAR_FIELDS.map(({ key, label, type }) => (
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
                    {[
                      "airFlow",
                      "totPressure",
                      "velPressure",
                      "staticPressure",
                      "fanInputPow",
                    ].map((key) => (
                      <Box key={key}>
                        <Text fontSize="sm" mb={1}>
                          {key} (JSON array)
                        </Text>
                        <textarea
                          rows={2}
                          value={form[key] ?? "[]"}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [key]: e.target.value }))
                          }
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
                  <Dialog.Title>Delete fan?</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  ID {confirmDelete.id} –{" "}
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

// Resolve nested keys like "casing.modelAndSize"
const getCellVal = (row, key) => {
  if (key.includes(".")) {
    return key.split(".").reduce((o, k) => o?.[k], row) ?? "-";
  }
  return row[key] ?? "-";
};

// ---------- Generic CRUD Table (Pulleys, Belt Standard, Pulley Standard) ----------
// formFields: [{ key, label, type: 'number'|'text' }] - used for Add/Edit form (exclude id)
// columns: [{ key, label }] - key can be nested e.g. "casing.modelAndSize"
function GenericCrudTab({
  title,
  listPath,
  createPath,
  updatePath,
  deletePath,
  columns,
  getRowId,
  formFields,
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
  const [calculatePrice, setCalculatePrice] = useState(false);
  const [calculatePriceResult, setCalculatePriceResult] = useState(null);

  const handleCalculatePrice = async (row) => {
    setCalculatePrice(true);
    setCalculatePriceResult(null);
    const r = await fetch(`${API}/api/centrifugal/data/casing-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    if (!r.ok)
      throw new Error(
        (await r.json().catch(() => ({}))).error || "Calculate price failed",
      );
    const data = await r.json();
    console.log("Calculate price result:", data);
    setCalculatePriceResult(data);
  };
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
    setForm(
      formFields
        ? formFields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {})
        : {},
    );
    setEditOpen(true);
  };
  const openEdit = (row) => {
    setEditingRow(row);
    setForm(
      formFields
        ? formFields.reduce(
            (acc, f) => ({ ...acc, [f.key]: row[f.key] ?? "" }),
            {},
          )
        : {},
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
          },
        );
        if (!r.ok)
          throw new Error(
            (await r.json().catch(() => ({}))).error || "Update failed",
          );
      } else {
        const r = await fetch(`${API}${createPath}`, {
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
      <Stack direction="row" mb={4} gap={2}>
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
              {formFields.map((c) => (
                <Table.ColumnHeader key={c.key}>{c.label}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {list.map((row, idx) => (
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
                      bg="var(--btn-primary)"
                      color="white"
                      _hover={{ bg: "var(--btn-primary-hover)" }}
                      onClick={() => handleCalculatePrice(row)}
                    >
                      Calculate Price
                    </Button>
                    {calculatePriceResult && (
                      <Text fontSize="xs" color="var(--text-muted)">
                        {calculatePriceResult.price}
                      </Text>
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
                {formFields.map((c) => (
                  <Table.Cell key={c.key}>{getCellVal(row, c.key)}</Table.Cell>
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
                <Dialog.Body>
                  ID {getRowId(confirmDelete)}. This cannot be undone.
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

export default function CentrifugalDataPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const casingSubFromUrl = searchParams.get("casing");
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && VALID_TABS.has(tabFromUrl) ? tabFromUrl : "fans",
  );
  const [casingSubTab, setCasingSubTab] = useState(
    casingSubFromUrl && CASING_SUB_TABS.some((t) => t.id === casingSubFromUrl)
      ? casingSubFromUrl
      : "casing-pricing",
  );

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.has(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (
      casingSubFromUrl &&
      CASING_SUB_TABS.some((t) => t.id === casingSubFromUrl) &&
      casingSubFromUrl !== casingSubTab
    ) {
      setCasingSubTab(casingSubFromUrl);
    }
  }, [casingSubFromUrl]);

  const setActiveTabAndUrl = (id) => {
    setActiveTab(id);
    setSearchParams(
      id === "casing" ? { tab: id, casing: casingSubTab } : { tab: id },
    );
  };

  const setCasingSubTabAndUrl = (id) => {
    setCasingSubTab(id);
    setSearchParams({ tab: "casing", casing: id });
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
              onClick={() => navigate("/admin/common")}
            >
              Open Common Data (Motor & Pricing Items)
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
            {activeTab === "casing" && (
              <Box>
                <Box
                  display="flex"
                  gap={2}
                  flexWrap="wrap"
                  mb={4}
                  borderBottom="1px solid var(--border-color)"
                  pb={3}
                >
                  {CASING_SUB_TABS.map((st) => {
                    const isActive = casingSubTab === st.id;
                    return (
                      <Button
                        key={st.id}
                        size="sm"
                        onClick={() => setCasingSubTabAndUrl(st.id)}
                        bg={isActive ? "#1e293b" : "#ffffff"}
                        color={isActive ? "white" : "#1e293b"}
                        border="1px solid"
                        borderColor={isActive ? "#1e293b" : "#e2e8f0"}
                        _hover={{ bg: isActive ? "#0f172a" : "#f1f5f9" }}
                      >
                        {st.name}
                      </Button>
                    );
                  })}
                </Box>
                {CASING_SUB_TABS.map((st) => {
                  if (casingSubTab !== st.id) return null;
                  const cfg = CASING_TAB_CONFIG[st.path];
                  if (!cfg) return null;
                  return (
                    <GenericCrudTab
                      key={st.id}
                      listPath={`/api/centrifugal/data/${st.path}`}
                      createPath={`/api/centrifugal/data/${st.path}`}
                      updatePath={`/api/centrifugal/data/${st.path}/:id`}
                      deletePath={`/api/centrifugal/data/${st.path}/:id`}
                      getRowId={(r) => r.id}
                      columns={cfg.columns}
                      formFields={cfg.formFields}
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
