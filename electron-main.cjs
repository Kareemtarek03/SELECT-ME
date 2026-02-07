const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");

console.log("Electron app starting...");

// PDF generators will be loaded dynamically (ES modules)
let generateAxialFanDatasheetPDF = null;
let generateCentrifugalFanDatasheetPDF = null;

let mainWindow;
let server;
let fanDataCache = null;
let motorDataCache = null;

// Determine if we're in development or production
const isDev = !app.isPackaged;
console.log("App is packaged:", !isDev);

// Configure Database Path for Production
if (!isDev) {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "database.db");

    console.log("Configuring production database...");
    console.log("User Data Path:", userDataPath);

    // Ensure the directory exists
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }

    // If the database file doesn't exist in userData, copy the template from resources
    if (!fs.existsSync(dbPath)) {
        try {
            // In production, the original dev.db is in the prisma folder
            // Prioritize process.resourcesPath as it's now in extraResources
            const resourcesDbPath = path.join(process.resourcesPath, "prisma", "dev.db");
            const appPath = app.getAppPath();
            const asarDbPath = path.join(appPath, "prisma", "dev.db");

            console.log("=== Database Discovery ===");
            console.log("Looking for template DB in Resources:", resourcesDbPath, "Exists:", fs.existsSync(resourcesDbPath));
            console.log("Looking for template DB in App (ASAR):", asarDbPath, "Exists:", fs.existsSync(asarDbPath));

            let templateDbPath = null;
            if (fs.existsSync(resourcesDbPath)) {
                templateDbPath = resourcesDbPath;
            } else if (fs.existsSync(asarDbPath)) {
                templateDbPath = asarDbPath;
            }

            if (templateDbPath) {
                console.log("Using template database from:", templateDbPath);
                try {
                    fs.copyFileSync(templateDbPath, dbPath);
                    console.log("Successfully copied database to:", dbPath);
                } catch (e) {
                    console.error("FAILED to copy database:", e.message);
                }
            } else {
                console.error("CRITICAL: Template database NOT found in either location!");
            }
        } catch (copyErr) {
            console.error("Database setup error:", copyErr);
        }
    }

    // Force Prisma to use the writable database path
    // Normalize path to use forward slashes for Prisma/SQLite on Windows
    const normalizedDbPath = dbPath.replace(/\\/g, "/");
    process.env.DATABASE_URL = `file:${normalizedDbPath}`;
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    // Prisma Engine Resolution for Packaged App
    try {
        const unpackedPath = path.join(process.resourcesPath, "app.asar.unpacked");
        // Locate engine binaries (unpacked via asarUnpack in package.json)
        const engineDir = path.join(unpackedPath, "node_modules", "@prisma", "engines");
        console.log("Looking for Prisma engines in:", engineDir, "Exists:", fs.existsSync(engineDir));

        if (fs.existsSync(engineDir)) {
            const files = fs.readdirSync(engineDir);
            const engineFile = files.find(f => f.includes('query_engine') && (f.endsWith('.node') || f.endsWith('.exe') || f.endsWith('.dll.node')));

            if (engineFile) {
                const fullEnginePath = path.join(engineDir, engineFile);
                process.env.PRISMA_QUERY_ENGINE_LIBRARY = fullEnginePath;
                process.env.PRISMA_QUERY_ENGINE_BINARY = fullEnginePath;
                console.log("PRISMA_ENGINE:", fullEnginePath);
            }
        }
    } catch (engineErr) {
        console.warn("Engine resolution failed:", engineErr.message);
    }
} else {
    // In development mode, normalize relative path from .env if it exists
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:./')) {
        const rootPath = __dirname;
        const relativePath = process.env.DATABASE_URL.replace('file:./', '');
        const absolutePath = path.resolve(rootPath, relativePath).replace(/\\/g, "/");
        process.env.DATABASE_URL = `file:${absolutePath}`;
        console.log("Dev Mode DATABASE_URL normalized:", process.env.DATABASE_URL);
    }
}

function getResourcesPath() {
    return isDev ? __dirname : process.resourcesPath;
}

function getAppPath() {
    return isDev ? __dirname : app.getAppPath();
}

