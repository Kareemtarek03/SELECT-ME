import xlsx from "xlsx";

// ─── Generic helpers ──────────────────────────────────────────────────────────

/**
 * Build an xlsx buffer from an array of DB rows.
 * @param {Object[]} data  - Prisma query results
 * @param {[string,string][]} columnMap - [[dbField, header], …] preserves order
 * @param {string} sheetName
 * @returns {Buffer}
 */
export function createExcelBuffer(data, columnMap, sheetName = "Sheet1") {
  const rows = data.map((item) => {
    const row = {};
    for (const [dbField, header] of columnMap) {
      let val = dbField.includes(".")
        ? dbField.split(".").reduce((o, k) => o?.[k], item)
        : item[dbField];
      row[header] = val ?? "";
    }
    return row;
  });
  const ws = xlsx.utils.json_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, sheetName);
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
}

/**
 * Build a multi-sheet xlsx buffer.
 * @param {{ sheetName: string, data: Object[], columnMap: [string,string][] }[]} sheets
 * @returns {Buffer}
 */
export function createMultiSheetExcelBuffer(sheets) {
  const wb = xlsx.utils.book_new();
  for (const { sheetName, data, columnMap } of sheets) {
    const rows = data.map((item) => {
      const row = {};
      for (const [dbField, header] of columnMap) {
        let val = dbField.includes(".")
          ? dbField.split(".").reduce((o, k) => o?.[k], item)
          : item[dbField];
        row[header] = val ?? "";
      }
      return row;
    });
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  }
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
}

/**
 * Parse the first sheet of an xlsx buffer into an array of DB-field objects.
 * @param {Buffer} buffer
 * @param {[string,string][]} columnMap - [[dbField, header], …]
 * @param {string[]} numberFields - fields that should be parsed as numbers
 * @returns {Object[]}
 */
export function parseExcelBuffer(buffer, columnMap, numberFields = []) {
  const wb = xlsx.read(buffer);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
  const reverseMap = new Map(columnMap.map(([db, hdr]) => [hdr, db]));
  const numSet = new Set(numberFields);

  return rows.map((row) => {
    const record = {};
    for (const [header, value] of Object.entries(row)) {
      const dbField = reverseMap.get(header);
      if (!dbField) continue;
      if (numSet.has(dbField)) {
        record[dbField] = value === "" || value === null ? null : Number(value);
      } else {
        record[dbField] = value === "" ? null : value;
      }
    }
    return record;
  });
}

/**
 * Parse ALL sheets of an xlsx buffer, keyed by sheet name.
 * @param {Buffer} buffer
 * @param {Object} sheetConfigs - { sheetName: { columnMap, numberFields } }
 * @returns {Object} { sheetName: Object[] }
 */
export function parseMultiSheetExcelBuffer(buffer, sheetConfigs) {
  const wb = xlsx.read(buffer);
  const result = {};
  for (const [sheetName, cfg] of Object.entries(sheetConfigs)) {
    const ws = wb.Sheets[sheetName];
    if (!ws) { result[sheetName] = []; continue; }
    const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
    const reverseMap = new Map(cfg.columnMap.map(([db, hdr]) => [hdr, db]));
    const numSet = new Set(cfg.numberFields || []);
    result[sheetName] = rows.map((row) => {
      const record = {};
      for (const [header, value] of Object.entries(row)) {
        const dbField = reverseMap.get(header);
        if (!dbField) continue;
        if (numSet.has(dbField)) {
          record[dbField] = value === "" || value === null ? null : Number(value);
        } else {
          record[dbField] = value === "" ? null : value;
        }
      }
      return record;
    });
  }
  return result;
}

export function sendExcelResponse(res, buffer, filename) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
}

// ─── Column maps (table-specific) ─────────────────────────────────────────────
// Each map is an array of [dbField, ExcelHeader] tuples. Order = column order.

