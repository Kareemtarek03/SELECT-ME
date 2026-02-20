#!/usr/bin/env node
/**
 * Maps each Centrifugal Casing component to its columns and compares structures.
 */
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const xlsmPath = path.join(__dirname, "Cent. Software Selection -(Costing).xlsm");

const wb = XLSX.readFile(xlsmPath, { bookVBA: false });
const sheetName = "Centrifugal Casing";
if (!wb.SheetNames.includes(sheetName)) {
  console.error("Sheet not found:", sheetName);
  process.exit(1);
}

const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" });
const row0 = data[0] || []; // Category headers (Volute 2mm, Frame Angle Bar, etc.)
const row1 = data[1] || []; // Column headers (Sr., Weight w/o Scrap, etc.)

// Find component boundaries from row 0 - each component name starts a new group
const components = [];
let currentComponent = null;
let startCol = 0;

for (let c = 0; c < row0.length; c++) {
  const val = String(row0[c] || "").trim();
  if (!val) continue;
  // Skip "Total Price with VAT" and "Scrap Recycle" - those are sub-headers
  if (val === "Total Price with VAT" || val.includes("Scrap Recylce") || val === "") continue;
  if (currentComponent && val !== currentComponent.name) {
    components.push({ ...currentComponent, endCol: c - 1 });
  }
  currentComponent = { name: val, startCol: c };
}
if (currentComponent) components.push({ ...currentComponent, endCol: row0.length - 1 });

// Build column structure for each component
const getColStructure = (startCol, endCol) => {
  const cols = [];
  for (let c = startCol; c <= endCol && c < row1.length; c++) {
    const h = String(row1[c] || "").trim();
    if (h) cols.push(h);
  }
  return cols;
};

console.log("=== Component boundaries (from row 0) ===\n");
components.forEach((comp, i) => {
  const structure = getColStructure(comp.startCol, comp.endCol);
  console.log(`${i + 1}. ${comp.name}`);
  console.log(`   Cols ${comp.startCol}-${comp.endCol} (${comp.endCol - comp.startCol + 1} cols)`);
  console.log(`   Headers: ${structure.slice(0, 8).join(" | ")}${structure.length > 8 ? " ..." : ""}`);
  comp.structure = structure;
  comp.structureKey = structure.join("|");
});

console.log("\n=== Full header list by component (first 15 cols each) ===\n");
components.forEach((comp, i) => {
  console.log(`\n--- ${comp.name} (cols ${comp.startCol}-${comp.endCol}) ---`);
  for (let c = comp.startCol; c <= Math.min(comp.endCol, comp.startCol + 14); c++) {
    console.log(`  ${c}: ${row1[c]}`);
  }
});

// Group components by same structure
console.log("\n=== Components with SAME column structure (can be combined) ===\n");
const byStructure = {};
components.forEach((comp) => {
  const key = comp.structureKey;
  if (!byStructure[key]) byStructure[key] = [];
  byStructure[key].push(comp.name);
});
Object.entries(byStructure).forEach(([key, names]) => {
  if (names.length > 1) {
    console.log(`Same structure (${key.split("|").length} cols): ${names.join(", ")}`);
  }
});

// Row 0 categories for cols 109-150
console.log("\n=== Row 0 categories (cols 105-150) ===\n");
for (let c = 105; c <= 150; c++) {
  const r0 = String(row0[c] || "").trim();
  const r1 = String(row1[c] || "").trim();
  if (r0 || r1) console.log(`${c}: row0="${r0}" | row1="${r1}"`);
}

// Compare structures in detail for combinable groups
console.log("\n=== Structure comparison: Sheet-metal components (Weight, Scrap, Dimensions + extras) ===\n");
const sheetMetalBase = ["Weight (kg) w/o Scrap", "Scrap Percentage (%)", "Weight (kg) with Scrap", "Sheet metal Dimensions (mm)"];
const sheetMetalAngleBar = ["Weight (kg) w/o Scrap", "Scrap Percentage (%)", "Weight (kg) with Scrap", "Angle Bar Dimensions (mm)"];
