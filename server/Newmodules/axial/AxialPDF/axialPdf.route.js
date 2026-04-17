import express from "express";
import { generateFanDatasheetPDF } from "./axialPdfGenerator.service.js";

const router = express.Router();

function sanitizeFilenamePart(value) {
  if (value == null) return "";
  return String(value)
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "")
    .slice(0, 100);
}

function buildDatasheetFilename(units, userInput) {
  const unitNo = sanitizeFilenamePart(units?.fanUnitNo ?? userInput?.fanUnitNo);
  const baseName = unitNo || "Datasheet";
  return `${baseName}.pdf`;
}

/**
 * POST /api/pdf/datasheet
 * Generate a fan datasheet PDF
 *
 * Request body:
 * {
 *   fanData: { ... },  // Fan data object with predictions, Blades, Impeller, matchedMotor, etc.
 *   userInput: { ... }, // User input values (airFlow, TempC, RPM, SPF, etc.)
 *   units: { ... }      // Units configuration (airFlow, pressure, power, etc.)
 * }
 */
const handleDatasheetInline = async (req, res) => {
  try {
    // Handle form submission (jsonPayload string) or standard JSON body
    if (req.body.jsonPayload) {
      try {
        req.body = JSON.parse(req.body.jsonPayload);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON payload" });
      }
    }
    const { fanData, userInput, units } = req.body;

    if (!fanData) {
      return res.status(400).json({ error: "Fan data is required" });
    }

    // Generate PDF
    const doc = generateFanDatasheetPDF(fanData, userInput, units);

    // Set response headers for PDF
    const filename = buildDatasheetFilename(units, userInput);
    const encodedFilename = encodeURIComponent(filename);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
    );
    res.setHeader("X-Datasheet-Filename", filename);

    // Pipe the PDF to the response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      details: error.message,
    });
  }
};

router.post("/datasheet", handleDatasheetInline);
router.post("/datasheet/:filename", handleDatasheetInline);

/**
 * POST /api/pdf/datasheet/download
 * Generate and download a fan datasheet PDF
 */
const handleDatasheetDownload = async (req, res) => {
  try {
    const { fanData, userInput, units } = req.body;

    if (!fanData) {
      return res.status(400).json({ error: "Fan data is required" });
    }

    // Generate PDF
    const doc = generateFanDatasheetPDF(fanData, userInput, units);

    // Set response headers for download
    const filename = buildDatasheetFilename(units, userInput);
    const encodedFilename = encodeURIComponent(filename);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
    );
    res.setHeader("X-Datasheet-Filename", filename);

    // Pipe the PDF to the response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      details: error.message,
    });
  }
};

router.post("/datasheet/download", handleDatasheetDownload);
router.post("/datasheet/download/:filename", handleDatasheetDownload);

export default router;
