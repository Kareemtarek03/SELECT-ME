import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let prisma = null;

async function getPrismaClient() {
    if (!prisma) {
        const dbUrl = process.env.DATABASE_URL;
        console.log("Initializing PrismaClient in DatabaseInitService...");
        console.log("Current DATABASE_URL:", dbUrl);

        const options = {};
        if (dbUrl) {
            options.datasources = {
                db: {
                    url: dbUrl
                }
            };
        }
        prisma = new PrismaClient(options);
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
        // If we're in production Electron, the files are often in app.asar.unpacked
        // Priority 1: Check if there's an unpacked version of the APP_PATH itself
        const appAsarPath = electronAppPath.endsWith('.asar') ? electronAppPath : electronAppPath + '.asar';
        const unpackedPath = appAsarPath + '.unpacked';

        if (fs.existsSync(unpackedPath)) {
            return unpackedPath;
        }
        return electronAppPath;
    }

    // Fallback: search up for package.json to find project root (development)
    let currentDir = __dirname;
    while (currentDir !== path.parse(currentDir).root) {
        if (fs.existsSync(path.join(currentDir, 'package.json'))) {
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
    const fansPath = path.join(BASE_PATH, "server/Newmodules/axial/AxialFanData/axialFan.json");
    if (!fs.existsSync(fansPath)) {
        console.warn(`⚠️ Seed file not found: ${fansPath}`);
        return;
    }

    const fans = JSON.parse(fs.readFileSync(fansPath, "utf-8"));
    await client.fanData.deleteMany({});

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
    const motorsPath = path.join(BASE_PATH, "server/Newmodules/axial/AxialPricing/MotorData.json");
    if (!fs.existsSync(motorsPath)) {
        console.warn(`⚠️ Seed file not found: ${motorsPath}`);
        return;
    }

    const motors = JSON.parse(fs.readFileSync(motorsPath, "utf-8"));
    await client.motorData.deleteMany({});

    for (const m of motors) {
        await client.motorData.create({
            data: {
                material: m["Material"],
                model: m["Model"],
                powerKW: parseFloat_(m["Power (kW)"]),
                speedRPM: parseFloat_(m["Speed (RPM)"]),
                NoPoles: parseInt_(m["No of Poles"]),

                ratedCurrentIn: parseFloat_(m["Rated current-In (A)"]),
                ratedTorqueMn: parseFloat_(m["Rated Torque – Mn (Nm)"]),

                dolLockedRotorCurrent: parseFloat_(m["Locked rotor Current – Ia (A) (DOL)"]),
                dolIaIn: parseFloat_(m["Ia / In (DOL)"]),
                dolLockedRotorTorque: parseFloat_(m["Locked rotor Torque – Ma (Nm) (DOL)"]),
                dolMaMn: parseFloat_(m["Ma / Mn (DOL)"]),

                starDeltaLockedRotorCurrent: parseFloat_(m["Locked rotor Current – Ia (A) (Y / ∆ Starting)"]),
                starDeltaIaIn: parseFloat_(m["Ia / I-n (Y / ∆ Starting)"]),
                starDeltaLockedRotorTorque: parseFloat_(m["Locked rotor Torque – Ma (Nm) (Y / ∆ Starting)"]),
                starDeltaMaMn: parseFloat_(m["Ma / Mn (Y / ∆ Starting)"]),

                powerFactor: parseFloat_(m["Power factor Cos φ"]),
                Phase: parseInt_(m["Phase"]),
                frameSize: parseInt_(m["Frame Size (mm)"]),
                shaftDia: parseFloat_(m["Shaft Diameter (mm)"]),
                shaftLength: parseFloat_(m["Shaft Length (mm)"]),
                shaftFeather: parseFloat_(m["Shaft Feather Key Length (mm)"]),
                IE: parseInt_(m["IE"]),
                frontBear: m["front Brearing"],
                rearBear: m["Rear Bearing"],
                noiseLvl: parseInt_(m["Noise Level (dB-A)"]),
                weightKg: parseFloat_(m["Weight (KG)"]),

                efficiency50Hz: parseFloat_(m["Efficiency @ 50 Hz"]),
                efficiency375Hz: parseFloat_(m["Efficiency @ 37.5 Hz"]),
                efficiency25Hz: parseFloat_(m["Efficiency @ 25 Hz"]),

                runCapacitor400V: parseFloat_(m["Run Capacitor 400 V (µF)"]),
                startCapacitor330V: parseFloat_(m["Start Capacitor 330 V (µF) "]),
                NoCapacitors: parseInt_(m["No. of Capacitors"]),
                NoPhases: parseInt_(m["No. of Phases"]),
                insClass: m["Insulation Class"],

                b3PriceWithoutVat: parseFloat_(m[" B3 Price ($) w/o VAT "]),
                b3PriceWithVat: parseFloat_(m["B3 Price with VAT & Factor (L.E)"]),
                otherPriceWithoutVat: parseFloat_(m["Other Price ($) w/o VAT "]),
                otherPriceWithVat: parseFloat_(m["Other Price with VAT & Factor (L.E)"]),

                cableCurrent: parseFloat_(m["Current (A) with S.F (25%)(Cable)"]),
                cableSize: m["Cable Size (mm2)(Cable) "],
                cablePriceWithoutVat: parseFloat_(m["Price w/o VAT Per Meter (Cable)"]),
                cablePriceWithVat: parseFloat_(m["Price With VAT Per Meter (Cable)"]),

                cableLugsNo: parseInt_(m["No.(Cable Lugs )"]),
                cableLugsUPWithoutVat: parseFloat_(m["U.P Price w/o VAT (Cable Lugs )"]),
                cableLugsUPWithVat: parseFloat_(m["U.P Price with VAT (Cable Lugs )"]),
                cableLugsTPWithVat: parseFloat_(m["T.P Price with VAT (Cable Lugs )"]),

                cableHeatShrinkNo: parseFloat_(m["No.(Cable Heat Shrink)"]),
                cableHeatShrinkUPWithoutVat: parseFloat_(m["U.P Price w/o VAT (Cable Heat Shrink)"]),
                cableHeatShrinkUPWithVat: parseFloat_(m["U.P Price with VAT (Cable Heat Shrink)"]),
                cableHeatShrinkTPWithVat: parseFloat_(m["T.P Price with VAT (Cable Heat Shrink)"]),

                flexibleConnectorMeter: parseFloat_(m["Meter (Flexible Connector)"]),
                flexibleConnectorSize: m["Size (mm) (Flexible Connector) "],
                flexibleConnectorUPWithoutVat: parseFloat_(m["U.P Price w/o VAT (Flexible Connector)"]),
                flexibleConnectorUPWithVat: parseFloat_(m["U.P Price with VAT (Flexible Connector)"]),
                flexibleConnectorTPWithVat: parseFloat_(m["T.P Price with VAT (Flexible Connector)"]),

                glandNo: parseFloat_(m["No. (Gland)"]),
                glandUPWithoutVat: parseFloat_(m["U.P Price w/o VAT (Gland)"]),
                glandUPWithVat: parseFloat_(m["U.P Price with VAT (Gland)"]),
                glandTPWithVat: parseFloat_(m["T.P Price with VAT (Gland)"]),

                brassBarNo: parseFloat_(m["No. (Brass Bar)"]),
                brassBarUPWithoutVat: parseFloat_(m["U.P Price w/o VAT (Brass Bar)"]),
                brassBarUPWithVat: parseFloat_(m["U.P Price with VAT (Brass Bar)"]),
                brassBarTPWithVat: parseFloat_(m["T.P Price with VAT (Brass Bar)"]),

                electricalBoxSize: m["Size (mm) (Electrical Box)"],
                electricalBoxUPWithoutVat: parseFloat_(m["U.P Price w/o VAT (Electrical Box)"]),
                electricalBoxUPWithVat: parseFloat_(m["U.P Price with VAT(Electrical Box)"]),

                totalPriceWithVat: parseFloat_(m["Price With VAT Per Meter (Total)"]),
                powerHorse: parseFloat_(m["Power (HP)"]),
            }
        });
    }
    console.log(`✅ Seeded ${motors.length} axial motor records!`);
}

async function seedPricingItems() {
    const client = await getPrismaClient();
    console.log("💰 Seeding PricingItems...");
    const pricingPath = path.join(BASE_PATH, "server/Newmodules/axial/AxialPricing/PriceList.json");
    if (!fs.existsSync(pricingPath)) {
        console.warn(`⚠️ Seed file not found: ${pricingPath}`);
        return;
    }

    const priceList = JSON.parse(fs.readFileSync(pricingPath, "utf-8"));
    await client.pricingItem.deleteMany({});
    await client.pricingCategory.deleteMany({});

    // Client/admin expects category name "axial_pricing" for GET /api/pricing/categories/name/axial_pricing
    const category = await client.pricingCategory.create({
        data: {
            name: "axial_pricing",
            displayName: "Axial Pricing",
            description: "Pricing items from PriceList.json for axial fans"
        }
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
            }
        });
    }
    console.log(`✅ Seeded ${priceList.length} pricing items!`);
}

