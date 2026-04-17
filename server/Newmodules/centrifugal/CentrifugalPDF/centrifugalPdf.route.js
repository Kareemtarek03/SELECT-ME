import express from "express";
import { generateCentrifugalFanDatasheetPDF } from "./centrifugalPdfGenerator.service.js";

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
 * POST /api/centrifugal/pdf/datasheet
 * Generate a centrifugal fan datasheet PDF
 *
 * Request body:
 * {
 *   fanData: {
 *     phase18: { ... },      // Phase 18 results
 *     phase17Motor: { ... }, // Motor data from Phase 17
 *     phase19: { ... },      // Curve data from Phase 19
 *     phase20: { ... },      // Noise data from Phase 20
 *     selectedFan: { ... }   // Original selected fan data
 *   },
 *   userInput: { ... },      // User input values (TempC, RPM, SPF, etc.)
 *   units: { ... }           // Units configuration (airFlow, pressure, etc.)
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

    if (!fanData.phase18) {
      return res.status(400).json({ error: "Phase 18 data is required" });
    }

    // Generate PDF
    const doc = generateCentrifugalFanDatasheetPDF(fanData, userInput, units);

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
    console.error("Centrifugal PDF generation error:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      details: error.message,
    });
  }
};

router.post("/datasheet", handleDatasheetInline);
router.post("/datasheet/:filename", handleDatasheetInline);

/**
 * POST /api/centrifugal/pdf/datasheet/download
 * Generate and download a centrifugal fan datasheet PDF
 */
const handleDatasheetDownload = async (req, res) => {
  try {
    const { fanData, userInput, units } = req.body;

    if (!fanData) {
      return res.status(400).json({ error: "Fan data is required" });
    }

    if (!fanData.phase18) {
      return res.status(400).json({ error: "Phase 18 data is required" });
    }

    // Generate PDF
    const doc = generateCentrifugalFanDatasheetPDF(fanData, userInput, units);

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
    console.error("Centrifugal PDF generation error:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      details: error.message,
    });
  }
};

router.post("/datasheet/download", handleDatasheetDownload);
router.post("/datasheet/download/:filename", handleDatasheetDownload);

export default router;
