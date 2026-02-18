import fs from "fs";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prisma client - lazy loaded only when needed (for database mode)
// This allows the module to work in Electron desktop where @prisma/client may not be available
let prisma = null;
async function getPrismaClient() {
  if (!prisma) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const dbUrl = process.env.DATABASE_URL;

      console.log(`Axial Service: Initializing PrismaClient with URL: ${dbUrl}`);

      const options = {};
      if (dbUrl) {
        options.datasources = {
          db: {
            url: dbUrl
          }
        };
      }

      prisma = new PrismaClient(options);

      // Test connection
      await prisma.$connect();
      console.log("Axial Service: Prisma connected successfully");

    } catch (err) {
      console.error("Axial Service: Prisma client not available or connection failed:", err.message);
      if (err.message.includes('engine') || err.message.includes('binary')) {
        console.error("This looks like a Prisma engine resolution error. Check PRISMA_QUERY_ENGINE_LIBRARY environment variable.");
      }
      prisma = null;
    }
  }
  return prisma;
}

// Calculate density based on temperature
function calcDensity(tempC) {
  let temp = Number(tempC);
  if (isNaN(temp))
    throw new Error("Invalid temperature for density calculation");
  let den = 101325 / ((temp + 273.15) * 287.1);

  return Math.round(den * 100) / 100;
  // return den;
}

// Convert fan measurement units
function convertFanUnits(fan, units = {}) {
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

  const powerConverters = {
    kW: 1,
    W: 1000,
    HP: 1.34,
  };

  const convertArray = (arr, factor) =>
    arr.map((v) => (typeof v === "number" && !isNaN(v) ? v * factor : null));

  const airFlowUnit = units.airFlow || "m^3/s";
  const pressureUnit = units.pressure || "Pa";
  const powerUnit = units.power || "kW";

  return {
    ...fan,
    convAirFlow: convertArray(fan.airFlow, airFlowConverters[airFlowUnit]),
    convTotPressure: convertArray(
      fan.totPressure,
      pressureConverters[pressureUnit]
    ),
    convVelPressure: convertArray(
      fan.velPressure,
      pressureConverters[pressureUnit]
    ),
    convStaticPressure: convertArray(
      fan.staticPressure,
      pressureConverters[pressureUnit]
    ),
    convFanInputPow: convertArray(fan.fanInputPow, powerConverters[powerUnit]),
  };
}

// Recalculate performance with RPM and density scaling
function recalcFanPerformance(fan, input) {
  const inputDensity = calcDensity(input.TempC);
  const rpmRatio = input.RPM / fan.RPM;
  const densityRatio = inputDensity / fan.desigDensity;

  const scaleArray = (arr, factor) =>
    arr.map((v) => (typeof v === "number" && !isNaN(v) ? v * factor : null));

  const AirFlowNew = scaleArray(fan.convAirFlow, rpmRatio);
  const TotalPressureNew = scaleArray(
    fan.convTotPressure,
    Math.pow(rpmRatio, 2) * densityRatio
  );
  const VelocityPressureNew = scaleArray(
    fan.convVelPressure,
    Math.pow(rpmRatio, 2) * densityRatio
  );
  const StaticPressureNew = scaleArray(
    fan.convStaticPressure,
    Math.pow(rpmRatio, 2) * densityRatio
  );
  const FanInputPowerNew = scaleArray(
    fan.convFanInputPow,
    Math.pow(rpmRatio, 3) * densityRatio
  );

  // Efficiency using OLD converted data
  const FanTotalEfficiency = fan.fanInputPow.map((pow, i) => {
    const p = fan.totPressure[i] ?? 0;
    const q = fan.airFlow[i] ?? 0;
    return pow && pow > 0 ? (p * q) / (pow * 1000) : null;
  });

  const FanStaticEfficiency = fan.fanInputPow.map((pow, i) => {
    const p = fan.staticPressure[i] ?? 0;
    const q = fan.airFlow[i] ?? 0;
    return pow && pow > 0 ? (p * q) / (pow * 1000) : null;
  });

  return {
    InputDensity: inputDensity,
    ...fan,
    AirFlowNew,
    TotalPressureNew,
    VelocityPressureNew,
    StaticPressureNew,
    FanInputPowerNew,
    FanTotalEfficiency,
    FanStaticEfficiency,
  };
}

// Main Service Function
// Map frontend fan type values to database column names
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

