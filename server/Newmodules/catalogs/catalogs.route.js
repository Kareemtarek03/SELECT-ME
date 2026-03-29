import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Resolve the Catologs folder (note: folder is spelled "Catologs" in the project)
const appPath = process.env.APP_PATH || path.join(__dirname, "..", "..", "..");
const catalogsDir = path.join(appPath, "Catologs");

// GET /api/catalogs - List all PDF catalogs
router.get("/", async (req, res) => {
    try {
        if (!fs.existsSync(catalogsDir)) {
            return res.json({ catalogs: [] });
        }

        const files = fs.readdirSync(catalogsDir).filter((f) =>
            f.toLowerCase().endsWith(".pdf")
        );

        const catalogs = files.map((file) => {
            const filePath = path.join(catalogsDir, file);
            const stats = fs.statSync(filePath);
            // Create a display name from the file name (remove .pdf extension)
            const displayName = file.replace(/\.pdf$/i, "");
            return {
                name: file,
                displayName,
                size: stats.size,
                modified: stats.mtime,
            };
        });

        // Sort alphabetically by display name
        catalogs.sort((a, b) => a.displayName.localeCompare(b.displayName));

        res.json({ catalogs });
    } catch (err) {
        console.error("Error listing catalogs:", err);
        res.status(500).json({ error: "Failed to list catalogs" });
    }
});

// GET /api/catalogs/download/:filename - Download/view a specific catalog PDF
router.get("/download/:filename", async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);

        // Prevent directory traversal
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return res.status(400).json({ error: "Invalid filename" });
        }

        const filePath = path.join(catalogsDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "Catalog not found" });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (err) {
        console.error("Error downloading catalog:", err);
        res.status(500).json({ error: "Failed to download catalog" });
    }
});

export default router;
