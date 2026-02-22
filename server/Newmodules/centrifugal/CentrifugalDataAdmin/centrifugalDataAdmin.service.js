import { getPrismaClient } from "../CentrifugalFanData/centrifugalFanData.service.js";

// ---------- Helpers ----------
export const casingNum = (v) =>
  v === null || v === undefined || v === "" ? null : Number(v);
export const casingStr = (v) =>
  v != null && v !== "" ? String(v).trim() : null;

// ---------- Field lists for casing-related entities ----------
export const voluteFields = [
  "volute2mmWeightKgWithoutScrap",
  "volute2mmScrapPct",
  "volute2mmWeightKgWithScrap",
  "volute2mmSheetMetalDimensionsMm",
  "volute1mmWeightKgWithoutScrap",
  "volute1mmScrapPct",
  "volute1mmWeightKgWithScrap",
  "volute1mmSheetMetalDimensionsMm",
  "volute1mmLaserTimeMin",
  "volute1mmRolling",
  "volute1mmSheetMetalOverlapping",
];

export const frameFields = [
  "angleBarWeightKgWithoutScrap",
  "angleBarScrapPct",
  "angleBarWeightKgWithScrap",
  "angleBarDimensionsMm",
  "supportWeightKgWithoutScrap",
  "supportScrapPct",
  "supportWeightKgWithScrap",
  "supportSheetMetalDimensionsMm",
  "supportLaserTimeMin",
  "supportCasingCircumferenceM",
  "supportPaintingLe",
];

export const impellerFields = [
  "bladesWeightKgWithoutScrap",
  "bladesScrapPct",
  "bladesWeightKgWithScrap",
  "bladesSheetMetalDimensionsMm",
  "plateWeightKgWithoutScrap",
  "plateScrapPct",
  "plateWeightKgWithScrap",
  "plateSheetMetalDimensionsMm",
  "plateCentrifugalImpellerRigCostPcs",
  "plateLaserTimeMin",
  "plateCasingCircumferenceM",
  "platePaintingLe",
];

export const funnelFields = [
  "funnel15mmWeightKgWithoutScrap",
  "funnel15mmScrapPct",
  "funnel15mmWeightKgWithScrap",
  "funnel15mmSheetMetalDimensionsMm",
  "funnel15mmDieCastingLePc",
  "funnel15mmFunnelMachiningLe",
  "funnel15mmGalvanizeLe",
  "funnel3mmWeightKgWithoutScrap",
  "funnel3mmScrapPct",
  "funnel3mmWeightKgWithScrap",
  "funnel3mmSheetMetalDimensionsMm",
  "funnel3mmDieCastingLePc",
  "funnel3mmFunnelMachiningLe",
  "funnel3mmPaintingLe",
];

export const sleeveShaftFields = [
  "sleeveWeightKgWithoutScrap",
  "sleeveScrapPct",
  "sleeveWeightKgWithScrap",
  "sleeveSheetMetalDimensionsMm",
  "sleeveManufacturingLePc",
  "shaftWeightKgWithoutScrap",
  "shaftScrapPct",
  "shaftWeightKgWithScrap",
  "shaftSheetMetalDimensionsMm",
  "shaftManufacturingLePc",
];

export const matchingFlangeFields = [
  "flange3mmWeightKgWithoutScrap",
  "flange3mmScrapPct",
  "flange3mmWeightKgWithScrap",
  "flange3mmSheetMetalDimensionsMm",
  "flange3mmLaserTimeMin",
  "flange3mmRolling",
  "flange3mmCasingCircumferenceM",
  "selfAligningBearingHousingLe",
];

// ---------- Pulley Data ----------
export async function getPulleys() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.pulleyData.findMany({ orderBy: { id: "asc" } });
}

export async function createPulley(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  return prisma.pulleyData.create({
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
}

export async function updatePulley(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.no !== undefined) updateData.no = b.no == null ? null : Number(b.no);
  if (b.beltType !== undefined) updateData.beltType = b.beltType;
  if (b.grooves !== undefined)
    updateData.grooves = b.grooves == null ? null : Number(b.grooves);
  if (b.pitchDiameter !== undefined)
    updateData.pitchDiameter =
      b.pitchDiameter == null ? null : Number(b.pitchDiameter);
  if (b.bushNo !== undefined) updateData.bushNo = b.bushNo;
  if (b.minBore !== undefined)
    updateData.minBore = b.minBore == null ? null : Number(b.minBore);
  if (b.maxBore !== undefined)
    updateData.maxBore = b.maxBore == null ? null : Number(b.maxBore);
  if (b.widthF !== undefined)
    updateData.widthF = b.widthF == null ? null : Number(b.widthF);
  if (b.condition !== undefined) updateData.condition = b.condition;
  return prisma.pulleyData.update({ where: { id }, data: updateData });
}

export async function deletePulley(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.pulleyData.delete({ where: { id } });
}

// ---------- Belt Length Standard ----------
export async function getBeltStandards() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.beltLengthStandard.findMany({ orderBy: { id: "asc" } });
}

