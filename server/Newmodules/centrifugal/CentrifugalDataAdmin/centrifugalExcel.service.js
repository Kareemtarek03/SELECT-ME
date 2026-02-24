import { getPrismaClient } from "../CentrifugalFanData/centrifugalFanData.service.js";
import {
  createExcelBuffer,
  createMultiSheetExcelBuffer,
  parseExcelBuffer,
  parseMultiSheetExcelBuffer,
  sendExcelResponse,
  COLUMN_MAPS,
  NUMBER_FIELDS,
} from "../../../services/excelExportImport.service.js";

// ─── Individual table exports ─────────────────────────────────────────────────

export async function exportCentrifugalFanData(res) {
  const prisma = await getPrismaClient();
  if (!prisma) return res.status(503).json({ error: "Database not available" });
  const data = await prisma.centrifugalFanData.findMany({ orderBy: { id: "asc" } });
  const buf = createExcelBuffer(data, COLUMN_MAPS.centrifugalFanData, "Centrifugal Fans");
  sendExcelResponse(res, buf, "CentrifugalFanData-export.xlsx");
}

export async function importCentrifugalFanData(fileBase64) {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error("Database not available");
  const buffer = Buffer.from(fileBase64, "base64");
  const rows = parseExcelBuffer(buffer, COLUMN_MAPS.centrifugalFanData, NUMBER_FIELDS.centrifugalFanData);
  let created = 0, updated = 0;
  const errors = [];
  for (const row of rows) {
    try {
      const { id, ...data } = row;
      if (id && Number.isFinite(Number(id))) {
        const existing = await prisma.centrifugalFanData.findUnique({ where: { id: Number(id) } });
        if (existing) {
          await prisma.centrifugalFanData.update({ where: { id: Number(id) }, data });
          updated++;
        } else {
          await prisma.centrifugalFanData.create({ data });
          created++;
        }
      } else {
        await prisma.centrifugalFanData.create({ data });
        created++;
      }
    } catch (e) {
      errors.push({ row, error: e.message });
    }
  }
  return { created, updated, errors, total: rows.length };
}

export async function exportPulleys(res) {
  const prisma = await getPrismaClient();
  if (!prisma) return res.status(503).json({ error: "Database not available" });
  const data = await prisma.pulleyData.findMany({ orderBy: { id: "asc" } });
  const buf = createExcelBuffer(data, COLUMN_MAPS.pulleyData, "Pulleys");
  sendExcelResponse(res, buf, "Pulleys-export.xlsx");
}

export async function importPulleys(fileBase64) {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error("Database not available");
  const buffer = Buffer.from(fileBase64, "base64");
  const rows = parseExcelBuffer(buffer, COLUMN_MAPS.pulleyData, NUMBER_FIELDS.pulleyData);
  let created = 0, updated = 0;
  const errors = [];
  for (const row of rows) {
    try {
      const { id, ...data } = row;
      if (id && Number.isFinite(Number(id))) {
        const existing = await prisma.pulleyData.findUnique({ where: { id: Number(id) } });
        if (existing) { await prisma.pulleyData.update({ where: { id: Number(id) }, data }); updated++; }
        else { await prisma.pulleyData.create({ data }); created++; }
      } else {
        await prisma.pulleyData.create({ data }); created++;
      }
    } catch (e) { errors.push({ row, error: e.message }); }
  }
  return { created, updated, errors, total: rows.length };
}

export async function exportBeltStandards(res) {
  const prisma = await getPrismaClient();
  if (!prisma) return res.status(503).json({ error: "Database not available" });
  const data = await prisma.beltLengthStandard.findMany({ orderBy: { id: "asc" } });
  const buf = createExcelBuffer(data, COLUMN_MAPS.beltLengthStandard, "Belt Standards");
  sendExcelResponse(res, buf, "BeltLengthStandard-export.xlsx");
}

