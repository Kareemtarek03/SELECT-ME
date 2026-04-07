import xlsx from "xlsx";

import path from "path";

import pkgPrisma from "@prisma/client";

const { PrismaClient } = pkgPrisma;

import {

  calculateMotorPrices,

  stripCalculatedFields,

  computeDerivedFields,

  CALCULATED_DB_FIELDS,

  parsePrice,

} from "./axialMotorPricing.service.js";



let prisma = null;

async function getPrismaClient() {

  if (!prisma) {

    try {

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

    id: r.id,

    Material: r.material,

    Model: r.model,

    "Power (kW)": r.powerKW,

    "Speed (RPM)": r.speedRPM,

    "No of Poles": r.noOfPoles,

    "Rated current-In (A)": r.ratedCurrentIn,

    "Rated Torque – Mn (Nm)": r.ratedTorqueMn,

    "Locked rotor Current – Ia (A) (DOL)": r.lockedRotorCurrentDOL,

    "Ia / In (DOL)": r.iaPerInDOL,

    "Locked rotor Torque – Ma (Nm) (DOL)": r.lockedRotorTorqueDOL,

    "Ma / Mn (DOL)": r.maPerMnDOL,

    "Locked rotor Current – Ia (A) (Y / ∆ Starting)":

      r.lockedRotorCurrentYD,

    "Ia / I-n (Y / ∆ Starting)": r.iaPerInYD,

    "Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)":

      r.lockedRotorTorqueYD,

    "Ma / Mn (Y / ∆ Starting)": r.maPerMnYD,

    "Power factor Cos φ": r.powerFactorCos,

    Phase: r.phase,

    "Frame Size (mm)": r.frameSize,

    "Shaft Diameter (mm)": r.shaftDiameter,

    "Shaft Length (mm)": r.shaftLength,

    "Shaft Feather Key Length (mm)": r.shaftFeatherKeyLength,

    IE: r.ie,

    "front Brearing": r.frontBearing,

    "Rear Bearing": r.rearBearing,

    "Noise Level (dB-A)": r.noiseLevel,

    "Weight (KG)": r.weight,

    "Efficiency @ 50 Hz": r.efficiency50Hz,

    "Efficiency @ 37.5 Hz": r.efficiency37_5Hz,

    "Efficiency @ 25 Hz": r.efficiency25Hz,

    "Run Capacitor 400 V (µF)": r.runCapacitor,

    "Start Capacitor 330 V (µF)": r.startCapacitor,

    "No. of Capacitors": r.NoCapacitors,

    "No. of Phases": r.NoPhases,

    "Insulation Class": r.insClass,

    "B3 Price ($) w/o VAT": r.b3PriceWithoutVat,

    "B3 Price with VAT & Factor (L.E)": r.b3PriceWithVat,

    "Other Price ($) w/o VAT": r.otherPriceWithoutVat,

    "Other Price with VAT & Factor (L.E)": r.otherPriceWithVat,

    "Current (A) with S.F (25%)(Cable)": r.cableCurrent,

    "Cable Size (mm2)(Cable)": r.cableSize,

    "Price With VAT Per Meter (Cable)": r.cablePriceWithVat,

    "No.(Cable Lugs)": r.cableLugsNo,

    "U.P Price with VAT (Cable Lugs)": r.cableLugsUPWithVat,

    "T.P Price with VAT (Cable Lugs)": r.cableLugsTPWithVat,

    "No.(Cable Heat Shrink)": r.cableHeatShrinkNo,

    "U.P Price with VAT (Cable Heat Shrink)": r.cableHeatShrinkUPWithVat,

    "T.P Price with VAT (Cable Heat Shrink)": r.cableHeatShrinkTPWithVat,

    "Meter (Flexible Connector)": r.flexibleConnectorMeter,

    "Size (mm) (Flexible Connector)": r.flexibleConnectorSize,

    "U.P Price with VAT (Flexible Connector)": r.flexibleConnectorUPWithVat,

    "T.P Price with VAT (Flexible Connector)": r.flexibleConnectorTPWithVat,

    "No. (Gland)": r.glandNo,

    "U.P Price with VAT (Gland)": r.glandUPWithVat,

    "T.P Price with VAT (Gland)": r.glandTPWithVat,

    "No. (Brass Bar)": r.brassBarNo,

    "U.P Price with VAT (Brass Bar)": r.brassBarUPWithVat,

    "T.P Price with VAT (Brass Bar)": r.brassBarTPWithVat,

    "Size (mm) (Electrical Box)": r.electricalBoxSize,

    "U.P Price with VAT(Electrical Box)": r.electricalBoxUPWithVat,

    "Price With VAT Per Meter (Total)": r.totalPriceWithVat,

    "Power (HP)": r.powerHorse,

    "Net Power": r.netpower,

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

    noOfPoles: toInt(jsonData["No of Poles"]),

    ratedCurrentIn: toFloat(jsonData["Rated current-In (A)"]),

    ratedTorqueMn: toFloat(jsonData["Rated Torque – Mn (Nm)"]),

    lockedRotorCurrentDOL: toFloat(

      jsonData["Locked rotor Current – Ia (A) (DOL)"],

    ),

    iaPerInDOL: toFloat(jsonData["Ia / In (DOL)"]),

    lockedRotorTorqueDOL: toFloat(

      jsonData["Locked rotor Torque – Ma (Nm) (DOL)"],

    ),

    maPerMnDOL: toFloat(jsonData["Ma / Mn (DOL)"]),

    lockedRotorCurrentYD: toFloat(

      jsonData["Locked rotor Current – Ia (A) (Y / ∆ Starting)"],

    ),

    iaPerInYD: toFloat(jsonData["Ia / I-n (Y / ∆ Starting)"]),

    lockedRotorTorqueYD: toFloat(

      jsonData["Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)"],

    ),

    maPerMnYD: toFloat(jsonData["Ma / Mn (Y / ∆ Starting)"]),

    powerFactorCos: toFloat(jsonData["Power factor Cos φ"]),

    phase: String(jsonData["Phase"] || ""),

    frameSize: String(jsonData["Frame Size (mm)"] || ""),

    shaftDiameter: toFloat(jsonData["Shaft Diameter (mm)"]),

    shaftLength: toFloat(jsonData["Shaft Length (mm)"]),

    shaftFeatherKeyLength: toFloat(jsonData["Shaft Feather Key Length (mm)"]),

    ie: String(jsonData["IE"] || ""),

    frontBearing: jsonData["front Brearing"],

    rearBearing: jsonData["Rear Bearing"],

    noiseLevel: toFloat(jsonData["Noise Level (dB-A)"]),

    weight: toFloat(jsonData["Weight (KG)"]),

    efficiency50Hz: toFloat(jsonData["Efficiency @ 50 Hz"]),

    efficiency37_5Hz: toFloat(jsonData["Efficiency @ 37.5 Hz"]),

    efficiency25Hz: toFloat(jsonData["Efficiency @ 25 Hz"]),

    runCapacitor: toFloat(jsonData["Run Capacitor 400 V (µF)"]),

    startCapacitor: toFloat(jsonData["Start Capacitor 330 V (µF)"]),

    NoCapacitors: toInt(jsonData["No. of Capacitors"]),

    NoPhases: toInt(jsonData["No. of Phases"]),

    insClass: jsonData["Insulation Class"],

    b3PriceWithoutVat: toFloat(jsonData["B3 Price ($) w/o VAT"]),

    b3PriceWithVat: toFloat(jsonData["B3 Price with VAT & Factor (L.E)"]),

    otherPriceWithoutVat: toFloat(jsonData["Other Price ($) w/o VAT"]),

    otherPriceWithVat: toFloat(jsonData["Other Price with VAT & Factor (L.E)"]),

    cableCurrent: toFloat(jsonData["Current (A) with S.F (25%)(Cable)"]),

    cableSize: jsonData["Cable Size (mm2)(Cable)"],

    cablePriceWithVat: toFloat(jsonData["Price With VAT Per Meter (Cable)"]),

    cableLugsNo: toInt(jsonData["No.(Cable Lugs)"]),

    cableLugsUPWithVat: toFloat(jsonData["U.P Price with VAT (Cable Lugs)"]),

    cableLugsTPWithVat: toFloat(jsonData["T.P Price with VAT (Cable Lugs)"]),

    cableHeatShrinkNo: toFloat(jsonData["No.(Cable Heat Shrink)"]),

    cableHeatShrinkUPWithVat: toFloat(

      jsonData["U.P Price with VAT (Cable Heat Shrink)"],

    ),

    cableHeatShrinkTPWithVat: toFloat(

      jsonData["T.P Price with VAT (Cable Heat Shrink)"],

    ),

    flexibleConnectorMeter: toFloat(jsonData["Meter (Flexible Connector)"]),

    flexibleConnectorSize: jsonData["Size (mm) (Flexible Connector)"],

    flexibleConnectorUPWithVat: toFloat(

      jsonData["U.P Price with VAT (Flexible Connector)"],

    ),

    flexibleConnectorTPWithVat: toFloat(

      jsonData["T.P Price with VAT (Flexible Connector)"],

    ),

    glandNo: toFloat(jsonData["No. (Gland)"]),

    glandUPWithVat: toFloat(jsonData["U.P Price with VAT (Gland)"]),

    glandTPWithVat: toFloat(jsonData["T.P Price with VAT (Gland)"]),

    brassBarNo: toFloat(jsonData["No. (Brass Bar)"]),

    brassBarUPWithVat: toFloat(jsonData["U.P Price with VAT (Brass Bar)"]),

    brassBarTPWithVat: toFloat(jsonData["T.P Price with VAT (Brass Bar)"]),

    electricalBoxSize: jsonData["Size (mm) (Electrical Box)"],

    electricalBoxUPWithVat: toFloat(

      jsonData["U.P Price with VAT(Electrical Box)"],

    ),

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

    return rows.map(mapDbRowToJsonFormat).sort((a, b) => a.id - b.id);

  } catch (err) {

    throw new Error(

      "Failed to read motor data from database: " +

        (err?.message || String(err)),

    );

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

    CALCULATED_DB_FIELDS.forEach((field) => delete dbData[field]);



    // Auto-compute derived fields (cable size, flex connector size, base prices)
    // from rated current and power kW via Excel IF-chain lookup tables

    const derived = computeDerivedFields(dbData);

    // Merge only display-derived fields into dbData (these are stored in DB)

    ['cableCurrent', 'cableSize', 'flexibleConnectorSize', 'electricalBoxSize'].forEach((key) => {

      if ((dbData[key] === undefined || dbData[key] === null) && derived[key] !== undefined) {

        dbData[key] = derived[key];

      }

    });

    // Build mergedData for price calculation using derived base prices (not stored in DB)

    const mergedData = {

      ...dbData,

      cablePriceWithoutVat: derived.cablePriceWithoutVat ?? null,

      cableLugsUPWithoutVat: derived.cableLugsUPWithoutVat ?? null,

      cableHeatShrinkUPWithoutVat: derived.cableHeatShrinkUPWithoutVat ?? null,

      flexibleConnectorUPWithoutVat: derived.flexibleConnectorUPWithoutVat ?? null,

      glandUPWithoutVat: derived.glandUPWithoutVat ?? null,

      brassBarUPWithoutVat: derived.brassBarUPWithoutVat ?? null,

      electricalBoxUPWithoutVat: derived.electricalBoxUPWithoutVat ?? null,

    };

    // Calculate the motor prices server-side

    const calculatedPrices = await calculateMotorPrices(mergedData);



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

    CALCULATED_DB_FIELDS.forEach((field) => delete updateData[field]);



    // Get the current motor data to merge with updates for price calculation

    const prismaClient = await getPrismaClient();

    if (!prismaClient) throw new Error("Database not available");

    const currentMotor = await prismaClient.motorData.findUnique({

      where: { id: numId },

    });

    if (!currentMotor) {

      const notFound = new Error("Motor not found");

      notFound.code = "NOT_FOUND";

      throw notFound;

    }



    // Auto-compute derived fields (cable size, flex connector size, base prices)
    // from rated current and power kW via Excel IF-chain lookup tables

    const derived = computeDerivedFields({

      ratedCurrentIn: updateData.ratedCurrentIn ?? currentMotor.ratedCurrentIn,

      powerKW: updateData.powerKW ?? currentMotor.powerKW,

    });

    // Merge derived display fields (cableCurrent, cableSize, flexibleConnectorSize, electricalBoxSize)
    // into updateData — only fill in fields not already explicitly provided

    ['cableCurrent', 'cableSize', 'flexibleConnectorSize', 'electricalBoxSize'].forEach((key) => {

      if (updateData[key] === undefined && derived[key] !== undefined) {

        updateData[key] = derived[key];

      }

    });



    // Merge current data with updates for price calculation
    // Base prices w/o VAT come from derived lookup tables (not stored in DB)

    const mergedData = {

      b3PriceWithoutVat:

        updateData.b3PriceWithoutVat ?? currentMotor.b3PriceWithoutVat,

      otherPriceWithoutVat:

        updateData.otherPriceWithoutVat ?? currentMotor.otherPriceWithoutVat,

      cablePriceWithoutVat: derived.cablePriceWithoutVat ?? null,

      cableLugsNo: updateData.cableLugsNo ?? currentMotor.cableLugsNo,

      cableLugsUPWithoutVat: derived.cableLugsUPWithoutVat ?? null,

      cableHeatShrinkNo:

        updateData.cableHeatShrinkNo ?? currentMotor.cableHeatShrinkNo,

      cableHeatShrinkUPWithoutVat: derived.cableHeatShrinkUPWithoutVat ?? null,

      flexibleConnectorMeter:

        updateData.flexibleConnectorMeter ??

        currentMotor.flexibleConnectorMeter,

      flexibleConnectorUPWithoutVat: derived.flexibleConnectorUPWithoutVat ?? null,

      glandNo: updateData.glandNo ?? currentMotor.glandNo,

      glandUPWithoutVat: derived.glandUPWithoutVat ?? null,

      brassBarNo: updateData.brassBarNo ?? currentMotor.brassBarNo,

      brassBarUPWithoutVat: derived.brassBarUPWithoutVat ?? null,

      electricalBoxUPWithoutVat: derived.electricalBoxUPWithoutVat ?? null,

    };



    // Calculate all motor prices server-side

    const calculatedPrices = await calculateMotorPrices(mergedData);



    // Add all calculated prices to update data

    updateData.b3PriceWithVat = calculatedPrices.b3PriceWithVat;

    updateData.otherPriceWithVat = calculatedPrices.otherPriceWithVat;

    updateData.cablePriceWithVat = calculatedPrices.cablePriceWithVat;

    updateData.cableLugsUPWithVat = calculatedPrices.cableLugsUPWithVat;

    updateData.cableLugsTPWithVat = calculatedPrices.cableLugsTPWithVat;

    updateData.cableHeatShrinkUPWithVat =

      calculatedPrices.cableHeatShrinkUPWithVat;

    updateData.cableHeatShrinkTPWithVat =

      calculatedPrices.cableHeatShrinkTPWithVat;

    updateData.flexibleConnectorUPWithVat =

      calculatedPrices.flexibleConnectorUPWithVat;

    updateData.flexibleConnectorTPWithVat =

      calculatedPrices.flexibleConnectorTPWithVat;

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

    if (err.code === "P2025") {

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

    const deleted = await prismaClient.motorData.delete({

      where: { id: numId },

    });

    return { id: deleted.id };

  } catch (err) {

    if (err?.code === "P2025") {

      const notFound = new Error("Motor not found");

      notFound.code = "NOT_FOUND";

      throw notFound;

    }

    throw new Error("Failed to delete motor: " + (err?.message || String(err)));

  }

}



export async function exportMotorData(res) {

  let data = [];

  try {

    const raw = await readMotorFile();

    // readMotorFile() returns data already in JSON format with exact column names

    // We just need to reorder columns for export with Id first

    data = raw.map((r) => ({

      Id: r.id,

      Material: r["Material"],

      Model: r["Model"],

      "Power (kW)": r["Power (kW)"],

      "Speed (RPM)": r["Speed (RPM)"],

      "No of Poles": r["No of Poles"],

      "Rated current-In (A)": r["Rated current-In (A)"],

      "Rated Torque – Mn (Nm)": r["Rated Torque – Mn (Nm)"],

      "Locked rotor Current – Ia (A) (DOL)":

        r["Locked rotor Current – Ia (A) (DOL)"],

      "Ia / In (DOL)": r["Ia / In (DOL)"],

      "Locked rotor Torque – Ma (Nm) (DOL)":

        r["Locked rotor Torque – Ma (Nm) (DOL)"],

      "Ma / Mn (DOL)": r["Ma / Mn (DOL)"],

      "Locked rotor Current – Ia (A) (Y / ∆ Starting)":

        r["Locked rotor Current – Ia (A) (Y / ∆ Starting)"],

      "Ia / I-n (Y / ∆ Starting)": r["Ia / I-n (Y / ∆ Starting)"],

      "Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)":

        r["Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)"],

      "Ma / Mn (Y / ∆ Starting)": r["Ma / Mn (Y / ∆ Starting)"],

      "Power factor Cos φ": r["Power factor Cos φ"],

      Phase: r["Phase"],

      "Frame Size (mm)": r["Frame Size (mm)"],

      "Shaft Diameter (mm)": r["Shaft Diameter (mm)"],

      "Shaft Length (mm)": r["Shaft Length (mm)"],

      "Shaft Feather Key Length (mm)": r["Shaft Feather Key Length (mm)"],

      IE: r["IE"],

      "front Brearing": r["front Brearing"],

      "Rear Bearing": r["Rear Bearing"],

      "Noise Level (dB-A)": r["Noise Level (dB-A)"],

      "Weight (KG)": r["Weight (KG)"],

      "Efficiency @ 50 Hz": r["Efficiency @ 50 Hz"],

      "Efficiency @ 37.5 Hz": r["Efficiency @ 37.5 Hz"],

      "Efficiency @ 25 Hz": r["Efficiency @ 25 Hz"],

      "Run Capacitor 400 V (µF)": r["Run Capacitor 400 V (µF)"],

      "Start Capacitor 330 V (µF)": r["Start Capacitor 330 V (µF)"],

      "No. of Capacitors": r["No. of Capacitors"],

      "No. of Phases": r["No. of Phases"],

      "Insulation Class": r["Insulation Class"],

      "B3 Price ($) w/o VAT": r["B3 Price ($) w/o VAT"],

      "B3 Price with VAT & Factor (L.E)": r["B3 Price with VAT & Factor (L.E)"],

      "Other Price ($) w/o VAT": r["Other Price ($) w/o VAT"],

      "Other Price with VAT & Factor (L.E)":

        r["Other Price with VAT & Factor (L.E)"],

      "Current (A) with S.F (25%)(Cable)":

        r["Current (A) with S.F (25%)(Cable)"],

      "Cable Size (mm2)(Cable)": r["Cable Size (mm2)(Cable)"],

      "Price With VAT Per Meter (Cable)": r["Price With VAT Per Meter (Cable)"],

      "No.(Cable Lugs)": r["No.(Cable Lugs)"],

      "U.P Price with VAT (Cable Lugs)": r["U.P Price with VAT (Cable Lugs)"],

      "T.P Price with VAT (Cable Lugs)": r["T.P Price with VAT (Cable Lugs)"],

      "No.(Cable Heat Shrink)": r["No.(Cable Heat Shrink)"],

      "U.P Price with VAT (Cable Heat Shrink)":

        r["U.P Price with VAT (Cable Heat Shrink)"],

      "T.P Price with VAT (Cable Heat Shrink)":

        r["T.P Price with VAT (Cable Heat Shrink)"],

      "Meter (Flexible Connector)": r["Meter (Flexible Connector)"],

      "Size (mm) (Flexible Connector)": r["Size (mm) (Flexible Connector)"],

      "U.P Price with VAT (Flexible Connector)":

        r["U.P Price with VAT (Flexible Connector)"],

      "T.P Price with VAT (Flexible Connector)":

        r["T.P Price with VAT (Flexible Connector)"],

      "No. (Gland)": r["No. (Gland)"],

      "U.P Price with VAT (Gland)": r["U.P Price with VAT (Gland)"],

      "T.P Price with VAT (Gland)": r["T.P Price with VAT (Gland)"],

      "No. (Brass Bar)": r["No. (Brass Bar)"],

      "U.P Price with VAT (Brass Bar)": r["U.P Price with VAT (Brass Bar)"],

      "T.P Price with VAT (Brass Bar)": r["T.P Price with VAT (Brass Bar)"],

      "Size (mm) (Electrical Box)": r["Size (mm) (Electrical Box)"],

      "U.P Price with VAT(Electrical Box)":

        r["U.P Price with VAT(Electrical Box)"],

      "Price With VAT Per Meter (Total)": r["Price With VAT Per Meter (Total)"],

      "Power (HP)": r["Power (HP)"],

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

    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  );

  res.send(buffer);

}



export async function updateMotorDataFromExcel(

  fileBase64,

  filename = "uploaded.xlsx",

) {

  if (!fileBase64) throw new Error("No fileBase64 provided");



  const buffer = Buffer.from(fileBase64, "base64");

  const workbook = xlsx.read(buffer, { type: "buffer" });

  const sheetName = workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];

  

  // Read as array of objects with headers

  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });



  if (rows.length === 0) return [];



  const prismaClient = await getPrismaClient();

  if (!prismaClient) throw new Error("Database not available");



  try {

    for (const row of rows) {

      // Map Excel column names (JSON format) to DB format

      const dbData = mapJsonToDbFormat(row);

      

      // Strip calculated fields - they will be recalculated

      CALCULATED_DB_FIELDS.forEach(field => delete dbData[field]);

      

      // Remove undefined values

      Object.keys(dbData).forEach(key => {

        if (dbData[key] === undefined) {

          delete dbData[key];

        }

      });



      // Check if row has an ID for update

      const idCandidate = row["Id"] ?? row["id"] ?? row["ID"] ?? null;

      const id = Number.isFinite(Number(idCandidate)) ? Number(idCandidate) : null;



      // Strip removed w/o VAT fields that may come from uploaded Excel

      const REMOVED_FIELDS = [
        'cablePriceWithoutVat', 'cableLugsUPWithoutVat', 'cableHeatShrinkUPWithoutVat',
        'flexibleConnectorUPWithoutVat', 'glandUPWithoutVat', 'brassBarUPWithoutVat',
        'electricalBoxUPWithoutVat',
      ];

      REMOVED_FIELDS.forEach((f) => delete dbData[f]);

      if (id) {

        // Check if record exists

        const existing = await prismaClient.motorData.findUnique({ where: { id } });

        if (existing) {

          // Compute derived base prices on-the-fly from merged motor data

          const baseData = { ...existing, ...dbData };

          const derived = computeDerivedFields(baseData);

          const mergedData = { ...baseData, ...derived };

          const calculatedPrices = await calculateMotorPrices(mergedData);

          // Merge derived display fields into dbData

          ['cableCurrent', 'cableSize', 'flexibleConnectorSize', 'electricalBoxSize'].forEach((key) => {

            if (dbData[key] === undefined && derived[key] !== undefined) dbData[key] = derived[key];

          });

          const updateData = {

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

          

          await prismaClient.motorData.update({

            where: { id },

            data: updateData,

          });

        } else {

          // ID provided but doesn't exist - create new with calculated prices

          const derived = computeDerivedFields(dbData);

          ['cableCurrent', 'cableSize', 'flexibleConnectorSize', 'electricalBoxSize'].forEach((key) => {

            if ((dbData[key] === undefined || dbData[key] === null) && derived[key] !== undefined) dbData[key] = derived[key];

          });

          const mergedData = { ...dbData, ...derived };

          const calculatedPrices = await calculateMotorPrices(mergedData);

          const createData = {

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

          await prismaClient.motorData.create({ data: createData });

        }

      } else {

        // No ID - create new record with calculated prices

        const derived = computeDerivedFields(dbData);

        ['cableCurrent', 'cableSize', 'flexibleConnectorSize', 'electricalBoxSize'].forEach((key) => {

          if ((dbData[key] === undefined || dbData[key] === null) && derived[key] !== undefined) dbData[key] = derived[key];

        });

        const mergedData = { ...dbData, ...derived };

        const calculatedPrices = await calculateMotorPrices(mergedData);

        const createData = {

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

        await prismaClient.motorData.create({ data: createData });

      }

    }



    // Return the full updated set from DB

    return await readMotorFile();

  } catch (err) {

    console.error("Import error:", err);

    throw new Error(

      "Failed to import motor data: " + (err?.message || String(err)),

    );

  }

}

