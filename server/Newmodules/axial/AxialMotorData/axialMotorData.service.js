import fs from "fs";
import xlsx from "xlsx";
import {
  calculateMotorPrices,
  stripCalculatedFields,
  CALCULATED_DB_FIELDS,
  parsePrice,
} from "./axialMotorPricing.service.js";

const MOTOR_FILE = "./MotorData.json";

// Prisma client - lazy loaded only when needed (for database mode)
let prisma = null;
async function getPrismaClient() {
  if (!prisma) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      prisma = new PrismaClient();
    } catch (err) {
      console.warn("Prisma client not available - database mode disabled");
      prisma = null;
    }
  }
  return prisma;
}

// Exact JSON column names in order (matching MotorData.json)
const MOTOR_JSON_COLUMNS = [
  "Material",
  "Model",
  "Power (kW)",
  "Speed (RPM)",
  "No of Poles",
  "Rated current-In (A)",
  "Rated Torque – Mn (Nm)",
  "Locked rotor Current – Ia (A) (DOL)",
  "Ia / In (DOL)",
  "Locked rotor Torque – Ma (Nm) (DOL)",
  "Ma / Mn (DOL)",
  "Locked rotor Current – Ia (A) (Y / ∆ Starting)",
  "Ia / I-n (Y / ∆ Starting)",
  "Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)",
  "Ma / Mn (Y / ∆ Starting)",
  "Power factor Cos φ",
  "Phase",
  "Frame Size (mm)",
  "Shaft Diameter (mm)",
  "Shaft Length (mm)",
  "Shaft Feather Key Length (mm)",
  "IE",
  "front Brearing",
  "Rear Bearing",
  "Noise Level (dB-A)",
  "Weight (KG)",
  "Efficiency @ 50 Hz",
  "Efficiency @ 37.5 Hz",
  "Efficiency @ 25 Hz",
  "Run Capacitor 400 V (µF)",
  "Start Capacitor 330 V (µF)",
  "No. of Capacitors",
  "No. of Phases",
  "Insulation Class",
  "B3 Price ($) w/o VAT",
  "B3 Price with VAT & Factor (L.E)",
  "Other Price ($) w/o VAT",
  "Other Price with VAT & Factor (L.E)",
  "Current (A) with S.F (25%)(Cable)",
  "Cable Size (mm2)(Cable)",
  "Price w/o VAT Per Meter (Cable)",
  "Price With VAT Per Meter (Cable)",
  "No.(Cable Lugs)",
  "U.P Price w/o VAT (Cable Lugs)",
  "U.P Price with VAT (Cable Lugs)",
  "T.P Price with VAT (Cable Lugs)",
  "No.(Cable Heat Shrink)",
  "U.P Price w/o VAT (Cable Heat Shrink)",
  "U.P Price with VAT (Cable Heat Shrink)",
  "T.P Price with VAT (Cable Heat Shrink)",
  "Meter (Flexible Connector)",
  "Size (mm) (Flexible Connector)",
  "U.P Price w/o VAT (Flexible Connector)",
  "U.P Price with VAT (Flexible Connector)",
  "T.P Price with VAT (Flexible Connector)",
  "No. (Gland)",
  "U.P Price w/o VAT (Gland)",
  "U.P Price with VAT (Gland)",
  "T.P Price with VAT (Gland)",
  "No. (Brass Bar)",
  "U.P Price w/o VAT (Brass Bar)",
  "U.P Price with VAT (Brass Bar)",
  "T.P Price with VAT (Brass Bar)",
  "Size (mm) (Electrical Box)",
  "U.P Price w/o VAT (Electrical Box)",
  "U.P Price with VAT(Electrical Box)",
  "Price With VAT Per Meter (Total)",
  "Power (HP)",
];

