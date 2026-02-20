import express from "express";
import { getPrismaClient } from "../CentrifugalFanData/centrifugalFanData.service.js";

const router = express.Router();

// ---------- Pulley Data ----------
router.get("/pulleys", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.pulleyData.findMany({ orderBy: { id: "asc" } });
    res.json({ data });
  } catch (e) {
    console.error("GET /pulleys", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/pulleys", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const created = await prisma.pulleyData.create({
      data: {
        no: b.no != null ? Number(b.no) : null,
        beltType: b.beltType ?? null,
        grooves: b.grooves != null ? Number(b.grooves) : null,
        pitchDiameter: b.pitchDiameter != null ? Number(b.pitchDiameter) : null,
        bushNo: b.bushNo ?? null,
        minBore: b.minBore != null ? Number(b.minBore) : null,
        maxBore: b.maxBore != null ? Number(b.maxBore) : null,
        widthF: b.widthF != null ? Number(b.widthF) : null,
        condition: b.condition ?? null,
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /pulleys", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/pulleys/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.no !== undefined) data.no = b.no == null ? null : Number(b.no);
    if (b.beltType !== undefined) data.beltType = b.beltType;
    if (b.grooves !== undefined) data.grooves = b.grooves == null ? null : Number(b.grooves);
    if (b.pitchDiameter !== undefined) data.pitchDiameter = b.pitchDiameter == null ? null : Number(b.pitchDiameter);
    if (b.bushNo !== undefined) data.bushNo = b.bushNo;
    if (b.minBore !== undefined) data.minBore = b.minBore == null ? null : Number(b.minBore);
    if (b.maxBore !== undefined) data.maxBore = b.maxBore == null ? null : Number(b.maxBore);
    if (b.widthF !== undefined) data.widthF = b.widthF == null ? null : Number(b.widthF);
    if (b.condition !== undefined) data.condition = b.condition;
    const updated = await prisma.pulleyData.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /pulleys/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/pulleys/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.pulleyData.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /pulleys/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Belt Length Standard ----------
router.get("/belt-standards", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.beltLengthStandard.findMany({ orderBy: { id: "asc" } });
    res.json({ data });
  } catch (e) {
    console.error("GET /belt-standards", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/belt-standards", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const created = await prisma.beltLengthStandard.create({
      data: {
        spz: b.spz != null ? Number(b.spz) : null,
        spa: b.spa != null ? Number(b.spa) : null,
        spb: b.spb != null ? Number(b.spb) : null,
        spc: b.spc != null ? Number(b.spc) : null,
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /belt-standards", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/belt-standards/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.spz !== undefined) data.spz = b.spz == null ? null : Number(b.spz);
    if (b.spa !== undefined) data.spa = b.spa == null ? null : Number(b.spa);
    if (b.spb !== undefined) data.spb = b.spb == null ? null : Number(b.spb);
    if (b.spc !== undefined) data.spc = b.spc == null ? null : Number(b.spc);
    const updated = await prisma.beltLengthStandard.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /belt-standards/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/belt-standards/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.beltLengthStandard.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /belt-standards/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Pulley Standard ----------
router.get("/pulley-standards", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.pulleyStandard.findMany({ orderBy: { id: "asc" } });
    res.json({ data });
  } catch (e) {
    console.error("GET /pulley-standards", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/pulley-standards", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const created = await prisma.pulleyStandard.create({
      data: {
        no: b.no != null ? Number(b.no) : null,
        spz: b.spz != null ? Number(b.spz) : null,
        spa: b.spa != null ? Number(b.spa) : null,
        spb: b.spb != null ? Number(b.spb) : null,
        spc: b.spc != null ? Number(b.spc) : null,
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /pulley-standards", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/pulley-standards/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.no !== undefined) data.no = b.no == null ? null : Number(b.no);
    if (b.spz !== undefined) data.spz = b.spz == null ? null : Number(b.spz);
    if (b.spa !== undefined) data.spa = b.spa == null ? null : Number(b.spa);
    if (b.spb !== undefined) data.spb = b.spb == null ? null : Number(b.spb);
    if (b.spc !== undefined) data.spc = b.spc == null ? null : Number(b.spc);
    const updated = await prisma.pulleyStandard.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /pulley-standards/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/pulley-standards/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.pulleyStandard.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /pulley-standards/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Centrifugal Casing Pricing ----------
const casingNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const casingStr = (v) => (v != null && v !== "" ? String(v).trim() : null);

// Parent: Casing Pricing
router.get("/casing-pricing", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingPricing.findMany({ orderBy: { modelAndSize: "asc" } });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-pricing", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/casing-pricing", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const created = await prisma.centrifugalCasingPricing.create({
      data: {
        type: b.type ?? "",
        model: b.model ?? "",
        sizeMm: casingNum(b.sizeMm) ?? 0,
        modelAndSize: b.modelAndSize ?? `${b.model || ""}-${b.sizeMm ?? ""}`,
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-pricing", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-pricing/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.type !== undefined) data.type = b.type;
    if (b.model !== undefined) data.model = b.model;
    if (b.sizeMm !== undefined) data.sizeMm = casingNum(b.sizeMm) ?? 0;
    if (b.modelAndSize !== undefined) data.modelAndSize = b.modelAndSize;
    const updated = await prisma.centrifugalCasingPricing.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-pricing/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-pricing/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingPricing.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-pricing/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Volutes (one row per casing: volute2mm + volute1mm columns)
router.get("/casing-volutes", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingVolute.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-volutes", e);
    res.status(500).json({ error: e.message });
  }
});

const voluteFields = [
  "volute2mmWeightKgWithoutScrap", "volute2mmScrapPct", "volute2mmWeightKgWithScrap", "volute2mmSheetMetalDimensionsMm",
  "volute1mmWeightKgWithoutScrap", "volute1mmScrapPct", "volute1mmWeightKgWithScrap", "volute1mmSheetMetalDimensionsMm",
  "volute1mmLaserTimeMin", "volute1mmRolling", "volute1mmSheetMetalOverlapping",
];
router.post("/casing-volutes", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = { casingId: casingNum(b.casingId) ?? 0 };
    voluteFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = f.includes("Dimensions") ? casingStr(b[f]) : casingNum(b[f]);
    });
    const created = await prisma.centrifugalCasingVolute.create({ data });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-volutes", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-volutes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    voluteFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = f.includes("Dimensions") ? casingStr(b[f]) : casingNum(b[f]);
    });
    const updated = await prisma.centrifugalCasingVolute.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-volutes/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-volutes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingVolute.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-volutes/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Frames (one row per casing: angleBar + support columns)
router.get("/casing-frames", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingFrame.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-frames", e);
    res.status(500).json({ error: e.message });
  }
});

const frameFields = [
  "angleBarWeightKgWithoutScrap", "angleBarScrapPct", "angleBarWeightKgWithScrap", "angleBarDimensionsMm",
  "supportWeightKgWithoutScrap", "supportScrapPct", "supportWeightKgWithScrap", "supportSheetMetalDimensionsMm",
  "supportLaserTimeMin", "supportCasingCircumferenceM", "supportPaintingLe",
];
router.post("/casing-frames", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = { casingId: casingNum(b.casingId) ?? 0 };
    frameFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = (f.includes("Dimensions") || f.includes("Mm")) ? casingStr(b[f]) : casingNum(b[f]);
    });
    const created = await prisma.centrifugalCasingFrame.create({ data });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-frames", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-frames/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    frameFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = (f.includes("Dimensions") || f.includes("Mm")) ? casingStr(b[f]) : casingNum(b[f]);
    });
    const updated = await prisma.centrifugalCasingFrame.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-frames/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-frames/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingFrame.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-frames/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Impellers (one row per casing: blades + plate columns)
const impellerFields = [
  "bladesWeightKgWithoutScrap", "bladesScrapPct", "bladesWeightKgWithScrap", "bladesSheetMetalDimensionsMm",
  "plateWeightKgWithoutScrap", "plateScrapPct", "plateWeightKgWithScrap", "plateSheetMetalDimensionsMm",
  "plateCentrifugalImpellerRigCostPcs", "plateLaserTimeMin", "plateCasingCircumferenceM", "platePaintingLe",
];
router.get("/casing-impellers", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingImpeller.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-impellers", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/casing-impellers", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = { casingId: casingNum(b.casingId) ?? 0 };
    impellerFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = f.includes("Dimensions") ? casingStr(b[f]) : casingNum(b[f]);
    });
    const created = await prisma.centrifugalCasingImpeller.create({ data });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-impellers", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-impellers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    impellerFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = f.includes("Dimensions") ? casingStr(b[f]) : casingNum(b[f]);
    });
    const updated = await prisma.centrifugalCasingImpeller.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-impellers/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-impellers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingImpeller.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-impellers/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Funnels (one row per casing: funnel15mm + funnel3mm columns)
