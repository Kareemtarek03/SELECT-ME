import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let prisma = null;

async function getPrismaClient() {
  if (!prisma) {
    let dbUrl = process.env.DATABASE_URL;
    console.log("Initializing PrismaClient in DatabaseInitService...");
    console.log("Current DATABASE_URL:", dbUrl);

    // In Electron production, DATABASE_URL is already set by electron-main to userDataPath
    // Only resolve relative paths when NOT in Electron production (no APP_PATH/RESOURCES_PATH)
    const isElectronProduction =
      process.env.APP_PATH || process.env.RESOURCES_PATH;
    // if (!isElectronProduction && dbUrl && dbUrl.startsWith("file:./")) {
    //   const relativePath = dbUrl.replace(/^file:\.?\//, "");
    //   const projectRoot = path.join(__dirname, "..", "..");
    //   const absolutePath = path.join(projectRoot, relativePath);
    //   dbUrl = `file:${absolutePath.replace(/\\/g, "/")}`;
    //   process.env.DATABASE_URL = dbUrl;
    //   console.log("Resolved DATABASE_URL:", dbUrl);
    // }

    prisma = new PrismaClient();
    console.log("PrismaClient initialized successfully");
  }
  return prisma;
}

// Helper to parse numbers from strings with commas
const parseFloat_ = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).replace(/,/g, "").trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? null : parsed;
};

const parseInt_ = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).replace(/,/g, "").trim();
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? null : parsed;
};

// Determine the base path for data files
function getBaseDataPath() {
  // If process.env.APP_PATH or process.env.RESOURCES_PATH is set (by Electron), use it
  const electronAppPath = process.env.APP_PATH || process.env.RESOURCES_PATH;
  if (electronAppPath) {
    return electronAppPath;
  }

  // Fallback: search up for package.json to find project root (development)
  let currentDir = __dirname;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return process.cwd();
}

const BASE_PATH = getBaseDataPath();

async function seedFanData() {
  const client = await getPrismaClient();
  console.log("🌬️ Seeding FanData...");
  const fansPath = path.join(
    BASE_PATH,
    "server/Newmodules/axial/AxialFanData/axialFan.json",
  );
  if (!fs.existsSync(fansPath)) {
    console.warn(`⚠️ Seed file not found: ${fansPath}`);
    return;
  }

  const fans = JSON.parse(fs.readFileSync(fansPath, "utf-8"));
  const fanCount = await client.fanData.count();
  if (fanCount > 0) {
    console.log(`   FanData already has ${fanCount} records, skipping.`);
    return;
  }

  for (const fanJson of fans) {
    await client.fanData.create({
      data: {
        No: fanJson.No,
        Model: fanJson.Model,
        AFS: fanJson["AF-S"],
        AFL: fanJson["AF-L"],
        WF: fanJson.WF,
        ARTF: fanJson.ARTF,
        SF: fanJson.SF,
        ABSFC: fanJson["ABSF-C"],
        ABSFS: fanJson["ABSF-S"],
        SABF: fanJson.SABF,
        SARTF: fanJson.SARTF,
        AJF: fanJson.AJF,
        bladesSymbol: fanJson.Blades.symbol,
        bladesMaterial: fanJson.Blades.material,
        noBlades: fanJson.Blades.noBlades,
        bladesAngle: fanJson.Blades.angle,
        hubType: fanJson.hubType,
        impellerConf: fanJson.Impeller.conf,
        impellerInnerDia: fanJson.Impeller.innerDia,
        desigDensity: fanJson.desigDensity,
        RPM: fanJson.RPM,
        airFlow: JSON.stringify(fanJson.airFlow),
        totPressure: JSON.stringify(fanJson.totPressure),
        velPressure: JSON.stringify(fanJson.velPressure),
        staticPressure: JSON.stringify(fanJson.staticPressure),
        fanInputPow: JSON.stringify(fanJson.fanInputPow),
      },
    });
  }
  console.log(`✅ Seeded ${fans.length} axial fan records!`);
}