// Map DB field to exact JSON column name
function mapDbRowToJsonFormat(r) {
  return {
    "id": r.id,
    "Material": r.material,
    "Model": r.model,
    "Power (kW)": r.powerKW,
    "Speed (RPM)": r.speedRPM,
    "No of Poles": r.NoPoles,
    "Rated current-In (A)": r.ratedCurrentIn,
    "Rated Torque – Mn (Nm)": r.ratedTorqueMn,
    "Locked rotor Current – Ia (A) (DOL)": r.dolLockedRotorCurrent,
    "Ia / In (DOL)": r.dolIaIn,
    "Locked rotor Torque – Ma (Nm) (DOL)": r.dolLockedRotorTorque,
    "Ma / Mn (DOL)": r.dolMaMn,
    "Locked rotor Current – Ia (A) (Y / ∆ Starting)": r.starDeltaLockedRotorCurrent,
    "Ia / I-n (Y / ∆ Starting)": r.starDeltaIaIn,
    "Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)": r.starDeltaLockedRotorTorque,
    "Ma / Mn (Y / ∆ Starting)": r.starDeltaMaMn,
    "Power factor Cos φ": r.powerFactor,
    "Phase": r.Phase,
    "Frame Size (mm)": r.frameSize,
    "Shaft Diameter (mm)": r.shaftDia,
    "Shaft Length (mm)": r.shaftLength,
    "Shaft Feather Key Length (mm)": r.shaftFeather,
    "IE": r.IE,
    "front Brearing": r.frontBear,
    "Rear Bearing": r.rearBear,
    "Noise Level (dB-A)": r.noiseLvl,
    "Weight (KG)": r.weightKg,
    "Efficiency @ 50 Hz": r.efficiency50Hz,
    "Efficiency @ 37.5 Hz": r.efficiency375Hz,
    "Efficiency @ 25 Hz": r.efficiency25Hz,
    "Run Capacitor 400 V (µF)": r.runCapacitor400V,
    "Start Capacitor 330 V (µF)": r.startCapacitor330V,
    "No. of Capacitors": r.NoCapacitors,
    "No. of Phases": r.NoPhases,
    "Insulation Class": r.insClass,
    "B3 Price ($) w/o VAT": r.b3PriceWithoutVat,
    "B3 Price with VAT & Factor (L.E)": r.b3PriceWithVat,
    "Other Price ($) w/o VAT": r.otherPriceWithoutVat,
    "Other Price with VAT & Factor (L.E)": r.otherPriceWithVat,
    "Current (A) with S.F (25%)(Cable)": r.cableCurrent,
    "Cable Size (mm2)(Cable)": r.cableSize,
    "Price w/o VAT Per Meter (Cable)": r.cablePriceWithoutVat,
    "Price With VAT Per Meter (Cable)": r.cablePriceWithVat,
    "No.(Cable Lugs)": r.cableLugsNo,
    "U.P Price w/o VAT (Cable Lugs)": r.cableLugsUPWithoutVat,
    "U.P Price with VAT (Cable Lugs)": r.cableLugsUPWithVat,
    "T.P Price with VAT (Cable Lugs)": r.cableLugsTPWithVat,
    "No.(Cable Heat Shrink)": r.cableHeatShrinkNo,
    "U.P Price w/o VAT (Cable Heat Shrink)": r.cableHeatShrinkUPWithoutVat,
    "U.P Price with VAT (Cable Heat Shrink)": r.cableHeatShrinkUPWithVat,
    "T.P Price with VAT (Cable Heat Shrink)": r.cableHeatShrinkTPWithVat,
    "Meter (Flexible Connector)": r.flexibleConnectorMeter,
    "Size (mm) (Flexible Connector)": r.flexibleConnectorSize,
    "U.P Price w/o VAT (Flexible Connector)": r.flexibleConnectorUPWithoutVat,
    "U.P Price with VAT (Flexible Connector)": r.flexibleConnectorUPWithVat,
    "T.P Price with VAT (Flexible Connector)": r.flexibleConnectorTPWithVat,
    "No. (Gland)": r.glandNo,
    "U.P Price w/o VAT (Gland)": r.glandUPWithoutVat,
    "U.P Price with VAT (Gland)": r.glandUPWithVat,
    "T.P Price with VAT (Gland)": r.glandTPWithVat,
    "No. (Brass Bar)": r.brassBarNo,
    "U.P Price w/o VAT (Brass Bar)": r.brassBarUPWithoutVat,
    "U.P Price with VAT (Brass Bar)": r.brassBarUPWithVat,
    "T.P Price with VAT (Brass Bar)": r.brassBarTPWithVat,
    "Size (mm) (Electrical Box)": r.electricalBoxSize,
    "U.P Price w/o VAT (Electrical Box)": r.electricalBoxUPWithoutVat,
    "U.P Price with VAT(Electrical Box)": r.electricalBoxUPWithVat,
    "Price With VAT Per Meter (Total)": r.totalPriceWithVat,
    "Power (HP)": r.powerHorse,
  };
}

// Helper to convert value to float for DB
const toFloat = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const parsed = parsePrice(val);
  return parsed;
};

// Helper to convert value to int for DB
const toInt = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const parsed = parseInt(String(val).replace(/[\s,]/g, ""), 10);
  return isNaN(parsed) ? null : parsed;
};