const funnelFields = [
  "funnel15mmWeightKgWithoutScrap", "funnel15mmScrapPct", "funnel15mmWeightKgWithScrap", "funnel15mmSheetMetalDimensionsMm",
  "funnel15mmDieCastingLePc", "funnel15mmFunnelMachiningLe", "funnel15mmGalvanizeLe",
  "funnel3mmWeightKgWithoutScrap", "funnel3mmScrapPct", "funnel3mmWeightKgWithScrap", "funnel3mmSheetMetalDimensionsMm",
  "funnel3mmDieCastingLePc", "funnel3mmFunnelMachiningLe", "funnel3mmPaintingLe",
];
router.get("/casing-funnels", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingFunnels.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-funnels", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/casing-funnels", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = { casingId: casingNum(b.casingId) ?? 0 };
    funnelFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = f.includes("Dimensions") ? casingStr(b[f]) : casingNum(b[f]);
    });
    const created = await prisma.centrifugalCasingFunnels.create({ data });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-funnels", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-funnels/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    funnelFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = f.includes("Dimensions") ? casingStr(b[f]) : casingNum(b[f]);
    });
    const updated = await prisma.centrifugalCasingFunnels.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-funnels/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-funnels/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingFunnels.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-funnels/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Sleeve+Shaft (one row per casing: sleeve + shaft columns)