async function seedMotorData() {
  const client = await getPrismaClient();
  console.log("⚙️ Seeding Axial MotorData...");
  const motorsPath = path.join(
    BASE_PATH,
    "server/Newmodules/axial/AxialPricing/MotorData.json",
  );
  if (!fs.existsSync(motorsPath)) {
    console.warn(`⚠️ Seed file not found: ${motorsPath}`);
    return;
  }

  const motors = JSON.parse(fs.readFileSync(motorsPath, "utf-8"));
  const motorCount = await client.motorData.count();
  if (motorCount > 0) {
    console.log(`   MotorData already has ${motorCount} records, skipping.`);
    return;
  }

  for (const m of motors) {
    await client.motorData.create({
      data: {
        material: m["Material"],
        model: m["Model"],
        powerKW: parseFloat_(m["Power (kW)"]),
        speedRPM: parseFloat_(m["Speed (RPM)"]),
        noOfPoles: parseInt_(m["No of Poles"]),

        ratedCurrentIn: parseFloat_(m["Rated current-In (A)"]),
        ratedTorqueMn: parseFloat_(m["Rated Torque – Mn (Nm)"]),

        lockedRotorCurrentDOL: parseFloat_(
          m["Locked rotor Current – Ia (A) (DOL)"],
        ),
        iaPerInDOL: parseFloat_(m["Ia / In (DOL)"]),
        lockedRotorTorqueDOL: parseFloat_(
          m["Locked rotor Torque – Ma (Nm) (DOL)"],
        ),
        maPerMnDOL: parseFloat_(m["Ma / Mn (DOL)"]),

        lockedRotorCurrentYD: parseFloat_(
          m["Locked rotor Current – Ia (A) (Y / ∆ Starting)"],
        ),
        iaPerInYD: parseFloat_(m["Ia / I-n (Y / ∆ Starting)"]),
        lockedRotorTorqueYD: parseFloat_(
          m["Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)"],
        ),
        maPerMnYD: parseFloat_(m["Ma / Mn (Y / ∆ Starting)"]),

        powerFactorCos: parseFloat_(m["Power factor Cos φ"]),
        phase: String(parseInt_(m["Phase"]) || ""),
        frameSize: String(parseInt_(m["Frame Size (mm)"]) || ""),
        shaftDiameter: parseFloat_(m["Shaft Diameter (mm)"]),
        shaftLength: parseFloat_(m["Shaft Length (mm)"]),
        shaftFeatherKeyLength: parseFloat_(m["Shaft Feather Key Length (mm)"]),
        ie: String(parseInt_(m["IE"]) || ""),
        frontBearing: m["front Brearing"],
        rearBearing: m["Rear Bearing"],
        noiseLevel: parseFloat_(m["Noise Level (dB-A)"]),
        weight: parseFloat_(m["Weight (KG)"]),

        efficiency50Hz: parseFloat_(m["Efficiency @ 50 Hz"]),
        efficiency37_5Hz: parseFloat_(m["Efficiency @ 37.5 Hz"]),
        efficiency25Hz: parseFloat_(m["Efficiency @ 25 Hz"]),

        runCapacitor: parseFloat_(m["Run Capacitor 400 V (µF)"]),
        startCapacitor: parseFloat_(m["Start Capacitor 330 V (µF) "]),
        NoCapacitors: parseInt_(m["No. of Capacitors"]),
        NoPhases: parseInt_(m["No. of Phases"]),
        insClass: m["Insulation Class"],

        b3PriceWithoutVat: parseFloat_(m[" B3 Price ($) w/o VAT "]),
        b3PriceWithVat: parseFloat_(m["B3 Price with VAT & Factor (L.E)"]),
        otherPriceWithoutVat: parseFloat_(m["Other Price ($) w/o VAT "]),
        otherPriceWithVat: parseFloat_(
          m["Other Price with VAT & Factor (L.E)"],
        ),

        cableCurrent: parseFloat_(m["Current (A) with S.F (25%)(Cable)"]),
        cableSize: m["Cable Size (mm2)(Cable) "],
        cablePriceWithVat: parseFloat_(m["Price With VAT Per Meter (Cable)"]),

        cableLugsNo: parseInt_(m["No.(Cable Lugs )"]),
        cableLugsUPWithVat: parseFloat_(m["U.P Price with VAT (Cable Lugs )"]),
        cableLugsTPWithVat: parseFloat_(m["T.P Price with VAT (Cable Lugs )"]),

        cableHeatShrinkNo: parseFloat_(m["No.(Cable Heat Shrink)"]),
        cableHeatShrinkUPWithVat: parseFloat_(
          m["U.P Price with VAT (Cable Heat Shrink)"],
        ),
        cableHeatShrinkTPWithVat: parseFloat_(
          m["T.P Price with VAT (Cable Heat Shrink)"],
        ),

        flexibleConnectorMeter: parseFloat_(m["Meter (Flexible Connector)"]),
        flexibleConnectorSize: m["Size (mm) (Flexible Connector) "],
        flexibleConnectorUPWithVat: parseFloat_(
          m["U.P Price with VAT (Flexible Connector)"],
        ),
        flexibleConnectorTPWithVat: parseFloat_(
          m["T.P Price with VAT (Flexible Connector)"],
        ),

        glandNo: parseFloat_(m["No. (Gland)"]),
        glandUPWithVat: parseFloat_(m["U.P Price with VAT (Gland)"]),
        glandTPWithVat: parseFloat_(m["T.P Price with VAT (Gland)"]),

        brassBarNo: parseFloat_(m["No. (Brass Bar)"]),
        brassBarUPWithVat: parseFloat_(m["U.P Price with VAT (Brass Bar)"]),
        brassBarTPWithVat: parseFloat_(m["T.P Price with VAT (Brass Bar)"]),

        electricalBoxSize: m["Size (mm) (Electrical Box)"],
        electricalBoxUPWithVat: parseFloat_(
          m["U.P Price with VAT(Electrical Box)"],
        ),

        totalPriceWithVat: parseFloat_(m["Price With VAT Per Meter (Total)"]),
        powerHorse: parseFloat_(m["Power (HP)"]),
        // Calculate netpower = powerKW * efficiency50Hz (critical for motor matching)
        netpower: (() => {
          const pKW = parseFloat_(m["Power (kW)"]);
          const eff = parseFloat_(m["Efficiency @ 50 Hz"]);
          if (pKW && eff) return pKW * eff;
          return null;
        })(),
      },
    });
  }
  console.log(`✅ Seeded ${motors.length} axial motor records!`);
}