export async function importBeltStandards(fileBase64) {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error("Database not available");
  const buffer = Buffer.from(fileBase64, "base64");
  const rows = parseExcelBuffer(buffer, COLUMN_MAPS.beltLengthStandard, NUMBER_FIELDS.beltLengthStandard);
  let created = 0, updated = 0;
  const errors = [];
  for (const row of rows) {
    try {
      const { id, ...data } = row;
      if (id && Number.isFinite(Number(id))) {
        const existing = await prisma.beltLengthStandard.findUnique({ where: { id: Number(id) } });
        if (existing) { await prisma.beltLengthStandard.update({ where: { id: Number(id) }, data }); updated++; }
        else { await prisma.beltLengthStandard.create({ data }); created++; }
      } else {
        await prisma.beltLengthStandard.create({ data }); created++;
      }
    } catch (e) { errors.push({ row, error: e.message }); }
  }
  return { created, updated, errors, total: rows.length };
}

export async function exportPulleyStandards(res) {
  const prisma = await getPrismaClient();
  if (!prisma) return res.status(503).json({ error: "Database not available" });
  const data = await prisma.pulleyStandard.findMany({ orderBy: { id: "asc" } });
  const buf = createExcelBuffer(data, COLUMN_MAPS.pulleyStandard, "Pulley Standards");
  sendExcelResponse(res, buf, "PulleyStandard-export.xlsx");
}

export async function importPulleyStandards(fileBase64) {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error("Database not available");
  const buffer = Buffer.from(fileBase64, "base64");
  const rows = parseExcelBuffer(buffer, COLUMN_MAPS.pulleyStandard, NUMBER_FIELDS.pulleyStandard);
  let created = 0, updated = 0;
  const errors = [];
  for (const row of rows) {
    try {
      const { id, ...data } = row;
      if (id && Number.isFinite(Number(id))) {
        const existing = await prisma.pulleyStandard.findUnique({ where: { id: Number(id) } });
        if (existing) { await prisma.pulleyStandard.update({ where: { id: Number(id) }, data }); updated++; }
        else { await prisma.pulleyStandard.create({ data }); created++; }
      } else {
        await prisma.pulleyStandard.create({ data }); created++;
      }
    } catch (e) { errors.push({ row, error: e.message }); }
  }
  return { created, updated, errors, total: rows.length };
}

// ─── Combined Centrifugal Casing Export ───────────────────────────────────────

const CASING_INCLUDE = {
  volute: true, frame: true, impeller: true, funnels: true,
  sleeveShaft: true, matchingFlange: true, bearingAssembly: true,
  fanBase: true, beltCover: true, motorBase: true, accessories: true,
};

const CASING_SUB_TABLE_MAP = [
  { relation: "volute", sheetName: "Volute", mapKey: "casingVolute", model: "centrifugalCasingVolute" },
  { relation: "frame", sheetName: "Frame", mapKey: "casingFrame", model: "centrifugalCasingFrame" },
  { relation: "impeller", sheetName: "Impeller", mapKey: "casingImpeller", model: "centrifugalCasingImpeller" },
  { relation: "funnels", sheetName: "Funnels", mapKey: "casingFunnels", model: "centrifugalCasingFunnels" },
  { relation: "sleeveShaft", sheetName: "Sleeve & Shaft", mapKey: "casingSleeveShaft", model: "centrifugalCasingSleeveShaft" },
  { relation: "matchingFlange", sheetName: "Matching Flange", mapKey: "casingMatchingFlange", model: "centrifugalCasingMatchingFlange" },
  { relation: "bearingAssembly", sheetName: "Bearing Assembly", mapKey: "casingBearingAssembly", model: "centrifugalCasingBearingAssembly" },
  { relation: "fanBase", sheetName: "Fan Base", mapKey: "casingFanBase", model: "centrifugalCasingFanBase" },
  { relation: "beltCover", sheetName: "Belt Cover", mapKey: "casingBeltCover", model: "centrifugalCasingBeltCover" },
  { relation: "motorBase", sheetName: "Motor Base", mapKey: "casingMotorBase", model: "centrifugalCasingMotorBase" },
  { relation: "accessories", sheetName: "Accessories", mapKey: "casingAccessories", model: "centrifugalCasingAccessories" },
];