const sleeveShaftFields = [
  "sleeveWeightKgWithoutScrap", "sleeveScrapPct", "sleeveWeightKgWithScrap", "sleeveSheetMetalDimensionsMm", "sleeveManufacturingLePc",
  "shaftWeightKgWithoutScrap", "shaftScrapPct", "shaftWeightKgWithScrap", "shaftSheetMetalDimensionsMm", "shaftManufacturingLePc",
];
router.get("/casing-sleeve-shafts", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingSleeveShaft.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-sleeve-shafts", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/casing-sleeve-shafts", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = { casingId: casingNum(b.casingId) ?? 0 };
    sleeveShaftFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = f.includes("Dimensions") ? casingStr(b[f]) : casingNum(b[f]);
    });
    const created = await prisma.centrifugalCasingSleeveShaft.create({ data });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-sleeve-shafts", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-sleeve-shafts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    sleeveShaftFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = f.includes("Dimensions") ? casingStr(b[f]) : casingNum(b[f]);
    });
    const updated = await prisma.centrifugalCasingSleeveShaft.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-sleeve-shafts/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-sleeve-shafts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingSleeveShaft.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-sleeve-shafts/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Matching Flanges (one row per casing)
const matchingFlangeFields = [
  "flange3mmWeightKgWithoutScrap", "flange3mmScrapPct", "flange3mmWeightKgWithScrap", "flange3mmSheetMetalDimensionsMm",
  "flange3mmLaserTimeMin", "flange3mmRolling", "flange3mmCasingCircumferenceM", "selfAligningBearingHousingLe",
];
router.get("/casing-matching-flanges", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingMatchingFlange.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-matching-flanges", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/casing-matching-flanges", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = { casingId: casingNum(b.casingId) ?? 0 };
    matchingFlangeFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = f.includes("Dimensions") ? casingStr(b[f]) : casingNum(b[f]);
    });
    const created = await prisma.centrifugalCasingMatchingFlange.create({ data });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-matching-flanges", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-matching-flanges/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    matchingFlangeFields.forEach((f) => {
      if (b[f] !== undefined) data[f] = f.includes("Dimensions") ? casingStr(b[f]) : casingNum(b[f]);
    });
    const updated = await prisma.centrifugalCasingMatchingFlange.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-matching-flanges/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-matching-flanges/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingMatchingFlange.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-matching-flanges/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Bearing Assemblies