export async function processFanDataService(inputOptions) {
  const { filePath, units, input, dataSource } = inputOptions;
  const fanType = units?.fanType;

  let rawData = [];

  // If caller explicitly requests DB or passes filePath === 'db', fetch from DB
  if (dataSource === "db" || filePath === "db") {
    // Build where clause to filter by fan type if provided
    const whereClause = {};
    if (fanType && fanTypeToDbColumn[fanType]) {
      const dbColumn = fanTypeToDbColumn[fanType];
      whereClause[dbColumn] = 1;
      console.log(`[FanFilter] Filtering DB by ${dbColumn}=1 for fanType="${fanType}"`);
    } else if (fanType) {
      console.warn(`[FanFilter] ⚠️ fanType="${fanType}" not found in fanTypeToDbColumn map — no type filter applied`);
    } else {
      console.warn(`[FanFilter] ⚠️ No fanType provided — returning all fans unfiltered`);
    }

    // read from Prisma FanData table and map DB rows to the expected nested shape
    const prismaClient = await getPrismaClient();
    if (!prismaClient) throw new Error("Database not available");
    const rows = await prismaClient.fanData.findMany({ where: whereClause });
    console.log(`[FanFilter] DB query returned ${rows.length} rows`);
    rawData = rows
      .map((r) => ({
        // map flattened DB fields to the nested structure the rest of the service expects
        Id: r.id,
        No: r.No, // Include the No field from database
        Model: r.Model, // Include the Model field from database
        Blades: {
          symbol: r.bladesSymbol,
          material: r.bladesMaterial,
          noBlades: r.noBlades,
          angle: r.bladesAngle,
        },
        Impeller: {
          innerDia: r.impellerInnerDia,
          conf: r.impellerConf,
        },
        desigDensity: r.desigDensity,
        RPM: r.RPM,
        // Prisma returns Json columns as parsed JS values
        airFlow: JSON.parse(r.airFlow),
        totPressure: JSON.parse(r.totPressure),
        velPressure: JSON.parse(r.velPressure),
        staticPressure: JSON.parse(r.staticPressure),
        fanInputPow: JSON.parse(r.fanInputPow),
        hubType: r.hubType,
        // keep some direct fields for compatibility
        bladesSymbol: r.bladesSymbol,
        bladesMaterial: r.bladesMaterial,
        noBlades: r.noBlades,
        bladesAngle: r.bladesAngle,
        impellerConf: r.impellerConf,
        impellerInnerDia: r.impellerInnerDia,
        // Fan type flags
        AFS: r.AFS,
        AFL: r.AFL,
        WF: r.WF,
        ARTF: r.ARTF,
        SF: r.SF,
        ABSFC: r.ABSFC,
        ABSFS: r.ABSFS,
        SABF: r.SABF,
        SARTF: r.SARTF,
        AJF: r.AJF,
      }))
      .sort((a, b) => a.Id - b.Id);
  } else {
    // Use DB only (no JSON fallback)
    const prismaClient = await getPrismaClient();
    if (!prismaClient) throw new Error("Database not available");
    const rows = await prismaClient.fanData.findMany();
    rawData = rows
      .map((r) => ({
        Id: r.id,
        No: r.No,
        Model: r.Model,
        AFS: r.AFS,
        AFL: r.AFL,
        WF: r.WF,
        ARTF: r.ARTF,
        SF: r.SF,
        ABSFC: r.ABSFC,
        ABSFS: r.ABSFS,
        SABF: r.SABF,
        SARTF: r.SARTF,
        AJF: r.AJF,
        Blades: {
          symbol: r.bladesSymbol,
          material: r.bladesMaterial,
          noBlades: r.noBlades,
          angle: r.bladesAngle,
        },
        hubType: r.hubType,
        Impeller: { conf: r.impellerConf, innerDia: r.impellerInnerDia },
        desigDensity: r.desigDensity,
        RPM: r.RPM,
        airFlow: typeof r.airFlow === "string" ? JSON.parse(r.airFlow) : r.airFlow,
        totPressure: typeof r.totPressure === "string" ? JSON.parse(r.totPressure) : r.totPressure,
        velPressure: typeof r.velPressure === "string" ? JSON.parse(r.velPressure) : r.velPressure,
        staticPressure: typeof r.staticPressure === "string" ? JSON.parse(r.staticPressure) : r.staticPressure,
        fanInputPow: typeof r.fanInputPow === "string" ? JSON.parse(r.fanInputPow) : r.fanInputPow,
      }))
      .sort((a, b) => (a.Id - b.Id));
    if (fanType && fanTypeToDbColumn[fanType]) {
      const dbColumn = fanTypeToDbColumn[fanType];
      const beforeCount = rawData.length;
      rawData = rawData.filter((fan) => fan[dbColumn] === 1);
      console.log(`[FanFilter] DB: filtered ${beforeCount} → ${rawData.length} fans by ${dbColumn}=1`);
    }
  }

  const convertedData = rawData.map((fan) => convertFanUnits(fan, units));
  const recalculatedData = convertedData.map((fan) =>
    recalcFanPerformance(fan, input)
  );
  // Save outputs for verification
  // fs.writeFileSync(
  //   "recalculated_output.json",
  //   JSON.stringify(recalculatedData, null, 2),
  //   "utf8"
  // );

  return { convertedData, recalculatedData };
}