// Map JSON format back to DB field names for create/update
function mapJsonToDbFormat(jsonData) {
  return {
    material: jsonData["Material"],
    model: jsonData["Model"],
    powerKW: toFloat(jsonData["Power (kW)"]),
    speedRPM: toFloat(jsonData["Speed (RPM)"]),
    NoPoles: toInt(jsonData["No of Poles"]),
    ratedCurrentIn: toFloat(jsonData["Rated current-In (A)"]),
    ratedTorqueMn: toFloat(jsonData["Rated Torque – Mn (Nm)"]),
    dolLockedRotorCurrent: toFloat(jsonData["Locked rotor Current – Ia (A) (DOL)"]),
    dolIaIn: toFloat(jsonData["Ia / In (DOL)"]),
    dolLockedRotorTorque: toFloat(jsonData["Locked rotor Torque – Ma (Nm) (DOL)"]),
    dolMaMn: toFloat(jsonData["Ma / Mn (DOL)"]),
    starDeltaLockedRotorCurrent: toFloat(jsonData["Locked rotor Current – Ia (A) (Y / ∆ Starting)"]),
    starDeltaIaIn: toFloat(jsonData["Ia / I-n (Y / ∆ Starting)"]),
    starDeltaLockedRotorTorque: toFloat(jsonData["Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)"]),
    starDeltaMaMn: toFloat(jsonData["Ma / Mn (Y / ∆ Starting)"]),
    powerFactor: toFloat(jsonData["Power factor Cos φ"]),
    Phase: jsonData["Phase"],
    frameSize: jsonData["Frame Size (mm)"],
    shaftDia: toFloat(jsonData["Shaft Diameter (mm)"]),
    shaftLength: toFloat(jsonData["Shaft Length (mm)"]),
    shaftFeather: toFloat(jsonData["Shaft Feather Key Length (mm)"]),
    IE: jsonData["IE"],
    frontBear: jsonData["front Brearing"],
    rearBear: jsonData["Rear Bearing"],
    noiseLvl: toFloat(jsonData["Noise Level (dB-A)"]),
    weightKg: toFloat(jsonData["Weight (KG)"]),
    efficiency50Hz: toFloat(jsonData["Efficiency @ 50 Hz"]),
    efficiency375Hz: toFloat(jsonData["Efficiency @ 37.5 Hz"]),
    efficiency25Hz: toFloat(jsonData["Efficiency @ 25 Hz"]),
    runCapacitor400V: toFloat(jsonData["Run Capacitor 400 V (µF)"]),
    startCapacitor330V: toFloat(jsonData["Start Capacitor 330 V (µF)"]),
    NoCapacitors: toInt(jsonData["No. of Capacitors"]),
    NoPhases: toInt(jsonData["No. of Phases"]),
    insClass: jsonData["Insulation Class"],
    b3PriceWithoutVat: toFloat(jsonData["B3 Price ($) w/o VAT"]),
    b3PriceWithVat: toFloat(jsonData["B3 Price with VAT & Factor (L.E)"]),
    otherPriceWithoutVat: toFloat(jsonData["Other Price ($) w/o VAT"]),
    otherPriceWithVat: toFloat(jsonData["Other Price with VAT & Factor (L.E)"]),
    cableCurrent: toFloat(jsonData["Current (A) with S.F (25%)(Cable)"]),
    cableSize: jsonData["Cable Size (mm2)(Cable)"],
    cablePriceWithoutVat: toFloat(jsonData["Price w/o VAT Per Meter (Cable)"]),
    cablePriceWithVat: toFloat(jsonData["Price With VAT Per Meter (Cable)"]),
    cableLugsNo: toInt(jsonData["No.(Cable Lugs)"]),
    cableLugsUPWithoutVat: toFloat(jsonData["U.P Price w/o VAT (Cable Lugs)"]),
    cableLugsUPWithVat: toFloat(jsonData["U.P Price with VAT (Cable Lugs)"]),
    cableLugsTPWithVat: toFloat(jsonData["T.P Price with VAT (Cable Lugs)"]),
    cableHeatShrinkNo: toFloat(jsonData["No.(Cable Heat Shrink)"]),
    cableHeatShrinkUPWithoutVat: toFloat(jsonData["U.P Price w/o VAT (Cable Heat Shrink)"]),
    cableHeatShrinkUPWithVat: toFloat(jsonData["U.P Price with VAT (Cable Heat Shrink)"]),
    cableHeatShrinkTPWithVat: toFloat(jsonData["T.P Price with VAT (Cable Heat Shrink)"]),
    flexibleConnectorMeter: toFloat(jsonData["Meter (Flexible Connector)"]),
    flexibleConnectorSize: jsonData["Size (mm) (Flexible Connector)"],
    flexibleConnectorUPWithoutVat: toFloat(jsonData["U.P Price w/o VAT (Flexible Connector)"]),
    flexibleConnectorUPWithVat: toFloat(jsonData["U.P Price with VAT (Flexible Connector)"]),
    flexibleConnectorTPWithVat: toFloat(jsonData["T.P Price with VAT (Flexible Connector)"]),
    glandNo: toFloat(jsonData["No. (Gland)"]),
    glandUPWithoutVat: toFloat(jsonData["U.P Price w/o VAT (Gland)"]),
    glandUPWithVat: toFloat(jsonData["U.P Price with VAT (Gland)"]),
    glandTPWithVat: toFloat(jsonData["T.P Price with VAT (Gland)"]),
    brassBarNo: toFloat(jsonData["No. (Brass Bar)"]),
    brassBarUPWithoutVat: toFloat(jsonData["U.P Price w/o VAT (Brass Bar)"]),
    brassBarUPWithVat: toFloat(jsonData["U.P Price with VAT (Brass Bar)"]),
    brassBarTPWithVat: toFloat(jsonData["T.P Price with VAT (Brass Bar)"]),
    electricalBoxSize: jsonData["Size (mm) (Electrical Box)"],
    electricalBoxUPWithoutVat: toFloat(jsonData["U.P Price w/o VAT (Electrical Box)"]),
    electricalBoxUPWithVat: toFloat(jsonData["U.P Price with VAT(Electrical Box)"]),
    totalPriceWithVat: toFloat(jsonData["Price With VAT Per Meter (Total)"]),
    powerHorse: toFloat(jsonData["Power (HP)"]),
  };
}

