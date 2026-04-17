const { app, BrowserWindow, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const express = require("express");
const cors = require("cors");
const { autoUpdater } = require("electron-updater");
const { ipcMain } = require("electron");

// ============================================
// AUTO-UPDATER CONFIGURATION (Non-blocking)
// ============================================
let updateDownloaded = false;
let downloadedVersion = null;

function setupAutoUpdater() {
  // Only run auto-updater in production
  if (!app.isPackaged) {
    console.log("[AutoUpdater] Skipping in development mode");
    return;
  }

  console.log("[AutoUpdater] Initializing...");
  console.log("[AutoUpdater] Current version:", app.getVersion());

  // Configure auto-updater for non-blocking background downloads
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  
  // Use a separate logger for debugging
  autoUpdater.logger = {
    info: (msg) => console.log("[AutoUpdater INFO]", msg),
    warn: (msg) => console.warn("[AutoUpdater WARN]", msg),
    error: (msg) => console.error("[AutoUpdater ERROR]", msg),
    debug: (msg) => console.log("[AutoUpdater DEBUG]", msg),
  };

  // Helper to safely send update status to renderer
  const sendUpdateStatus = (status, data = {}) => {
    try {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
        mainWindow.webContents.send("update-status", { status, ...data });
        console.log("[AutoUpdater] Sent status to renderer:", status, data);
      }
    } catch (err) {
      console.error("[AutoUpdater] Failed to send status:", err.message);
    }
  };

  // Event: Checking for update
  autoUpdater.on("checking-for-update", () => {
    console.log("[AutoUpdater] Checking for updates...");
    sendUpdateStatus("checking");
  });

  // Event: Update available - download will start automatically
  autoUpdater.on("update-available", (info) => {
    console.log("[AutoUpdater] Update available:", info.version);
    sendUpdateStatus("available", { version: info.version });
  });

  // Event: Update not available
  autoUpdater.on("update-not-available", (info) => {
    console.log("[AutoUpdater] No update available. Current:", app.getVersion());
    sendUpdateStatus("not-available");
  });

  // Event: Download progress - throttle updates to avoid UI flooding
  let lastProgressUpdate = 0;
  autoUpdater.on("download-progress", (progress) => {
    const now = Date.now();
    const percent = Math.round(progress.percent);
    
    // Only send updates every 500ms or at key milestones
    if (now - lastProgressUpdate > 500 || percent === 100 || percent === 0) {
      lastProgressUpdate = now;
      console.log(`[AutoUpdater] Download progress: ${percent}%`);
      sendUpdateStatus("downloading", { 
        percent: percent,
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond
      });
    }
  });

  // Event: Update downloaded - ready to install
  autoUpdater.on("update-downloaded", (info) => {
    console.log("[AutoUpdater] Update downloaded:", info.version);
    updateDownloaded = true;
    downloadedVersion = info.version;
    sendUpdateStatus("downloaded", { version: info.version });
  });

  // Event: Error - handle gracefully without crashing
  autoUpdater.on("error", (err) => {
    console.error("[AutoUpdater] Error:", err.message);
    console.error("[AutoUpdater] Stack:", err.stack);
    sendUpdateStatus("error", { message: err.message });
  });

  // Delay the update check to ensure window is fully loaded
  setTimeout(() => {
    console.log("[AutoUpdater] Starting update check...");
    autoUpdater.checkForUpdates().catch((err) => {
      console.error("[AutoUpdater] Check failed:", err.message);
      sendUpdateStatus("error", { message: err.message });
    });
  }, 3000); // Wait 3 seconds after app start
}

// IPC handler for restart request from renderer - with safety checks
ipcMain.on("restart-app", () => {
  console.log("[AutoUpdater] Restart requested by user");
  
  if (!updateDownloaded) {
    console.warn("[AutoUpdater] No update downloaded, ignoring restart request");
    return;
  }
  
  try {
    console.log("[AutoUpdater] Quitting and installing update silently...");
    
    // Hide the window immediately to avoid white screen during install
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
    
    // Give the app a moment to clean up
    setTimeout(() => {
      // isSilent = true (no installer UI), isForceRunAfter = true (restart app after install)
      // This performs a silent update without showing the installation wizard
      autoUpdater.quitAndInstall(true, true);
    }, 500);
  } catch (err) {
    console.error("[AutoUpdater] Failed to quit and install:", err.message);
    
    // Fallback: try to quit normally
    dialog.showErrorBox(
      "Update Error",
      "Failed to install update automatically. Please restart the app manually."
    );
    app.quit();
  }
});

// IPC handler to check update status on demand
ipcMain.handle("get-update-status", () => {
  return {
    updateDownloaded,
    downloadedVersion,
    currentVersion: app.getVersion()
  };
});

// Load and normalize environment variables immediately
require("dotenv").config();

const isDev = !app.isPackaged;
console.log("Electron app starting...");
console.log("App is packaged:", !isDev);

// PDF generators will be loaded dynamically (ES modules)
let generateAxialFanDatasheetPDF = null;
let generateCentrifugalFanDatasheetPDF = null;

let mainWindow;
let server;
let fanDataCache = null;
let motorDataCache = null;

// Production database path - set by setupProductionDatabase(), used before server starts
let productionDbPath = null;