export async function createBeltStandard(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  return prisma.beltLengthStandard.create({
    data: {
      spz: b.spz != null ? Number(b.spz) : null,
      spa: b.spa != null ? Number(b.spa) : null,
      spb: b.spb != null ? Number(b.spb) : null,
      spc: b.spc != null ? Number(b.spc) : null,
    },
  });
}

export async function updateBeltStandard(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.spz !== undefined)
    updateData.spz = b.spz == null ? null : Number(b.spz);
  if (b.spa !== undefined)
    updateData.spa = b.spa == null ? null : Number(b.spa);
  if (b.spb !== undefined)
    updateData.spb = b.spb == null ? null : Number(b.spb);
  if (b.spc !== undefined)
    updateData.spc = b.spc == null ? null : Number(b.spc);
  return prisma.beltLengthStandard.update({ where: { id }, data: updateData });
}

export async function deleteBeltStandard(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.beltLengthStandard.delete({ where: { id } });
}

// ---------- Pulley Standard ----------
export async function getPulleyStandards() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.pulleyStandard.findMany({ orderBy: { id: "asc" } });
}

export async function createPulleyStandard(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  return prisma.pulleyStandard.create({
    data: {
      no: b.no != null ? Number(b.no) : null,
      spz: b.spz != null ? Number(b.spz) : null,
      spa: b.spa != null ? Number(b.spa) : null,
      spb: b.spb != null ? Number(b.spb) : null,
      spc: b.spc != null ? Number(b.spc) : null,
    },
  });
}

export async function updatePulleyStandard(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.no !== undefined) updateData.no = b.no == null ? null : Number(b.no);
  if (b.spz !== undefined)
    updateData.spz = b.spz == null ? null : Number(b.spz);
  if (b.spa !== undefined)
    updateData.spa = b.spa == null ? null : Number(b.spa);
  if (b.spb !== undefined)
    updateData.spb = b.spb == null ? null : Number(b.spb);
  if (b.spc !== undefined)
    updateData.spc = b.spc == null ? null : Number(b.spc);
  return prisma.pulleyStandard.update({ where: { id }, data: updateData });
}

export async function deletePulleyStandard(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.pulleyStandard.delete({ where: { id } });
}

// ---------- Centrifugal Casing Pricing ----------
export async function getCasingPricing() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingPricing.findMany({
    orderBy: { modelAndSize: "asc" },
  });
}

export async function createCasingPricing(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  return prisma.centrifugalCasingPricing.create({
    data: {
      type: b.type ?? "",
      model: b.model ?? "",
      sizeMm: casingNum(b.sizeMm) ?? 0,
      modelAndSize: b.modelAndSize ?? `${b.model || ""}-${b.sizeMm ?? ""}`,
    },
  });
}

export async function updateCasingPricing(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.type !== undefined) updateData.type = b.type;
  if (b.model !== undefined) updateData.model = b.model;
  if (b.sizeMm !== undefined) updateData.sizeMm = casingNum(b.sizeMm) ?? 0;
  if (b.modelAndSize !== undefined) updateData.modelAndSize = b.modelAndSize;
  return prisma.centrifugalCasingPricing.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingPricing(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingPricing.delete({ where: { id } });
}

// ---------- Casing Volutes ----------
export async function getCasingVolutes() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingVolute.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingVolute(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const createData = { casingId: casingNum(b.casingId) ?? 0 };
  voluteFields.forEach((f) => {
    if (b[f] !== undefined)
      createData[f] = f.includes("Dimensions")
        ? casingStr(b[f])
        : casingNum(b[f]);
  });
  return prisma.centrifugalCasingVolute.create({ data: createData });
}