async function seedAccessoryPricing() {
    const client = await getPrismaClient();
    console.log("🛠️ Seeding AccessoryPricing...");
    const accessoryPath = path.join(BASE_PATH, "server/Newmodules/axial/AxialPricing/Accessory.json");
    if (!fs.existsSync(accessoryPath)) {
        console.warn(`⚠️ Seed file not found: ${accessoryPath}`);
        return;
    }

    const accessories = JSON.parse(fs.readFileSync(accessoryPath, "utf-8"));
    await client.accessoryPricing.deleteMany({});

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
                internalTransportationLe: parseFloat_(acc["Internal Transportation (L.E)"]),
                boltsAndNutsKg: parseFloat_(acc["Bolts & Nuts (kg)"]),
                priceWithVatLe: parseFloat_(acc["Price With VAT (L.E)"]),
            }
        });
    }
    console.log(`✅ Seeded ${accessories.length} accessory pricing records!`);
}

async function seedAxialCasingPricing() {
    const client = await getPrismaClient();
    console.log("📦 Seeding AxialCasingPricing...");
    const casingPath = path.join(BASE_PATH, "server/Newmodules/axial/AxialPricing/AxialCasing/casingSeedConfig.json");
    if (!fs.existsSync(casingPath)) {
        console.warn(`⚠️ Seed file not found: ${casingPath}`);
        return;
    }

    const casingConfig = JSON.parse(fs.readFileSync(casingPath, "utf-8"));
    await client.axialCasingPricing.deleteMany({});

    for (const modelGroup of casingConfig.models) {
        for (const size of modelGroup.sizes) {
            const rng = (min, max) => Math.random() * (max - min) + min;
            await client.axialCasingPricing.create({
                data: {
                    model: modelGroup.model,
                    sizeMm: size,
                    casingWeightKgWithoutScrap: rng(modelGroup.ranges.weightKg.min, modelGroup.ranges.weightKg.max),
                    scrapPercentage: rng(modelGroup.ranges.scrapPct.min, modelGroup.ranges.scrapPct.max),
                    casingCircumferenceMeter: rng(modelGroup.ranges.circumference.min, modelGroup.ranges.circumference.max),
                    laserTimeMinutes: rng(modelGroup.ranges.laserTime.min, modelGroup.ranges.laserTime.max),
                    bendingLine: rng(modelGroup.ranges.bendingLine.min, modelGroup.ranges.bendingLine.max),
                    rolling: rng(modelGroup.ranges.rolling.min, modelGroup.ranges.rolling.max),
                    paintingDiameter: rng(modelGroup.ranges.paintingDiameter.min, modelGroup.ranges.paintingDiameter.max),
                    profitPercentage: rng(modelGroup.ranges.profitPct.min, modelGroup.ranges.profitPct.max),
                }
            });
        }
    }
    console.log("✅ Seeded axial casing pricing records!");
}