// Helper function to get the correct module path for dynamic imports
// In production, ES modules are unpacked from asar to app.asar.unpacked folder
// Windows requires forward slashes in file:// URLs for ES module imports
function getModulePath(relativePath) {
    let fullPath;
    if (isDev) {
        // In development, use __dirname directly
        fullPath = path.join(__dirname, relativePath);
    } else {
        // First try unpacked path (where ES modules should be if asarUnpacked)
        const unpackedPath = path.join(process.resourcesPath, "app.asar.unpacked");
        fullPath = path.join(unpackedPath, relativePath);

        if (!fs.existsSync(fullPath)) {
            // Fallback to ASAR internal path
            fullPath = path.join(app.getAppPath(), relativePath);
        }
    }
    // Convert Windows backslashes to forward slashes for ES module compatibility
    const normalizedPath = fullPath.replace(/\\/g, '/');
    return `file:///${normalizedPath}`;
}

// Load data from JSON files
function loadData(clientBuildPath) {
    try {
        const fanDataPath = path.join(clientBuildPath, "fan-data.json");
        const motorDataPath = path.join(clientBuildPath, "motor-data.json");

        if (fs.existsSync(fanDataPath)) {
            fanDataCache = JSON.parse(fs.readFileSync(fanDataPath, "utf8"));
            console.log("Loaded", fanDataCache.length, "fan records");
        }
        if (fs.existsSync(motorDataPath)) {
            motorDataCache = JSON.parse(fs.readFileSync(motorDataPath, "utf8"));
            console.log("Loaded", motorDataCache.length, "motor records");
        }
    } catch (err) {
        console.error("Failed to load data:", err);
    }
}

// Fan type mapping
const fanTypeToDbColumn = {
    "AF-S": "AFS", "AF-L": "AFL", "WF": "WF", "ARTF": "ARTF", "SF": "SF",
    "ABSF-C": "ABSFC", "ABSF-S": "ABSFS", "SWF": "SABF", "SARTF": "SARTF", "AJF": "AJF"
};

// Calculate density from temperature
function calcDensity(tempC) {
    const temp = Number(tempC);
    if (isNaN(temp)) return 1.2;
    return Math.round((101325 / ((temp + 273.15) * 287.1)) * 100) / 100;
}

// Piecewise cubic interpolation
function cubicSpline(x, y) {
    const segments = [];
    for (let i = 0; i < x.length - 1; i++) {
        const x0 = x[i], x1 = x[i + 1], y0 = y[i], y1 = y[i + 1];
        const a = (y1 - y0) / (Math.pow(x1, 3) - Math.pow(x0, 3));
        const b = y0 - a * Math.pow(x0, 3);
        segments.push({ xMin: Math.min(x0, x1), xMax: Math.max(x0, x1), a, b });
    }
    return (xi) => {
        for (const seg of segments) {
            if (xi >= seg.xMin && xi <= seg.xMax) {
                return seg.a * Math.pow(xi, 3) + seg.b;
            }
        }
        const seg = xi < segments[0].xMin ? segments[0] : segments[segments.length - 1];
        return seg.a * Math.pow(xi, 3) + seg.b;
    };
}

// Parse JSON field (SQLite stores arrays as strings)
function parseJsonField(val) {
    if (typeof val === "string") {
        try { return JSON.parse(val); } catch (e) { return val; }
    }
    return val;
}

