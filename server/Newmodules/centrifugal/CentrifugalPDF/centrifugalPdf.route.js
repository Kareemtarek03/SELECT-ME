import express from "express";
import { generateCentrifugalFanDatasheetPDF } from "./centrifugalPdfGenerator.service.js";

const router = express.Router();

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
// Use :filename? to allow it to be part of the URL path for better browser support
router.post("/datasheet", async (req, res) => {
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
        const filename = `Datasheet.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

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
});

/**
 * POST /api/centrifugal/pdf/datasheet/download
 * Generate and download a centrifugal fan datasheet PDF
 */
router.post("/datasheet/download", async (req, res) => {
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
        const filename = `Datasheet.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

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
});

export default router;