async function setupProductionDatabase() {
  if (isDev) return;

  // Use database next to exe when running from win-unpacked (portable/testing)
  // Otherwise use userData (installed app)
  const exeDir = path.dirname(app.getPath("exe"));
  const isPortable = exeDir.includes("win-unpacked") || exeDir.includes("linux-unpacked") || exeDir.includes("mac");
  const dbPath = isPortable
    ? path.join(exeDir, "database.db")
    : path.join(app.getPath("userData"), "database.db");
  productionDbPath = dbPath;

  console.log("Configuring production database...");
  console.log("Mode:", isPortable ? "portable (next to exe)" : "installed (userData)");
  console.log("Database path:", dbPath);

  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log("Created database directory:", dbDir);
    }
  } catch (dirErr) {
    console.error("❌ Failed to create database directory:", dirErr.message);
    throw dirErr;
  }

  // Prisma Engine Resolution - MUST run before any Prisma usage
  const enginePaths = [
    path.join(app.getAppPath(), "node_modules", "@prisma", "engines"),
    path.join(process.resourcesPath, "app", "node_modules", "@prisma", "engines"),
  ];
  for (const engineDir of enginePaths) {
    try {
      if (fs.existsSync(engineDir)) {
        const files = fs.readdirSync(engineDir);
        const engineFile = files.find((f) =>
          f.includes("query_engine") && (f.endsWith(".node") || f.endsWith(".exe") || f.endsWith(".dll.node"))
        );
        if (engineFile) {
          const fullEnginePath = path.join(engineDir, engineFile);
          process.env.PRISMA_QUERY_ENGINE_LIBRARY = fullEnginePath;
          process.env.PRISMA_QUERY_ENGINE_BINARY = fullEnginePath;
          console.log("✅ Prisma engine found:", fullEnginePath);
          break;
        }
      }
    } catch (e) {
      // try next path
    }
  }
  if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
    console.warn("⚠️ Prisma engine not found - database may fail");
  }

  // With asar: false, .prisma/client is already in app/node_modules/.prisma/client
  // Also ensure the extraResources copy is available as a fallback
  const appDotPrisma = path.join(app.getAppPath(), "node_modules", ".prisma", "client");
  if (!fs.existsSync(path.join(appDotPrisma, "default.js"))) {
    const extraResourceClient = path.join(process.resourcesPath, "prisma-generated-client");
    if (fs.existsSync(extraResourceClient)) {
      console.log("Copying prisma-generated-client → .prisma/client...");
      fs.mkdirSync(appDotPrisma, { recursive: true });
      const clientFiles = fs.readdirSync(extraResourceClient);
      for (const file of clientFiles) {
        const src = path.join(extraResourceClient, file);
        const dest = path.join(appDotPrisma, file);
        try {
          if (fs.statSync(src).isFile()) fs.copyFileSync(src, dest);
        } catch (e) {
          console.warn(`  ⚠️ Could not copy ${file}: ${e.message}`);
        }
      }
      console.log("✅ .prisma/client installed");
    } else {
      console.warn("⚠️ prisma-generated-client not found in resources");
    }
  } else {
    console.log("✅ .prisma/client already present");
  }

  // Schema version - INCREMENT THIS when you change the Prisma schema!
  const SCHEMA_VERSION = 3; // Bumped: fix motor data lost during migration
  const schemaVersionFile = path.join(dbDir, ".schema_version");
  
  const dbExists = fs.existsSync(dbPath);
  const dbSize = dbExists ? fs.statSync(dbPath).size : 0;
  const MIN_VALID_DB_SIZE = 100 * 1024; // 100KB minimum for valid seeded database
  
  // Check if schema version matches
  let currentSchemaVersion = 0;
  try {
    if (fs.existsSync(schemaVersionFile)) {
      currentSchemaVersion = parseInt(fs.readFileSync(schemaVersionFile, "utf8").trim(), 10) || 0;
    }
  } catch (e) {
    currentSchemaVersion = 0;
  }
  
  const needsSchemaUpdate = currentSchemaVersion < SCHEMA_VERSION;
  if (needsSchemaUpdate && dbExists) {
    console.log(`⚠️ Schema version mismatch (current: ${currentSchemaVersion}, required: ${SCHEMA_VERSION})`);
    console.log("   Database will be replaced with updated template...");
  }
  
  // Copy template if database doesn't exist, is too small, OR schema version changed
  if (!dbExists || dbSize < MIN_VALID_DB_SIZE || needsSchemaUpdate) {
    if (dbExists && dbSize < MIN_VALID_DB_SIZE) {
      console.log(`⚠️ Existing database is too small (${dbSize} bytes), replacing with template...`);
    }
    
    const possiblePaths = [
      path.join(process.resourcesPath, "prisma", "dev.db"),
      path.join(app.getAppPath(), "prisma", "dev.db"),
    ];
    console.log("=== Database Discovery ===");
    let templateDbPath = null;
    for (const p of possiblePaths) {
      const exists = fs.existsSync(p);
      const size = exists ? fs.statSync(p).size : 0;
      console.log(`  ${p} - Exists: ${exists}, Size: ${size} bytes`);
      if (exists && size > MIN_VALID_DB_SIZE) {
        templateDbPath = p;
        break;
      }
    }

    if (templateDbPath) {
      try {
        // Backup old database if it exists and has data
        if (dbExists && dbSize > MIN_VALID_DB_SIZE) {
          const backupPath = dbPath + ".backup";
          fs.copyFileSync(dbPath, backupPath);
          console.log(`📦 Backed up old database to: ${backupPath}`);
        }
        
        fs.copyFileSync(templateDbPath, dbPath);
        const newSize = fs.statSync(dbPath).size;
        console.log(`✅ Copied template database to: ${dbPath} (${newSize} bytes)`);
        
        // Update schema version file
        fs.writeFileSync(schemaVersionFile, String(SCHEMA_VERSION));
        console.log(`✅ Schema version updated to: ${SCHEMA_VERSION}`);
      } catch (e) {
        console.error("❌ Copy failed:", e.message);
        ensureDatabaseFileExists(dbPath);
      }
    } else {
      console.warn("⚠️ Template not found - creating empty database");
      ensureDatabaseFileExists(dbPath);
    }
  } else {
    console.log(`✅ Database exists and is valid (${dbSize} bytes, schema v${currentSchemaVersion})`);
  }

  // Set DATABASE_URL for Prisma
  // Use file: with forward slashes; do NOT encode spaces (%20) as Prisma/SQLite
  // handles literal spaces but fails on %20-encoded paths
  const normalizedDbPath = dbPath.replace(/\\/g, "/");
  const dbUrl = `file:${normalizedDbPath}`;
  process.env.DATABASE_URL = dbUrl;
  process.env.RESOURCES_PATH = process.resourcesPath;
  process.env.APP_PATH = app.getAppPath();
  console.log("DATABASE_URL set to:", process.env.DATABASE_URL);

  // Quick connection test - verify Prisma can connect before server starts
  try {
    const { PrismaClient } = require(
      path.join(app.getAppPath(), "node_modules", "@prisma", "client")
    );
    const testPrisma = new PrismaClient({
      datasources: { db: { url: dbUrl } },
    });
    await testPrisma.$connect();
    await testPrisma.$disconnect();
    console.log("✅ Database connection test passed");
  } catch (connErr) {
    console.error("❌ Database connection test failed:", connErr?.message || connErr);
    if (connErr?.message?.includes("engine") || connErr?.message?.includes("binary")) {
      console.error("   → Prisma engine may not be found. Check PRISMA_QUERY_ENGINE_LIBRARY.");
    }
  }

  // Run migrations and seed in background - don't block app start
  // App window will show immediately; database will be ready shortly
  setImmediate(async () => {
    const DB_SETUP_TIMEOUT_MS = 45000;
    const runWithTimeout = (fn) =>
      Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), DB_SETUP_TIMEOUT_MS)
        ),
      ]);

    const modulePath = path.join(app.getAppPath(), "server", "services");
    const migrationPath = path.join(modulePath, "migrationRunner.service.js");
    const dbInitPath = path.join(modulePath, "databaseInit.service.js");

    try {
      if (fs.existsSync(migrationPath)) {
        const { runMigrations } = await import(pathToFileURL(migrationPath).href);
        await runWithTimeout(() => runMigrations(dbPath));
        console.log("✅ Migrations completed");
      } else {
        console.warn("⚠️ Migration runner not found at:", migrationPath);
      }
    } catch (migErr) {
      console.warn("⚠️ Migrations failed:", migErr?.message || migErr);
    }

    try {
      if (fs.existsSync(dbInitPath)) {
        const { DatabaseInitService } = await import(pathToFileURL(dbInitPath).href);
        await runWithTimeout(() => DatabaseInitService.initializeDatabase());
        console.log("✅ Database initialization completed");
      } else {
        console.warn("⚠️ DatabaseInitService not found at:", dbInitPath);
      }
    } catch (seedErr) {
      console.warn("⚠️ Database seed failed:", seedErr?.message || seedErr);
    }
  });
}

