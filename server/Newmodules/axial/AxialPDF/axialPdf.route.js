import express from 'express';
import { generateFanDatasheetPDF } from './axialPdfGenerator.service.js';

const router = express.Router();

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
// Use :filename? to allow it to be part of the URL path for better browser support
router.post('/datasheet/:filename?', async (req, res) => {
    try {
        // Handle form submission (jsonPayload string) or standard JSON body
        if (req.body.jsonPayload) {
            try {
                req.body = JSON.parse(req.body.jsonPayload);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid JSON payload' });
            }
        }
        const { fanData, userInput, units } = req.body;

        if (!fanData) {
            return res.status(400).json({ error: 'Fan data is required' });
        }

        // Generate PDF
        const doc = generateFanDatasheetPDF(fanData, userInput, units);

        // Set response headers for PDF
        // Use fanUnitNo for filename, sanitize: remove invalid characters (/ \ : * ? " < > |)
        const fanUnitNo = userInput?.fanUnitNo || 'EX-01';
        const sanitizedFanUnitNo = fanUnitNo.replace(/[/\\:*?"<>|]/g, '_');
        const filename = `${sanitizedFanUnitNo}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        // Pipe the PDF to the response
        doc.pipe(res);
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            error: 'Failed to generate PDF',
            details: error.message
        });
    }
});

/**
 * POST /api/pdf/datasheet/download
 * Generate and download a fan datasheet PDF
 */
router.post('/datasheet/download', async (req, res) => {
    try {
        const { fanData, userInput, units } = req.body;

        if (!fanData) {
            return res.status(400).json({ error: 'Fan data is required' });
        }

        // Generate PDF
        const doc = generateFanDatasheetPDF(fanData, userInput, units);

        // Set response headers for download
        // Use fanUnitNo for filename, sanitize: remove invalid characters (/ \ : * ? " < > |)
        const fanUnitNo = userInput?.fanUnitNo || 'EX-01';
        const sanitizedFanUnitNo = fanUnitNo.replace(/[/\\:*?"<>|]/g, '_');
        const filename = `${sanitizedFanUnitNo}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe the PDF to the response
        doc.pipe(res);
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            error: 'Failed to generate PDF',
            details: error.message
        });
    }
});

export default router;