// Linear Interpolation (matches C# FanCalculationService.cs)
// Used for fan performance predictions - same as WPF application

class LinearInterpolator {
  constructor(xValues, yValues) {
    this.xValues = xValues;
    this.yValues = yValues;
  }

  // Linear interpolation formula: y = y1 + (y2 - y1) * (x - x1) / (x2 - x1)
  // Matches C# FanCalculationService.LinearInterpolate exactly
  linearInterpolate(x1, y1, x2, y2, x) {
    const ZeroThreshold = 1e-10;
    if (Math.abs(x2 - x1) < ZeroThreshold) {
      return y1; // Avoid division by zero
    }
    const t = (x - x1) / (x2 - x1);
    return y1 + (y2 - y1) * t;
  }

  // Interpolate value at target X
  at(targetX) {
    const xValues = this.xValues;
    const yValues = this.yValues;
    const MinPointSpacing = 1e-6;

    // Handle single point case
    if (xValues.length === 1) {
      return yValues[0];
    }

    // Find two points that bracket the target value
    for (let i = 0; i < xValues.length - 1; i++) {
      const x1 = xValues[i];
      const x2 = xValues[i + 1];

      // Skip if points are too close
      if (Math.abs(x2 - x1) < MinPointSpacing) continue;

      // Check if target is between these two points
      const isBetween = (x1 <= targetX && targetX <= x2) ||
        (x2 <= targetX && targetX <= x1);

      if (isBetween) {
        return this.linearInterpolate(x1, yValues[i], x2, yValues[i + 1], targetX);
      }
    }

    // If outside range, return nearest value
    if (targetX < xValues[0]) {
      return yValues[0];
    } else {
      return yValues[yValues.length - 1];
    }
  }
}

function cubicSpline(x, y) {
  // Filter out invalid data points (null, NaN, Infinity)
  // Data comes pre-sorted from loadFansFromRecalculatedOutput
  const xClean = [];
  const yClean = [];

  for (let i = 0; i < x.length; i++) {
    if (Number.isFinite(x[i]) && Number.isFinite(y[i])) {
      xClean.push(x[i]);
      yClean.push(y[i]);
    }
  }

  // Need at least 2 points for interpolation
  if (xClean.length < 2) {
    const fallbackY = yClean.length === 1 ? yClean[0] : 0;
    return () => fallbackY;
  }

  // Use linear interpolation to match C# WPF behavior
  const interpolator = new LinearInterpolator(xClean, yClean);
  return (xi) => interpolator.at(xi);
}

function loadFansFromRecalculatedOutput(fans) {
  const curveNames = [
    "StaticPressureNew",
    "VelocityPressureNew",
    "FanInputPowerNew",
    "FanStaticEfficiency",
    "FanTotalEfficiency",
  ];

  const PredNames = [
    "StaticPressurePred",
    "VelocityPressurePred",
    "FanInputPowerPred",
    "FanStaticEfficiencyPred",
    "FanTotalEfficiencyPred",
  ];

  const xPerFan = [];
  const yPerFan = [];

  fans.forEach((fan, fanIdx) => {
    const xRaw = fan["AirFlowNew"]; // X-axis values per fan
    if (!Array.isArray(xRaw) || xRaw.length !== 10) {
      throw new Error(`Fan ${fanIdx + 1}: expected 10 AirFlowNew values`);
    }

    // Build curves in requested order
    const curvesRaw = curveNames.map((name) => {
      const arr = fan[name];
      if (!Array.isArray(arr) || arr.length !== 10) {
        throw new Error(`Fan ${fanIdx + 1}: expected 10 values for ${name}`);
      }
      return arr;
    });

    // Ensure X ascending with consistent Y reordering
    const sortedIdx = [...xRaw.keys()].sort((a, b) => xRaw[a] - xRaw[b]);
    const xSorted = sortedIdx.map((i) => xRaw[i]);
    const curvesSorted = curvesRaw.map((yArr) => sortedIdx.map((i) => yArr[i]));

    xPerFan.push(xSorted);
    yPerFan.push(curvesSorted);
  });

  return { xPerFan, yPerFan, curveNames, PredNames };
}