// Process fan data with unit conversion and recalculation
function processFanData(units, input) {
    if (!fanDataCache) return [];

    const fanType = units?.fanType;
    const dbColumn = fanTypeToDbColumn[fanType];

    // Filter by fan type
    let fans = fanDataCache;
    if (dbColumn) {
        fans = fans.filter(f => f[dbColumn] === 1);
    }

    // Unit converters
    const airFlowConverters = { "m^3/s": 1, "m^3/min": 60, "m^3/hr": 3600, "L/s": 1000, "L/min": 60000, "L/hr": 3600000, CFM: 2118.880003 };
    const pressureConverters = { Pa: 1, kPa: 0.001, bar: 1e-5, Psi: 0.000145038, "in.wg": 0.004018647 };
    const powerConverters = { kW: 1, W: 1000, HP: 1.34 };

    const airFlowFactor = airFlowConverters[units.airFlow] || 1;
    const pressureFactor = pressureConverters[units.pressure] || 1;
    const powerFactor = powerConverters[units.power] || 1;

    const inputDensity = calcDensity(input.TempC);
    const inputAirFlow = parseFloat(input.airFlow);
    const inputStaticPressure = parseFloat(input.staticPressure);
    const spf = input.SPF || 5;
    const safety = input.Safety || 5;

    // Calculate noPoles from RPM
    function calcNoPoles(rpm) {
        if (rpm <= 750) return 8;
        if (rpm <= 1000) return 6;
        if (rpm <= 1500) return 4;
        if (rpm <= 3000) return 2;
        return 4;
    }
    const noPoles = calcNoPoles(input.RPM);

    const results = [];

    for (const fan of fans) {
        try {
            const airFlow = parseJsonField(fan.airFlow);
            const totPressure = parseJsonField(fan.totPressure);
            const staticPressure = parseJsonField(fan.staticPressure);
            const velPressure = parseJsonField(fan.velPressure);
            const fanInputPow = parseJsonField(fan.fanInputPow);

            if (!Array.isArray(airFlow) || airFlow.length < 2) continue;

            // Convert and scale
            const rpmRatio = input.RPM / fan.RPM;
            const densityRatio = inputDensity / fan.desigDensity;

            const convAirFlow = airFlow.map(v => v * airFlowFactor);
            const AirFlowNew = convAirFlow.map(v => v * rpmRatio);
            const StaticPressureNew = staticPressure.map(v => v * pressureFactor * Math.pow(rpmRatio, 2) * densityRatio);
            const TotalPressureNew = totPressure.map(v => v * pressureFactor * Math.pow(rpmRatio, 2) * densityRatio);
            const VelocityPressureNew = velPressure.map(v => v * pressureFactor * Math.pow(rpmRatio, 2) * densityRatio);
            const FanInputPowerNew = fanInputPow.map(v => v * powerFactor * Math.pow(rpmRatio, 3) * densityRatio);

            // Efficiency
            const FanTotalEfficiency = fanInputPow.map((pow, i) => pow > 0 ? (totPressure[i] * airFlow[i]) / (pow * 1000) : null);
            const FanStaticEfficiency = fanInputPow.map((pow, i) => pow > 0 ? (staticPressure[i] * airFlow[i]) / (pow * 1000) : null);

            // Sort by airflow
            const sortedIdx = [...AirFlowNew.keys()].sort((a, b) => AirFlowNew[a] - AirFlowNew[b]);
            const xSorted = sortedIdx.map(i => AirFlowNew[i]);

            const xMin = xSorted[0], xMax = xSorted[xSorted.length - 1];
            if (inputAirFlow < xMin || inputAirFlow > xMax) continue;

            // Interpolate
            const spStatic = cubicSpline(xSorted, sortedIdx.map(i => StaticPressureNew[i]));
            const spPower = cubicSpline(xSorted, sortedIdx.map(i => FanInputPowerNew[i]));
            const spTotalEff = cubicSpline(xSorted, sortedIdx.map(i => FanTotalEfficiency[i]));
            const spStaticEff = cubicSpline(xSorted, sortedIdx.map(i => FanStaticEfficiency[i]));
            const spVelPressure = cubicSpline(xSorted, sortedIdx.map(i => VelocityPressureNew[i]));

            const predStatic = spStatic(inputAirFlow);
            const predPower = spPower(inputAirFlow);
            const predTotalEff = spTotalEff(inputAirFlow);
            const predStaticEff = spStaticEff(inputAirFlow);
            const predVelPressure = spVelPressure(inputAirFlow);

            // Filter by static pressure tolerance
            const lower = inputStaticPressure * (1 - spf / 100);
            const upper = inputStaticPressure * (1 + spf / 100);
            if (predStatic < lower || predStatic > upper) continue;

            // Match motor
            let matchedMotor = null;
            if (motorDataCache) {
                const requiredPower = predPower * (1 + safety / 100);
                const candidates = motorDataCache.filter(m => {
                    const net = m.netpower || m.netPower || 0;
                    return net >= requiredPower && m.NoPoles == noPoles;
                }).sort((a, b) => (a.netpower || 0) - (b.netpower || 0));
                if (candidates.length > 0) matchedMotor = candidates[0];
            }

            // Build FanModel
            const FanModel = `${fanType || ""}-${fan.impellerInnerDia || ""}-${fan.noBlades || ""}\\${fan.bladesAngle || ""}\\${fan.bladesMaterial || ""}${fan.bladesSymbol || ""}-${noPoles}${input.NoPhases == 3 ? "T" : "M"}${matchedMotor ? `-${matchedMotor.powerHorse || ""}` : ""}`;

            results.push({
                Id: fan.id,
                FanModel,
                RPM: input.RPM,
                InputDensity: inputDensity,
                Blades: { symbol: fan.bladesSymbol, material: fan.bladesMaterial, noBlades: fan.noBlades, angle: fan.bladesAngle },
                Impeller: { innerDia: fan.impellerInnerDia, conf: fan.impellerConf },
                AirFlowNew, StaticPressureNew, TotalPressureNew, VelocityPressureNew, FanInputPowerNew,
                FanTotalEfficiency, FanStaticEfficiency,
                predictions: {
                    StaticPressurePred: predStatic,
                    FanInputPowerPred: predPower,
                    FanTotalEfficiencyPred: predTotalEff,
                    FanStaticEfficiencyPred: predStaticEff,
                    VelocityPressurePred: predVelPressure
                },
                matchedMotor
            });
        } catch (err) {
            // Skip fans with errors
        }
    }

    // Sort by efficiency
    results.sort((a, b) => (b.predictions?.FanTotalEfficiencyPred || 0) - (a.predictions?.FanTotalEfficiencyPred || 0));
    return results;
}

