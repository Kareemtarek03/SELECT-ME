#!/usr/bin/env node
/**
 * Reads the "Axial Impeller" sheet from the Excel file and outputs the data.
 * Used to understand the Impeller pricing seed structure for Blades, Hubs, Frames.
 */
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const xlsmPath = path.join(
  __dirname,
  "../server/Newmodules/axial/AxialPricing/AxialImpeller/Axial Software Selection .xlsm"
);

const wb = XLSX.readFile(xlsmPath, { bookVBA: false, sheetRows: 50 });
const sheetName = "Axial Impeller";
if (!wb.SheetNames.includes(sheetName)) {
  console.error("Sheet not found:", sheetName);
  console.log("Available sheets:", wb.SheetNames);
  process.exit(1);
}

const ws = wb.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

console.log("=== Axial Impeller Sheet ===");
console.log("Rows:", data.length);
console.log("\nFirst 50 rows (raw):\n");
data.slice(0, 50).forEach((row, i) => {
  console.log(`Row ${i}:`, JSON.stringify(row));
});