// --- Evaluate ---
export async function main(InputData) {
  let result = [];
  const inputOptions = {
    filePath: InputData.filePath || "axialFan.json",
    dataSource: InputData.dataSource, // optional: set to 'db' to read from DB
    units: InputData.units,
    input: {
      RPM: InputData.RPM,
      TempC: InputData.TempC,
      airFlow: InputData.airFlow,
    },
  };

  const { convertedData, recalculatedData } = await processFanDataService(
    inputOptions
  );

  // Load fans from recalculated data
  const { xPerFan, yPerFan, curveNames, PredNames } =
    loadFansFromRecalculatedOutput(recalculatedData);

  // Create splines per fan (five curves each)
  const splinesPerFan = yPerFan.map((fanCurves, fanIdx) => {
    const x = xPerFan[fanIdx];
    return fanCurves.map((y) => cubicSpline(x, y));
  });
  // Evaluate at a specific x value and collect predictions
  const predictions = splinesPerFan.map((fanSplines, fanIdx) => {
    const x = xPerFan[fanIdx];
    const xMin = x[0];
    const xMax = x[x.length - 1];

    if (Number.isNaN(inputOptions.input.airFlow)) {
      return { fan: fanIdx + 1, error: "Invalid x value." };
    }
    if (
      inputOptions.input.airFlow < xMin ||
      inputOptions.input.airFlow > xMax
    ) {
      result[fanIdx] = {
        Id: fanIdx,
        ...recalculatedData[fanIdx],
        predictions: null,
      };

      return {
        fan: fanIdx + 1,
        error: `x=${inputOptions.input.airFlow} is out of range [${xMin}, ${xMax}] for this fan.`,
      };
    }

    const fanResults = {};
    fanSplines.forEach((spline, curveIdx) => {
      const yPred = spline(inputOptions.input.airFlow);
      const name = PredNames[curveIdx];
      const n = Number(yPred);
      fanResults[name] = n;
    });

    // merge predictions into a copy of the recalculated fan entry
    result[fanIdx] = {
      Id: fanIdx,
      ...recalculatedData[fanIdx],
      predictions: fanResults,
    };

    return {
      fan: fanIdx + 1,
      x: inputOptions.input.airFlow,
      results: fanResults,
    };
  });

  return {
    recalculatedData,
    result,
    predictions,
  };
}