async function seedPricingItems() {
  const client = await getPrismaClient();
  console.log("💰 Seeding PricingItems...");
  const pricingPath = path.join(
    BASE_PATH,
    "server/Newmodules/axial/AxialPricing/PriceList.json",
  );
  if (!fs.existsSync(pricingPath)) {
    console.warn(`⚠️ Seed file not found: ${pricingPath}`);
    return;
  }

  const priceList = JSON.parse(fs.readFileSync(pricingPath, "utf-8"));
  const pricingCount = await client.pricingItem.count();
  if (pricingCount > 0) {
    console.log(
      `   PricingItems already has ${pricingCount} records, skipping.`,
    );
    return;
  }

  // Client/admin expects category name "axial_pricing" for GET /api/pricing/categories/name/axial_pricing
  const category = await client.pricingCategory.create({
    data: {
      name: "axial_pricing",
      displayName: "Axial Pricing",
      description: "Pricing items from PriceList.json for axial fans",
    },
  });

  for (const item of priceList) {
    if (!item.Description) continue;
    await client.pricingItem.create({
      data: {
        categoryId: category.id,
        sr: parseInt_(item["Sr."]) || 0,
        description: item.Description,
        unit: item.Unit || "Pc",
        updatedDate: item["Updated Date"],
        priceWithoutVat: parseFloat_(item[" Price w/o VAT "]),
        priceWithVat: parseFloat_(item[" Price with VAT "]),
      },
    });
  }
  console.log(`✅ Seeded ${priceList.length} pricing items!`);
}

async function seedAccessoryPricing() {
  const client = await getPrismaClient();
  console.log("🛠️ Seeding AccessoryPricing...");
  const accessoryPath = path.join(
    BASE_PATH,
    "server/Newmodules/axial/AxialPricing/Accessory.json",
  );
  if (!fs.existsSync(accessoryPath)) {
    console.warn(`⚠️ Seed file not found: ${accessoryPath}`);
    return;
  }

  const accessories = JSON.parse(fs.readFileSync(accessoryPath, "utf-8"));
  const accCount = await client.accessoryPricing.count();
  if (accCount > 0) {
    console.log(
      `   AccessoryPricing already has ${accCount} records, skipping.`,
    );
    return;
  }

  for (const acc of accessories) {
    await client.accessoryPricing.create({
      data: {
        sr: parseInt_(acc["Sr."]) || 0,
        fanModel: acc["Fan Model"],
        fanSizeMm: parseInt_(acc["Fan Size (mm)"]) || 0,
        vinylStickersLe: parseFloat_(acc["Vinyl stickers (L.E)"]),
        namePlateLe: parseFloat_(acc["Name Plate (L.E)"]),
        packingLe: parseFloat_(acc["Packing (L.E)"]),
        labourCostLe: parseFloat_(acc["Labour Cost (L.E)"]),
        internalTransportationLe: parseFloat_(
          acc["Internal Transportation (L.E)"],
        ),
        boltsAndNutsKg: parseFloat_(acc["Bolts & Nuts (kg)"]),
        priceWithVatLe: parseFloat_(acc["Price With VAT (L.E)"]),
      },
    });
  }
  console.log(`✅ Seeded ${accessories.length} accessory pricing records!`);
}

async function seedAxialCasingPricing() {
  const client = await getPrismaClient();
  console.log("📦 Seeding AxialCasingPricing...");
  const casingPath = path.join(
    BASE_PATH,
    "server/Newmodules/axial/AxialPricing/AxialCasing/casingSeedConfig.json",
  );
  if (!fs.existsSync(casingPath)) {
    console.warn(`⚠️ Seed file not found: ${casingPath}`);
    return;
  }

  const casingConfig = JSON.parse(fs.readFileSync(casingPath, "utf-8"));
  const axialCasingCount = await client.axialCasingPricing.count();
  if (axialCasingCount > 0) {
    console.log(
      `   AxialCasingPricing already has ${axialCasingCount} records, skipping.`,
    );
    return;
  }

  for (const modelGroup of casingConfig.models) {
    for (const size of modelGroup.sizes) {
      const rng = (min, max) => Math.random() * (max - min) + min;
      await client.axialCasingPricing.create({
        data: {
          model: modelGroup.model,
          sizeMm: size,
          casingWeightKgWithoutScrap: rng(
            modelGroup.ranges.weightKg.min,
            modelGroup.ranges.weightKg.max,
          ),
          scrapPercentage: rng(
            modelGroup.ranges.scrapPct.min,
            modelGroup.ranges.scrapPct.max,
          ),
          casingCircumferenceMeter: rng(
            modelGroup.ranges.circumference.min,
            modelGroup.ranges.circumference.max,
          ),
          laserTimeMinutes: rng(
            modelGroup.ranges.laserTime.min,
            modelGroup.ranges.laserTime.max,
          ),
          bendingLine: rng(
            modelGroup.ranges.bendingLine.min,
            modelGroup.ranges.bendingLine.max,
          ),
          rolling: rng(
            modelGroup.ranges.rolling.min,
            modelGroup.ranges.rolling.max,
          ),
          paintingDiameter: rng(
            modelGroup.ranges.paintingDiameter.min,
            modelGroup.ranges.paintingDiameter.max,
          ),
          profitPercentage: rng(
            modelGroup.ranges.profitPct.min,
            modelGroup.ranges.profitPct.max,
          ),
        },
      });
    }
  }
  console.log("✅ Seeded axial casing pricing records!");
}