export const COLUMN_MAPS = {
  centrifugalFanData: [
    ["id", "ID"],
    ["bladesType", "Blades Type"],
    ["bladesModel", "Blades Model"],
    ["minSpeedRPM", "Min Speed (RPM)"],
    ["highSpeedRPM", "High Speed (RPM)"],
    ["impellerType", "Impeller Type"],
    ["fanShaftDiameter", "Fan Shaft Diameter"],
    ["innerDiameter", "Inner Diameter"],
    ["desigDensity", "Design Density"],
    ["RPM", "RPM"],
    ["airFlow", "Air Flow (JSON)"],
    ["totPressure", "Total Pressure (JSON)"],
    ["velPressure", "Velocity Pressure (JSON)"],
    ["staticPressure", "Static Pressure (JSON)"],
    ["fanInputPow", "Fan Input Power (JSON)"],
  ],

  pulleyData: [
    ["id", "ID"],
    ["no", "No"],
    ["beltType", "Belt Type"],
    ["grooves", "Grooves"],
    ["pitchDiameter", "Pitch Diameter"],
    ["bushNo", "Bush No"],
    ["minBore", "Min Bore"],
    ["maxBore", "Max Bore"],
    ["widthF", "Width F"],
    ["condition", "Condition"],
  ],

  beltLengthStandard: [
    ["id", "ID"],
    ["spz", "SPZ"],
    ["spa", "SPA"],
    ["spb", "SPB"],
    ["spc", "SPC"],
  ],

  pulleyStandard: [
    ["id", "ID"],
    ["no", "No"],
    ["spz", "SPZ"],
    ["spa", "SPA"],
    ["spb", "SPB"],
    ["spc", "SPC"],
  ],

  accessoryPricing: [
    ["id", "ID"],
    ["sr", "SR"],
    ["fanModel", "Fan Model"],
    ["fanSizeMm", "Fan Size (mm)"],
    ["vinylStickersLe", "Vinyl Stickers (LE)"],
    ["namePlateLe", "Name Plate (LE)"],
    ["packingLe", "Packing (LE)"],
    ["labourCostLe", "Labour Cost (LE)"],
    ["internalTransportationLe", "Internal Transportation (LE)"],
    ["boltsAndNutsKg", "Bolts & Nuts (Kg)"],
    ["priceWithVatLe", "Price With VAT (LE)"],
  ],

  axialImpellerBlade: [
    ["id", "ID"],
    ["symbol", "Symbol"],
    ["material", "Material"],
    ["bladeType", "Blade Type"],
    ["lengthMm", "Length (mm)"],
    ["bladeWeightKg", "Blade Weight (Kg)"],
    ["moldCostWithVat", "Mold Cost (With VAT)"],
    ["machiningCostWithVat", "Machining Cost (With VAT)"],
    ["transportationCost", "Transportation Cost"],
    ["packingCost", "Packing Cost"],
    ["steelBallsCost", "Steel Balls Cost"],
    ["bladeFactor", "Blade Factor"],
  ],

  axialImpellerHub: [
    ["id", "ID"],
    ["symbol", "Symbol"],
    ["material", "Material"],
    ["hubType", "Hub Type"],
    ["sizeMm", "Size (mm)"],
    ["hubWeightKg", "Hub Weight (Kg)"],
    ["moldCostWithVat", "Mold Cost (With VAT)"],
    ["machiningCostWithVat", "Machining Cost (With VAT)"],
    ["transportationCost", "Transportation Cost"],
    ["packingCost", "Packing Cost"],
  ],

  axialImpellerFrame: [
    ["id", "ID"],
    ["material", "Material"],
    ["frameSizeMm", "Frame Size (mm)"],
    ["sizeMm", "Size (mm)"],
    ["weightKg", "Weight (Kg)"],
    ["moldCostWithVat", "Mold Cost (With VAT)"],
    ["machiningCostWithVat", "Machining Cost (With VAT)"],
    ["transportationCost", "Transportation Cost"],
    ["packingCost", "Packing Cost"],
  ],

  axialCasingPricing: [
    ["id", "ID"],
    ["model", "Model"],
    ["sizeMm", "Size (mm)"],
    ["casingWeightKgWithoutScrap", "Casing Weight (Kg) w/o Scrap"],
    ["scrapPercentage", "Scrap (%)"],
    ["casingCircumferenceMeter", "Casing Circumference (m)"],
    ["laserTimeMinutes", "Laser Time (min)"],
    ["bendingLine", "Bending Line"],
    ["rolling", "Rolling"],
    ["paintingDiameter", "Painting Diameter"],
    ["profitPercentage", "Profit (%)"],
    ["accessory1Description", "Accessory 1 Description"],
    ["accessory1PriceWithoutVat", "Accessory 1 Price (w/o VAT)"],
    ["accessory2Description", "Accessory 2 Description"],
    ["accessory2PriceWithoutVat", "Accessory 2 Price (w/o VAT)"],
  ],

  // ─── Centrifugal Casing (multi-sheet) ──────────────────────────────────────
  casingParent: [
    ["id", "ID"],
    ["type", "Type"],
    ["model", "Model"],
    ["sizeMm", "Size (mm)"],
    ["modelAndSize", "Model & Size"],
  ],

  casingVolute: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["volute2mmWeightKgWithoutScrap", "2mm Weight w/o Scrap (Kg)"],
    ["volute2mmScrapPct", "2mm Scrap (%)"],
    ["volute2mmWeightKgWithScrap", "2mm Weight w/ Scrap (Kg)"],
    ["volute2mmSheetMetalDimensionsMm", "2mm Sheet Metal Dimensions (mm)"],
    ["volute1mmWeightKgWithoutScrap", "1mm Weight w/o Scrap (Kg)"],
    ["volute1mmScrapPct", "1mm Scrap (%)"],
    ["volute1mmWeightKgWithScrap", "1mm Weight w/ Scrap (Kg)"],
    ["volute1mmSheetMetalDimensionsMm", "1mm Sheet Metal Dimensions (mm)"],
    ["volute1mmLaserTimeMin", "1mm Laser Time (min)"],
    ["volute1mmRolling", "1mm Rolling"],
    ["volute1mmSheetMetalOverlapping", "1mm Overlapping"],
  ],

  casingFrame: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["angleBarWeightKgWithoutScrap", "Angle Bar Weight w/o Scrap (Kg)"],
    ["angleBarScrapPct", "Angle Bar Scrap (%)"],
    ["angleBarWeightKgWithScrap", "Angle Bar Weight w/ Scrap (Kg)"],
    ["angleBarDimensionsMm", "Angle Bar Dimensions (mm)"],
    ["supportWeightKgWithoutScrap", "Support Weight w/o Scrap (Kg)"],
    ["supportScrapPct", "Support Scrap (%)"],
    ["supportWeightKgWithScrap", "Support Weight w/ Scrap (Kg)"],
    ["supportSheetMetalDimensionsMm", "Support Dimensions (mm)"],
    ["supportLaserTimeMin", "Support Laser Time (min)"],
    ["supportCasingCircumferenceM", "Support Circumference (m)"],
    ["supportPaintingLe", "Support Painting (LE)"],
  ],

  casingImpeller: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["bladesWeightKgWithoutScrap", "Blades Weight w/o Scrap (Kg)"],
    ["bladesScrapPct", "Blades Scrap (%)"],
    ["bladesWeightKgWithScrap", "Blades Weight w/ Scrap (Kg)"],
    ["bladesSheetMetalDimensionsMm", "Blades Dimensions (mm)"],
    ["plateWeightKgWithoutScrap", "Plate Weight w/o Scrap (Kg)"],
    ["plateScrapPct", "Plate Scrap (%)"],
    ["plateWeightKgWithScrap", "Plate Weight w/ Scrap (Kg)"],
    ["plateSheetMetalDimensionsMm", "Plate Dimensions (mm)"],
    ["plateCentrifugalImpellerRigCostPcs", "Plate Rig Cost (pcs)"],
    ["plateLaserTimeMin", "Plate Laser Time (min)"],
    ["plateCasingCircumferenceM", "Plate Circumference (m)"],
    ["platePaintingLe", "Plate Painting (LE)"],
  ],

  casingFunnels: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["funnel15mmWeightKgWithoutScrap", "1.5mm Weight w/o Scrap (Kg)"],
    ["funnel15mmScrapPct", "1.5mm Scrap (%)"],
    ["funnel15mmWeightKgWithScrap", "1.5mm Weight w/ Scrap (Kg)"],
    ["funnel15mmSheetMetalDimensionsMm", "1.5mm Dimensions (mm)"],
    ["funnel15mmDieCastingLePc", "1.5mm Die Casting (LE/pc)"],
    ["funnel15mmFunnelMachiningLe", "1.5mm Machining (LE)"],
    ["funnel15mmGalvanizeLe", "1.5mm Galvanize (LE)"],
    ["funnel3mmWeightKgWithoutScrap", "3mm Weight w/o Scrap (Kg)"],
    ["funnel3mmScrapPct", "3mm Scrap (%)"],
    ["funnel3mmWeightKgWithScrap", "3mm Weight w/ Scrap (Kg)"],
    ["funnel3mmSheetMetalDimensionsMm", "3mm Dimensions (mm)"],
    ["funnel3mmDieCastingLePc", "3mm Die Casting (LE/pc)"],
    ["funnel3mmFunnelMachiningLe", "3mm Machining (LE)"],
    ["funnel3mmPaintingLe", "3mm Painting (LE)"],
  ],

  casingSleeveShaft: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["sleeveWeightKgWithoutScrap", "Sleeve Weight w/o Scrap (Kg)"],
    ["sleeveScrapPct", "Sleeve Scrap (%)"],
    ["sleeveWeightKgWithScrap", "Sleeve Weight w/ Scrap (Kg)"],
    ["sleeveSheetMetalDimensionsMm", "Sleeve Dimensions (mm)"],
    ["sleeveManufacturingLePc", "Sleeve Manufacturing (LE/pc)"],
    ["shaftWeightKgWithoutScrap", "Shaft Weight w/o Scrap (Kg)"],
    ["shaftScrapPct", "Shaft Scrap (%)"],
    ["shaftWeightKgWithScrap", "Shaft Weight w/ Scrap (Kg)"],
    ["shaftSheetMetalDimensionsMm", "Shaft Dimensions (mm)"],
    ["shaftManufacturingLePc", "Shaft Manufacturing (LE/pc)"],
  ],

  casingMatchingFlange: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["flange3mmWeightKgWithoutScrap", "Flange Weight w/o Scrap (Kg)"],
    ["flange3mmScrapPct", "Flange Scrap (%)"],
    ["flange3mmWeightKgWithScrap", "Flange Weight w/ Scrap (Kg)"],
    ["flange3mmSheetMetalDimensionsMm", "Flange Dimensions (mm)"],
    ["flange3mmLaserTimeMin", "Flange Laser Time (min)"],
    ["flange3mmRolling", "Flange Rolling"],
    ["flange3mmCasingCircumferenceM", "Flange Circumference (m)"],
    ["selfAligningBearingHousingLe", "Self-Aligning Bearing Housing (LE)"],
  ],

  casingBearingAssembly: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["boltsNutsKg", "Bolts & Nuts (Kg)"],
    ["assemblyLaboursPerShaft", "Assembly Labours Per Shaft"],
  ],

  casingFanBase: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["weightKgWithoutScrap", "Weight w/o Scrap (Kg)"],
    ["scrapPct", "Scrap (%)"],
    ["weightKgWithScrap", "Weight w/ Scrap (Kg)"],
    ["sheetMetalDimensionsMm", "Sheet Metal Dimensions (mm)"],
    ["laserTimeMin", "Laser Time (min)"],
    ["bendingLine", "Bending Line"],
    ["paintingLe", "Painting (LE)"],
  ],

  casingBeltCover: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["weightKgWithoutScrap", "Weight w/o Scrap (Kg)"],
    ["scrapPct", "Scrap (%)"],
    ["weightKgWithScrap", "Weight w/ Scrap (Kg)"],
    ["sheetMetalDimensionsMm", "Sheet Metal Dimensions (mm)"],
    ["laserTimeMin", "Laser Time (min)"],
    ["casingCircumferenceM", "Circumference (m)"],
    ["paintingLe", "Painting (LE)"],
  ],

  casingMotorBase: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["weightKgWithoutScrap", "Weight w/o Scrap (Kg)"],
    ["scrapPct", "Scrap (%)"],
    ["weightKgWithScrap", "Weight w/ Scrap (Kg)"],
    ["sheetMetalDimensionsMm", "Sheet Metal Dimensions (mm)"],
    ["laserTimeMin", "Laser Time (min)"],
    ["bendingLine", "Bending Line"],
    ["studNutPriceLe", "Stud & Nut Price (LE)"],
    ["paintingLe", "Painting (LE)"],
  ],

  casingAccessories: [
    ["casing.model", "Casing Model"],
    ["casing.sizeMm", "Casing Size (mm)"],
    ["casingId", "Casing ID"],
    ["vibrationIsolatorsLe", "Vibration Isolators (LE)"],
    ["vinylStickersLe", "Vinyl Stickers (LE)"],
    ["namePlateLe", "Name Plate (LE)"],
    ["packingLe", "Packing (LE)"],
    ["labourCostLe", "Labour Cost (LE)"],
    ["internalTransportationLe", "Internal Transportation (LE)"],
  ],
};