export async function exportCasingPricingAll(res) {
  const prisma = await getPrismaClient();
  if (!prisma) return res.status(503).json({ error: "Database not available" });
  const casings = await prisma.centrifugalCasingPricing.findMany({
    orderBy: { id: "asc" },
    include: CASING_INCLUDE,
  });

  const sheets = [
    { sheetName: "Casing (Parent)", data: casings, columnMap: COLUMN_MAPS.casingParent },
  ];

  for (const sub of CASING_SUB_TABLE_MAP) {
    const subData = casings
      .filter((c) => c[sub.relation])
      .map((c) => ({ ...c[sub.relation], casing: { model: c.model, sizeMm: c.sizeMm } }));
    sheets.push({ sheetName: sub.sheetName, data: subData, columnMap: COLUMN_MAPS[sub.mapKey] });
  }

  const buf = createMultiSheetExcelBuffer(sheets);
  sendExcelResponse(res, buf, "CentrifugalCasingPricing-export.xlsx");
}

export async function importCasingPricingAll(fileBase64) {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error("Database not available");
  const buffer = Buffer.from(fileBase64, "base64");

  // Build sheet configs for multi-sheet parsing
  const sheetConfigs = {
    "Casing (Parent)": { columnMap: COLUMN_MAPS.casingParent, numberFields: ["sizeMm"] },
  };
  for (const sub of CASING_SUB_TABLE_MAP) {
    const numFields = COLUMN_MAPS[sub.mapKey]
      .filter(([db]) => !["casing.model", "casing.sizeMm"].includes(db) && db !== "casingId")
      .filter(([db]) => {
        const hdr = COLUMN_MAPS[sub.mapKey].find(([d]) => d === db)?.[1] || "";
        return !hdr.includes("Dimensions") && !hdr.includes("Model") && !hdr.includes("Description");
      })
      .map(([db]) => db);
    sheetConfigs[sub.sheetName] = { columnMap: COLUMN_MAPS[sub.mapKey], numberFields: numFields };
  }

  const parsed = parseMultiSheetExcelBuffer(buffer, sheetConfigs);
  let created = 0, updated = 0;
  const errors = [];

  // Import parent casings first
  const parentRows = parsed["Casing (Parent)"] || [];
  const casingIdMap = new Map();
  for (const row of parentRows) {
    try {
      const { id, ...data } = row;
      if (data.sizeMm != null) data.sizeMm = Number(data.sizeMm);
      if (id && Number.isFinite(Number(id))) {
        const existing = await prisma.centrifugalCasingPricing.findUnique({ where: { id: Number(id) } });
        if (existing) {
          await prisma.centrifugalCasingPricing.update({ where: { id: Number(id) }, data });
          casingIdMap.set(Number(id), Number(id));
          updated++;
        } else {
          const rec = await prisma.centrifugalCasingPricing.create({ data });
          casingIdMap.set(Number(id), rec.id);
          created++;
        }
      } else {
        const rec = await prisma.centrifugalCasingPricing.create({ data });
        created++;
        if (data.modelAndSize) casingIdMap.set(data.modelAndSize, rec.id);
      }
    } catch (e) { errors.push({ sheet: "Casing (Parent)", row, error: e.message }); }
  }

  // Import sub-tables
  for (const sub of CASING_SUB_TABLE_MAP) {
    const subRows = parsed[sub.sheetName] || [];
    for (const row of subRows) {
      try {
        delete row["casing.model"];
        delete row["casing.sizeMm"];
        const casingId = Number(row.casingId);
        if (!Number.isFinite(casingId)) continue;
        const resolvedId = casingIdMap.get(casingId) || casingId;
        const data = { ...row, casingId: resolvedId };
        delete data.id;

        const existing = await prisma[sub.model].findUnique({ where: { casingId: resolvedId } });
        if (existing) {
          await prisma[sub.model].update({ where: { casingId: resolvedId }, data });
          updated++;
        } else {
          await prisma[sub.model].create({ data });
          created++;
        }
      } catch (e) { errors.push({ sheet: sub.sheetName, row, error: e.message }); }
    }
  }

  return { created, updated, errors, total: parentRows.length };
}