async function seedAxialImpellerPricing() {
  const client = await getPrismaClient();
  console.log("🔄 Seeding Axial Impeller Pricing (Blades, Hubs, Frames)...");
  const xlsmPath = path.join(
    BASE_PATH,
    "server/Newmodules/axial/AxialPricing/AxialImpeller/Axial Software Selection .xlsm",
  );
  if (!fs.existsSync(xlsmPath)) {
    console.warn(`⚠️ Axial Impeller seed file not found: ${xlsmPath}`);
    return;
  }

  const wb = XLSX.readFile(xlsmPath, { bookVBA: false, sheetRows: 50 });
  const sheetName = "Axial Impeller";
  if (!wb.SheetNames.includes(sheetName)) {
    console.warn(
      `⚠️ Sheet "${sheetName}" not found in Excel. Available: ${wb.SheetNames.join(", ")}`,
    );
    return;
  }

  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  const existingBladeCount = await client.axialImpellerBlade.count();
  if (existingBladeCount > 0) {
    console.log(
      `   Axial Impeller already seeded (${existingBladeCount} blades), skipping.`,
    );
    return;
  }

  const toNum = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    const n = parseFloat(String(v).replace(/,/g, "").trim());
    return isNaN(n) ? 0 : n;
  };
  const toStr = (v) => (v != null && v !== "" ? String(v).trim() : "");

  // Clear existing
  await client.axialImpellerBlade.deleteMany({});
  await client.axialImpellerHub.deleteMany({});
  await client.axialImpellerFrame.deleteMany({});

  // 1. Blades: rows 3-7 (0-indexed, corresponds to Excel rows 4-8)
  // Cols: A=Sr, B=Symbol, C=Material, D=Blade Type, E=Length(mm), F=Blade Weight(kg), G-K=costs
  // Blade Factor values extracted from Excel "Total Price with VAT" formula:
  // AM=150, AV=150, AG=150, PV=0 (not present), PF=5
  const bladeFactorMap = {
    AM: 150,
    AV: 150,
    AG: 150,
    PV: 0,
    PF: 5,
  };
  let bladeCount = 0;
  for (let r = 3; r <= 7 && r < data.length; r++) {
    const row = data[r];
    if (!row || !toStr(row[1])) continue; // skip empty symbol
    const symbol = toStr(row[1]);
    await client.axialImpellerBlade.create({
      data: {
        symbol: symbol,
        material: toStr(row[2]) || "Aluminum",
        bladeType: toStr(row[3]) || "Variable",
        lengthMm: toNum(row[4]),
        bladeWeightKg: toNum(row[5]),
        moldCostWithVat: toNum(row[6]),
        machiningCostWithVat: toNum(row[7]),
        transportationCost: toNum(row[8]),
        packingCost: toNum(row[9]),
        steelBallsCost: toNum(row[10]),
        bladeFactor: bladeFactorMap[symbol] ?? 0,
      },
    });
    bladeCount++;
  }

  // 2. Hubs: rows 11-16 (0-indexed, corresponds to Excel rows 12-17)
  // Cols: A=Sr, B=Symbol, C=Material, D=Hub Type, E=Size(mm), F=Hub Weight(kg), G-J=costs
  let hubCount = 0;
  for (let r = 11; r <= 16 && r < data.length; r++) {
    const row = data[r];
    if (!row || (row[1] === "" && row[2] === "")) continue;
    await client.axialImpellerHub.create({
      data: {
        symbol: toStr(row[1]) || String(row[1]),
        material: toStr(row[2]) || "Aluminum",
        hubType: toStr(row[3]) || "Variable",
        sizeMm: toNum(row[4]),
        hubWeightKg: toNum(row[5]),
        moldCostWithVat: toNum(row[6]),
        machiningCostWithVat: toNum(row[7]),
        transportationCost: toNum(row[8]),
        packingCost: toNum(row[9]),
      },
    });
    hubCount++;
  }

  // 3. Frames (Axial Aluminum sleeve): rows 20-32 (0-indexed, corresponds to Excel rows 21-33)
  // Cols: A=Sr, B=empty, C=Material, D=Frame Size(mm), E=Size(mm), F=Weight(kg), G-J=costs
  let frameCount = 0;
  for (let r = 20; r <= 32 && r < data.length; r++) {
    const row = data[r];
    if (!row || !toStr(row[2])) continue; // skip empty material
    await client.axialImpellerFrame.create({
      data: {
        material: toStr(row[2]),
        frameSizeMm: toNum(row[3]),
        sizeMm: toNum(row[4]),
        weightKg: toNum(row[5]),
        moldCostWithVat: toNum(row[6]),
        machiningCostWithVat: toNum(row[7]),
        transportationCost: toNum(row[8]),
        packingCost: toNum(row[9]),
      },
    });
    frameCount++;
  }

  console.log(
    `✅ Seeded Axial Impeller: ${bladeCount} blades, ${hubCount} hubs, ${frameCount} frames`,
  );
}