async function seedCentrifugalData() {
    const client = await getPrismaClient();
    console.log("🌀 Seeding Centrifugal Data...");
    const basePath = path.join(BASE_PATH, "server/Newmodules/centrifugal/CentrifugalFanData/");

    const fanPath = path.join(basePath, "centrifugalFan.json");
    const motorPath = path.join(basePath, "MotorData.json");
    const pulleyPath = path.join(basePath, "pully database.json");
    const beltPath = path.join(basePath, "Belt Length per Standard.json");
    const pulleyStdPath = path.join(basePath, "Pulleys Standard .json");

    if (!fs.existsSync(fanPath)) {
        console.warn(`⚠️ Seed file not found: ${fanPath}`);
        return;
    }

    await client.centrifugalFanData.deleteMany({});
    await client.centrifugalMotorData.deleteMany({});
    await client.pulleyData.deleteMany({});
    await client.beltLengthStandard.deleteMany({});
    await client.pulleyStandard.deleteMany({});

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
                        powerFactor: parseFloat_(motor["Power factor Cos φ"] || motor.powerFactor),
                        Phase: parseInt_(motor.Phase),
                        frameSize: parseInt_(motor["Frame Size (mm)"] || motor.frameSize),
                        shaftDia: parseFloat_(motor["Shaft Diameter (mm)"] || motor.shaftDia),
                        shaftLength: parseFloat_(motor["Shaft Length (mm)"] || motor.shaftLength),
                        shaftFeather: parseFloat_(motor["Shaft Feather Key Length (mm)"] || motor.shaftFeather),
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

    const basePath = path.join(BASE_PATH, "server/Newmodules/centrifugal/CentrifugalFanData/");
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
            console.log("✅ Updated pricing category to axial_pricing for admin API.");
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
                console.log(`✅ Database already populated (Axial: ${fanCount}, Centrifugal: ${centrifugalCount})`);
            }
            await ensureCentrifugalReferenceData();
            await this.ensureAxialPricingCategory();
        } catch (error) {
            console.error("❌ Database initialization failed:", error);
        } finally {
            await client.$disconnect();
        }
    }
};