// Numeric field lists for import parsing
export const NUMBER_FIELDS = {
  centrifugalFanData: ["minSpeedRPM", "highSpeedRPM", "fanShaftDiameter", "innerDiameter", "desigDensity", "RPM"],
  pulleyData: ["no", "grooves", "pitchDiameter", "minBore", "maxBore", "widthF"],
  beltLengthStandard: ["spz", "spa", "spb", "spc"],
  pulleyStandard: ["no", "spz", "spa", "spb", "spc"],
  accessoryPricing: ["sr", "fanSizeMm", "vinylStickersLe", "namePlateLe", "packingLe", "labourCostLe", "internalTransportationLe", "boltsAndNutsKg", "priceWithVatLe"],
  axialImpellerBlade: ["lengthMm", "bladeWeightKg", "moldCostWithVat", "machiningCostWithVat", "transportationCost", "packingCost", "steelBallsCost", "bladeFactor"],
  axialImpellerHub: ["sizeMm", "hubWeightKg", "moldCostWithVat", "machiningCostWithVat", "transportationCost", "packingCost"],
  axialImpellerFrame: ["frameSizeMm", "sizeMm", "weightKg", "moldCostWithVat", "machiningCostWithVat", "transportationCost", "packingCost"],
  axialCasingPricing: ["sizeMm", "casingWeightKgWithoutScrap", "scrapPercentage", "casingCircumferenceMeter", "laserTimeMinutes", "bendingLine", "rolling", "paintingDiameter", "profitPercentage", "accessory1PriceWithoutVat", "accessory2PriceWithoutVat"],
};