async function seedCentrifugalCasingPricing() {
  const client = await getPrismaClient();
  console.log("🔄 Seeding Centrifugal Casing Pricing...");
  const xlsmPath = path.join(
    BASE_PATH,
    "scripts/Cent. Software Selection -(Costing).xlsm",
  );
  if (!fs.existsSync(xlsmPath)) {
    console.warn(`⚠️ Centrifugal Casing seed file not found: ${xlsmPath}`);
    return;
  }

  const casingCount = await client.centrifugalCasingPricing.count();
  if (casingCount > 0) {
    console.log(
      `   CentrifugalCasingPricing already has ${casingCount} records, skipping.`,
    );
    return;
  }

  const wb = XLSX.readFile(xlsmPath, { bookVBA: false });
  const sheetName = "Centrifugal Casing";
  if (!wb.SheetNames.includes(sheetName)) {
    console.warn(
      `⚠️ Sheet "${sheetName}" not found. Available: ${wb.SheetNames.join(", ")}`,
    );
    return;
  }

  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
  });
  const toNum = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = parseFloat(String(v).replace(/,/g, "").trim());
    return isNaN(n) ? null : n;
  };
  const toStr = (v) => (v != null && v !== "" ? String(v).trim() : null);

  let count = 0;
  for (let r = 2; r < data.length; r++) {
    const row = data[r];
    if (!row || !toStr(row[2])) continue; // skip empty model
    const type = toStr(row[1]) || "SISW Centrifugal Fan - Belt";
    const model = toStr(row[2]);
    const sizeMm = toNum(row[3]);
    const modelAndSize = toStr(row[4]) || `${model}-${sizeMm}`;
    if (!modelAndSize) continue;

    const casing = await client.centrifugalCasingPricing.create({
      data: {
        type,
        model,
        sizeMm: sizeMm ?? 0,
        modelAndSize,
      },
    });

    // Volute - one row: Volute 2mm (5-8) + Volute 1mm (9-17)
    await client.centrifugalCasingVolute.create({
      data: {
        casingId: casing.id,
        volute2mmWeightKgWithoutScrap: toNum(row[5]),
        volute2mmScrapPct: toNum(row[6]),
        volute2mmWeightKgWithScrap: toNum(row[7]),
        volute2mmSheetMetalDimensionsMm: toStr(row[8]),
        volute1mmWeightKgWithoutScrap: toNum(row[9]),
        volute1mmScrapPct: toNum(row[10]),
        volute1mmWeightKgWithScrap: toNum(row[11]),
        volute1mmSheetMetalDimensionsMm: toStr(row[12]),
        volute1mmLaserTimeMin: toNum(row[13]),
        volute1mmRolling: toNum(row[14]),
        volute1mmSheetMetalOverlapping: toNum(row[15]),
      },
    });

    // Frame - one row: Angle Bar (21-24) + Support (25-33)
    await client.centrifugalCasingFrame.create({
      data: {
        casingId: casing.id,
        angleBarWeightKgWithoutScrap: toNum(row[21]),
        angleBarScrapPct: toNum(row[22]),
        angleBarWeightKgWithScrap: toNum(row[23]),
        angleBarDimensionsMm: toStr(row[24]),
        supportWeightKgWithoutScrap: toNum(row[25]),
        supportScrapPct: toNum(row[26]),
        supportWeightKgWithScrap: toNum(row[27]),
        supportSheetMetalDimensionsMm: toStr(row[28]),
        supportLaserTimeMin: toNum(row[29]),
        supportCasingCircumferenceM: toNum(row[30]),
        supportPaintingLe: toNum(row[31]),
      },
    });

    // Impeller - one row: Blades (37-40) + Plate (41-50)
    await client.centrifugalCasingImpeller.create({
      data: {
        casingId: casing.id,
        bladesWeightKgWithoutScrap: toNum(row[37]),
        bladesScrapPct: toNum(row[38]),
        bladesWeightKgWithScrap: toNum(row[39]),
        bladesSheetMetalDimensionsMm: toStr(row[40]),
        plateWeightKgWithoutScrap: toNum(row[41]),
        plateScrapPct: toNum(row[42]),
        plateWeightKgWithScrap: toNum(row[43]),
        plateSheetMetalDimensionsMm: toStr(row[44]),
        plateCentrifugalImpellerRigCostPcs: toNum(row[45]),
        plateLaserTimeMin: toNum(row[46]),
        plateCasingCircumferenceM: toNum(row[47]),
        platePaintingLe: toNum(row[48]),
      },
    });

    // Funnels - one row: 1.5mm (54-60) + 3mm (61-69)
    await client.centrifugalCasingFunnels.create({
      data: {
        casingId: casing.id,
        funnel15mmWeightKgWithoutScrap: toNum(row[54]),
        funnel15mmScrapPct: toNum(row[55]),
        funnel15mmWeightKgWithScrap: toNum(row[56]),
        funnel15mmSheetMetalDimensionsMm: toStr(row[57]),
        funnel15mmDieCastingLePc: toNum(row[58]),
        funnel15mmFunnelMachiningLe: toNum(row[59]),
        funnel15mmGalvanizeLe: toNum(row[60]),
        funnel3mmWeightKgWithoutScrap: toNum(row[61]),
        funnel3mmScrapPct: toNum(row[62]),
        funnel3mmWeightKgWithScrap: toNum(row[63]),
        funnel3mmSheetMetalDimensionsMm: toStr(row[64]),
        funnel3mmDieCastingLePc: toNum(row[65]),
        funnel3mmFunnelMachiningLe: toNum(row[66]),
        funnel3mmPaintingLe: toNum(row[67]),
      },
    });

    // Sleeve + Shaft - one row: Sleeve (73-77) + Shaft (78-84)
    await client.centrifugalCasingSleeveShaft.create({
      data: {
        casingId: casing.id,
        sleeveWeightKgWithoutScrap: toNum(row[73]),
        sleeveScrapPct: toNum(row[74]),
        sleeveWeightKgWithScrap: toNum(row[75]),
        sleeveSheetMetalDimensionsMm: toStr(row[76]),
        sleeveManufacturingLePc: toNum(row[77]),
        shaftWeightKgWithoutScrap: toNum(row[78]),
        shaftScrapPct: toNum(row[79]),
        shaftWeightKgWithScrap: toNum(row[80]),
        shaftSheetMetalDimensionsMm: toStr(row[81]),
        shaftManufacturingLePc: toNum(row[82]),
      },
    });

    // Matching Flange - one row: Flange 3mm (87-95) + selfAligningBearingHousingLe (99)
    await client.centrifugalCasingMatchingFlange.create({
      data: {
        casingId: casing.id,
        flange3mmWeightKgWithoutScrap: toNum(row[87]),
        flange3mmScrapPct: toNum(row[88]),
        flange3mmWeightKgWithScrap: toNum(row[89]),
        flange3mmSheetMetalDimensionsMm: toStr(row[90]),
        flange3mmLaserTimeMin: toNum(row[91]),
        flange3mmRolling: toNum(row[92]),
        flange3mmCasingCircumferenceM: toNum(row[93]),
        selfAligningBearingHousingLe: toNum(row[99]),
      },
    });

    // Bearing Assembly (102-103)
    await client.centrifugalCasingBearingAssembly.create({
      data: {
        casingId: casing.id,
        boltsNutsKg: toNum(row[102]),
        assemblyLaboursPerShaft: toNum(row[103]),
      },
    });

    // Fan Base (109-116)
    await client.centrifugalCasingFanBase.create({
      data: {
        casingId: casing.id,
        weightKgWithoutScrap: toNum(row[109]),
        scrapPct: toNum(row[110]),
        weightKgWithScrap: toNum(row[111]),
        sheetMetalDimensionsMm: toStr(row[112]),
        laserTimeMin: toNum(row[113]),
        bendingLine: toNum(row[114]),
        paintingLe: toNum(row[115]),
      },
    });

    // Belt Cover (121-128)
    await client.centrifugalCasingBeltCover.create({
      data: {
        casingId: casing.id,
        weightKgWithoutScrap: toNum(row[121]),
        scrapPct: toNum(row[122]),
        weightKgWithScrap: toNum(row[123]),
        sheetMetalDimensionsMm: toStr(row[124]),
        laserTimeMin: toNum(row[125]),
        casingCircumferenceM: toNum(row[126]),
        paintingLe: toNum(row[127]),
      },
    });

    // Motor Base (133-141)
    await client.centrifugalCasingMotorBase.create({
      data: {
        casingId: casing.id,
        weightKgWithoutScrap: toNum(row[133]),
        scrapPct: toNum(row[134]),
        weightKgWithScrap: toNum(row[135]),
        sheetMetalDimensionsMm: toStr(row[136]),
        laserTimeMin: toNum(row[137]),
        bendingLine: toNum(row[138]),
        studNutPriceLe: toNum(row[139]),
        paintingLe: toNum(row[140]),
      },
    });

    // Accessories (146, 150-154)
    await client.centrifugalCasingAccessories.create({
      data: {
        casingId: casing.id,
        vibrationIsolatorsLe: toNum(row[146]),
        vinylStickersLe: toNum(row[150]),
        namePlateLe: toNum(row[151]),
        packingLe: toNum(row[152]),
        labourCostLe: toNum(row[153]),
        internalTransportationLe: toNum(row[154]),
      },
    });

    count++;
  }

  console.log(`✅ Seeded ${count} centrifugal casing pricing records!`);
}