function ensureDatabaseFileExists(dbPath) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, "");
    console.log("✅ Created database file at:", dbPath);
    const stats = fs.statSync(dbPath);
    console.log("   File size:", stats.size, "bytes");
  } catch (err) {
    console.error("❌ Failed to create database file:", err.message);
    console.error("   Path:", dbPath);
    throw err;
  }
}

if (isDev) {
  // Development: normalize relative DATABASE_URL from .env to absolute path
  if (
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.startsWith("file:./")
  ) {
    const relativePath = process.env.DATABASE_URL.replace("file:./", "");
    const absolutePath = path.resolve(__dirname, relativePath).replace(/\\/g, "/");
    process.env.DATABASE_URL = `file:${absolutePath}`;
    console.log("Dev DATABASE_URL normalized:", process.env.DATABASE_URL);
  }
}

function getResourcesPath() {
  return isDev ? __dirname : process.resourcesPath;
}

function getAppPath() {
  return isDev ? __dirname : app.getAppPath();
}

// Helper function to get the correct module path for dynamic imports
// With asar: false, all files are in a normal directory under resources/app
function getModulePath(relativePath) {
  const base = isDev ? __dirname : app.getAppPath();
  const fullPath = path.join(base, relativePath);
  return pathToFileURL(fullPath).href;
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
  "AF-S": "AFS",
  "AF-L": "AFL",
  WF: "WF",
  ARTF: "ARTF",
  SF: "SF",
  "ABSF-C": "ABSFC",
  "ABSF-S": "ABSFS",
  SWF: "SABF",
  SARTF: "SARTF",
  AJF: "AJF",
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
    const x0 = x[i],
      x1 = x[i + 1],
      y0 = y[i],
      y1 = y[i + 1];
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
    const seg =
      xi < segments[0].xMin ? segments[0] : segments[segments.length - 1];
    return seg.a * Math.pow(xi, 3) + seg.b;
  };
}