// ─── Axial Pricing Tables ─────────────────────────────────────────────────────

export async function exportAccessoryPricing(res) {
  const prisma = await getPrismaClient();
  if (!prisma) return res.status(503).json({ error: "Database not available" });
  const data = await prisma.accessoryPricing.findMany({ orderBy: { id: "asc" } });
  const buf = createExcelBuffer(data, COLUMN_MAPS.accessoryPricing, "Accessories");
  sendExcelResponse(res, buf, "AccessoryPricing-export.xlsx");
}

export async function importAccessoryPricing(fileBase64) {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error("Database not available");
  const buffer = Buffer.from(fileBase64, "base64");
  const rows = parseExcelBuffer(buffer, COLUMN_MAPS.accessoryPricing, NUMBER_FIELDS.accessoryPricing);
  let created = 0, updated = 0;
  const errors = [];
  for (const row of rows) {
    try {
      const { id, ...data } = row;
      if (id && Number.isFinite(Number(id))) {
        const existing = await prisma.accessoryPricing.findUnique({ where: { id: Number(id) } });
        if (existing) { await prisma.accessoryPricing.update({ where: { id: Number(id) }, data }); updated++; }
        else { await prisma.accessoryPricing.create({ data }); created++; }
      } else {
        await prisma.accessoryPricing.create({ data }); created++;
      }
    } catch (e) { errors.push({ row, error: e.message }); }
  }
  return { created, updated, errors, total: rows.length };
}

export async function exportAxialImpellerBlades(res) {
  const prisma = await getPrismaClient();
  if (!prisma) return res.status(503).json({ error: "Database not available" });
  const data = await prisma.axialImpellerBlade.findMany({ orderBy: { id: "asc" } });
  const buf = createExcelBuffer(data, COLUMN_MAPS.axialImpellerBlade, "Impeller Blades");
  sendExcelResponse(res, buf, "AxialImpellerBlades-export.xlsx");
}

export async function importAxialImpellerBlades(fileBase64) {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error("Database not available");
  const buffer = Buffer.from(fileBase64, "base64");
  const rows = parseExcelBuffer(buffer, COLUMN_MAPS.axialImpellerBlade, NUMBER_FIELDS.axialImpellerBlade);
  let created = 0, updated = 0;
  const errors = [];
  for (const row of rows) {
    try {
      const { id, ...data } = row;
      if (id && Number.isFinite(Number(id))) {
        const existing = await prisma.axialImpellerBlade.findUnique({ where: { id: Number(id) } });
        if (existing) { await prisma.axialImpellerBlade.update({ where: { id: Number(id) }, data }); updated++; }
        else { await prisma.axialImpellerBlade.create({ data }); created++; }
      } else {
        await prisma.axialImpellerBlade.create({ data }); created++;
      }
    } catch (e) { errors.push({ row, error: e.message }); }
  }
  return { created, updated, errors, total: rows.length };
}

export async function exportAxialImpellerHubs(res) {
  const prisma = await getPrismaClient();
  if (!prisma) return res.status(503).json({ error: "Database not available" });
  const data = await prisma.axialImpellerHub.findMany({ orderBy: { id: "asc" } });
  const buf = createExcelBuffer(data, COLUMN_MAPS.axialImpellerHub, "Impeller Hubs");
  sendExcelResponse(res, buf, "AxialImpellerHubs-export.xlsx");
}