async function seedCentrifugalData() {
  const client = await getPrismaClient();
  console.log("🌀 Seeding Centrifugal Data...");
  const basePath = path.join(
    BASE_PATH,
    "server/Newmodules/centrifugal/CentrifugalFanData/",
  );

  const fanPath = path.join(basePath, "centrifugalFan.json");
  const motorPath = path.join(basePath, "MotorData.json");
  const pulleyPath = path.join(basePath, "pully database.json");
  const beltPath = path.join(basePath, "Belt Length per Standard.json");
  const pulleyStdPath = path.join(basePath, "Pulleys Standard .json");

  if (!fs.existsSync(fanPath)) {
    console.warn(`⚠️ Seed file not found: ${fanPath}`);
    return;
  }

  const fanCount = await client.centrifugalFanData.count();
  if (fanCount > 0) {
    console.log(
      `   CentrifugalFanData already has ${fanCount} records, skipping.`,
    );
    return;
  }

  const centrifugalFans = JSON.parse(fs.readFileSync(fanPath, "utf-8"));
  for (const fan of centrifugalFans) {
    await client.centrifugalFanData.create({
      data: {
        bladesType: fan.Blades?.Type,
        bladesModel: fan.Blades?.Model,
        minSpeedRPM: fan.Blades?.minSpeedRPM,
        highSpeedRPM: fan.Blades?.highSpeedRPM,
        impellerType: fan.Impeller?.impellerType,
        fanShaftDiameter: fan.Impeller?.fanShaftDiameter,
        innerDiameter: fan.Impeller?.innerDiameter,
        desigDensity: fan.desigDensity,
        RPM: fan.RPM,
        airFlow: JSON.stringify(fan.airFlow),
        totPressure: JSON.stringify(fan.totPressure),
        velPressure: JSON.stringify(fan.velPressure),
        staticPressure: JSON.stringify(fan.staticPressure),
        fanInputPow: JSON.stringify(fan.fanInputPow),
      },
    });
  }

  if (fs.existsSync(pulleyPath)) {
    const pulleyDb = JSON.parse(fs.readFileSync(pulleyPath, "utf-8"));
    if (Array.isArray(pulleyDb)) {
      for (const entry of pulleyDb) {
        await client.pulleyData.create({
          data: {
            no: parseInt_(entry["No"]),
            beltType: entry["Belt Type"] || null,
            grooves: parseInt_(entry["No. of Grooves"]),
            pitchDiameter: parseFloat_(entry["Pitch Diameter"]),
            bushNo: entry["Bush No."] || null,
            minBore: parseInt_(entry["Min Bore"]),
            maxBore: parseInt_(entry["Max Bore"]),
            widthF: parseFloat_(entry["F (Width)"]),
            condition: entry["Conditation"] || null,
          },
        });
      }
      console.log(`   PulleyData: ${pulleyDb.length} rows`);
    }
  } else {
    console.warn(`⚠️ Pulley database not found: ${pulleyPath}`);
  }

  if (fs.existsSync(beltPath)) {
    const beltLengths = JSON.parse(fs.readFileSync(beltPath, "utf-8"));
    if (Array.isArray(beltLengths)) {
      for (const entry of beltLengths) {
        await client.beltLengthStandard.create({
          data: {
            spz: parseFloat_(entry.SPZ),
            spa: parseFloat_(entry.SPA),
            spb: parseFloat_(entry.SPB),
            spc: parseFloat_(entry.SPC),
          },
        });
      }
      console.log(`   BeltLengthStandard: ${beltLengths.length} rows`);
    }
  } else {
    console.warn(`⚠️ Belt Length per Standard not found: ${beltPath}`);
  }

  if (fs.existsSync(pulleyStdPath)) {
    const pulleyStandards = JSON.parse(fs.readFileSync(pulleyStdPath, "utf-8"));
    if (Array.isArray(pulleyStandards)) {
      for (const entry of pulleyStandards) {
        await client.pulleyStandard.create({
          data: {
            no: parseInt_(entry.No),
            spz: parseFloat_(entry.SPZ),
            spa: parseFloat_(entry.SPA),
            spb: parseFloat_(entry.SPB),
            spc: parseFloat_(entry.SPC),
          },
        });
      }
      console.log(`   PulleyStandard: ${pulleyStandards.length} rows`);
    }
  } else {
    console.warn(`⚠️ Pulleys Standard not found: ${pulleyStdPath}`);
  }

  if (fs.existsSync(motorPath)) {
    const motors = JSON.parse(fs.readFileSync(motorPath, "utf-8"));
    if (Array.isArray(motors)) {
      for (const motor of motors) {
        await client.centrifugalMotorData.create({
          data: {
            material: motor.Material || motor.material,
            model: motor.Model || motor.model,
            powerKW: parseFloat_(motor["Power (kW)"] || motor.powerKW),
            speedRPM: parseFloat_(motor["Speed (RPM)"] || motor.speedRPM),
            NoPoles: parseInt_(motor["No of Poles"] || motor.NoPoles),
            powerFactor: parseFloat_(
              motor["Power factor Cos φ"] || motor.powerFactor,
            ),
            Phase: parseInt_(motor.Phase),
            frameSize: parseInt_(motor["Frame Size (mm)"] || motor.frameSize),
            shaftDia: parseFloat_(
              motor["Shaft Diameter (mm)"] || motor.shaftDia,
            ),
            shaftLength: parseFloat_(
              motor["Shaft Length (mm)"] || motor.shaftLength,
            ),
            shaftFeather: parseFloat_(
              motor["Shaft Feather Key Length (mm)"] || motor.shaftFeather,
            ),
            IE: parseInt_(motor.IE),
            frontBear: motor["front Brearing"] || motor.frontBear,
            rearBear: motor["Rear Bearing"] || motor.rearBear || "",
            noiseLvl: parseInt_(motor["Noise Level (dB-A)"] || motor.noiseLvl),
            weightKg: parseFloat_(motor["Weight (KG)"] || motor.weightKg),
            insClass: motor["Insulation Class"] || motor.insClass,
          },
        });
      }
      console.log(`   CentrifugalMotorData: ${motors.length} rows`);
    }
  } else {
    console.warn(`⚠️ Centrifugal MotorData not found: ${motorPath}`);
  }

  console.log("✅ Centrifugal data seeded!");
}

