import { processFanDataService, main, Output } from "./axialFanData.service.js";
import { exportFanData, importFanDataFromExcel } from "./axialFanData.service.js";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

export async function processFanDataController(req, res) {
  try {
    const { units, input } = req.body;
    const filePath = "db";
    const result = await processFanDataService({
      filePath,
      units,
      input,
      dataSource: "db",
    });

    res.json({
      message: "✅ Fan data processed successfully!",
      data: result.recalculatedData,
    });
  } catch (error) {
    console.error("❌ Fan data processing failed:", error);
    res.status(500).json({
      error: "Failed to process fan data",
      details: error.message,
    });
  }
}
export async function NumericalEq(req, res) {
  try {
    const { units, input } = req.body;
    const filePath = "db";
    const result = await main({ filePath, units, input, dataSource: "db" });

    res.json({
      message: "✅ Fan data processed successfully!",
      data: result.result,
    });
  } catch (error) {
    console.error("❌ Fan data processing failed:", error);
    res.status(500).json({
      error: "Failed to process fan data",
      details: error.message,
    });
  }
}
export async function filter(req, res) {
  try {
    const { units, input } = req.body;

    console.log(`\n=== Filter Controller Debug ===`);
    console.log(`units:`, JSON.stringify(units, null, 2));
    console.log(`input:`, JSON.stringify(input, null, 2));

    const result = await Output({ units, input, dataSource: "db" });

    res.json({
      message: "✅ Fan data processed successfully!",
      data: result,
    });
  } catch (error) {
    console.error("❌ Fan data processing failed:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to process fan data",
      details: error.message || String(error),
    });
  }
}
export async function getOutputFile(req, res) {
  try {
    // Read fan data directly from the database
    const rows = await prisma.fanData.findMany();
    const data = rows
      .map((r) => ({
        Id: r.id,
        Blades: {
          symbol: r.bladesSymbol,
          material: r.bladesMaterial,
          noBlades: r.noBlades,
          angle: r.bladesAngle,
        },
        Impeller: {
          innerDia: r.impellerInnerDia,
          conf: r.impellerConf,
        },
        desigDensity: r.desigDensity,
        RPM: r.RPM,
        airFlow: r.airFlow,
        totPressure: r.totPressure,
        velPressure: r.velPressure,
        staticPressure: r.staticPressure,
        fanInputPow: r.fanInputPow,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }))
      .sort((a, b) => (a.Id || 0) - (b.Id || 0)); // sort by Id if available

    res.json({ message: "✅ Output data (from DB)", data });
  } catch (err) {
    console.error("Failed to read output file", err);
    res
      .status(500)
      .json({ error: "Failed to read output file", details: err.message });
  }
}

export async function exportFanDataController(req, res) {
  try {
    return await exportFanData(res);
  } catch (err) {
    console.error("Failed to export fan data", err);
    res
      .status(500)
      .json({ error: "Failed to export fan data", details: err.message });
  }
}

export async function uploadFanDataController(req, res) {
  try {
    const { fileBase64, filename } = req.body;
    const out = await importFanDataFromExcel(fileBase64, filename);
    res.json({
      message: "✅ Fan data imported",
      importedRows: Array.isArray(out) ? out.length : 0,
    });
  } catch (err) {
    console.error("Failed to import fan data", err);
    res
      .status(500)
      .json({ error: "Failed to import fan data", details: err.message });
  }
}

export async function uploadFanDataBinaryController(req, res) {
  try {
    // Expect raw bytes in req.body (Buffer) and optional filename in header 'x-filename'
    const filename =
      req.headers["x-filename"] || req.query.filename || "uploaded.xlsx";
    let fileBuffer = null;
    if (req.body && Buffer.isBuffer(req.body)) {
      fileBuffer = req.body;
    } else if (req.body && typeof req.body === "string") {
      // sometimes body may be stringified; try to decode
      fileBuffer = Buffer.from(req.body, "binary");
    } else {
      return res.status(400).json({ error: "Missing file body" });
    }

    const base64 = fileBuffer.toString("base64");
    const out = await importFanDataFromExcel(base64, filename);
    res.json({
      message: "✅ Fan data imported (binary)",
      importedRows: Array.isArray(out) ? out.length : 0,
    });
  } catch (err) {
    console.error("Failed to import fan data (binary)", err);
    res
      .status(500)
      .json({
        error: "Failed to import fan data (binary)",
        details: err.message,
      });
  }
}

export async function deleteFanDataController(req, res) {
  try {
    const idRaw = req.params.id;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    try {
      // attempt to delete from DB
      await prisma.fanData.delete({ where: { id } });
      return res.json({ message: `Deleted fan data with id=${id}` });
    } catch (dbErr) {
      // If DB delete fails (not found or DB not available), try file fallback
      console.warn(
        "DB delete failed, attempting file fallback:",
        dbErr?.message
      );
      try {
        const filePath = new URL("./axialFan.json", import.meta.url);
        const p = filePath.pathname;
        let arr = JSON.parse(fs.readFileSync(p, "utf8") || "[]");
        const before = arr.length;
        arr = arr.filter((x) => Number(x.id) !== id && Number(x.Id) !== id);
        const after = arr.length;
        if (after === before) {
          return res.status(404).json({ error: "Not found" });
        }
        fs.writeFileSync(p, JSON.stringify(arr, null, 2), "utf8");
        return res.json({
          message: `Deleted fan data with id=${id} (file fallback)`,
        });
      } catch (fileErr) {
        console.error("Failed to delete fan data in fallback file:", fileErr);
        return res
          .status(500)
          .json({
            error: "Failed to delete fan data",
            details: fileErr.message,
          });
      }
    }
  } catch (err) {
    console.error("Error in deleteFanDataController:", err);
    res
      .status(500)
      .json({ error: "Failed to delete fan data", details: err.message });
  }
}