// Parse JSON field (SQLite stores arrays as strings)
function parseJsonField(val) {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
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
    fans = fans.filter((f) => f[dbColumn] === 1);
  }

  // Unit converters
  const airFlowConverters = {
    "m^3/s": 1,
    "m^3/min": 60,
    "m^3/hr": 3600,
    "L/s": 1000,
    "L/min": 60000,
    "L/hr": 3600000,
    CFM: 2118.880003,
  };
  const pressureConverters = {
    Pa: 1,
    kPa: 0.001,
    bar: 1e-5,
    Psi: 0.000145038,
    "in.wg": 0.004018647,
  };
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

      const convAirFlow = airFlow.map((v) => v * airFlowFactor);
      const AirFlowNew = convAirFlow.map((v) => v * rpmRatio);
      const StaticPressureNew = staticPressure.map(
        (v) => v * pressureFactor * Math.pow(rpmRatio, 2) * densityRatio
      );
      const TotalPressureNew = totPressure.map(
        (v) => v * pressureFactor * Math.pow(rpmRatio, 2) * densityRatio
      );
      const VelocityPressureNew = velPressure.map(
        (v) => v * pressureFactor * Math.pow(rpmRatio, 2) * densityRatio
      );
      const FanInputPowerNew = fanInputPow.map(
        (v) => v * powerFactor * Math.pow(rpmRatio, 3) * densityRatio
      );

      // Efficiency
      const FanTotalEfficiency = fanInputPow.map((pow, i) =>
        pow > 0 ? (totPressure[i] * airFlow[i]) / (pow * 1000) : null
      );
      const FanStaticEfficiency = fanInputPow.map((pow, i) =>
        pow > 0 ? (staticPressure[i] * airFlow[i]) / (pow * 1000) : null
      );

      // Sort by airflow
      const sortedIdx = [...AirFlowNew.keys()].sort(
        (a, b) => AirFlowNew[a] - AirFlowNew[b]
      );
      const xSorted = sortedIdx.map((i) => AirFlowNew[i]);

      const xMin = xSorted[0],
        xMax = xSorted[xSorted.length - 1];
      if (inputAirFlow < xMin || inputAirFlow > xMax) continue;

      // Interpolate
      const spStatic = cubicSpline(
        xSorted,
        sortedIdx.map((i) => StaticPressureNew[i])
      );
      const spPower = cubicSpline(
        xSorted,
        sortedIdx.map((i) => FanInputPowerNew[i])
      );
      const spTotalEff = cubicSpline(
        xSorted,
        sortedIdx.map((i) => FanTotalEfficiency[i])
      );
      const spStaticEff = cubicSpline(
        xSorted,
        sortedIdx.map((i) => FanStaticEfficiency[i])
      );
      const spVelPressure = cubicSpline(
        xSorted,
        sortedIdx.map((i) => VelocityPressureNew[i])
      );

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
        const candidates = motorDataCache
          .filter((m) => {
            const net = m.netpower || m.netPower || 0;
            return net >= requiredPower && m.NoPoles == noPoles;
          })
          .sort((a, b) => (a.netpower || 0) - (b.netpower || 0));
        if (candidates.length > 0) matchedMotor = candidates[0];
      }

      // Build FanModel
      const FanModel = `${fanType || ""}-${fan.impellerInnerDia || ""}-${fan.noBlades || ""
        }\\${fan.bladesAngle || ""}\\${fan.bladesMaterial || ""}${fan.bladesSymbol || ""
        }-${noPoles}${input.NoPhases == 3 ? "T" : "M"}${matchedMotor ? `-${matchedMotor.powerHorse || ""}` : ""
        }`;

      results.push({
        Id: fan.id,
        FanModel,
        RPM: input.RPM,
        InputDensity: inputDensity,
        Blades: {
          symbol: fan.bladesSymbol,
          material: fan.bladesMaterial,
          noBlades: fan.noBlades,
          angle: fan.bladesAngle,
        },
        Impeller: { innerDia: fan.impellerInnerDia, conf: fan.impellerConf },
        AirFlowNew,
        StaticPressureNew,
        TotalPressureNew,
        VelocityPressureNew,
        FanInputPowerNew,
        FanTotalEfficiency,
        FanStaticEfficiency,
        predictions: {
          StaticPressurePred: predStatic,
          FanInputPowerPred: predPower,
          FanTotalEfficiencyPred: predTotalEff,
          FanStaticEfficiencyPred: predStaticEff,
          VelocityPressurePred: predVelPressure,
        },
        matchedMotor,
      });
    } catch (err) {
      // Skip fans with errors
    }
  }

  // Sort by efficiency
  results.sort(
    (a, b) =>
      (b.predictions?.FanTotalEfficiencyPred || 0) -
      (a.predictions?.FanTotalEfficiencyPred || 0)
  );
  return results;
}