/** Seed only pulley / belt reference tables if they are empty (e.g. after migration). Does not touch fan or motor data. */
async function ensureCentrifugalReferenceData() {
  const client = await getPrismaClient();
  const pulleyCount = await client.pulleyData.count();
  const beltCount = await client.beltLengthStandard.count();
  const pulleyStdCount = await client.pulleyStandard.count();
  if (pulleyCount > 0 && beltCount > 0 && pulleyStdCount > 0) return;

  const basePath = path.join(
    BASE_PATH,
    "server/Newmodules/centrifugal/CentrifugalFanData/",
  );
  const pulleyPath = path.join(basePath, "pully database.json");
  const beltPath = path.join(basePath, "Belt Length per Standard.json");
  const pulleyStdPath = path.join(basePath, "Pulleys Standard .json");

  if (pulleyCount === 0 && fs.existsSync(pulleyPath)) {
    console.log("🔄 Seeding pulley_data (was empty)...");
    const pulleyDb = JSON.parse(fs.readFileSync(pulleyPath, "utf-8"));
    if (Array.isArray(pulleyDb)) {
      for (const entry of pulleyDb) {
        await client.pulleyData.create({
          data: {
            no: parseInt_(entry["No"]),
            beltType: entry["Belt Type"] || null,
            grooves: parseInt_(entry["No. of Grooves"]),
            pitchDiameter: parseFloat_(entry["Pitch Diameter"]),
            bushNo: entry["Bush No."] || null,
            minBore: parseInt_(entry["Min Bore"]),
            maxBore: parseInt_(entry["Max Bore"]),
            widthF: parseFloat_(entry["F (Width)"]),
            condition: entry["Conditation"] || null,
          },
        });
      }
      console.log(`   PulleyData: ${pulleyDb.length} rows`);
    }
  }

  if (beltCount === 0 && fs.existsSync(beltPath)) {
    console.log("🔄 Seeding belt_length_standard (was empty)...");
    const beltLengths = JSON.parse(fs.readFileSync(beltPath, "utf-8"));
    if (Array.isArray(beltLengths)) {
      for (const entry of beltLengths) {
        await client.beltLengthStandard.create({
          data: {
            spz: parseFloat_(entry.SPZ),
            spa: parseFloat_(entry.SPA),
            spb: parseFloat_(entry.SPB),
            spc: parseFloat_(entry.SPC),
          },
        });
      }
      console.log(`   BeltLengthStandard: ${beltLengths.length} rows`);
    }
  }

  if (pulleyStdCount === 0 && fs.existsSync(pulleyStdPath)) {
    console.log("🔄 Seeding pulley_standard (was empty)...");
    const pulleyStandards = JSON.parse(fs.readFileSync(pulleyStdPath, "utf-8"));
    if (Array.isArray(pulleyStandards)) {
      for (const entry of pulleyStandards) {
        await client.pulleyStandard.create({
          data: {
            no: parseInt_(entry.No),
            spz: parseFloat_(entry.SPZ),
            spa: parseFloat_(entry.SPA),
            spb: parseFloat_(entry.SPB),
            spc: parseFloat_(entry.SPC),
          },
        });
      }
      console.log(`   PulleyStandard: ${pulleyStandards.length} rows`);
    }
  }
}