// Try to read motor data from DB; fall back to file read if DB not available
export async function readMotorFile() {
  try {
    const prismaClient = await getPrismaClient();
    if (!prismaClient) throw new Error("Database not available");
    const rows = await prismaClient.motorData.findMany();
    // Map DB rows to exact JSON column names
    return rows
      .map(mapDbRowToJsonFormat)
      .sort((a, b) => a.id - b.id);
  } catch (err) {
    // fallback to reading the file if DB not configured/available
    try {
      const raw = fs.readFileSync(MOTOR_FILE, "utf8");
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
}

// Export the column order for UI
export function getMotorColumnOrder() {
  return ["id", ...MOTOR_JSON_COLUMNS];
}

export async function getMotorData() {
  return await readMotorFile();
}

// Create a new motor record - accepts data with exact JSON column names
export async function createMotor(jsonData) {
  try {
    // Strip any calculated fields from input (prevent frontend injection)
    const sanitizedJsonData = stripCalculatedFields(jsonData);

    // Map JSON format to DB format
    const dbData = mapJsonToDbFormat(sanitizedJsonData);

    // Remove calculated DB fields as extra safety
    CALCULATED_DB_FIELDS.forEach(field => delete dbData[field]);

    // Calculate the motor prices server-side
    const calculatedPrices = await calculateMotorPrices(dbData);

    // Merge all calculated prices into the data
    const finalData = {
      ...dbData,
      b3PriceWithVat: calculatedPrices.b3PriceWithVat,
      otherPriceWithVat: calculatedPrices.otherPriceWithVat,
      cablePriceWithVat: calculatedPrices.cablePriceWithVat,
      cableLugsUPWithVat: calculatedPrices.cableLugsUPWithVat,
      cableLugsTPWithVat: calculatedPrices.cableLugsTPWithVat,
      cableHeatShrinkUPWithVat: calculatedPrices.cableHeatShrinkUPWithVat,
      cableHeatShrinkTPWithVat: calculatedPrices.cableHeatShrinkTPWithVat,
      flexibleConnectorUPWithVat: calculatedPrices.flexibleConnectorUPWithVat,
      flexibleConnectorTPWithVat: calculatedPrices.flexibleConnectorTPWithVat,
      glandUPWithVat: calculatedPrices.glandUPWithVat,
      glandTPWithVat: calculatedPrices.glandTPWithVat,
      brassBarUPWithVat: calculatedPrices.brassBarUPWithVat,
      brassBarTPWithVat: calculatedPrices.brassBarTPWithVat,
      electricalBoxUPWithVat: calculatedPrices.electricalBoxUPWithVat,
      totalPriceWithVat: calculatedPrices.totalPriceWithVat,
    };

    const prismaClient = await getPrismaClient();
    if (!prismaClient) throw new Error("Database not available");
    const created = await prismaClient.motorData.create({
      data: finalData,
    });

    // Return in JSON format
    return mapDbRowToJsonFormat(created);
  } catch (err) {
    console.error("Failed to create motor:", err);
    throw new Error("Failed to create motor: " + err.message);
  }
}

// Update an existing motor record by ID - accepts data with exact JSON column names
export async function updateMotorById(id, jsonData) {
  if (!id) throw new Error("No id provided");
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error("Invalid id");

  try {
    // Strip any calculated fields from input (prevent frontend injection)
    const sanitizedJsonData = stripCalculatedFields(jsonData);

    // Map JSON format to DB format
    const dbData = mapJsonToDbFormat(sanitizedJsonData);

    // Build update payload - only include fields that are provided (not undefined)
    const updateData = {};
    Object.entries(dbData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // Remove calculated DB fields as extra safety
    CALCULATED_DB_FIELDS.forEach(field => delete updateData[field]);

    // Get the current motor data to merge with updates for price calculation
    const prismaClient = await getPrismaClient();
    if (!prismaClient) throw new Error("Database not available");
    const currentMotor = await prismaClient.motorData.findUnique({ where: { id: numId } });
    if (!currentMotor) {
      const notFound = new Error("Motor not found");
      notFound.code = "NOT_FOUND";
      throw notFound;
    }

    // Merge current data with updates for price calculation
    const mergedData = {
      b3PriceWithoutVat: updateData.b3PriceWithoutVat ?? currentMotor.b3PriceWithoutVat,
      otherPriceWithoutVat: updateData.otherPriceWithoutVat ?? currentMotor.otherPriceWithoutVat,
      cablePriceWithoutVat: updateData.cablePriceWithoutVat ?? currentMotor.cablePriceWithoutVat,
      cableLugsNo: updateData.cableLugsNo ?? currentMotor.cableLugsNo,
      cableLugsUPWithoutVat: updateData.cableLugsUPWithoutVat ?? currentMotor.cableLugsUPWithoutVat,
      cableHeatShrinkNo: updateData.cableHeatShrinkNo ?? currentMotor.cableHeatShrinkNo,
      cableHeatShrinkUPWithoutVat: updateData.cableHeatShrinkUPWithoutVat ?? currentMotor.cableHeatShrinkUPWithoutVat,
      flexibleConnectorMeter: updateData.flexibleConnectorMeter ?? currentMotor.flexibleConnectorMeter,
      flexibleConnectorUPWithoutVat: updateData.flexibleConnectorUPWithoutVat ?? currentMotor.flexibleConnectorUPWithoutVat,
      glandNo: updateData.glandNo ?? currentMotor.glandNo,
      glandUPWithoutVat: updateData.glandUPWithoutVat ?? currentMotor.glandUPWithoutVat,
      brassBarNo: updateData.brassBarNo ?? currentMotor.brassBarNo,
      brassBarUPWithoutVat: updateData.brassBarUPWithoutVat ?? currentMotor.brassBarUPWithoutVat,
      electricalBoxUPWithoutVat: updateData.electricalBoxUPWithoutVat ?? currentMotor.electricalBoxUPWithoutVat,
    };

    // Calculate all motor prices server-side
    const calculatedPrices = await calculateMotorPrices(mergedData);

    // Add all calculated prices to update data
    updateData.b3PriceWithVat = calculatedPrices.b3PriceWithVat;
    updateData.otherPriceWithVat = calculatedPrices.otherPriceWithVat;
    updateData.cablePriceWithVat = calculatedPrices.cablePriceWithVat;
    updateData.cableLugsUPWithVat = calculatedPrices.cableLugsUPWithVat;
    updateData.cableLugsTPWithVat = calculatedPrices.cableLugsTPWithVat;
    updateData.cableHeatShrinkUPWithVat = calculatedPrices.cableHeatShrinkUPWithVat;
    updateData.cableHeatShrinkTPWithVat = calculatedPrices.cableHeatShrinkTPWithVat;
    updateData.flexibleConnectorUPWithVat = calculatedPrices.flexibleConnectorUPWithVat;
    updateData.flexibleConnectorTPWithVat = calculatedPrices.flexibleConnectorTPWithVat;
    updateData.glandUPWithVat = calculatedPrices.glandUPWithVat;
    updateData.glandTPWithVat = calculatedPrices.glandTPWithVat;
    updateData.brassBarUPWithVat = calculatedPrices.brassBarUPWithVat;
    updateData.brassBarTPWithVat = calculatedPrices.brassBarTPWithVat;
    updateData.electricalBoxUPWithVat = calculatedPrices.electricalBoxUPWithVat;
    updateData.totalPriceWithVat = calculatedPrices.totalPriceWithVat;

    const updated = await prismaClient.motorData.update({
      where: { id: numId },
      data: updateData,
    });

    // Return in JSON format
    return mapDbRowToJsonFormat(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      const notFound = new Error("Motor not found");
      notFound.code = "NOT_FOUND";
      throw notFound;
    }
    console.error("Failed to update motor:", err);
    throw new Error("Failed to update motor: " + err.message);
  }
}

// Delete a motor by numeric id. Returns the deleted record id on success.
export async function deleteMotorById(id) {
  if (!id) throw new Error("No id provided");
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error("Invalid id");

  try {
    // try DB delete first
    const prismaClient = await getPrismaClient();
    if (!prismaClient) throw new Error("Database not available");
    const deleted = await prismaClient.motorData.delete({ where: { id: numId } });
    return { id: deleted.id };
  } catch (err) {
    // fallback to file-based deletion
    try {
      const raw = fs.readFileSync(MOTOR_FILE, "utf8");
      const arr = JSON.parse(raw || "[]");
      const idx = arr.findIndex((m) => {
        if (m == null) return false;
        // support id or Id
        return Number(m.id ?? m.Id) === numId;
      });
      if (idx === -1) {
        const notFound = new Error("Not found");
        notFound.code = "NOT_FOUND";
        throw notFound;
      }
      arr.splice(idx, 1);
      fs.writeFileSync(MOTOR_FILE, JSON.stringify(arr, null, 2), "utf8");
      return { id: numId };
    } catch (e) {
      // propagate not found specially
      if (e && e.code === "NOT_FOUND") throw e;
      throw new Error("Failed to delete motor: " + e.message);
    }
  }
}

export async function exportMotorData(res) {
  let data = [];
  try {
    const raw = await readMotorFile();
    data = raw.map((r) => ({
      Id: r.id,
      Material: r.material,
      Model: r.model,
      "Power (kW)": r.powerKW,
      "Speed (RPM)": r.speedRPM,
      "No of Poles": r.NoPoles,
      "Rated current-In (A)": r.ratedCurrentIn ?? r.rated?.currentInput ?? null,
      "Rated Torque – Mn (Nm)": r.ratedTorqueMn ?? r.rated?.tourqueNm ?? null,
      "Locked rotor Current – Ia (A) (DOL)": r.dolLockedRotorCurrent ?? r.DOL?.current ?? null,
      "Ia / In (DOL)": r.dolIaIn ?? r.DOL?.laln ?? null,
      "Locked rotor Torque – Ma (Nm) (DOL)": r.dolLockedRotorTorque ?? r.DOL?.tourque ?? null,
      "Ma / Mn (DOL)": r.dolMaMn ?? r.DOL?.MaMn ?? null,
      "Locked rotor Current – Ia (A) (Y / ∆ Starting)": r.starDeltaLockedRotorCurrent ?? r.starDelta?.current ?? null,
      "Ia / I-n (Y / ∆ Starting)": r.starDeltaIaIn ?? r.starDelta?.laln ?? null,
      "Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)": r.starDeltaLockedRotorTorque ?? r.starDelta?.tourque ?? null,
      "Ma / Mn (Y / ∆ Starting)": r.starDeltaMaMn ?? r.starDelta?.MaMn ?? null,
      "Power factor Cos φ": r.powerFactor,
      Phase: r.Phase,
      "Frame Size (mm)": r.frameSize,
      "Shaft Diameter (mm)": r.shaftDia,
      "Shaft Length (mm)": r.shaftLength,
      "Shaft Feather Key Length (mm)": r.shaftFeather,
      IE: r.IE,
      "front Brearing": r.frontBear,
      "Rear Bearing": r.rearBear,
      "Noise Level (dB-A)": r.noiseLvl,
      "Weight (KG)": r.weightKg,
      "Efficiency @ 50 Hz": r.efficiency50Hz ?? (Array.isArray(r.effCurve) ? r.effCurve[0] : null),
      "Efficiency @ 37.5 Hz": r.efficiency375Hz ?? (Array.isArray(r.effCurve) ? r.effCurve[1] : null),
      "Efficiency @ 25 Hz": r.efficiency25Hz ?? (Array.isArray(r.effCurve) ? r.effCurve[2] : null),
      "Run Capacitor 400 V (µF)": r.runCapacitor400V,
      "Start Capacitor 330 V (µF)": r.startCapacitor330V,
      "No. of Capacitors": r.NoCapacitors,
      "No. of Phases": r.NoPhases,
      "Insulation Class": r.insClass,
      "B3 Price ($) w/o VAT": r.b3PriceWithoutVat,
      "B3 Price with VAT & Factor (L.E)": r.b3PriceWithVat,
      "Other Price ($) w/o VAT": r.otherPriceWithoutVat,
      "Other Price with VAT & Factor (L.E)": r.otherPriceWithVat,
      "Current (A) with S.F (25%)(Cable)": r.cableCurrent,
      "Cable Size (mm2)(Cable)": r.cableSize,
      "Price w/o VAT Per Meter (Cable)": r.cablePriceWithoutVat,
      "Price With VAT Per Meter (Cable)": r.cablePriceWithVat,
      "No.(Cable Lugs)": r.cableLugsNo,
      "U.P Price w/o VAT (Cable Lugs)": r.cableLugsUPWithoutVat,
      "U.P Price with VAT (Cable Lugs)": r.cableLugsUPWithVat,
      "T.P Price with VAT (Cable Lugs)": r.cableLugsTPWithVat,
      "No.(Cable Heat Shrink)": r.cableHeatShrinkNo,
      "U.P Price w/o VAT (Cable Heat Shrink)": r.cableHeatShrinkUPWithoutVat,
      "U.P Price with VAT (Cable Heat Shrink)": r.cableHeatShrinkUPWithVat,
      "T.P Price with VAT (Cable Heat Shrink)": r.cableHeatShrinkTPWithVat,
      "Meter (Flexible Connector)": r.flexibleConnectorMeter,
      "Size (mm) (Flexible Connector)": r.flexibleConnectorSize,
      "U.P Price w/o VAT (Flexible Connector)": r.flexibleConnectorUPWithoutVat,
      "U.P Price with VAT (Flexible Connector)": r.flexibleConnectorUPWithVat,
      "T.P Price with VAT (Flexible Connector)": r.flexibleConnectorTPWithVat,
      "No. (Gland)": r.glandNo,
      "U.P Price w/o VAT (Gland)": r.glandUPWithoutVat,
      "U.P Price with VAT (Gland)": r.glandUPWithVat,
      "T.P Price with VAT (Gland)": r.glandTPWithVat,
      "No. (Brass Bar)": r.brassBarNo,
      "U.P Price w/o VAT (Brass Bar)": r.brassBarUPWithoutVat,
      "U.P Price with VAT (Brass Bar)": r.brassBarUPWithVat,
      "T.P Price with VAT (Brass Bar)": r.brassBarTPWithVat,
      "Size (mm) (Electrical Box)": r.electricalBoxSize,
      "U.P Price w/o VAT (Electrical Box)": r.electricalBoxUPWithoutVat,
      "U.P Price with VAT(Electrical Box)": r.electricalBoxUPWithVat,
      "Price With VAT Per Meter (Total)": r.totalPriceWithVat,
      "Power (HP)": r.powerHorse,
      "Net Power": r.netpower,
    }));
  } catch (err) {
    console.error("Failed to read motor data for export:", err);
    throw new Error("Failed to read motor data for export: " + err.message);
  }
  const filename = "MotorData-export.xlsx";

  // convert JSON to worksheet
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "MotorData");

  const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
}
const parseNumber = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v).trim();
  if (s === "") return null;
  if (s.endsWith("%")) {
    const num = Number(s.slice(0, -1).replace(/,/g, "").trim());
    return Number.isNaN(num) ? null : num;
  }
  s = s.replace(/[^0-9+\-.,eE\[\]\{\}\:\"\'\s]/g, "");
  if ((s.match(/,/g) || []).length > 0 && s.indexOf(".") !== -1) {
    s = s.replace(/,/g, "");
  } else {
    if (s.indexOf(".") === -1 && s.indexOf(",") !== -1) {
      if ((s.match(/,/g) || []).length > 1) s = s.replace(/,/g, "");
      else s = s.replace(",", ".");
    }
  }
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
};
const motorRowToPayload = (row, offset = 0) => {
  // indices based on the sample mapping
  const idx = (i) => i + offset;
  const get = (i) => row[idx(i)] ?? null;

  const effCurve = () => {
    // sample effCurve in sample uses indexes 26..28 when offset=0
    const a = [get(27), get(28), get(29)].map((v) => parseNumber(v));
    return a;
  };

  const payload = {
    material: String(get(1) ?? "") || "",
    model: String(get(2) ?? "") || "",
    powerKW: parseNumber(get(3)),
    speedRPM: parseNumber(get(4)),
    NoPoles: parseNumber(get(5)),
    rated: {
      currentInput: parseNumber(get(6)),
      tourqueNm: parseNumber(get(7)),
    },
    DOL: {
      current: parseNumber(get(8)),
      laln: parseNumber(get(9)),
      tourque: parseNumber(get(10)),
      MaMn: parseNumber(get(11)),
    },
    starDelta: {
      current: parseNumber(get(12)),
      laln: parseNumber(get(13)),
      tourque: parseNumber(get(14)),
      MaMn: parseNumber(get(15)),
    },
    powerFactor: parseNumber(get(16)),
    Phase: parseNumber(get(17)),
    frameSize: parseNumber(get(18)),
    shaftDia: parseNumber(get(19)),
    shaftLength: parseNumber(get(20)),
    shaftFeather: parseNumber(get(21)),
    IE: parseNumber(get(22)),
    frontBear: String(get(23) ?? "") || "",
    rearBear: String(get(24) ?? "") || "",
    noiseLvl: parseNumber(get(25)),
    weightKg: parseNumber(get(26)),
    effCurve: effCurve(),
    NoCapacitors: parseNumber(get(30)),
    NoPhases: parseNumber(get(31)),
    insClass: String(get(32) ?? "") || "",
    powerHorse: parseNumber(get(33)),
  };
  // if first column looks like a numeric id, include it so callers can update by id
  const possibleId = parseNumber(row[0]);
  if (Number.isFinite(possibleId)) payload.id = possibleId;
  // netpower if possible
  if (
    payload.powerKW != null &&
    Array.isArray(payload.effCurve) &&
    payload.effCurve[0] != null
  ) {
    payload.netpower = parseNumber(payload.powerKW * payload.effCurve[0]);
  } else {
    payload.netpower = parseNumber(get(34) ?? null);
  }

  return payload;
};
export async function updateMotorDataFromExcel(
  fileBase64,
  filename = "uploaded.xlsx"
) {
  if (!fileBase64) throw new Error("No fileBase64 provided");

  const buffer = Buffer.from(fileBase64, "base64");
  const workbook = xlsx.read(buffer, { type: "buffer" });
  // parse first sheet into array of objects (header row expected)
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // We'll first try to detect whether the sheet contains a header row.
  // Read as array-of-rows so we can decide behavior.
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Known field names for header detection / mapping
  const knownFields = new Set([
    "id",
    "model",
    "material",
    "powerkw",
    "speedrpm",
    "nopoles",
    "rated",
    "dol",
    "stardelta",
    "powerfactor",
    "phase",
    "framesize",
    "shaftdia",
    "shaftlength",
    "shaftfeather",
    "ie",
    "frontbear",
    "rearbear",
    "noiselvl",
    "weightkg",
    "effcurve",
    "nocapacitors",
    "nophases",
    "insclass",
    "powerhorse",
    "netpower",
  ]);

  // Default column->field mapping when the sheet has no header row.
  // This mirrors the expectation: row[i][0] may be id (if numeric), row[i][1] -> model, row[i][2] -> material, etc.
  const colMap = [
    "id", // column 0: optional existing DB id
    "model",
    "material",
    "powerKW",
    "speedRPM",
    "NoPoles",
    "rated",
    "DOL",
    "starDelta",
    "powerFactor",
    "Phase",
    "frameSize",
    "shaftDia",
    "shaftLength",
    "shaftFeather",
    "IE",
    "frontBear",
    "rearBear",
    "noiseLvl",
    "weightKg",
    "effCurve",
    "NoCapacitors",
    "NoPhases",
    "insClass",
    "powerHorse",
    "netpower",
  ];

  // Helper: normalize header cell text
  const normalize = (s) =>
    typeof s === "string" ? s.trim().toLowerCase() : "";

  let records = [];

  if (rows.length === 0) return [];

  const firstRow = rows[0];
  const firstRowHasHeaders = firstRow.some((cell) =>
    knownFields.has(normalize(cell))
  );

  // No header row: use motorRowToPayload to normalize positional rows.
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    // detect whether first column is an id (numeric). If so, offset fields by 1.

    const payload = motorRowToPayload(row, 0);
    records.push(payload);
  }

  // Helper: robust number parser (adapted from your sample)

  // Map a positional row into a motor payload. If offset===1, row[0] is treated as ID and fields shift right.

  // If DB available, merge into DB by model (case-insensitive where possible)
  try {
    for (const rec of records) {
      // If first column was an ID (numeric), update by id
      const idCandidate = rec.id ?? rec.ID ?? null;
      const id = Number.isFinite(Number(idCandidate))
        ? Number(idCandidate)
        : null;

      // Build update/create payload: only include allowed fields and non-empty values
      const allowed = [
        "material",
        "model",
        "powerKW",
        "speedRPM",
        "NoPoles",
        "rated",
        "DOL",
        "starDelta",
        "powerFactor",
        "Phase",
        "frameSize",
        "shaftDia",
        "shaftLength",
        "shaftFeather",
        "IE",
        "frontBear",
        "rearBear",
        "noiseLvl",
        "weightKg",
        "effCurve",
        "NoCapacitors",
        "NoPhases",
        "insClass",
        "powerHorse",
        "netpower",
      ];

      const normalizeVal = (v) => {
        // try to parse JSON-like strings for arrays/objects
        if (typeof v === "string") {
          const s = v.trim();
          if (
            (s.startsWith("[") && s.endsWith("]")) ||
            (s.startsWith("{") && s.endsWith("}"))
          ) {
            try {
              return JSON.parse(s);
            } catch (e) {
              return v;
            }
          }
        }
        return v;
      };

      const dataPayload = {};
      for (const key of allowed) {
        // support header names lowercased if present
        const candidates = [key, key.toLowerCase(), key.toUpperCase()];
        let val = null;
        for (const c of candidates) {
          if (rec[c] !== undefined) {
            val = rec[c];
            break;
          }
        }
        if (val !== null && val !== undefined && val !== "") {
          dataPayload[key] = normalizeVal(val);
        }
      }

      const prismaClient = await getPrismaClient();
      if (!prismaClient) throw new Error("Database not available");

      if (id) {
        // update by id
        const existing = await prismaClient.motorData.findUnique({ where: { id } });
        if (!existing) {
          // skip if no such id
          await prismaClient.motorData.create({ data: dataPayload });
        }
        await prismaClient.motorData.update({ where: { id }, data: dataPayload });
        continue;
      }

      // otherwise try matching by model if present
      // const modelVal = (dataPayload.model ?? rec.model ?? rec.Model ?? "") + "";
      // if (modelVal) {
      //   const existing = await prismaClient.motorData.findFirst({
      //     where: { model: { equals: modelVal, mode: "insensitive" } },
      //   });
      //   if (existing) {
      //     console.log(existing,dataPayload)
      //     await prismaClient.motorData.update({
      //       where: { id: existing.id },
      //       data: dataPayload,
      //     });
      //   } else {
      //     await prismaClient.motorData.create({ data: dataPayload });
      //   }
      // }
      else {
        // no id and no model -> create new
        await prismaClient.motorData.create({ data: dataPayload });
      }
    }

    // return the full updated set from DB
    return await readMotorFile();
  } catch (err) {
    // fallback to file-based merge if DB operations fail
    const existing = (function () {
      try {
        const raw = fs.readFileSync(MOTOR_FILE, "utf8");
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    })();

    const map = new Map();
    existing.forEach((m) => {
      const key = (m.model ?? m.Model ?? "") + "";
      map.set(key.toLowerCase(), { ...m });
    });

    json.forEach((rec) => {
      const key = (rec.model ?? rec.Model ?? "") + "";
      const k = key.toLowerCase();
      if (map.has(k)) {
        const base = map.get(k);
        // merge: overwrite only when value is not null/undefined/empty-string
        Object.keys(rec).forEach((field) => {
          const v = rec[field];
          if (v !== null && v !== undefined && v !== "") {
            base[field] = v;
          }
        });
        map.set(k, base);
      } else {
        map.set(k, { ...rec });
      }
    });

    const merged = Array.from(map.values());
    fs.writeFileSync(MOTOR_FILE, JSON.stringify(merged, null, 2), "utf8");
    return merged;
  }
}
