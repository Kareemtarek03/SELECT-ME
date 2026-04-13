import { processFanDataService, main, Output } from "./axialFanData.service.js";
import {
  exportFanData,
  importFanDataFromExcel,
} from "./axialFanData.service.js";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

let prisma = null;
async function getPrismaClient() {
  if (!prisma) {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error("DATABASE_URL not configured");
      }
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      });
    } catch (err) {
      console.warn("Prisma client not available - database mode disabled:", err.message);
      prisma = null;
    }
  }
  return prisma;
}

export async function processFanDataController(req, res) {
  try {
    const { units, input } = req.body;
    const result = await processFanDataService({
      filePath: "db",
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
    const result = await main({ filePath: "db", units, input, dataSource: "db" });

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
    const prismaClient = await getPrismaClient();
    if (!prismaClient) throw new Error("Database not available");
    const rows = await prismaClient.fanData.findMany();
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
    res.status(500).json({
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

    const prismaClient = await getPrismaClient();
    if (!prismaClient) {
      return res.status(503).json({ error: "Database not available" });
    }
    await prismaClient.fanData.delete({ where: { id } });
    return res.json({ message: `Deleted fan data with id=${id}` });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Not found", details: "No fan data with that id" });
    }
    console.error("Error in deleteFanDataController:", err);
    res
      .status(500)
      .json({ error: "Failed to delete fan data", details: err?.message });
  }
}