export const DatabaseInitService = {
  async seedAll() {
    console.log("🚀 Starting comprehensive seed process...\n");
    await seedFanData();
    await seedMotorData();
    await seedPricingItems();
    await seedAccessoryPricing();
    await seedAxialCasingPricing();
    await seedAxialImpellerPricing();
    await seedCentrifugalCasingPricing();
    await seedCentrifugalData();
    console.log("\n🎉 Database fully seeded!");
  },

  async ensureAxialPricingCategory() {
    const client = await getPrismaClient();
    if (!client) return;
    const existing = await client.pricingCategory.findUnique({
      where: { name: "axial_pricing" },
    });
    if (existing) return;
    const first = await client.pricingCategory.findFirst();
    if (first) {
      await client.pricingCategory.update({
        where: { id: first.id },
        data: { name: "axial_pricing", displayName: "Axial Pricing" },
      });
      console.log(
        "✅ Updated pricing category to axial_pricing for admin API.",
      );
    } else {
      await client.pricingCategory.create({
        data: {
          name: "axial_pricing",
          displayName: "Axial Pricing",
          description: "Pricing items for axial fans",
        },
      });
      console.log("✅ Created axial_pricing category.");
    }
  },

  async initializeDatabase() {
    const client = await getPrismaClient();
    try {
      console.log("🔍 Checking database status...");

      // Check if axial fan data exists
      const fanCount = await client.fanData.count();
      const centrifugalCount = await client.centrifugalFanData.count();

      if (fanCount === 0 || centrifugalCount === 0) {
        console.log("⚠️ Database is empty. Starting automatic seed...");
        await this.seedAll();
      } else {
        console.log(
          `✅ Database already populated (Axial: ${fanCount}, Centrifugal: ${centrifugalCount})`,
        );
      }
      await ensureCentrifugalReferenceData();
      await this.ensureAxialPricingCategory();
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
    } finally {
      await client.$disconnect();
    }
  },
};