export async function Output({ units, input, dataSource }) {
  try {
    const filePath = "axialFan.json";
    // main expects RPM/TempC/airFlow at top-level of its InputData argument
    const result = await main({
      filePath: dataSource === "db" ? "db" : filePath,
      dataSource,
      units,
      RPM: input?.RPM,
      TempC: input?.TempC,
      airFlow: input?.airFlow,
    });
    const spf = input.SPF;

    // console.log("Main result:", result.result);
    // result.result is the array of recalculated fans with a `predictions` field
    const candidates = Array.isArray(result.result)
      ? result.result
      : result.recalculatedData;
    console.log("🔍 candidates:", candidates);
    const staticRefRaw =
      input && (input.staticPressure ?? input.StaticPressure);
    const staticRef =
      typeof staticRefRaw === "string" ? Number(staticRefRaw) : staticRefRaw;

    const hasValidPredictions = (fan) => {
      if (!fan || !fan.predictions) return false;
      // ensure predictions object has at least one non-null numeric value
      const hasNumeric = Object.values(fan.predictions).some(
        (v) => typeof v === "number" && !Number.isNaN(v)
      );
      if (!hasNumeric) return false;

      // If caller provided a staticPressure filter, enforce it (+/-25%)
      if (typeof staticRef === "number" && Number.isFinite(staticRef)) {
        // try different possible static pressure keys in predictions
        const sp =
          fan.predictions.StaticPressurePred ??
          fan.predictions.StaticPressure ??
          fan.predictions.StaticPressureNew ??
          fan.predictions.StaticPressurepred;
        if (typeof sp !== "number" || Number.isNaN(sp)) return false;
        const pressureFactors = {
          "Pa": 1,
          "kPa": 0.001,
          "bar": 0.00001,
          "psi": 0.000145038,
          "in.wg": 0.00401865,
        };
        const currentUnit = units?.pressure || units?.staticPressure || "Pa";
        const factor = pressureFactors[currentUnit] || 1;
        // const testSp = sp / factor;
        const staticPressureVariance= 25;
        // const staticPressureVariance =
        //   testSp < 38 ? 50 :
        //     testSp <= 75 ? 35 :
        //       testSp <= 125 ? 25 :
        //         testSp <= 175 ? 20 :
        //           testSp <= 225 ? 17.5 :
        //             testSp <= 275 ? 15 :
        //               testSp <= 325 ? 12.5 :
        //                 testSp <= 425 ? 10 :
        //                   testSp <= 575 ? 7.5 : 5; // Adaptive variance for static pressure tolerance
        const l = 1 - staticPressureVariance / 100;
        const u = 1 + staticPressureVariance / 100;
        const lower = staticRef * l;
        const upper = staticRef * u;
        return sp >= lower && sp <= upper;
      }

      return true;
    };

    // Helper to calculate noPoles from RPM
    function calcNoPoles(rpm) {
      if (rpm === undefined || rpm === null || isNaN(rpm)) return "";
      if (rpm <= 750) return 8;
      if (rpm > 750 && rpm <= 1000) return 6;
      if (rpm > 1000 && rpm <= 1500) return 4;
      if (rpm > 1500 && rpm <= 3000) return 2;
      return "";
    }
    const noPoles = calcNoPoles(input.RPM);

    // Add FanModel property to each filtered fan
    // Fan type prefix is validated by the database filter (only fans with fanType column = 1 are returned)
    const filtered = (candidates || [])
      .filter(hasValidPredictions)
      .map((fan) => {
        const blades = fan.Blades || {};
        const impeller = fan.Impeller || {};
        // Generate model string with validated fan type prefix
        const FanModel = `${units.fanType || ""}-${impeller.innerDia || ""}-${blades.noBlades || ""
          }\\${blades.angle || ""}\\${blades.material || ""}${blades.symbol || ""
          }-${noPoles}${input.NoPhases == 3 ? "T" : "M"}`;

        return { FanModel, ...fan };
      });

    // Load motor database and attach nearest motor by netpower to each fan
    let motors = [];
    try {
      // Prefer DB-backed motor data via Prisma; fallback to file if DB not available
      const prismaClient = await getPrismaClient();
      if (!prismaClient) throw new Error("Database not available");
      const rows = await prismaClient.motorData.findMany();
      // Transform Prisma rows to include effCurve array for frontend compatibility
      // Desktop uses SQLite with effCurve as JSON string, web uses PostgreSQL with separate efficiency fields
      motors = rows.map((m) => {
        // Try to get efficiency from separate fields first (web schema)
        // Then fallback to parsing effCurve JSON string (desktop schema)
        let effCurveArray = [];
        if (m.efficiency50Hz != null || m.efficiency375Hz != null || m.efficiency25Hz != null) {
          // Web schema: separate efficiency fields
          effCurveArray = [
            m.efficiency50Hz ?? 0,
            m.efficiency375Hz ?? 0,
            m.efficiency25Hz ?? 0,
          ];
        } else if (m.effCurve) {
          // Desktop schema: effCurve is a JSON string
          try {
            const parsed = typeof m.effCurve === 'string' ? JSON.parse(m.effCurve) : m.effCurve;
            effCurveArray = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            effCurveArray = [];
          }
        }
        return {
          ...m,
          effCurve: effCurveArray,
          // Also set individual efficiency fields for compatibility
          efficiency50Hz: effCurveArray[0] ?? 0,
          efficiency375Hz: effCurveArray[1] ?? 0,
          efficiency25Hz: effCurveArray[2] ?? 0,
        };
      });
    } catch (err) {
      motors = [];
    }
    const attachClosestMotor = (fan) => {
      // determine fan power to match against motor.netpower
      const fanPower =
        (fan.predictions &&
          (fan.predictions.FanInputPower ??
            fan.predictions.FanInputPowerPred)) ??
        null;
      const fPower =
        typeof fanPower === "number" && !Number.isNaN(fanPower)
          ? fanPower
          : null;
      if (fPower === null) {
        return { ...fan, matchedMotor: null, powerDiff: null };
      }

      // Determine fan power (try multiple prediction keys)
      const fanPowerCandidate =
        (fan.predictions &&
          (fan.predictions.FanInputPowerPred ??
            fan.predictions.FanInputPower ??
            fan.FanInputPowerNew?.[0])) ??
        null;
      const fPowerVal =
        typeof fanPowerCandidate === "number" &&
          !Number.isNaN(fanPowerCandidate)
          ? fanPowerCandidate
          : fPower;
      const fPowerFinal =
        typeof fPowerVal === "number" && Number.isFinite(fPowerVal)
          ? fPowerVal
          : null;
      if (fPowerFinal === null)
        return { ...fan, matchedMotor: null, powerDiff: null };

      // collect motors with net >= fan power
      const candidatesAbove = [];
      for (const m of motors) {
        const netRaw = m.netpower ?? m.netPower ?? m.powerKW ?? m.powerKw;
        const net = Number(netRaw);
        if (!Number.isFinite(net)) continue;

        if (
          net >= fPowerFinal * (1 + input.Safety / 100) &&
          noPoles == m.NoPoles &&
          m.Phase == input.NoPhases &&
          m.insClass == units.insulationClass
        )
          candidatesAbove.push({ m, net });
      }
      if (candidatesAbove.length === 0) {
        // no motor meets the criterion of net >= fan power
        return null;
      }

      // choose the smallest net among candidates (closest higher)
      candidatesAbove.sort((a, b) => a.net - b.net);
      const bestEntry = candidatesAbove[0];
      const best = bestEntry.m;
      const bestNet = bestEntry.net;
      const bestDiff = bestNet - fPowerFinal;

      const matched = {
        model: best.model ?? best.Model ?? null,
        powerKW: best.powerKW ?? best.powerKw ?? null,
        netpower: best.netpower ?? best.netPower ?? null,
        frameSize: best.frameSize ?? null,
        powerHorse: best.powerHorse ?? null,
      };
      fan.FanModel += `-${matched.powerHorse || ""}`;

      return { ...fan, matchedMotor: best, powerDiff: bestDiff };
    };

    const withMatches = filtered
      .map(attachClosestMotor)
      .filter((fan) => fan !== null);

    // Sort final results by predictions.FanTotalEfficiencyPred (descending).
    const getEff = (item) => {
      const p =
        item.predictions?.FanStaticEfficiencyPred ??
        item.predictions?.FanStaticEfficiency ??
        null;
      if (typeof p === "number" && !Number.isNaN(p)) return p;
      const parsed = Number(p);
      return Number.isFinite(parsed) ? parsed : -Infinity;
    };

    const sorted = withMatches.sort((a, b) => getEff(b) - getEff(a));
    return sorted;
  } catch (error) {
    console.error("❌ Fan data processing failed:", error);
    throw error;
  }
}