// Start embedded Express server
function startServer() {
    return new Promise((resolve, reject) => {
        try {
            const resourcesPath = getResourcesPath();
            const appPath = getAppPath();

            console.log("Starting embedded server...");
            console.log("Resources path:", resourcesPath);
            console.log("App path:", appPath);

            const expressApp = express();
            expressApp.use(express.json());
            expressApp.use(cors({ origin: true, credentials: true }));

            // Serve static files from the React app build directory
            const clientBuildPath = path.join(resourcesPath, "client", "build");
            console.log("Client build path:", clientBuildPath);

            // Load fan and motor data
            loadData(clientBuildPath);

            // API Routes - Legacy route
            expressApp.post("/api/fan-data/filter", (req, res) => {
                try {
                    const { units, input } = req.body;
                    const results = processFanData(units, input);
                    res.json({ message: "Success", data: results });
                } catch (err) {
                    console.error("API error:", err);
                    res.status(500).json({ error: err.message });
                }
            });

            // Axial fan routes - using new Newmodules service
            expressApp.post("/api/axial/fan-data/filter", async (req, res) => {
                try {
                    const { units, input } = req.body;
                    const axialService = await import(getModulePath('server/Newmodules/axial/AxialFanData/axialFanData.service.js'));
                    const result = await axialService.Output({ units, input, dataSource: 'db' });
                    res.json({ message: "Success", data: result.data || result });
                } catch (err) {
                    console.error("Axial API error:", err);
                    res.status(500).json({
                        error: err.message || "Unknown Axial API error",
                        details: err.message,
                        stack: isDev ? err.stack : undefined
                    });
                }
            });

            // Centrifugal fan routes - dynamically import the service
            expressApp.post("/api/centrifugal/fan-data/process", async (req, res) => {
                try {
                    const { units, input } = req.body;
                    const centrifugalService = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js'));

                    // Build inputOptions with selectedFanType extracted from units.fanType
                    const inputOptions = {
                        filePath: "centrifugalFan.json",
                        units: units || {},
                        input,
                        dataSource: "db",
                        selectedFanType: units?.centrifugalFanType || units?.fanType,
                    };

                    console.log(`\n=== Electron Centrifugal Process ===`);
                    console.log(`selectedFanType: ${inputOptions.selectedFanType}`);

                    const result = await centrifugalService.processFanDataService(inputOptions);

                    // Return phase-separated results matching the controller format
                    res.json({
                        message: "✅ Fan data processed successfully!",
                        phase3: result.results,
                        phase4: result.phase4,
                        phase5: result.phase5,
                        phase6: result.phase6,
                        phase7: result.phase7,
                        phase8: result.phase8,
                        phase9: result.phase9,
                        phase10: result.phase10,
                    });
                } catch (err) {
                    console.error("Centrifugal API error:", err);
                    res.status(500).json({
                        error: err.message || "Unknown Centrifugal API error",
                        details: err.message,
                        stack: isDev ? err.stack : undefined
                    });
                }
            });

            expressApp.post("/api/centrifugal/fan-data/phase11", async (req, res) => {
                try {
                    const centrifugalService = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js'));
                    const result = centrifugalService.processPhase11(req.body);
                    res.json({ message: "✅ Phase 11 calculated successfully!", phase11: result });
                } catch (err) {
                    console.error("Phase 11 error:", err);
                    res.status(500).json({ error: err.message, details: err.message });
                }
            });

            expressApp.post("/api/centrifugal/fan-data/phase12", async (req, res) => {
                try {
                    const centrifugalService = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js'));
                    const result = centrifugalService.processPhase12(req.body);
                    res.json({ message: "✅ Phase 12 calculated successfully!", phase12: result });
                } catch (err) {
                    console.error("Phase 12 error:", err);
                    res.status(500).json({ error: err.message, details: err.message });
                }
            });

            expressApp.post("/api/centrifugal/fan-data/phase13", async (req, res) => {
                try {
                    const centrifugalService = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js'));
                    const result = centrifugalService.processPhase13(req.body);
                    res.json({ message: "✅ Phase 13 calculated successfully!", phase13: result });
                } catch (err) {
                    console.error("Phase 13 error:", err);
                    res.status(500).json({ error: err.message, details: err.message });
                }
            });

            expressApp.post("/api/centrifugal/fan-data/phase14", async (req, res) => {
                try {
                    const centrifugalService = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js'));
                    const result = centrifugalService.processPhase14(req.body);
                    res.json({ message: "✅ Phase 14 calculated successfully!", phase14: result });
                } catch (err) {
                    console.error("Phase 14 error:", err);
                    res.status(500).json({ error: err.message, details: err.message });
                }
            });

            expressApp.post("/api/centrifugal/fan-data/phase15", async (req, res) => {
                try {
                    const centrifugalService = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js'));
                    const result = centrifugalService.processPhase15(req.body);
                    res.json({ message: "✅ Phase 15 calculated successfully!", phase15: result });
                } catch (err) {
                    console.error("Phase 15 error:", err);
                    res.status(500).json({ error: err.message, details: err.message });
                }
            });

            expressApp.post("/api/centrifugal/fan-data/phase16", async (req, res) => {
                try {
                    const centrifugalService = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js'));
                    const result = centrifugalService.processPhase16(req.body);
                    res.json({ message: "✅ Phase 16 calculated successfully!", phase16: result });
                } catch (err) {
                    console.error("Phase 16 error:", err);
                    res.status(500).json({ error: err.message, details: err.message });
                }
            });

            // Phase 17 - Sound data calculation (uses Phase 20 logic)
            expressApp.post("/api/centrifugal/fan-data/phase17", async (req, res) => {
                try {
                    const { selectedFan, distance, directivityQ } = req.body;
                    const centrifugalService = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js'));

                    // Create a phase18-like result structure from selectedFan for Phase 20
                    const phase18Result = {
                        fanModel: selectedFan?.fanModel || selectedFan?.model,
                        rpm: selectedFan?.rpm,
                        fanInputPower: selectedFan?.fanInputPower,
                        airFlow: selectedFan?.airFlow,
                        staticPressure: selectedFan?.staticPressure,
                    };

                    const result = centrifugalService.processPhase20({
                        phase18Result,
                        distance: distance ? parseFloat(distance) : 3,
                        directivityQ: directivityQ ? parseFloat(directivityQ) : 1,
                        safetyFactor: 0,
                    });

                    res.json({ message: "✅ Phase 17 sound data calculated!", phase17: result });
                } catch (err) {
                    console.error("Phase 17 error:", err);
                    res.status(500).json({ error: err.message, details: err.message });
                }
            });

            // Phase 19 - Fan curve data with speed adjustment
            expressApp.post("/api/centrifugal/fan-data/phase19", async (req, res) => {
                try {
                    const { selectedFan, phase18Result } = req.body;
                    const centrifugalService = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js'));

                    const result = centrifugalService.processPhase19({
                        selectedFan,
                        phase18Result,
                    });

                    res.json({ message: "✅ Phase 19 curve data calculated!", phase19: result });
                } catch (err) {
                    console.error("Phase 19 error:", err);
                    res.status(500).json({ error: err.message, details: err.message });
                }
            });

            expressApp.post("/api/centrifugal/fan-data/phase18-all", async (req, res) => {
                try {
                    const { phase16Data, phase13Motors, phase17Data, selectedFan } = req.body;

                    // Import centrifugal service for Phase 18 and Phase 19 calculations
                    const centrifugalService = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js'));

                    // Build consolidated results array - MUST match web version structure
                    // Web version calls Phase 18 service for EACH row to apply fan affinity laws
                    const results = [];
                    const rows = phase16Data?.rows || phase16Data || [];

                    if (Array.isArray(rows)) {
                        for (let idx = 0; idx < rows.length; idx++) {
                            const row = rows[idx];
                            // Get motor from phase13Motors - use row.index if available, otherwise use idx
                            const motorIdx = row.index !== undefined ? row.index : idx;
                            const motor = phase13Motors?.[motorIdx] || phase13Motors?.[idx] || null;

                            // Build phase17Motor - use Phase 13 motor object directly
                            // Phase 13 service returns: model, powerKW, powerHP, noOfPoles, noOfPhases,
                            // efficiency50Hz, insulationClass, shaftDiameterMM, shaftKeyLengthMM
                            const phase17Motor = motor ? {
                                model: motor.model || "",
                                powerKW: motor.powerKW,
                                powerHP: motor.powerHP,
                                noOfPoles: motor.noOfPoles,
                                noOfPhases: motor.noOfPhases || 3,
                                shaftDiameterMM: motor.shaftDiameterMM,
                                shaftKeyLengthMM: motor.shaftKeyLengthMM,
                                efficiency50Hz: motor.efficiency50Hz,
                                insulationClass: motor.insulationClass || "F",
                                ie: motor.ie,
                                capacitors: motor.capacitors,
                                // Calculated values from Phase 13
                                motorOutputPowerRequired: motor.motorOutputPowerRequired,
                                standardOutputPower: motor.standardOutputPower,
                                motorEfficiencyUsed: motor.motorEfficiencyUsed,
                                motorInputPowerRequired: motor.motorInputPowerRequired,
                                standardMotorPower: motor.standardMotorPower,
                                netFanPowerRequired: motor.netFanPowerRequired,
                            } : null;

                            // Call Phase 18 service - THIS IS CRITICAL
                            // Phase 18 applies fan affinity laws: airFlow*ratio, pressure*ratio², power*ratio³
                            let phase18 = null;
                            try {
                                phase18 = centrifugalService.processPhase18({
                                    selectedFan: selectedFan,
                                    phase16Row: row,
                                    phase17Motor: phase17Motor,
                                    userPoles: motor?.noOfPoles || motor?.["No of Poles"] || 4,
                                    userPhases: 3,
                                    innerDiameter: selectedFan?.innerDiameter,
                                });

                                // Check for error response
                                if (phase18?.error) {
                                    console.error(`Phase 18 error for row ${idx}:`, phase18.error);
                                    phase18 = null;
                                }
                            } catch (err) {
                                console.error(`Phase 18 calculation error for row ${idx}:`, err);
                            }

                            // Skip this row if Phase 18 failed
                            if (!phase18) {
                                continue;
                            }

                            // Call Phase 19 service for curve data
                            let phase19 = null;
                            if (selectedFan?.curveArrays) {
                                try {
                                    phase19 = centrifugalService.processPhase19({
                                        selectedFan: selectedFan,
                                        phase18Result: phase18,
                                    });
                                    if (phase19?.error) {
                                        console.error(`Phase 19 error for row ${idx}:`, phase19.error);
                                        phase19 = null;
                                    }
                                } catch (err) {
                                    console.error(`Phase 19 calculation error for row ${idx}:`, err);
                                }
                            }

                            // Use phase17Data as phase20 (sound data)
                            const phase20 = phase17Data || null;

                            results.push({
                                phase16Row: row,
                                phase17Motor: phase17Motor,
                                phase18: phase18,
                                phase19: phase19,
                                phase20: phase20,
                                index: idx,
                            });
                        }
                    }

                    // Return results directly as array (matching web version)
                    res.json({
                        message: "✅ Phase 18 All models calculated!",
                        phase18All: results,
                    });
                } catch (err) {
                    console.error("Phase 18 All error:", err);
                    res.status(500).json({ error: err.message, details: err.message });
                }
            });

            // PDF Generation Routes - using Newmodules PDF generators
            // Axial PDF route (prefixed)
            expressApp.post("/api/axial/pdf/datasheet", async (req, res) => {
                try {
                    const { fanData, userInput, units } = req.body;
                    if (!fanData) {
                        return res.status(400).json({ error: 'Fan data is required' });
                    }

                    // Dynamically import the Axial PDF generator from Newmodules
                    if (!generateAxialFanDatasheetPDF) {
                        const pdfModule = await import(getModulePath('server/Newmodules/axial/AxialPDF/axialPdfGenerator.service.js'));
                        generateAxialFanDatasheetPDF = pdfModule.generateFanDatasheetPDF;
                    }

                    const doc = generateAxialFanDatasheetPDF(fanData, userInput, units);
                    // Use fanUnitNo from userInput if available, otherwise fall back to FanModel
                    const fanUnitNo = userInput?.fanUnitNo || fanData.FanModel || 'DataSheet';
                    const sanitizedName = fanUnitNo.replace(/[/\\:*?"<>|]/g, '_');
                    const filename = `${sanitizedName}_datasheet.pdf`;
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
                    doc.pipe(res);
                    doc.end();
                } catch (err) {
                    console.error("Axial PDF generation error:", err);
                    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
                }
            });

            // Centrifugal PDF route
            expressApp.post("/api/centrifugal/pdf/datasheet", async (req, res) => {
                try {
                    const { fanData, userInput, units } = req.body;
                    if (!fanData) {
                        return res.status(400).json({ error: 'Fan data is required' });
                    }

                    // Dynamically import the Centrifugal PDF generator from Newmodules
                    if (!generateCentrifugalFanDatasheetPDF) {
                        const pdfModule = await import(getModulePath('server/Newmodules/centrifugal/CentrifugalPDF/centrifugalPdfGenerator.service.js'));
                        generateCentrifugalFanDatasheetPDF = pdfModule.generateCentrifugalFanDatasheetPDF;
                    }

                    const doc = generateCentrifugalFanDatasheetPDF(fanData, userInput, units);
                    // Use fanUnitNo from userInput if available, otherwise fall back to FanModel
                    const fanUnitNo = userInput?.fanUnitNo || fanData.FanModel || 'DataSheet';
                    const sanitizedName = fanUnitNo.replace(/[/\\:*?"<>|]/g, '_');
                    const filename = `${sanitizedName}_datasheet.pdf`;
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
                    doc.pipe(res);
                    doc.end();
                } catch (err) {
                    console.error("Centrifugal PDF generation error:", err);
                    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
                }
            });

            // Legacy PDF route (uses Axial PDF generator)
            expressApp.post("/api/pdf/datasheet", async (req, res) => {
                try {
                    const { fanData, userInput, units } = req.body;
                    if (!fanData) {
                        return res.status(400).json({ error: 'Fan data is required' });
                    }

                    // Dynamically import the Axial PDF generator from Newmodules
                    if (!generateAxialFanDatasheetPDF) {
                        const pdfModule = await import(getModulePath('server/Newmodules/axial/AxialPDF/axialPdfGenerator.service.js'));
                        generateAxialFanDatasheetPDF = pdfModule.generateFanDatasheetPDF;
                    }

                    const doc = generateAxialFanDatasheetPDF(fanData, userInput, units);
                    // Use fanUnitNo from userInput if available, otherwise fall back to FanModel
                    const fanUnitNo = userInput?.fanUnitNo || fanData.FanModel || 'DataSheet';
                    const sanitizedName = fanUnitNo.replace(/[/\\:*?"<>|]/g, '_');
                    const filename = `${sanitizedName}_datasheet.pdf`;
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
                    doc.pipe(res);
                    doc.end();
                } catch (err) {
                    console.error("PDF generation error:", err);
                    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
                }
            });

            expressApp.post("/api/pdf/datasheet/download", async (req, res) => {
                try {
                    const { fanData, userInput, units } = req.body;
                    if (!fanData) {
                        return res.status(400).json({ error: 'Fan data is required' });
                    }

                    // Dynamically import the Axial PDF generator from Newmodules
                    if (!generateAxialFanDatasheetPDF) {
                        const pdfModule = await import(getModulePath('server/Newmodules/axial/AxialPDF/axialPdfGenerator.service.js'));
                        generateAxialFanDatasheetPDF = pdfModule.generateFanDatasheetPDF;
                    }

                    const doc = generateAxialFanDatasheetPDF(fanData, userInput, units);
                    // Use fanUnitNo from userInput if available, otherwise fall back to FanModel
                    const fanUnitNo = userInput?.fanUnitNo || fanData.FanModel || 'Fan_Report';
                    const sanitizedName = fanUnitNo.replace(/[/\\:*?"<>|]/g, '_');
                    const filename = `${sanitizedName}_datasheet.pdf`;
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    doc.pipe(res);
                    doc.end();
                } catch (err) {
                    console.error("PDF generation error:", err);
                    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
                }
            });

            // Catalog API Routes - List available catalog PDFs
            expressApp.get("/api/catalogs", (req, res) => {
                try {
                    const catalogsPath = isDev
                        ? path.join(__dirname, "Catologs")
                        : path.join(process.resourcesPath, "Catologs");

                    console.log("Catalogs path:", catalogsPath);

                    if (!fs.existsSync(catalogsPath)) {
                        return res.json({ catalogs: [] });
                    }

                    const files = fs.readdirSync(catalogsPath)
                        .filter(file => file.toLowerCase().endsWith('.pdf'))
                        .map(file => ({
                            name: file,
                            displayName: file.replace('.pdf', ''),
                            size: fs.statSync(path.join(catalogsPath, file)).size
                        }));

                    res.json({ catalogs: files });
                } catch (err) {
                    console.error("Catalog list error:", err);
                    res.status(500).json({ error: err.message });
                }
            });

            // Catalog Download Route - Download a specific catalog PDF
            expressApp.get("/api/catalogs/download/:filename", (req, res) => {
                try {
                    const { filename } = req.params;

                    // Security: Prevent directory traversal
                    const sanitizedFilename = path.basename(filename);
                    if (!sanitizedFilename.toLowerCase().endsWith('.pdf')) {
                        return res.status(400).json({ error: 'Invalid file type' });
                    }

                    const catalogsPath = isDev
                        ? path.join(__dirname, "Catologs")
                        : path.join(process.resourcesPath, "Catologs");

                    const filePath = path.join(catalogsPath, sanitizedFilename);

                    if (!fs.existsSync(filePath)) {
                        return res.status(404).json({ error: 'Catalog not found' });
                    }

                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
                    res.setHeader('Content-Length', fs.statSync(filePath).size);

                    const fileStream = fs.createReadStream(filePath);
                    fileStream.pipe(res);
                } catch (err) {
                    console.error("Catalog download error:", err);
                    res.status(500).json({ error: err.message });
                }
            });

            if (fs.existsSync(clientBuildPath)) {
                expressApp.use(express.static(clientBuildPath));

                // Handle React Router - serve index.html for all non-API routes
                expressApp.get("*", (req, res) => {
                    res.sendFile(path.join(clientBuildPath, "index.html"));
                });

                console.log("Static files configured");
            } else {
                console.error("Client build not found at:", clientBuildPath);
            }

            const PORT = 5001;
            server = expressApp.listen(PORT, "127.0.0.1", async () => {
                console.log(`Server running on http://127.0.0.1:${PORT}`);

                // Initialize database if empty
                try {
                    // Set environment variables for the service to find data files
                    process.env.RESOURCES_PATH = resourcesPath;
                    process.env.APP_PATH = appPath;

                    const dbInitPath = getModulePath('server/services/databaseInit.service.js');
                    const { DatabaseInitService } = await import(dbInitPath);
                    await DatabaseInitService.initializeDatabase();
                } catch (dbErr) {
                    console.error("Database auto-init failed:", dbErr);
                }

                resolve();
            });

            server.on("error", (err) => {
                console.error("Server error:", err);
                reject(err);
            });
        } catch (error) {
            console.error("Failed to start server:", error);
            reject(error);
        }
    });
}

// Create the main application window
function createWindow() {
    const { screen } = require("electron");
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // Dynamic window sizing - scale based on screen resolution without upper limits
    const windowWidth = Math.max(Math.floor(screenWidth * 0.85), 900);
    const windowHeight = Math.max(Math.floor(screenHeight * 0.85), 600);

    const resourcesPath = getResourcesPath();
    const iconPath = isDev
        ? path.join(__dirname, "client", "public", "icon-256.png")
        : path.join(resourcesPath, "client", "build", "icon-256.png");

    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        minWidth: 800,
        minHeight: 550,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: iconPath,
        title: "SELECT ME",
        show: false,
        center: true,
        autoHideMenuBar: true,
    });

    // Remove the application menu (File, Edit, View, Window, Help)
    mainWindow.setMenu(null);

    // Load from embedded server
    mainWindow.loadURL("http://127.0.0.1:5001");

    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

// App lifecycle
app.whenReady().then(async () => {
    console.log("Electron app starting...");
    console.log("App is packaged:", app.isPackaged);

    try {
        await startServer();
        console.log("Server started successfully");
        createWindow();
    } catch (error) {
        console.error("Failed to start application:", error);
        app.quit();
    }
});

app.on("window-all-closed", () => {
    if (server) {
        server.close();
    }
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on("before-quit", () => {
    if (server) {
        server.close();
    }
});