export async function importAxialImpellerHubs(fileBase64) {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error("Database not available");
  const buffer = Buffer.from(fileBase64, "base64");
  const rows = parseExcelBuffer(buffer, COLUMN_MAPS.axialImpellerHub, NUMBER_FIELDS.axialImpellerHub);
  let created = 0, updated = 0;
  const errors = [];
  for (const row of rows) {
    try {
      const { id, ...data } = row;
      if (id && Number.isFinite(Number(id))) {
        const existing = await prisma.axialImpellerHub.findUnique({ where: { id: Number(id) } });
        if (existing) { await prisma.axialImpellerHub.update({ where: { id: Number(id) }, data }); updated++; }
        else { await prisma.axialImpellerHub.create({ data }); created++; }
      } else {
        await prisma.axialImpellerHub.create({ data }); created++;
      }
    } catch (e) { errors.push({ row, error: e.message }); }
  }
  return { created, updated, errors, total: rows.length };
}

export async function exportAxialImpellerFrames(res) {
  const prisma = await getPrismaClient();
  if (!prisma) return res.status(503).json({ error: "Database not available" });
  const data = await prisma.axialImpellerFrame.findMany({ orderBy: { id: "asc" } });
  const buf = createExcelBuffer(data, COLUMN_MAPS.axialImpellerFrame, "Impeller Frames");
  sendExcelResponse(res, buf, "AxialImpellerFrames-export.xlsx");
}

export async function importAxialImpellerFrames(fileBase64) {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error("Database not available");
  const buffer = Buffer.from(fileBase64, "base64");
  const rows = parseExcelBuffer(buffer, COLUMN_MAPS.axialImpellerFrame, NUMBER_FIELDS.axialImpellerFrame);
  let created = 0, updated = 0;
  const errors = [];
  for (const row of rows) {
    try {
      const { id, ...data } = row;
      if (id && Number.isFinite(Number(id))) {
        const existing = await prisma.axialImpellerFrame.findUnique({ where: { id: Number(id) } });
        if (existing) { await prisma.axialImpellerFrame.update({ where: { id: Number(id) }, data }); updated++; }
        else { await prisma.axialImpellerFrame.create({ data }); created++; }
      } else {
        await prisma.axialImpellerFrame.create({ data }); created++;
      }
    } catch (e) { errors.push({ row, error: e.message }); }
  }
  return { created, updated, errors, total: rows.length };
}

export async function exportAxialCasingPricing(res) {
  const prisma = await getPrismaClient();
  if (!prisma) return res.status(503).json({ error: "Database not available" });
  const data = await prisma.axialCasingPricing.findMany({ orderBy: { id: "asc" } });
  const buf = createExcelBuffer(data, COLUMN_MAPS.axialCasingPricing, "Axial Casing");
  sendExcelResponse(res, buf, "AxialCasingPricing-export.xlsx");
}

export async function importAxialCasingPricing(fileBase64) {
  const prisma = await getPrismaClient();
  if (!prisma) throw new Error("Database not available");
  const buffer = Buffer.from(fileBase64, "base64");
  const rows = parseExcelBuffer(buffer, COLUMN_MAPS.axialCasingPricing, NUMBER_FIELDS.axialCasingPricing);
  let created = 0, updated = 0;
  const errors = [];
  for (const row of rows) {
    try {
      const { id, ...data } = row;
      if (id && Number.isFinite(Number(id))) {
        const existing = await prisma.axialCasingPricing.findUnique({ where: { id: Number(id) } });
        if (existing) { await prisma.axialCasingPricing.update({ where: { id: Number(id) }, data }); updated++; }
        else { await prisma.axialCasingPricing.create({ data }); created++; }
      } else {
        await prisma.axialCasingPricing.create({ data }); created++;
      }
    } catch (e) { errors.push({ row, error: e.message }); }
  }
  return { created, updated, errors, total: rows.length };
}