// Start embedded Express server
function startServer() {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const resourcesPath = getResourcesPath();
        const appPath = getAppPath();

        console.log("Starting embedded server...");
        console.log("Resources path:", resourcesPath);
        console.log("App path:", appPath);

        const expressApp = express();
        expressApp.use(express.json({ limit: "50mb" }));
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
            const axialService = await import(
              getModulePath(
                "server/Newmodules/axial/AxialFanData/axialFanData.service.js"
              )
            );
            const result = await axialService.Output({
              units,
              input,
              dataSource: "file", // Temporarily using JSON instead of DB
            });
            res.json({ message: "Success", data: result.data || result });
          } catch (err) {
            console.error("Axial API error:", err);
            res.status(500).json({
              error: err.message || "Unknown Axial API error",
              details: err.message,
              stack: isDev ? err.stack : undefined,
            });
          }
        });

        // Centrifugal fan routes - dynamically import the service
        expressApp.post("/api/centrifugal/fan-data/process", async (req, res) => {
          try {
            const { units, input } = req.body;
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );

            // Build inputOptions with selectedFanType extracted from units.fanType
            const inputOptions = {
              filePath: "centrifugalFan.json",
              units: units || {},
              input,
              dataSource: "file", // Temporarily using JSON instead of DB
              selectedFanType: units?.centrifugalFanType || units?.fanType,
            };

            console.log(`\n=== Electron Centrifugal Process ===`);
            console.log(`selectedFanType: ${inputOptions.selectedFanType}`);

            const result = await centrifugalService.processFanDataService(
              inputOptions
            );

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
              stack: isDev ? err.stack : undefined,
            });
          }
        });

        expressApp.post("/api/centrifugal/fan-data/phase11", async (req, res) => {
          try {
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );
            const result = await centrifugalService.processPhase11(req.body);
            res.json({
              message: "✅ Phase 11 calculated successfully!",
              phase11: result,
            });
          } catch (err) {
            console.error("Phase 11 error:", err);
            res.status(500).json({ error: err.message, details: err.message });
          }
        });

        expressApp.post("/api/centrifugal/fan-data/phase12", async (req, res) => {
          try {
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );
            const result = await centrifugalService.processPhase12(req.body);
            res.json({
              message: "✅ Phase 12 calculated successfully!",
              phase12: result,
            });
          } catch (err) {
            console.error("Phase 12 error:", err);
            res.status(500).json({ error: err.message, details: err.message });
          }
        });

        expressApp.post("/api/centrifugal/fan-data/phase13", async (req, res) => {
          try {
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );
            const result = await centrifugalService.processPhase13(req.body);
            res.json({
              message: "✅ Phase 13 calculated successfully!",
              phase13: result,
            });
          } catch (err) {
            console.error("Phase 13 error:", err);
            res.status(500).json({ error: err.message, details: err.message });
          }
        });

        expressApp.post("/api/centrifugal/fan-data/phase14", async (req, res) => {
          try {
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );
            const result = await centrifugalService.processPhase14(req.body);
            res.json({
              message: "✅ Phase 14 calculated successfully!",
              phase14: result,
            });
          } catch (err) {
            console.error("Phase 14 error:", err);
            res.status(500).json({ error: err.message, details: err.message });
          }
        });

        expressApp.post("/api/centrifugal/fan-data/phase15", async (req, res) => {
          try {
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );
            const result = await centrifugalService.processPhase15(req.body);
            res.json({
              message: "✅ Phase 15 calculated successfully!",
              phase15: result,
            });
          } catch (err) {
            console.error("Phase 15 error:", err);
            res.status(500).json({ error: err.message, details: err.message });
          }
        });

        expressApp.post("/api/centrifugal/fan-data/phase16", async (req, res) => {
          try {
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );
            const result = centrifugalService.processPhase16(req.body);
            res.json({
              message: "✅ Phase 16 calculated successfully!",
              phase16: result,
            });
          } catch (err) {
            console.error("Phase 16 error:", err);
            res.status(500).json({ error: err.message, details: err.message });
          }
        });

        // Phase 18 - Final output table (individual row)
        expressApp.post("/api/centrifugal/fan-data/phase18", async (req, res) => {
          try {
            const { selectedFan, phase16Row, phase17Motor, userPoles, userPhases, innerDiameter } = req.body;
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );
            const result = centrifugalService.processPhase18({
              selectedFan,
              phase16Row,
              phase17Motor,
              userPoles: userPoles || 4,
              userPhases: userPhases || 3,
              innerDiameter,
            });
            res.json({
              message: "✅ Phase 18 calculated successfully!",
              phase18: result,
            });
          } catch (err) {
            console.error("Phase 18 error:", err);
            res.status(500).json({ error: err.message, details: err.message });
          }
        });

        // Phase 17 - Sound data calculation (uses Phase 20 logic)
        expressApp.post("/api/centrifugal/fan-data/phase17", async (req, res) => {
          try {
            const { selectedFan, distance, directivityQ } = req.body;
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );

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

            res.json({
              message: "✅ Phase 17 sound data calculated!",
              phase17: result,
            });
          } catch (err) {
            console.error("Phase 17 error:", err);
            res.status(500).json({ error: err.message, details: err.message });
          }
        });

        // Phase 19 - Fan curve data with speed adjustment
        expressApp.post("/api/centrifugal/fan-data/phase19", async (req, res) => {
          try {
            const { selectedFan, phase18Result } = req.body;
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );

            const result = centrifugalService.processPhase19({
              selectedFan,
              phase18Result,
            });

            res.json({
              message: "✅ Phase 19 curve data calculated!",
              phase19: result,
            });
          } catch (err) {
            console.error("Phase 19 error:", err);
            res.status(500).json({ error: err.message, details: err.message });
          }
        });

        // Phase 20 - Noise data calculation (LW(A) and LP(A))
        expressApp.post("/api/centrifugal/fan-data/phase20", async (req, res) => {
          try {
            const { phase18Result, distance, directivityQ, safetyFactor } = req.body;
            const centrifugalService = await import(
              getModulePath(
                "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
              )
            );
            const result = centrifugalService.processPhase20({
              phase18Result,
              distance: distance ? parseFloat(distance) : 3,
              directivityQ: directivityQ ? parseFloat(directivityQ) : 1,
              safetyFactor: safetyFactor ? parseFloat(safetyFactor) : 0.1,
            });
            res.json({
              message: "✅ Phase 20 noise data calculated!",
              phase20: result,
            });
          } catch (err) {
            console.error("Phase 20 error:", err);
            res.status(500).json({ error: err.message, details: err.message });
          }
        });

        expressApp.post(
          "/api/centrifugal/fan-data/phase18-all",
          async (req, res) => {
            try {
              const { phase16Data, phase13Motors, phase17Data, selectedFan } =
                req.body;

              // Import centrifugal service for Phase 18 and Phase 19 calculations
              const centrifugalService = await import(
                getModulePath(
                  "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.service.js"
                )
              );

              // Build consolidated results array - MUST match web version structure
              // Web version calls Phase 18 service for EACH row to apply fan affinity laws
              const results = [];
              const rows = phase16Data?.rows || phase16Data || [];

              if (Array.isArray(rows)) {
                for (let idx = 0; idx < rows.length; idx++) {
                  const row = rows[idx];
                  // Get motor from phase13Motors - use row.index if available, otherwise use idx
                  const motorIdx = row.index !== undefined ? row.index : idx;
                  const motor =
                    phase13Motors?.[motorIdx] || phase13Motors?.[idx] || null;

                  // Build phase17Motor - use Phase 13 motor object directly
                  // Phase 13 service returns: model, powerKW, powerHP, noOfPoles, noOfPhases,
                  // efficiency50Hz, insulationClass, shaftDiameterMM, shaftKeyLengthMM
                  const phase17Motor = motor
                    ? {
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
                    }
                    : null;

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
                      console.error(
                        `Phase 18 error for row ${idx}:`,
                        phase18.error
                      );
                      phase18 = null;
                    }
                  } catch (err) {
                    console.error(
                      `Phase 18 calculation error for row ${idx}:`,
                      err
                    );
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
                        console.error(
                          `Phase 19 error for row ${idx}:`,
                          phase19.error
                        );
                        phase19 = null;
                      }
                    } catch (err) {
                      console.error(
                        `Phase 19 calculation error for row ${idx}:`,
                        err
                      );
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
          }
        );

        // PDF Generation Routes - using Newmodules PDF generators
        // Axial PDF route (prefixed)
        expressApp.post("/api/axial/pdf/datasheet/:filename?", async (req, res) => {
          try {
            const { fanData, userInput, units } = req.body;
            if (!fanData) {
              return res.status(400).json({ error: "Fan data is required" });
            }

            // Dynamically import the Axial PDF generator from Newmodules
            if (!generateAxialFanDatasheetPDF) {
              const pdfModule = await import(
                getModulePath(
                  "server/Newmodules/axial/AxialPDF/axialPdfGenerator.service.js"
                )
              );
              generateAxialFanDatasheetPDF = pdfModule.generateFanDatasheetPDF;
            }

            const doc = generateAxialFanDatasheetPDF(fanData, userInput, units);
            // Use fanUnitNo from userInput if available, otherwise fall back to FanModel
            const fanUnitNo =
              userInput?.fanUnitNo || fanData.FanModel || "DataSheet";
            const sanitizedName = fanUnitNo.replace(/[/\\:*?"<>|]/g, "_");
            const filename = `${sanitizedName}_datasheet.pdf`;
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `inline; filename="${filename}"`
            );
            doc.pipe(res);
            doc.end();
          } catch (err) {
            console.error("Axial PDF generation error:", err);
            res
              .status(500)
              .json({ error: "Failed to generate PDF", details: err.message });
          }
        });

        // Centrifugal PDF route
        expressApp.post("/api/centrifugal/pdf/datasheet/:filename?", async (req, res) => {
          try {
            const { fanData, userInput, units } = req.body;
            if (!fanData) {
              return res.status(400).json({ error: "Fan data is required" });
            }

            // Dynamically import the Centrifugal PDF generator from Newmodules
            if (!generateCentrifugalFanDatasheetPDF) {
              const pdfModule = await import(
                getModulePath(
                  "server/Newmodules/centrifugal/CentrifugalPDF/centrifugalPdfGenerator.service.js"
                )
              );
              generateCentrifugalFanDatasheetPDF =
                pdfModule.generateCentrifugalFanDatasheetPDF;
            }

            const doc = generateCentrifugalFanDatasheetPDF(
              fanData,
              userInput,
              units
            );
            // Use fanUnitNo from userInput if available, otherwise fall back to FanModel
            const fanUnitNo =
              userInput?.fanUnitNo || fanData.FanModel || "DataSheet";
            const sanitizedName = fanUnitNo.replace(/[/\\:*?"<>|]/g, "_");
            const filename = `${sanitizedName}_datasheet.pdf`;
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `inline; filename="${filename}"`
            );
            doc.pipe(res);
            doc.end();
          } catch (err) {
            console.error("Centrifugal PDF generation error:", err);
            res
              .status(500)
              .json({ error: "Failed to generate PDF", details: err.message });
          }
        });

        // Legacy PDF route (uses Axial PDF generator)
        expressApp.post("/api/pdf/datasheet", async (req, res) => {
          try {
            const { fanData, userInput, units } = req.body;
            if (!fanData) {
              return res.status(400).json({ error: "Fan data is required" });
            }

            // Dynamically import the Axial PDF generator from Newmodules
            if (!generateAxialFanDatasheetPDF) {
              const pdfModule = await import(
                getModulePath(
                  "server/Newmodules/axial/AxialPDF/axialPdfGenerator.service.js"
                )
              );
              generateAxialFanDatasheetPDF = pdfModule.generateFanDatasheetPDF;
            }

            const doc = generateAxialFanDatasheetPDF(fanData, userInput, units);
            // Use fanUnitNo from userInput if available, otherwise fall back to FanModel
            const fanUnitNo =
              userInput?.fanUnitNo || fanData.FanModel || "DataSheet";
            const sanitizedName = fanUnitNo.replace(/[/\\:*?"<>|]/g, "_");
            const filename = `${sanitizedName}_datasheet.pdf`;
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `inline; filename="${filename}"`
            );
            doc.pipe(res);
            doc.end();
          } catch (err) {
            console.error("PDF generation error:", err);
            res
              .status(500)
              .json({ error: "Failed to generate PDF", details: err.message });
          }
        });

        expressApp.post("/api/pdf/datasheet/download", async (req, res) => {
          try {
            const { fanData, userInput, units } = req.body;
            if (!fanData) {
              return res.status(400).json({ error: "Fan data is required" });
            }

            // Dynamically import the Axial PDF generator from Newmodules
            if (!generateAxialFanDatasheetPDF) {
              const pdfModule = await import(
                getModulePath(
                  "server/Newmodules/axial/AxialPDF/axialPdfGenerator.service.js"
                )
              );
              generateAxialFanDatasheetPDF = pdfModule.generateFanDatasheetPDF;
            }

            const doc = generateAxialFanDatasheetPDF(fanData, userInput, units);
            // Use fanUnitNo from userInput if available, otherwise fall back to FanModel
            const fanUnitNo =
              userInput?.fanUnitNo || fanData.FanModel || "Fan_Report";
            const sanitizedName = fanUnitNo.replace(/[/\\:*?"<>|]/g, "_");
            const filename = `${sanitizedName}_datasheet.pdf`;
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${filename}"`
            );
            doc.pipe(res);
            doc.end();
          } catch (err) {
            console.error("PDF generation error:", err);
            res
              .status(500)
              .json({ error: "Failed to generate PDF", details: err.message });
          }
        });

        // Centrifugal Data Admin routes (pulleys, belt-standards, pulley-standards, casing pricing CRUD)
        // Must match server/index.js: app.use("/api/centrifugal/data", centrifugalDataAdminRoutes)
        try {
          const centrifugalDataAdminModule = await import(
            getModulePath(
              "server/Newmodules/centrifugal/CentrifugalDataAdmin/centrifugalDataAdmin.router.js"
            )
          );
          expressApp.use("/api/centrifugal/data", centrifugalDataAdminModule.default);
          console.log("✅ Centrifugal data admin routes mounted at /api/centrifugal/data");
        } catch (err) {
          console.warn("⚠️ Could not mount centrifugal data admin routes:", err.message);
        }

        // Centrifugal Fan Data CRUD routes (GET/POST fan-data, PUT/DELETE :id for admin page)
        // Must match server/index.js: app.use("/api/centrifugal/fan-data", centrifugalFanDataRoutes)
        try {
          const centrifugalFanDataModule = await import(
            getModulePath(
              "server/Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.route.js"
            )
          );
          expressApp.use("/api/centrifugal/fan-data", centrifugalFanDataModule.default);
          console.log("✅ Centrifugal fan data routes mounted at /api/centrifugal/fan-data");
        } catch (err) {
          console.warn("⚠️ Could not mount centrifugal fan data routes:", err.message);
        }

        // Axial Fan Data CRUD routes (admin page: list, add, edit, delete fans + export/import)
        try {
          const axialFanDataModule = await import(
            getModulePath("server/Newmodules/axial/AxialFanData/axialFanData.route.js")
          );
          expressApp.use("/api/axial/fan-data", axialFanDataModule.default);
          expressApp.use("/api/fan-data", axialFanDataModule.default);
          console.log("✅ Axial fan data routes mounted at /api/axial/fan-data & /api/fan-data");
        } catch (err) {
          console.warn("⚠️ Could not mount axial fan data routes:", err.message);
        }

        // Axial Motor Data CRUD routes (admin page: list, add, edit, delete motors + export/import)
        try {
          const axialMotorDataModule = await import(
            getModulePath("server/Newmodules/axial/AxialMotorData/axialMotorData.route.js")
          );
          expressApp.use("/api/motor-data", axialMotorDataModule.default);
          console.log("✅ Axial motor data routes mounted at /api/motor-data");
        } catch (err) {
          console.error("❌ Could not mount axial motor data routes:", err.message);
          console.error("   Stack:", err.stack);
          // Fallback: return a clear JSON error so the client doesn't get HTML
          expressApp.all("/api/motor-data/*", (req, res) => {
            res.status(503).json({ error: "Motor data service unavailable", details: err.message });
          });
          expressApp.all("/api/motor-data", (req, res) => {
            res.status(503).json({ error: "Motor data service unavailable", details: err.message });
          });
        }

        // Axial Pricing routes (items, accessories, impeller, casing)
        try {
          const axialPricingModule = await import(
            getModulePath("server/Newmodules/axial/AxialPricing/axialPricing.routes.js")
          );
          expressApp.use("/api/axial/pricing", axialPricingModule.default);
          console.log("✅ Axial pricing routes mounted at /api/axial/pricing");
        } catch (err) {
          console.warn("⚠️ Could not mount axial pricing routes:", err.message);
        }

        // Pricing compatibility routes (/api/pricing/axial-impeller, /api/pricing/axial-casing, /api/pricing/items, /api/pricing/categories)
        try {
          const { axialImpellerRoutes } = await import(
            getModulePath("server/Newmodules/axial/AxialPricing/AxialImpeller/index.js")
          );
          const { axialCasingRoutes } = await import(
            getModulePath("server/Newmodules/axial/AxialPricing/AxialCasing/index.js")
          );
          const { pricingItemsRoutes } = await import(
            getModulePath("server/Newmodules/axial/AxialPricing/Pricing_Items/index.js")
          );
          const pricingCompatRouter = express.Router();
          pricingCompatRouter.use("/axial-impeller", axialImpellerRoutes);
          pricingCompatRouter.use("/axial-casing", axialCasingRoutes);
          pricingCompatRouter.use("/", pricingItemsRoutes);
          expressApp.use("/api/pricing", pricingCompatRouter);
          console.log("✅ Pricing compat routes mounted at /api/pricing");
        } catch (err) {
          console.warn("⚠️ Could not mount pricing compat routes:", err.message);
        }

        // Accessories Pricing routes
        try {
          const { accessoriesRoutes } = await import(
            getModulePath("server/Newmodules/axial/AxialPricing/index.js")
          );
          expressApp.use("/api/accessories-pricing", accessoriesRoutes);
          console.log("✅ Accessories pricing routes mounted at /api/accessories-pricing");
        } catch (err) {
          console.warn("⚠️ Could not mount accessories pricing routes:", err.message);
        }

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

            const files = fs
              .readdirSync(catalogsPath)
              .filter((file) => file.toLowerCase().endsWith(".pdf"))
              .map((file) => ({
                name: file,
                displayName: file.replace(".pdf", ""),
                size: fs.statSync(path.join(catalogsPath, file)).size,
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
            if (!sanitizedFilename.toLowerCase().endsWith(".pdf")) {
              return res.status(400).json({ error: "Invalid file type" });
            }

            const catalogsPath = isDev
              ? path.join(__dirname, "Catologs")
              : path.join(process.resourcesPath, "Catologs");

            const filePath = path.join(catalogsPath, sanitizedFilename);

            if (!fs.existsSync(filePath)) {
              return res.status(404).json({ error: "Catalog not found" });
            }

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${sanitizedFilename}"`
            );
            res.setHeader("Content-Length", fs.statSync(filePath).size);

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
            if (req.path.startsWith("/api")) {
              // API route not found - return JSON 404 instead of HTML
              return res.status(404).json({ error: "API endpoint not found", path: req.path });
            }
            res.sendFile(path.join(clientBuildPath, "index.html"));
          });

          console.log("Static files configured");
        } else {
          console.error("Client build not found at:", clientBuildPath);
        }

        const PORT = 5001;
        server = expressApp.listen(PORT, "127.0.0.1", async () => {
          console.log(`Server running on http://127.0.0.1:${PORT}`);

          // Initialize database - create schema and seed if needed
          try {
            // Set environment variables for the service to find data files
            process.env.RESOURCES_PATH = resourcesPath;
            process.env.APP_PATH = appPath;

            // Check if database already has data (was copied from template)
            let databaseNeedsSetup = true;
            if (!isDev) {
              try {
                const dbPathFromEnv = process.env.DATABASE_URL
                  ? decodeURIComponent(process.env.DATABASE_URL.replace(/^file:/, ""))
                  : null;
                if (dbPathFromEnv && fs.existsSync(dbPathFromEnv)) {
                  const dbStats = fs.statSync(dbPathFromEnv);
                  console.log(
                    `📊 Database file size: ${(dbStats.size / 1024).toFixed(
                      2
                    )} KB`
                  );

                  // If database is larger than 1KB, it likely has data
                  if (dbStats.size > 1024) {
                    // Quick check: try to query if tables exist
                    const { PrismaClient } = require(
                      path.join(app.getAppPath(), "node_modules", "@prisma", "client")
                    );
                    const testPrisma = new PrismaClient({
                      datasources: {
                        db: { url: process.env.DATABASE_URL },
                      },
                    });

                    try {
                      const fanCount = await testPrisma.fanData.count();
                      const centrifugalCount =
                        await testPrisma.centrifugalFanData.count();
                      console.log(
                        `📊 Database check: ${fanCount} axial fans, ${centrifugalCount} centrifugal fans`
                      );

                      if (fanCount > 0 || centrifugalCount > 0) {
                        console.log(
                          "✅ Database already has data - skipping seeding (migrations will still run)"
                        );
                        databaseNeedsSetup = false;
                      } else {
                        console.log(
                          "⚠️ Database exists but is empty - will run migrations and seed"
                        );
                      }
                    } catch (queryErr) {
                      console.log(
                        "⚠️ Could not query database (may need migrations):",
                        queryErr.message
                      );
                      // Database might need migrations
                    } finally {
                      await testPrisma.$disconnect();
                    }
                  }
                }
              } catch (checkErr) {
                console.warn(
                  "⚠️ Could not check database status:",
                  checkErr.message
                );
              }
            }

            // Always run migrations to apply pending schema changes
            if (!isDev) {
              try {
                const migrationRunnerPath = getModulePath(
                  "server/services/migrationRunner.service.js"
                );
                const { runMigrations } = await import(migrationRunnerPath);
                const dbPathFromEnv = process.env.DATABASE_URL
                  ? decodeURIComponent(process.env.DATABASE_URL.replace(/^file:/, ""))
                  : null;
                if (dbPathFromEnv) {
                  console.log("🔄 Ensuring database schema is up to date...");
                  const normalizedPath = dbPathFromEnv.replace(/\//g, path.sep);
                  await runMigrations(normalizedPath);
                } else {
                  console.warn("⚠️ DATABASE_URL not set, skipping migrations");
                }
              } catch (migrationErr) {
                console.error(
                  "⚠️ Migration runner failed (will continue):",
                  migrationErr.message
                );
                console.error("Migration error details:", migrationErr);
              }
            }

            // Only run seeding if database needs setup
            if (databaseNeedsSetup) {
              // Initialize and seed the database
              const dbInitPath = getModulePath(
                "server/services/databaseInit.service.js"
              );
              const { DatabaseInitService } = await import(dbInitPath);
              await DatabaseInitService.initializeDatabase();
            }
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
    })();
  });
}

// Create the main application window
function createWindow() {
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;

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
      preload: path.join(__dirname, "preload.js"),
    },
    icon: iconPath,
    title: "SELECT ME",
    show: false,
    center: true,
    autoHideMenuBar: true,
  });

  // Use a minimal hidden menu that preserves Edit role shortcuts
  // (without this, Ctrl+A/C/V/X and double-click select break in Electron)
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
  ]));
  mainWindow.setMenuBarVisibility(false);

  // Load from embedded server
  mainWindow.loadURL("http://127.0.0.1:5001");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Recover from white screen / load failures by retrying after a short delay
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error(`[Window] Load failed: ${errorCode} ${errorDescription}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(() => {
        console.log("[Window] Retrying page load...");
        mainWindow.loadURL("http://127.0.0.1:5001");
      }, 2000);
    }
  });

  // Handle renderer process crash / unresponsive
  mainWindow.webContents.on("render-process-gone", (event, details) => {
    console.error("[Window] Renderer process gone:", details.reason);
    if (mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(() => {
        console.log("[Window] Reloading after renderer crash...");
        mainWindow.loadURL("http://127.0.0.1:5001");
      }, 2000);
    }
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
    // Production: set up database path, create database.db, migrate, and seed before server starts
    if (!isDev) {
      await setupProductionDatabase();
    }
    await startServer();
    console.log("Server started successfully");
    createWindow();
    
    // Check for updates after window is created
    setupAutoUpdater();
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
