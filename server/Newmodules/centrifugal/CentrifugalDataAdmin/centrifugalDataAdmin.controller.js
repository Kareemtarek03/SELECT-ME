import * as service from "./centrifugalDataAdmin.service.js";

// ---------- Pulley Data ----------
export async function getPulleys(req, res) {
  try {
    const data = await service.getPulleys();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /pulleys", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createPulley(req, res) {
  try {
    const created = await service.createPulley(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /pulleys", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updatePulley(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updatePulley(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /pulleys/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deletePulley(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deletePulley(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /pulleys/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Belt Length Standard ----------
export async function getBeltStandards(req, res) {
  try {
    const data = await service.getBeltStandards();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /belt-standards", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createBeltStandard(req, res) {
  try {
    const created = await service.createBeltStandard(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /belt-standards", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateBeltStandard(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateBeltStandard(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /belt-standards/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteBeltStandard(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteBeltStandard(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /belt-standards/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Pulley Standard ----------
export async function getPulleyStandards(req, res) {
  try {
    const data = await service.getPulleyStandards();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /pulley-standards", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createPulleyStandard(req, res) {
  try {
    const created = await service.createPulleyStandard(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /pulley-standards", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updatePulleyStandard(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updatePulleyStandard(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /pulley-standards/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deletePulleyStandard(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deletePulleyStandard(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /pulley-standards/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Pricing ----------
export async function getCasingPricing(req, res) {
  try {
    const data = await service.getCasingPricing();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-pricing", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingPricing(req, res) {
  try {
    const created = await service.createCasingPricing(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-pricing", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingPricing(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingPricing(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-pricing/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingPricing(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingPricing(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-pricing/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Volutes ----------
export async function getCasingVolutes(req, res) {
  try {
    const data = await service.getCasingVolutes();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-volutes", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingVolute(req, res) {
  try {
    const created = await service.createCasingVolute(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-volutes", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingVolute(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingVolute(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-volutes/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingVolute(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingVolute(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-volutes/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Frames ----------
export async function getCasingFrames(req, res) {
  try {
    const data = await service.getCasingFrames();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-frames", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingFrame(req, res) {
  try {
    const created = await service.createCasingFrame(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-frames", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingFrame(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingFrame(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-frames/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingFrame(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingFrame(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-frames/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Impellers ----------
export async function getCasingImpellers(req, res) {
  try {
    const data = await service.getCasingImpellers();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-impellers", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingImpeller(req, res) {
  try {
    const created = await service.createCasingImpeller(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-impellers", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingImpeller(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingImpeller(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-impellers/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingImpeller(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingImpeller(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-impellers/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Funnels ----------
export async function getCasingFunnels(req, res) {
  try {
    const data = await service.getCasingFunnels();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-funnels", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingFunnels(req, res) {
  try {
    const created = await service.createCasingFunnels(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-funnels", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingFunnels(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingFunnels(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-funnels/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingFunnels(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingFunnels(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-funnels/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Sleeve Shafts ----------
export async function getCasingSleeveShafts(req, res) {
  try {
    const data = await service.getCasingSleeveShafts();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-sleeve-shafts", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingSleeveShaft(req, res) {
  try {
    const created = await service.createCasingSleeveShaft(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-sleeve-shafts", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingSleeveShaft(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingSleeveShaft(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-sleeve-shafts/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingSleeveShaft(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingSleeveShaft(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-sleeve-shafts/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Matching Flanges ----------
export async function getCasingMatchingFlanges(req, res) {
  try {
    const data = await service.getCasingMatchingFlanges();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-matching-flanges", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingMatchingFlange(req, res) {
  try {
    const created = await service.createCasingMatchingFlange(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-matching-flanges", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingMatchingFlange(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingMatchingFlange(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-matching-flanges/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingMatchingFlange(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingMatchingFlange(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-matching-flanges/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Bearing Assemblies ----------
export async function getCasingBearingAssemblies(req, res) {
  try {
    const data = await service.getCasingBearingAssemblies();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-bearing-assemblies", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingBearingAssembly(req, res) {
  try {
    const created = await service.createCasingBearingAssembly(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-bearing-assemblies", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingBearingAssembly(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingBearingAssembly(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-bearing-assemblies/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingBearingAssembly(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingBearingAssembly(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-bearing-assemblies/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Fan Bases ----------
export async function getCasingFanBases(req, res) {
  try {
    const data = await service.getCasingFanBases();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-fan-bases", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingFanBase(req, res) {
  try {
    const created = await service.createCasingFanBase(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-fan-bases", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingFanBase(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingFanBase(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-fan-bases/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingFanBase(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingFanBase(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-fan-bases/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Belt Covers ----------
export async function getCasingBeltCovers(req, res) {
  try {
    const data = await service.getCasingBeltCovers();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-belt-covers", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingBeltCover(req, res) {
  try {
    const created = await service.createCasingBeltCover(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-belt-covers", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingBeltCover(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingBeltCover(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-belt-covers/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingBeltCover(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingBeltCover(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-belt-covers/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Motor Bases ----------
export async function getCasingMotorBases(req, res) {
  try {
    const data = await service.getCasingMotorBases();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-motor-bases", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingMotorBase(req, res) {
  try {
    const created = await service.createCasingMotorBase(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-motor-bases", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingMotorBase(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingMotorBase(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-motor-bases/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingMotorBase(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingMotorBase(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-motor-bases/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Accessories ----------
export async function getCasingAccessories(req, res) {
  try {
    const data = await service.getCasingAccessories();
    if (data === null) return res.status(503).json({ error: "Database not available" });
    res.json({ data });
  } catch (e) {
    console.error("GET /casing-accessories", e);
    res.status(500).json({ error: e.message });
  }
}

export async function createCasingAccessories(req, res) {
  try {
    const created = await service.createCasingAccessories(req.body);
    if (created === null) return res.status(503).json({ error: "Database not available" });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /casing-accessories", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateCasingAccessories(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const updated = await service.updateCasingAccessories(id, req.body);
    if (updated === null) return res.status(503).json({ error: "Database not available" });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("PUT /casing-accessories/:id", e);
    res.status(500).json({ error: e.message });
  }
}

export async function deleteCasingAccessories(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    await service.deleteCasingAccessories(id);
    res.json({ message: "Deleted" });
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("DELETE /casing-accessories/:id", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Calculate Pricing ----------
export async function calculatePricing(req, res) {
  try {
    const { type, size, ...rest } = req.body || {};
    const result = await service.calculatePricing({ type, size, ...rest });
    res.json(result);
  } catch (e) {
    console.error("POST /calculate-pricing", e);
    res.status(500).json({ error: e.message });
  }
}

// ---------- Casing Price Calculation ----------
export async function casingPriceCalculation(req, res) {
  try {
    if (process.env.DEBUG_CASING_PRICE === "1") {
      console.log("[casingPrice] POST body:", JSON.stringify(req.body, null, 2));
    }
    const result = await service.casingPriceCalculation(req.body);
    if (result === null) {
      return res.status(404).json({
        error: "Casing or related data not found. Check that casing has volute, frame, impeller, etc.",
      });
    }
    res.json(result);
  } catch (e) {
    console.error("POST /casing-price", e);
    res.status(500).json({
      error: e.message,
      stack: process.env.NODE_ENV === "development" ? e.stack : undefined,
    });
  }
}