// Helper for safe array access
const arrAt = (arr, i) =>
  Array.isArray(arr) && arr.length > i ? arr[i] : null;

// --- Export / Import helpers for FanData (xlsx)
export async function exportFanData(res) {
  // try DB first, fallback to file
  let data = [];
  try {
    const prismaClient = await getPrismaClient();
    if (!prismaClient) throw new Error("Database not available");
    const rows = await prismaClient.fanData.findMany();
    data = rows.map((r) => ({
      Id: r.id,
      No: r.No ?? null,
      Model: r.Model ?? null,
      "AF-S": r.AFS ?? null,
      "AF-L": r.AFL ?? null,
      WF: r.WF ?? null,
      ARTF: r.ARTF ?? null,
      SF: r.SF ?? null,
      "ABSF-C": r.ABSFC ?? null,
      "ABSF-S": r.ABSFS ?? null,
      SABF: r.SABF ?? null,
      SARTF: r.SARTF ?? null,
      AJF: r.AJF ?? null,
      "Blade Symbol": r.bladesSymbol,
      "Blade Material": r.bladesMaterial,
      "No Blades": r.noBlades,
      "Blade Angle": r.bladesAngle,
      "Hub Type": r.hubType,
      "Impeller Inner Diameter": r.impellerInnerDia,
      "Impeller Configuration": r.impellerConf,
      "Designated Density": r.desigDensity,
      "Rotational Speed": r.RPM,
      "Air Flow 1": arrAt(r.airFlow, 0),
      "Air Flow 2": arrAt(r.airFlow, 1),
      "Air Flow 3": arrAt(r.airFlow, 2),
      "Air Flow 4": arrAt(r.airFlow, 3),
      "Air Flow 5": arrAt(r.airFlow, 4),
      "Air Flow 6": arrAt(r.airFlow, 5),
      "Air Flow 7": arrAt(r.airFlow, 6),
      "Air Flow 8": arrAt(r.airFlow, 7),
      "Air Flow 9": arrAt(r.airFlow, 8),
      "Air Flow 10": arrAt(r.airFlow, 9),
      "Total Pressure 1": arrAt(r.totPressure, 0),
      "Total Pressure 2": arrAt(r.totPressure, 1),
      "Total Pressure 3": arrAt(r.totPressure, 2),
      "Total Pressure 4": arrAt(r.totPressure, 3),
      "Total Pressure 5": arrAt(r.totPressure, 4),
      "Total Pressure 6": arrAt(r.totPressure, 5),
      "Total Pressure 7": arrAt(r.totPressure, 6),
      "Total Pressure 8": arrAt(r.totPressure, 7),
      "Total Pressure 9": arrAt(r.totPressure, 8),
      "Total Pressure 10": arrAt(r.totPressure, 9),
      "Velocity Pressure 1": arrAt(r.velPressure, 0),
      "Velocity Pressure 2": arrAt(r.velPressure, 1),
      "Velocity Pressure 3": arrAt(r.velPressure, 2),
      "Velocity Pressure 4": arrAt(r.velPressure, 3),
      "Velocity Pressure 5": arrAt(r.velPressure, 4),
      "Velocity Pressure 6": arrAt(r.velPressure, 5),
      "Velocity Pressure 7": arrAt(r.velPressure, 6),
      "Velocity Pressure 8": arrAt(r.velPressure, 7),
      "Velocity Pressure 9": arrAt(r.velPressure, 8),
      "Velocity Pressure 10": arrAt(r.velPressure, 9),
      "Static Pressure 1": arrAt(r.staticPressure, 0),
      "Static Pressure 2": arrAt(r.staticPressure, 1),
      "Static Pressure 3": arrAt(r.staticPressure, 2),
      "Static Pressure 4": arrAt(r.staticPressure, 3),
      "Static Pressure 5": arrAt(r.staticPressure, 4),
      "Static Pressure 6": arrAt(r.staticPressure, 5),
      "Static Pressure 7": arrAt(r.staticPressure, 6),
      "Static Pressure 8": arrAt(r.staticPressure, 7),
      "Static Pressure 9": arrAt(r.staticPressure, 8),
      "Static Pressure 10": arrAt(r.staticPressure, 9),
      "Fan Input Power 1": arrAt(r.fanInputPow, 0),
      "Fan Input Power 2": arrAt(r.fanInputPow, 1),
      "Fan Input Power 3": arrAt(r.fanInputPow, 2),
      "Fan Input Power 4": arrAt(r.fanInputPow, 3),
      "Fan Input Power 5": arrAt(r.fanInputPow, 4),
      "Fan Input Power 6": arrAt(r.fanInputPow, 5),
      "Fan Input Power 7": arrAt(r.fanInputPow, 6),
      "Fan Input Power 8": arrAt(r.fanInputPow, 7),
      "Fan Input Power 9": arrAt(r.fanInputPow, 8),
      "Fan Input Power 10": arrAt(r.fanInputPow, 9),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  } catch (e) {
    throw new Error("Failed to export fan data from database: " + (e?.message || String(e)));
  }

  const filename = "FanData-export.xlsx";
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "FanData");
  const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
}

export async function importFanDataFromExcel(
  fileBase64,
  filename = "uploaded.xlsx"
) {
  if (!fileBase64) throw new Error("No fileBase64 provided");
  const buffer = Buffer.from(fileBase64, "base64");
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
  if (!rows || rows.length === 0) return [];

  // small number parser (robust to commas/percent signs)
  const parseNumber = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    let s = String(v).trim();
    if (s === "") return null;
    if (s.endsWith("%")) {
      const n = Number(s.slice(0, -1).replace(/,/g, ""));
      return Number.isNaN(n) ? null : n;
    }
    // remove any non-numeric except .,- and e
    s = s.replace(/[^0-9+\-.,eE]/g, "");
    if ((s.match(/,/g) || []).length > 0 && s.indexOf(".") !== -1)
      s = s.replace(/,/g, "");
    else if (s.indexOf(".") === -1 && s.indexOf(",") !== -1) {
      if ((s.match(/,/g) || []).length > 1) s = s.replace(/,/g, "");
      else s = s.replace(",", ".");
    }
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
  };

  // Map a positional row -> FanData payload. offset=1 means first column is ID and fields shift right.
  const fanRowToPayload = (row, offset = 0) => {
    const idx = (i) => i + offset;
    const get = (i) => row[idx(i)] ?? null;

    // expect 10-point curves for AirFlow & others; safe-read with fallback
    const readArray = (startIndex, length = 10) => {
      const out = [];
      for (let i = 0; i < length; i++) {
        out.push(parseNumber(row[idx(startIndex + i)]));
      }
      return out;
    };

    const payload = {
      id: parseNumber(get(-1)), // if offset=1, id is at -1
      bladesSymbol: String(get(2) ?? "") || "",
      bladesMaterial: String(get(3) ?? "") || "",
      noBlades: parseNumber(get(5)),
      bladesAngle: parseNumber(get(4)),
      hubType: parseNumber(get(4)),
      impellerConf: String(get(7) ?? "") || "",
      impellerInnerDia: parseNumber(get(6)),
      desigDensity: parseNumber(get(0)),
      RPM: parseNumber(get(1)),
      airFlow: readArray(8, 10),
      totPressure: readArray(18, 10),
      velPressure: readArray(28, 10),
      staticPressure: readArray(38, 10),
      fanInputPow: readArray(48, 10),
    };

    // if first column looks like numeric id include it
    const possibleId = parseNumber(row[0]);
    if (Number.isFinite(possibleId)) payload.id = possibleId;

    return payload;
  };

  // Known field names for header detection
  const knownFields = new Set([
    "id",
    "bladessymbol",
    "bladesmaterial",
    "noblades",
    "bladesangle",
    "hubtype",
    "impellerconf",
    "impellerinnerdia",
    "desigdensity",
    "rpm",
    "airflow",
    "totpressure",
    "velpressure",
    "staticpressure",
    "faninputpow",
  ]);

  // const firstRow = rows[0];
  // const firstRowHasHeaders = firstRow.some((cell) =>
  //   knownFields.has(
  //     String(cell || "")
  //       .toLowerCase()
  //       .replace(/\s+/g, "")
  //   )
  // );

  const records = [];
  // if (firstRowHasHeaders) {
  //   // parse with header mapping
  //   const objs = xlsx.utils.sheet_to_json(sheet, { defval: null });
  //   for (const o of objs) {
  //     // normalize keys and attempt to parse arrays if present as CSV strings
  //     const rec = {};
  //     for (const k of Object.keys(o)) {
  //       const nk = String(k).trim();
  //       const key = nk.replace(/\s+/g, "").toLowerCase();
  //       const val = o[k];
  //       if (
  //         [
  //           "airflow",
  //           "totpressure",
  //           "velpressure",
  //           "staticpressure",
  //           "faninputpow",
  //         ].includes(key)
  //       ) {
  //         if (Array.isArray(val)) rec[key] = val.map((v) => parseNumber(v));
  //         else if (typeof val === "string") {
  //           const parts = val.split(/[,;\|]/).map((s) => parseNumber(s));
  //           rec[key] = parts;
  //         } else rec[key] = val;
  //       } else if (
  //         [
  //           "noblades",
  //           "hubtype",
  //           "rpm",
  //           "bladesangle",
  //           "desigdensity",
  //         ].includes(key)
  //       ) {
  //         rec[key] = parseNumber(val);
  //       } else {
  //         rec[key] = val;
  //       }
  //     }
  //     records.push(rec);
  //   }
  // } else {
  // No headers — treat each row (skip header-like empty first row?)
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const payload = fanRowToPayload(row, 1);
    records.push(payload);
  }
  // }

  // Merge into DB (preferred) or fallback to file
  try {
    for (const rec of records) {
      const idCandidate = rec.id || rec.Id || rec.ID || null;
      const id = Number.isFinite(Number(idCandidate))
        ? Number(idCandidate)
        : null;

      // build data payload mapping to DB columns
      const allowed = [
        "bladesSymbol",
        "bladesMaterial",
        "noBlades",
        "bladesAngle",
        "hubType",
        "impellerConf",
        "impellerInnerDia",
        "desigDensity",
        "RPM",
        "airFlow",
        "totPressure",
        "velPressure",
        "staticPressure",
        "fanInputPow",
      ];

      const normalizeVal = (v) => {
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
          // comma-separated numbers
          if (s.indexOf(",") !== -1) {
            const parts = s.split(/[,;\|]/).map((p) => parseNumber(p));
            return parts;
          }
        }
        return v;
      };

      const dataPayload = {};
      for (const key of allowed) {
        // support different casings
        const candidates = [key, key.toLowerCase(), key.toUpperCase()];
        let val = undefined;
        for (const c of candidates) {
          if (rec[c] !== undefined) {
            val = rec[c];
            break;
          }
        }
        if (val === undefined) {
          // also try direct property names from fanRowToPayload (camelCase)
          if (rec[key] !== undefined) val = rec[key];
          else if (rec[key.toLowerCase()] !== undefined)
            val = rec[key.toLowerCase()];
        }
        if (val !== undefined && val !== null && val !== "") {
          dataPayload[key] = normalizeVal(val);
        }
      }

      const prismaClient = await getPrismaClient();
      if (!prismaClient) throw new Error("Database not available");

      if (id) {
        const existing = await prismaClient.fanData.findUnique({ where: { id } });
        if (!existing) {
          console.warn(`No existing fan with id=${id}, creating new instead.`);
          await prismaClient.fanData.create({ data: dataPayload });
          continue;
        }
        await prismaClient.fanData.update({ where: { id }, data: dataPayload });
        continue;
      }

      // No id: try to match by impellerInnerDia + noBlades + bladesSymbol if present
      else {
        await prismaClient.fanData.create({ data: dataPayload });
      }
    }

    const prismaClientFinal = await getPrismaClient();
    return await prismaClientFinal.fanData.findMany();
  } catch (err) {
    throw new Error("Failed to import fan data: " + (err?.message || String(err)));
  }
}