router.get("/casing-bearing-assemblies", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingBearingAssembly.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-bearing-assemblies", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/casing-bearing-assemblies", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const created = await prisma.centrifugalCasingBearingAssembly.create({
      data: {
        casingId: casingNum(b.casingId) ?? 0,
        boltsNutsKg: casingNum(b.boltsNutsKg),
        assemblyLaboursPerShaft: casingNum(b.assemblyLaboursPerShaft),
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-bearing-assemblies", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-bearing-assemblies/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    if (b.boltsNutsKg !== undefined) data.boltsNutsKg = casingNum(b.boltsNutsKg);
    if (b.assemblyLaboursPerShaft !== undefined) data.assemblyLaboursPerShaft = casingNum(b.assemblyLaboursPerShaft);
    const updated = await prisma.centrifugalCasingBearingAssembly.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-bearing-assemblies/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-bearing-assemblies/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingBearingAssembly.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-bearing-assemblies/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Fan Bases
router.get("/casing-fan-bases", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingFanBase.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-fan-bases", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/casing-fan-bases", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const created = await prisma.centrifugalCasingFanBase.create({
      data: {
        casingId: casingNum(b.casingId) ?? 0,
        weightKgWithoutScrap: casingNum(b.weightKgWithoutScrap),
        scrapPct: casingNum(b.scrapPct),
        weightKgWithScrap: casingNum(b.weightKgWithScrap),
        sheetMetalDimensionsMm: casingStr(b.sheetMetalDimensionsMm),
        laserTimeMin: casingNum(b.laserTimeMin),
        bendingLine: casingNum(b.bendingLine),
        paintingLe: casingNum(b.paintingLe),
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-fan-bases", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-fan-bases/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    if (b.weightKgWithoutScrap !== undefined) data.weightKgWithoutScrap = casingNum(b.weightKgWithoutScrap);
    if (b.scrapPct !== undefined) data.scrapPct = casingNum(b.scrapPct);
    if (b.weightKgWithScrap !== undefined) data.weightKgWithScrap = casingNum(b.weightKgWithScrap);
    if (b.sheetMetalDimensionsMm !== undefined) data.sheetMetalDimensionsMm = casingStr(b.sheetMetalDimensionsMm);
    if (b.laserTimeMin !== undefined) data.laserTimeMin = casingNum(b.laserTimeMin);
    if (b.bendingLine !== undefined) data.bendingLine = casingNum(b.bendingLine);
    if (b.paintingLe !== undefined) data.paintingLe = casingNum(b.paintingLe);
    const updated = await prisma.centrifugalCasingFanBase.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-fan-bases/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-fan-bases/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingFanBase.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-fan-bases/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Belt Covers
router.get("/casing-belt-covers", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingBeltCover.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-belt-covers", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/casing-belt-covers", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const created = await prisma.centrifugalCasingBeltCover.create({
      data: {
        casingId: casingNum(b.casingId) ?? 0,
        weightKgWithoutScrap: casingNum(b.weightKgWithoutScrap),
        scrapPct: casingNum(b.scrapPct),
        weightKgWithScrap: casingNum(b.weightKgWithScrap),
        sheetMetalDimensionsMm: casingStr(b.sheetMetalDimensionsMm),
        laserTimeMin: casingNum(b.laserTimeMin),
        casingCircumferenceM: casingNum(b.casingCircumferenceM),
        paintingLe: casingNum(b.paintingLe),
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-belt-covers", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-belt-covers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    if (b.weightKgWithoutScrap !== undefined) data.weightKgWithoutScrap = casingNum(b.weightKgWithoutScrap);
    if (b.scrapPct !== undefined) data.scrapPct = casingNum(b.scrapPct);
    if (b.weightKgWithScrap !== undefined) data.weightKgWithScrap = casingNum(b.weightKgWithScrap);
    if (b.sheetMetalDimensionsMm !== undefined) data.sheetMetalDimensionsMm = casingStr(b.sheetMetalDimensionsMm);
    if (b.laserTimeMin !== undefined) data.laserTimeMin = casingNum(b.laserTimeMin);
    if (b.casingCircumferenceM !== undefined) data.casingCircumferenceM = casingNum(b.casingCircumferenceM);
    if (b.paintingLe !== undefined) data.paintingLe = casingNum(b.paintingLe);
    const updated = await prisma.centrifugalCasingBeltCover.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-belt-covers/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-belt-covers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingBeltCover.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-belt-covers/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Motor Bases
router.get("/casing-motor-bases", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingMotorBase.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-motor-bases", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/casing-motor-bases", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const created = await prisma.centrifugalCasingMotorBase.create({
      data: {
        casingId: casingNum(b.casingId) ?? 0,
        weightKgWithoutScrap: casingNum(b.weightKgWithoutScrap),
        scrapPct: casingNum(b.scrapPct),
        weightKgWithScrap: casingNum(b.weightKgWithScrap),
        sheetMetalDimensionsMm: casingStr(b.sheetMetalDimensionsMm),
        laserTimeMin: casingNum(b.laserTimeMin),
        bendingLine: casingNum(b.bendingLine),
        studNutPriceLe: casingNum(b.studNutPriceLe),
        paintingLe: casingNum(b.paintingLe),
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-motor-bases", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-motor-bases/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    if (b.weightKgWithoutScrap !== undefined) data.weightKgWithoutScrap = casingNum(b.weightKgWithoutScrap);
    if (b.scrapPct !== undefined) data.scrapPct = casingNum(b.scrapPct);
    if (b.weightKgWithScrap !== undefined) data.weightKgWithScrap = casingNum(b.weightKgWithScrap);
    if (b.sheetMetalDimensionsMm !== undefined) data.sheetMetalDimensionsMm = casingStr(b.sheetMetalDimensionsMm);
    if (b.laserTimeMin !== undefined) data.laserTimeMin = casingNum(b.laserTimeMin);
    if (b.bendingLine !== undefined) data.bendingLine = casingNum(b.bendingLine);
    if (b.studNutPriceLe !== undefined) data.studNutPriceLe = casingNum(b.studNutPriceLe);
    if (b.paintingLe !== undefined) data.paintingLe = casingNum(b.paintingLe);
    const updated = await prisma.centrifugalCasingMotorBase.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-motor-bases/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-motor-bases/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingMotorBase.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-motor-bases/:id", e);
    res.status(500).json({ error: e.message });
  }
});

// Accessories
router.get("/casing-accessories", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = await prisma.centrifugalCasingAccessories.findMany({
      include: { casing: true },
      orderBy: { casingId: "asc" },
    });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-accessories", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/casing-accessories", async (req, res) => {
  try {
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const created = await prisma.centrifugalCasingAccessories.create({
      data: {
        casingId: casingNum(b.casingId) ?? 0,
        vibrationIsolatorsLe: casingNum(b.vibrationIsolatorsLe),
        vinylStickersLe: casingNum(b.vinylStickersLe),
        namePlateLe: casingNum(b.namePlateLe),
        packingLe: casingNum(b.packingLe),
        labourCostLe: casingNum(b.labourCostLe),
        internalTransportationLe: casingNum(b.internalTransportationLe),
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-accessories", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/casing-accessories/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const b = req.body || {};
    const data = {};
    if (b.casingId !== undefined) data.casingId = casingNum(b.casingId) ?? 0;
    if (b.vibrationIsolatorsLe !== undefined) data.vibrationIsolatorsLe = casingNum(b.vibrationIsolatorsLe);
    if (b.vinylStickersLe !== undefined) data.vinylStickersLe = casingNum(b.vinylStickersLe);
    if (b.namePlateLe !== undefined) data.namePlateLe = casingNum(b.namePlateLe);
    if (b.packingLe !== undefined) data.packingLe = casingNum(b.packingLe);
    if (b.labourCostLe !== undefined) data.labourCostLe = casingNum(b.labourCostLe);
    if (b.internalTransportationLe !== undefined) data.internalTransportationLe = casingNum(b.internalTransportationLe);
    const updated = await prisma.centrifugalCasingAccessories.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-accessories/:id", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/casing-accessories/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    await prisma.centrifugalCasingAccessories.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-accessories/:id", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
