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

export default router;