export async function updateCasingVolute(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  voluteFields.forEach((f) => {
    if (b[f] !== undefined)
      updateData[f] = f.includes("Dimensions")
        ? casingStr(b[f])
        : casingNum(b[f]);
  });
  return prisma.centrifugalCasingVolute.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingVolute(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingVolute.delete({ where: { id } });
}

// ---------- Casing Frames ----------
export async function getCasingFrames() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingFrame.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingFrame(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const createData = { casingId: casingNum(b.casingId) ?? 0 };
  frameFields.forEach((f) => {
    if (b[f] !== undefined)
      createData[f] =
        f.includes("Dimensions") || f.includes("Mm")
          ? casingStr(b[f])
          : casingNum(b[f]);
  });
  return prisma.centrifugalCasingFrame.create({ data: createData });
}

export async function updateCasingFrame(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  frameFields.forEach((f) => {
    if (b[f] !== undefined)
      updateData[f] =
        f.includes("Dimensions") || f.includes("Mm")
          ? casingStr(b[f])
          : casingNum(b[f]);
  });
  return prisma.centrifugalCasingFrame.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingFrame(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingFrame.delete({ where: { id } });
}

// ---------- Casing Impellers ----------
export async function getCasingImpellers() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingImpeller.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingImpeller(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const createData = { casingId: casingNum(b.casingId) ?? 0 };
  impellerFields.forEach((f) => {
    if (b[f] !== undefined)
      createData[f] = f.includes("Dimensions")
        ? casingStr(b[f])
        : casingNum(b[f]);
  });
  return prisma.centrifugalCasingImpeller.create({ data: createData });
}

export async function updateCasingImpeller(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  impellerFields.forEach((f) => {
    if (b[f] !== undefined)
      updateData[f] = f.includes("Dimensions")
        ? casingStr(b[f])
        : casingNum(b[f]);
  });
  return prisma.centrifugalCasingImpeller.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingImpeller(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingImpeller.delete({ where: { id } });
}

// ---------- Casing Funnels ----------
export async function getCasingFunnels() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingFunnels.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingFunnels(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const createData = { casingId: casingNum(b.casingId) ?? 0 };
  funnelFields.forEach((f) => {
    if (b[f] !== undefined)
      createData[f] = f.includes("Dimensions")
        ? casingStr(b[f])
        : casingNum(b[f]);
  });
  return prisma.centrifugalCasingFunnels.create({ data: createData });
}

export async function updateCasingFunnels(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  funnelFields.forEach((f) => {
    if (b[f] !== undefined)
      updateData[f] = f.includes("Dimensions")
        ? casingStr(b[f])
        : casingNum(b[f]);
  });
  return prisma.centrifugalCasingFunnels.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingFunnels(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingFunnels.delete({ where: { id } });
}

// ---------- Casing Sleeve Shafts ----------
export async function getCasingSleeveShafts() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingSleeveShaft.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingSleeveShaft(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const createData = { casingId: casingNum(b.casingId) ?? 0 };
  sleeveShaftFields.forEach((f) => {
    if (b[f] !== undefined)
      createData[f] = f.includes("Dimensions")
        ? casingStr(b[f])
        : casingNum(b[f]);
  });
  return prisma.centrifugalCasingSleeveShaft.create({ data: createData });
}

export async function updateCasingSleeveShaft(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  sleeveShaftFields.forEach((f) => {
    if (b[f] !== undefined)
      updateData[f] = f.includes("Dimensions")
        ? casingStr(b[f])
        : casingNum(b[f]);
  });
  return prisma.centrifugalCasingSleeveShaft.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingSleeveShaft(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingSleeveShaft.delete({ where: { id } });
}

// ---------- Casing Matching Flanges ----------
export async function getCasingMatchingFlanges() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingMatchingFlange.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingMatchingFlange(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const createData = { casingId: casingNum(b.casingId) ?? 0 };
  matchingFlangeFields.forEach((f) => {
    if (b[f] !== undefined)
      createData[f] = f.includes("Dimensions")
        ? casingStr(b[f])
        : casingNum(b[f]);
  });
  return prisma.centrifugalCasingMatchingFlange.create({ data: createData });
}

export async function updateCasingMatchingFlange(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  matchingFlangeFields.forEach((f) => {
    if (b[f] !== undefined)
      updateData[f] = f.includes("Dimensions")
        ? casingStr(b[f])
        : casingNum(b[f]);
  });
  return prisma.centrifugalCasingMatchingFlange.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingMatchingFlange(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingMatchingFlange.delete({ where: { id } });
}

// ---------- Casing Bearing Assemblies ----------
export async function getCasingBearingAssemblies() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingBearingAssembly.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingBearingAssembly(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  return prisma.centrifugalCasingBearingAssembly.create({
    data: {
      casingId: casingNum(b.casingId) ?? 0,
      boltsNutsKg: casingNum(b.boltsNutsKg),
      assemblyLaboursPerShaft: casingNum(b.assemblyLaboursPerShaft),
    },
  });
}

export async function updateCasingBearingAssembly(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  if (b.boltsNutsKg !== undefined)
    updateData.boltsNutsKg = casingNum(b.boltsNutsKg);
  if (b.assemblyLaboursPerShaft !== undefined)
    updateData.assemblyLaboursPerShaft = casingNum(b.assemblyLaboursPerShaft);
  return prisma.centrifugalCasingBearingAssembly.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingBearingAssembly(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingBearingAssembly.delete({ where: { id } });
}

// ---------- Casing Fan Bases ----------
export async function getCasingFanBases() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingFanBase.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingFanBase(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  return prisma.centrifugalCasingFanBase.create({
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
}

export async function updateCasingFanBase(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  if (b.weightKgWithoutScrap !== undefined)
    updateData.weightKgWithoutScrap = casingNum(b.weightKgWithoutScrap);
  if (b.scrapPct !== undefined) updateData.scrapPct = casingNum(b.scrapPct);
  if (b.weightKgWithScrap !== undefined)
    updateData.weightKgWithScrap = casingNum(b.weightKgWithScrap);
  if (b.sheetMetalDimensionsMm !== undefined)
    updateData.sheetMetalDimensionsMm = casingStr(b.sheetMetalDimensionsMm);
  if (b.laserTimeMin !== undefined)
    updateData.laserTimeMin = casingNum(b.laserTimeMin);
  if (b.bendingLine !== undefined)
    updateData.bendingLine = casingNum(b.bendingLine);
  if (b.paintingLe !== undefined)
    updateData.paintingLe = casingNum(b.paintingLe);
  return prisma.centrifugalCasingFanBase.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingFanBase(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingFanBase.delete({ where: { id } });
}

// ---------- Casing Belt Covers ----------
export async function getCasingBeltCovers() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingBeltCover.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingBeltCover(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  return prisma.centrifugalCasingBeltCover.create({
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
}

export async function updateCasingBeltCover(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  if (b.weightKgWithoutScrap !== undefined)
    updateData.weightKgWithoutScrap = casingNum(b.weightKgWithoutScrap);
  if (b.scrapPct !== undefined) updateData.scrapPct = casingNum(b.scrapPct);
  if (b.weightKgWithScrap !== undefined)
    updateData.weightKgWithScrap = casingNum(b.weightKgWithScrap);
  if (b.sheetMetalDimensionsMm !== undefined)
    updateData.sheetMetalDimensionsMm = casingStr(b.sheetMetalDimensionsMm);
  if (b.laserTimeMin !== undefined)
    updateData.laserTimeMin = casingNum(b.laserTimeMin);
  if (b.casingCircumferenceM !== undefined)
    updateData.casingCircumferenceM = casingNum(b.casingCircumferenceM);
  if (b.paintingLe !== undefined)
    updateData.paintingLe = casingNum(b.paintingLe);
  return prisma.centrifugalCasingBeltCover.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingBeltCover(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingBeltCover.delete({ where: { id } });
}

// ---------- Casing Motor Bases ----------
export async function getCasingMotorBases() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingMotorBase.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingMotorBase(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  return prisma.centrifugalCasingMotorBase.create({
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
}

export async function updateCasingMotorBase(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  if (b.weightKgWithoutScrap !== undefined)
    updateData.weightKgWithoutScrap = casingNum(b.weightKgWithoutScrap);
  if (b.scrapPct !== undefined) updateData.scrapPct = casingNum(b.scrapPct);
  if (b.weightKgWithScrap !== undefined)
    updateData.weightKgWithScrap = casingNum(b.weightKgWithScrap);
  if (b.sheetMetalDimensionsMm !== undefined)
    updateData.sheetMetalDimensionsMm = casingStr(b.sheetMetalDimensionsMm);
  if (b.laserTimeMin !== undefined)
    updateData.laserTimeMin = casingNum(b.laserTimeMin);
  if (b.bendingLine !== undefined)
    updateData.bendingLine = casingNum(b.bendingLine);
  if (b.studNutPriceLe !== undefined)
    updateData.studNutPriceLe = casingNum(b.studNutPriceLe);
  if (b.paintingLe !== undefined)
    updateData.paintingLe = casingNum(b.paintingLe);
  return prisma.centrifugalCasingMotorBase.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingMotorBase(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingMotorBase.delete({ where: { id } });
}

// ---------- Casing Accessories ----------
export async function getCasingAccessories() {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingAccessories.findMany({
    include: { casing: true },
    orderBy: { casingId: "asc" },
  });
}

export async function createCasingAccessories(data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  return prisma.centrifugalCasingAccessories.create({
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
}

export async function updateCasingAccessories(id, data) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  const b = data || {};
  const updateData = {};
  if (b.casingId !== undefined)
    updateData.casingId = casingNum(b.casingId) ?? 0;
  if (b.vibrationIsolatorsLe !== undefined)
    updateData.vibrationIsolatorsLe = casingNum(b.vibrationIsolatorsLe);
  if (b.vinylStickersLe !== undefined)
    updateData.vinylStickersLe = casingNum(b.vinylStickersLe);
  if (b.namePlateLe !== undefined)
    updateData.namePlateLe = casingNum(b.namePlateLe);
  if (b.packingLe !== undefined) updateData.packingLe = casingNum(b.packingLe);
  if (b.labourCostLe !== undefined)
    updateData.labourCostLe = casingNum(b.labourCostLe);
  if (b.internalTransportationLe !== undefined)
    updateData.internalTransportationLe = casingNum(b.internalTransportationLe);
  return prisma.centrifugalCasingAccessories.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCasingAccessories(id) {
  const prisma = await getPrismaClient();
  if (!prisma) return null;
  return prisma.centrifugalCasingAccessories.delete({ where: { id } });
}

// ---------- Calculate Pricing ----------
/**
 * Calculate pricing based on type and size.
 * Accepts { type, size, ... } in body - extend with additional params as needed.
 * @param {Object} input - { type, size, ... }
 * @returns {Object} - Pricing result (placeholder - implement calculation logic)
 */
export async function calculatePricing(input) {
  const { type, size } = input || {};
  // TODO: Implement pricing calculation logic
  // For now returns a placeholder - you can fill in the rest
  return {
    type: type ?? null,
    size: size ?? null,
    // Add your calculation result fields here
  };
}

// ---------- Casing Price Calculation ----------
const DEBUG_CASING_PRICE = process.env.DEBUG_CASING_PRICE === "1";

function debugLog(...args) {
  if (DEBUG_CASING_PRICE) console.log("[casingPrice]", ...args);
}

export async function casingPriceCalculation(input) {
  const { type, size, sizeMm, id, casingId } = input || {};
  // Child rows (volute, frame, etc.) have casingId; casing-pricing rows have id
  const lookupCasingId = casingId ?? id;

  debugLog("INPUT:", { type, size, sizeMm, id, casingId, lookupCasingId });

  const prisma = await getPrismaClient();
  let price = {
    volute: null,
    voluteWithoutScrap: null,
    frame: null,
    frameWithoutScrap: null,
    impeller: null,
    impellerWithoutScrap: null,
    funnels: null,
    sleeveShaft: null,
    matchingFlange: null,
    bearingAssembly: null,
    fanBase: null,
    fanBaseWithoutScrap: null,
    beltCover: null,
    beltCoverWithoutScrap: null,
    motorBase: null,
    motorBaseWithoutScrap: null,
    accessories: null,
    totalFanPriceWithVat: null,
    totalFanPriceWithVatScrapRecycle: null,
  };
  if (!prisma) {
    debugLog("FAIL: prisma not available");
    return null;
  }
  const priceItems = await prisma.pricingItem.findMany({});
  debugLog("priceItems count:", priceItems?.length);

  const casing = lookupCasingId
    ? await prisma.centrifugalCasingPricing.findUnique({
        where: { id: lookupCasingId },
      })
    : await prisma.centrifugalCasingPricing.findFirst({
        where: {
          type: type ?? "",
          sizeMm: size ?? sizeMm ?? 0,
        },
      });

  if (!casing) {
    debugLog("FAIL: casing not found", {
      lookupCasingId,
      type,
      size,
      sizeMm,
    });
    return null;
  }
  debugLog("casing found:", { id: casing.id, type: casing.type, sizeMm: casing.sizeMm });
  const volute = await prisma.centrifugalCasingVolute.findFirst({
    where: { casingId: casing.id },
  });
  if (!volute) {
    debugLog("FAIL: volute not found for casingId", casing.id);
    return null;
  }
  debugLog("volute:", {
    volute2mmWeightKgWithScrap: volute.volute2mmWeightKgWithScrap,
    volute1mmWeightKgWithScrap: volute.volute1mmWeightKgWithScrap,
    volute1mmLaserTimeMin: volute.volute1mmLaserTimeMin,
  });
  const galvanizedPrice =
    (priceItems.find((item) => item.description?.includes("Galvanized Sheet Steel Raw Material"))?.priceWithVat ?? 0) / 1000;
  const voluteWeight =
    (volute.volute2mmWeightKgWithScrap ?? 0) + (volute.volute1mmWeightKgWithScrap ?? 0);
  price.volute = voluteWeight * galvanizedPrice;
  price.volute +=
    (volute.volute1mmLaserTimeMin ?? 0) *
    (priceItems.find((item) => item.description?.includes("Black Steel Laser"))
      ?.priceWithVat || 0);
  price.volute +=
    (volute.volute1mmRolling ?? 0) *
    (priceItems.find((item) =>
      item.description?.includes("Black Steel Rolling"),
    )?.priceWithVat || 0);
  price.volute +=
    (volute.volute1mmSheetMetalOverlapping ?? 0) *
    (priceItems.find((item) =>
      item.description?.includes("Galvanized Sheet Steel Overlaping"),
    )?.priceWithVat || 0);
  price.volute *=
    1 +
      priceItems.find((item) => item.description.includes("Profit"))
        ?.priceWithVat /
        100 || 0;
  price.volute *= 1.14; // VAT
  price.voluteWithoutScrap =
    price.volute -
    ((volute.volute2mmWeightKgWithScrap -
      volute.volute2mmWeightKgWithoutScrap) *
      (priceItems.find((item) =>
        item.description.includes("Galvanized Sheet Steel Raw Material"),
      )?.priceWithVat || 0)) /
      1000 /
      2;
  const frame = await prisma.centrifugalCasingFrame.findFirst({
    where: { casingId: casing.id },
  });
  if (!frame) {
    debugLog("FAIL: frame not found for casingId", casing.id);
    return null;
  }
  price.frame =
    (frame.angleBarWeightKgWithScrap *
      priceItems.find((item) =>
        item.description.includes("Formed Black Steel Raw Material"),
      )?.priceWithVat) /
      1000 ||
    0 +
      (frame.supportWeightKgWithScrap *
        priceItems.find((item) =>
          item.description.includes("Black Steel Raw Material"),
        )?.priceWithVat) /
        1000 ||
    0;

  price.frame +=
    frame.supportLaserTimeMin *
      priceItems.find((item) => item.description.includes("Black Steel Laser"))
        ?.priceWithVat || 0;
  price.frame +=
    frame.supportCasingCircumferenceM *
      priceItems.find((item) =>
        item.description.includes("Black Steel Welding"),
      )?.priceWithVat || 0;
  price.frame += frame.supportPaintingLe;
  price.frame *=
    1 +
      priceItems.find((item) => item.description.includes("Profit"))
        ?.priceWithVat /
        100 || 0;
  price.frame *= 1.14; // VAT
  price.frameWithoutScrap =
    price.frame -
    ((frame.angleBarWeightKgWithScrap - frame.angleBarWeightKgWithoutScrap) *
      (priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat || 0)) /
      1000 /
      2;
  const impeller = await prisma.centrifugalCasingImpeller.findFirst({
    where: { casingId: casing.id },
  });
  if (!impeller) {
    debugLog("FAIL: impeller not found for casingId", casing.id);
    return null;
  }
  price.impeller =
    ((impeller.bladesWeightKgWithScrap + impeller.plateWeightKgWithScrap) *
      priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat) /
      1000 || 0;
  price.impeller += impeller.plateCentrifugalImpellerRigCostPcs;

  price.impeller +=
    impeller.plateLaserTimeMin *
      priceItems.find((item) => item.description.includes("Black Steel Laser"))
        ?.priceWithVat || 0;
  price.impeller +=
    impeller.plateCasingCircumferenceM *
      priceItems.find((item) =>
        item.description.includes("Black Steel Welding"),
      )?.priceWithVat || 0;
  price.impeller += impeller.platePaintingLe;
  price.impeller *=
    1 +
      priceItems.find((item) => item.description.includes("Profit"))
        ?.priceWithVat /
        100 || 0;
  price.impeller *= 1.14; // VAT
  price.impellerWithoutScrap =
    price.impeller -
    ((impeller.bladesWeightKgWithScrap - impeller.bladesWeightKgWithoutScrap) *
      (priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat || 0)) /
      1000 /
      2;
  const funnels = await prisma.centrifugalCasingFunnels.findFirst({
    where: { casingId: casing.id },
  });
  if (!funnels) {
    debugLog("FAIL: funnels not found for casingId", casing.id);
    return null;
  }
  price.funnels =
    ((funnels.funnel15mmWeightKgWithScrap +
      funnels.funnel3mmWeightKgWithScrap) *
      priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat) /
      1000 || 0;
  price.funnels +=
    funnels.funnel15mmDieCastingLePc + funnels.funnel3mmDieCastingLePc;
  price.funnels +=
    funnels.funnel15mmFunnelMachiningLe + funnels.funnel3mmFunnelMachiningLe;
  price.funnels += funnels.funnel15mmGalvanizeLe + funnels.funnel3mmPaintingLe;
  price.funnels *=
    1 +
      priceItems.find((item) => item.description.includes("Profit"))
        ?.priceWithVat /
        100 || 0;
  price.funnels *= 1.14; // VAT
  const sleeveShaft = await prisma.centrifugalCasingSleeveShaft.findFirst({
    where: { casingId: casing.id },
  });
  if (!sleeveShaft) {
    debugLog("FAIL: sleeveShaft not found for casingId", casing.id);
    return null;
  }
  price.sleeveShaft =
    (sleeveShaft.sleeveWeightKgWithScrap *
      priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat) /
      1000 || 0;
  price.sleeveShaft += sleeveShaft.sleeveManufacturingLePc;
  price.sleeveShaft +=
    (sleeveShaft.shaftWeightKgWithScrap *
      (priceItems.find((item) =>
        item.description.includes("Hard Steel Chrom Raw Material"),
      )?.priceWithVat || 0)) /
      1000 || 0;
  price.sleeveShaft += sleeveShaft.shaftManufacturingLePc;
  price.sleeveShaft *=
    1 +
      priceItems.find((item) => item.description.includes("Profit"))
        ?.priceWithVat /
        100 || 0;
  price.sleeveShaft *= 1.14; // VAT
  const matchingFlange = await prisma.centrifugalCasingMatchingFlange.findFirst(
    {
      where: {
        casingId: casing.id,
      },
    },
  );
  if (!matchingFlange) {
    debugLog("FAIL: matchingFlange not found for casingId", casing.id);
    return null;
  }
  price.matchingFlange =
    (matchingFlange.flange3mmWeightKgWithScrap *
      priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat) /
      1000 || 0;
  price.matchingFlange +=
    matchingFlange.flange3mmLaserTimeMin *
      priceItems.find((item) => item.description.includes("Black Steel Laser"))
        ?.priceWithVat || 0;
  price.matchingFlange +=
    matchingFlange.flange3mmRolling *
      priceItems.find((item) =>
        item.description.includes("Black Steel Rolling"),
      )?.priceWithVat || 0;
  price.matchingFlange +=
    matchingFlange.flange3mmCasingCircumferenceM *
      priceItems.find((item) =>
        item.description.includes("Black Steel Welding"),
      )?.priceWithVat || 0;
  price.matchingFlange *=
    1 +
      priceItems.find((item) => item.description.includes("Profit"))
        ?.priceWithVat /
        100 || 0;

  price.matchingFlange *= 1.14; // VAT
  price.matchingFlange +=
    matchingFlange.selfAligningBearingHousingLe * 2 * 1.14;

  const bearingAssembly =
    await prisma.centrifugalCasingBearingAssembly.findFirst({
      where: {
        casingId: casing.id,
      },
    });
  if (!bearingAssembly) {
    debugLog("FAIL: bearingAssembly not found for casingId", casing.id);
    return null;
  }
  price.bearingAssembly =
    bearingAssembly.boltsNutsKg *
      priceItems.find((item) => item.description.includes("Bolts"))
        ?.priceWithVat || 0;
  price.bearingAssembly +=
    bearingAssembly.assemblyLaboursPerShaft *
    (priceItems.find((item) => item.description.includes("Assembly Cost"))
      ?.priceWithVat || 0);

  const fanBase = await prisma.centrifugalCasingFanBase.findFirst({
    where: {
      casingId: casing.id,
    },
  });
  if (!fanBase) {
    debugLog("FAIL: fanBase not found for casingId", casing.id);
    return null;
  }
  price.fanBase =
    (fanBase.weightKgWithScrap *
      priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat) /
      1000 || 0;
  price.fanBase +=
    fanBase.laserTimeMin *
      priceItems.find((item) => item.description.includes("Black Steel Laser"))
        ?.priceWithVat || 0;
  price.fanBase +=
    fanBase.bendingLine *
      priceItems.find((item) =>
        item.description.includes("Black Steel Bending"),
      )?.priceWithVat || 0;
  price.fanBase += fanBase.paintingLe;
  price.fanBase *=
    1 +
      (priceItems.find((item) => item.description?.includes("Profit"))
        ?.priceWithVat ?? 0) /
        100;
  price.fanBase *= 1.14; // VAT
  price.fanBaseWithoutScrap =
    price.fanBase -
    (((fanBase.weightKgWithScrap ?? 0) - (fanBase.weightKgWithoutScrap ?? 0)) *
      (priceItems.find((item) =>
        item.description?.includes("Black Steel Raw Material"),
      )?.priceWithVat || 0)) /
      1000 /
      2;
  const beltCover = await prisma.centrifugalCasingBeltCover.findFirst({
    where: {
      casingId: casing.id,
    },
  });
  if (!beltCover) {
    debugLog("FAIL: beltCover not found for casingId", casing.id);
    return null;
  }
  price.beltCover =
    (beltCover.weightKgWithScrap *
      priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat) /
      1000 || 0;
  price.beltCover +=
    beltCover.laserTimeMin *
      priceItems.find((item) => item.description.includes("Black Steel Laser"))
        ?.priceWithVat || 0;
  price.beltCover +=
    beltCover.casingCircumferenceM *
      priceItems.find((item) =>
        item.description.includes("Black Steel Welding"),
      )?.priceWithVat || 0;
  price.beltCover += beltCover.paintingLe;
  price.beltCover *=
    1 +
      priceItems.find((item) => item.description.includes("Profit"))
        ?.priceWithVat /
        100 || 0;
  price.beltCover *= 1.14; // VAT
  price.beltCoverWithoutScrap =
    price.beltCover -
    ((beltCover.weightKgWithScrap - beltCover.weightKgWithoutScrap) *
      (priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat || 0)) /
      1000 /
      2;
  const motorBase = await prisma.centrifugalCasingMotorBase.findFirst({
    where: {
      casingId: casing.id,
    },
  });
  if (!motorBase) {
    debugLog("FAIL: motorBase not found for casingId", casing.id);
    return null;
  }
  price.motorBase =
    (motorBase.weightKgWithScrap *
      priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat) /
      1000 || 0;
  price.motorBase +=
    motorBase.laserTimeMin *
      priceItems.find((item) => item.description.includes("Black Steel Laser"))
        ?.priceWithVat || 0;
  price.motorBase +=
    motorBase.bendingLine *
      priceItems.find((item) =>
        item.description.includes("Black Steel Bending"),
      )?.priceWithVat || 0;
  price.motorBase += motorBase.studNutPriceLe;
  price.motorBase += motorBase.paintingLe;
  price.motorBase *=
    1 +
      priceItems.find((item) => item.description.includes("Profit"))
        ?.priceWithVat /
        100 || 0;
  price.motorBase *= 1.14; // VAT
  price.motorBaseWithoutScrap =
    price.motorBase -
    ((motorBase.weightKgWithScrap - motorBase.weightKgWithoutScrap) *
      (priceItems.find((item) =>
        item.description.includes("Black Steel Raw Material"),
      )?.priceWithVat || 0)) /
      1000 /
      2;
  const accessories = await prisma.centrifugalCasingAccessories.findFirst({
    where: {
      casingId: casing.id,
    },
  });
  if (!accessories) {
    debugLog("FAIL: accessories not found for casingId", casing.id);
    return null;
  }
  price.accessories = accessories.vibrationIsolatorsLe;
  price.accessories += accessories.vinylStickersLe;
  price.accessories += accessories.namePlateLe;
  price.accessories += accessories.packingLe;
  price.accessories += accessories.labourCostLe;
  price.accessories += accessories.internalTransportationLe;
  price.totalFanPriceWithVat =
    price.volute +
    price.frame +
    price.impeller +
    price.funnels +
    price.sleeveShaft +
    price.matchingFlange +
    price.bearingAssembly +
    price.fanBase +
    price.beltCover +
    price.motorBase +
    price.accessories;
  price.totalFanPriceWithVatScrapRecycle =
    price.voluteWithoutScrap +
    price.frameWithoutScrap +
    price.impellerWithoutScrap +
    price.funnels +
    price.sleeveShaft +
    price.matchingFlange +
    price.bearingAssembly +
    price.fanBaseWithoutScrap +
    price.beltCoverWithoutScrap +
    price.motorBaseWithoutScrap +
    price.accessories;

  debugLog("FINAL price:", {
    totalFanPriceWithVat: price.totalFanPriceWithVat,
    totalFanPriceWithVatScrapRecycle: price.totalFanPriceWithVatScrapRecycle,
  });
  return price;
}
