import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculate density based on temperature
function calcDensity(tempC) {
  let temp = Number(tempC);
  if (isNaN(temp))
    throw new Error("Invalid temperature for density calculation");
  let den = 101325 / ((temp + 273.15) * 287.1);

  return Math.round(den * 100) / 100;
  // return den;
}

// ============================================================================
// PHASE 1: Load Raw Data
// ============================================================================
// Load raw data arrays from centrifugalFan.json
// No calculations - values remain exactly as they appear in JSON
function loadRawData(fan) {
  return {
    airFlow: [...fan.airFlow],
    totalPressure: [...fan.totPressure],
    velocityPressure: [...fan.velPressure],
    staticPressure: [...fan.staticPressure],
    fanInputPower: [...fan.fanInputPow],
  };
}

// ============================================================================
// PHASE 2: Unit Conversion Calculations
// ============================================================================
// Apply unit conversion factors element-wise on arrays
function applyUnitConversions(rawData, units = {}) {
  const airFlowConverters = {
    "m³/s": 1,
    "m^3/s": 1,
    "m³/min": 60,
    "m^3/min": 60,
    "m³/hr": 3600,
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
    psi: 0.000145038,
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

  const airFlowUnit = units.airFlow || "m³/s";
  const pressureUnit = units.pressure || units.staticPressure || "Pa";
  const powerUnit = units.power || units.fanInputPower || "kW";

  const airFlowConversionFactor = airFlowConverters[airFlowUnit] || 1;
  const pressureConversionFactor = pressureConverters[pressureUnit] || 1;
  const powerConversionFactor = powerConverters[powerUnit] || 1;

  // Apply conversions
  const airFlow_converted = convertArray(
    rawData.airFlow,
    airFlowConversionFactor
  );
  const totalPressure_converted = convertArray(
    rawData.totalPressure,
    pressureConversionFactor
  );
  const velocityPressure_converted = convertArray(
    rawData.velocityPressure,
    pressureConversionFactor
  );
  // staticPressure_converted = totalPressure_converted - velocityPressure_converted
  const staticPressure_converted = totalPressure_converted.map((tp, i) => {
    const vp = velocityPressure_converted[i];
    if (tp === null || vp === null) return null;
    return tp - vp;
  });
  const fanInputPower_converted = convertArray(
    rawData.fanInputPower,
    powerConversionFactor
  );

  return {
    airFlow: airFlow_converted,
    totalPressure: totalPressure_converted,
    velocityPressure: velocityPressure_converted,
    staticPressure: staticPressure_converted,
    fanInputPower: fanInputPower_converted,
  };
}

// ============================================================================
// PHASE 3: Density Correction & Efficiency Calculations
// ============================================================================
function applyDensityCorrectionAndEfficiency(
  convertedData,
  rawData,
  inputDensity,
  designDensity
) {
  const densityRatio = inputDensity / designDensity;

  // Density-corrected calculations using Phase 2 converted values
  const airFlow_new = [...convertedData.airFlow];
  const totalPressure_new = convertedData.totalPressure.map(
    (v) => (v !== null ? v * densityRatio : null)
  );
  const velocityPressure_new = convertedData.velocityPressure.map(
    (v) => (v !== null ? v * densityRatio : null)
  );
  // staticPressure_new = totalPressure_new - velocityPressure_new
  const staticPressure_new = totalPressure_new.map((tp, i) => {
    const vp = velocityPressure_new[i];
    if (tp === null || vp === null) return null;
    return tp - vp;
  });
  const fanInputPower_new = convertedData.fanInputPower.map(
    (v) => (v !== null ? v * densityRatio : null)
  );

  // Efficiency calculations using RAW DATA (Phase 1)
  const fanTotalEfficiency = rawData.airFlow.map((q, i) => {
    const p = rawData.totalPressure[i] ?? 0;
    const pow = rawData.fanInputPower[i] ?? 0;
    if (pow === 0 || pow === null) return null;
    return (p * q) / (pow * 1000);
  });

  const fanStaticEfficiency = rawData.airFlow.map((q, i) => {
    const p = rawData.staticPressure[i] ?? 0;
    const pow = rawData.fanInputPower[i] ?? 0;
    if (pow === 0 || pow === null) return null;
    return (p * q) / (pow * 1000);
  });

  return {
    densityCorrected: {
      airFlow: airFlow_new,
      totalPressure: totalPressure_new,
      velocityPressure: velocityPressure_new,
      staticPressure: staticPressure_new,
      fanInputPower: fanInputPower_new,
    },
    efficiencies: {
      fanTotalEfficiency,
      fanStaticEfficiency,
    },
  };
}


// ============================================================================
// PHASE 4: Calculate airFlow and staticPressure at minimum and maximum RPM
// ============================================================================
// Calculates performance at min RPM and max RPM based on fan laws:
//   airFlow_min = (minSpeedRPM / RPM) * airFlow_phase3
//   staticPressure_min = (minSpeedRPM / RPM)^2 * staticPressure_phase3
//   airFlow_max = (highSpeedRPM / RPM) * airFlow_phase3
//   staticPressure_max = (highSpeedRPM / RPM)^2 * staticPressure_phase3
// Uses density-corrected Phase 3 values (all 10 data points)
function calculatePhase4(
  selectedFan,
  phase3Result,
  numReadings = 10
) {
  if (!selectedFan || !phase3Result) {
    throw new Error("Missing selectedFan or phase3Result for Phase 4 calculation");
  }

  if (!selectedFan.Blades) {
    throw new Error("Selected fan missing Blades metadata");
  }

  const minSpeedRPM = selectedFan.Blades.minSpeedRPM;
  const highSpeedRPM = selectedFan.Blades.highSpeedRPM;
  const ratedRPM = selectedFan.RPM;

  if (!minSpeedRPM || !ratedRPM) {
    throw new Error("Selected fan missing minSpeedRPM or RPM value");
  }

  if (!highSpeedRPM) {
    throw new Error("Selected fan missing highSpeedRPM value");
  }

  // Validate Phase 3 result
  if (!phase3Result.phase3) {
    throw new Error("Missing Phase 3 results");
  }

  const densityCorrectData = phase3Result.phase3.densityCorrected;
  if (!densityCorrectData.airFlow || !densityCorrectData.staticPressure) {
    throw new Error("Phase 3 missing airFlow or staticPressure");
  }

  // Get Phase 3 density-corrected arrays (10 data points each)
  const phase3AirFlow = densityCorrectData.airFlow;
  const phase3StaticPressure = densityCorrectData.staticPressure;

  // Calculate ratio for minimum RPM
  const minRatio = minSpeedRPM / ratedRPM;
  // Calculate ratio for maximum RPM
  const maxRatio = highSpeedRPM / ratedRPM;

  // Calculate 10 readings at minimum RPM
  const minRpmReadings = [];
  for (let i = 0; i < numReadings && i < phase3AirFlow.length; i++) {
    const airFlowPhase3 = phase3AirFlow[i];
    const staticPressurePhase3 = phase3StaticPressure[i];

    if (airFlowPhase3 === null || airFlowPhase3 === undefined ||
      staticPressurePhase3 === null || staticPressurePhase3 === undefined) {
      minRpmReadings.push({
        index: i + 1,
        airFlow: null,
        staticPressure: null,
      });
      continue;
    }

    // airFlow_min = (minSpeedRPM / RPM) * airFlow_phase3
    const airFlow = minRatio * airFlowPhase3;
    // staticPressure_min = (minSpeedRPM / RPM)^2 * staticPressure_phase3
    const staticPressure = Math.pow(minRatio, 2) * staticPressurePhase3;

    minRpmReadings.push({
      index: i + 1,
      airFlow: Math.round(airFlow * 10000) / 10000, // 4 decimals
      staticPressure: Math.round(staticPressure * 10000) / 10000, // 4 decimals
    });
  }

  // Calculate 10 readings at maximum RPM
  const maxRpmReadings = [];
  for (let i = 0; i < numReadings && i < phase3AirFlow.length; i++) {
    const airFlowPhase3 = phase3AirFlow[i];
    const staticPressurePhase3 = phase3StaticPressure[i];

    if (airFlowPhase3 === null || airFlowPhase3 === undefined ||
      staticPressurePhase3 === null || staticPressurePhase3 === undefined) {
      maxRpmReadings.push({
        index: i + 1,
        airFlow: null,
        staticPressure: null,
      });
      continue;
    }

    // airFlow_max = (highSpeedRPM / RPM) * airFlow_phase3
    const airFlow = maxRatio * airFlowPhase3;
    // staticPressure_max = (highSpeedRPM / RPM)^2 * staticPressure_phase3
    const staticPressure = Math.pow(maxRatio, 2) * staticPressurePhase3;

    maxRpmReadings.push({
      index: i + 1,
      airFlow: Math.round(airFlow * 10000) / 10000, // 4 decimals
      staticPressure: Math.round(staticPressure * 10000) / 10000, // 4 decimals
    });
  }

  return {
    fanType: selectedFan.Blades?.Model || "Unknown",
    minRPM: {
      rpm: minSpeedRPM,
      airFlow: minRpmReadings.map((r) => r.airFlow),
      staticPressure: minRpmReadings.map((r) => r.staticPressure),
    },
    maxRPM: {
      rpm: highSpeedRPM,
      airFlow: maxRpmReadings.map((r) => r.airFlow),
      staticPressure: maxRpmReadings.map((r) => r.staticPressure),
    },
    ratedRPM,
    fanMetadata: {
      innerDiameter: selectedFan.Impeller?.innerDiameter,
      impellerType: selectedFan.Impeller?.impellerType,
      type: selectedFan.Blades?.Type,
    },
  };
}

// ============================================================================
// Static Pressure Tolerance Lookup Table
// ============================================================================
// Returns the tolerance percentage based on static pressure in Pa.
// The table maps pressure ranges to percentage tolerances:
//   25 Pa -> 50%, 50 Pa -> 35%, 100 Pa -> 25%, ... 600+ Pa -> 5%
function getStaticPressureTolerancePct(staticPressurePa) {
  const table = [
    { pa: 25, pct: 50.0 },
    { pa: 50, pct: 35.0 },
    { pa: 100, pct: 25.0 },
    { pa: 150, pct: 20.0 },
    { pa: 200, pct: 17.5 },
    { pa: 250, pct: 15.0 },
    { pa: 300, pct: 12.5 },
    { pa: 350, pct: 10.0 },
    { pa: 400, pct: 10.0 },
    { pa: 450, pct: 7.5 },
    { pa: 500, pct: 7.5 },
    { pa: 550, pct: 7.5 },
    { pa: 600, pct: 5.0 },
  ];
  const sp = Math.abs(staticPressurePa);
  // If below the lowest threshold, use the highest tolerance
  if (sp <= table[0].pa) return table[0].pct;
  // Walk through the table; return the percentage for the first bracket that covers sp
  for (let i = 0; i < table.length; i++) {
    if (sp <= table[i].pa) return table[i].pct;
  }
  // Above 600 Pa -> 5%
  return 5.0;
}

// Pressure unit converters (Pa -> user unit multipliers)
// Used to convert user-unit pressure back to Pa for tolerance lookup
const pressureToleranceConverters = {
  Pa: 1,
  kPa: 0.001,
  bar: 1e-5,
  psi: 0.000145038,
  Psi: 0.000145038,
  "in.wg": 0.004018647,
};

// ============================================================================
// PHASE 5: Find Matching RPM using Linear Interpolation
// ============================================================================
// Port of VBA InterpolateInMemory function
// Performs linear interpolation on a 10-point curve, scaled by ratio
// Xmins, Ymins = curve at minimum RPM (10 points)
// xSel = target air flow to find
// ratio = rpm / minRPM
function interpolateInMemory(Xmins, Ymins, nPts, xSel, ratio) {
  // Matches VBA exactly:
  // For j = 1 To nPts - 1
  //   x0 = Xmins(j) * ratio
  //   y0 = Ymins(j) * ratio ^ 2
  //   x1 = Xmins(j + 1) * ratio
  //   y1 = Ymins(j + 1) * ratio ^ 2
  //   If xSel >= x0 And xSel <= x1 Then
  //     InterpolateInMemory = y0 + (y1 - y0) * (xSel - x0) / (x1 - x0)
  //     Exit Function
  //   End If
  // Next j

  for (let j = 0; j < nPts - 1; j++) {
    const x0 = Xmins[j] * ratio;
    const y0 = Ymins[j] * Math.pow(ratio, 2);
    const x1 = Xmins[j + 1] * ratio;
    const y1 = Ymins[j + 1] * Math.pow(ratio, 2);

    // VBA: If xSel >= x0 And xSel <= x1 Then
    if (xSel >= x0 && xSel <= x1) {
      // Linear interpolation: y0 + (y1 - y0) * (xSel - x0) / (x1 - x0)
      const interpolatedY = y0 + (y1 - y0) * (xSel - x0) / (x1 - x0);
      return interpolatedY;
    }
  }

  // No segment found - return null (equivalent to CVErr(xlErrNA) in VBA)
  return null;
}

// Main Phase 5 calculation - finds matching RPM for user operating point
// Direct port of VBA FindMatchingRPM_Fast algorithm
// fanData = { rawFan, phase2Converted } - raw fan metadata + Phase 2 converted curve data
// selX = user air flow input (in user units, e.g., CFM)
// selY = user static pressure input (in user units, e.g., Pa)
// pressureUnit = the unit of selY (e.g., 'Pa', 'in.wg', 'kPa', 'psi', 'bar')
function calculatePhase5(fanData, selX, selY, pressureUnit) {
  const { rawFan, phase2Converted } = fanData;

  if (!rawFan || !phase2Converted) {
    return { fanType: null, matchingRPM: null, error: "Missing fan data" };
  }

  const fanType = rawFan.Blades?.Model || "Unknown";
  const minRPM = rawFan.Blades?.minSpeedRPM;
  const maxRPM = rawFan.Blades?.highSpeedRPM;
  const ratedRPM = rawFan.RPM;

  // Validation - matches VBA logic
  // VBA: If MinRPM <= 0 Or MaxRPM <= 0 Or MinRPM >= MaxRPM Then GoTo MarkEmpty
  if (!minRPM || minRPM <= 0) {
    return { fanType, matchingRPM: null, error: "Invalid minRPM" };
  }
  if (!maxRPM || maxRPM <= 0) {
    return { fanType, matchingRPM: null, error: "Invalid maxRPM" };
  }
  if (minRPM >= maxRPM) {
    return { fanType, matchingRPM: null, error: "minRPM must be less than maxRPM" };
  }
  if (selX === null || selX === undefined || isNaN(selX)) {
    return { fanType, matchingRPM: null, error: "Invalid user air flow (SelX)" };
  }
  if (selY === null || selY === undefined || isNaN(selY)) {
    return { fanType, matchingRPM: null, error: "Invalid user static pressure (SelY)" };
  }

  // Get the 10-point curve from Phase 2 converted data (already in user units like CFM, Pa)
  // VBA reads from columns HJ (airFlow) and HU (staticPressure) which are in user units
  // Phase 2 converted data is at ratedRPM, so we need to scale to minRPM first
  const ratedAirFlow = phase2Converted.airFlow;
  const ratedStaticPressure = phase2Converted.staticPressure;

  if (!ratedAirFlow || !ratedStaticPressure || ratedAirFlow.length === 0 || ratedStaticPressure.length === 0) {
    return { fanType, matchingRPM: null, error: "Missing curve data from fan" };
  }

  // Scale the rated curve to minimum RPM (this is what VBA has in columns HJ/HU)
  // Xmins = airFlow at minRPM = (minRPM / ratedRPM) * ratedAirFlow
  // Ymins = staticPressure at minRPM = (minRPM / ratedRPM)^2 * ratedStaticPressure
  const minRatio = minRPM / ratedRPM;
  const Xmins = ratedAirFlow.map(x => x !== null ? x * minRatio : null);
  const Ymins = ratedStaticPressure.map(y => y !== null ? y * Math.pow(minRatio, 2) : null);

  const nPts = Math.min(Xmins.length, Ymins.length, 10);

  // Debug logging
  console.log(`\n=== Phase 5 Debug for ${fanType} ===`);
  console.log(`minRPM: ${minRPM}, maxRPM: ${maxRPM}, ratedRPM: ${ratedRPM}`);
  console.log(`minRatio: ${minRatio}`);
  console.log(`selX (user airFlow): ${selX}, selY (user staticPressure): ${selY}`);
  console.log(`ratedAirFlow (Phase 2, first 3): ${ratedAirFlow.slice(0, 3)}`);
  console.log(`ratedStaticPressure (Phase 2, first 3): ${ratedStaticPressure.slice(0, 3)}`);
  console.log(`Xmins (at minRPM, first 3): ${Xmins.slice(0, 3)}`);
  console.log(`Ymins (at minRPM, first 3): ${Ymins.slice(0, 3)}`);
  console.log(`Xmins range: ${Math.min(...Xmins.filter(x => x !== null))} to ${Math.max(...Xmins.filter(x => x !== null))}`);
  console.log(`At maxRPM, Xmins would scale to: ${Math.min(...Xmins.filter(x => x !== null)) * (maxRPM / minRPM)} to ${Math.max(...Xmins.filter(x => x !== null)) * (maxRPM / minRPM)}`);

  // Brute-force search from minRPM to maxRPM + 50
  // VBA: For rpm = CLng(MinRPM) To CLng(MaxRPM) + 50
  let matchingRPM = null;
  const rpmStart = Math.round(minRPM);
  const rpmEnd = Math.round(maxRPM) + 50;

  // Dynamic tolerance: convert selY to Pa, then look up percentage from table
  const convFactor = pressureToleranceConverters[pressureUnit] || 1;
  const selY_Pa = convFactor !== 0 ? selY / convFactor : selY;
  const tolerancePct = getStaticPressureTolerancePct(selY_Pa);
  const tolFraction = tolerancePct / 100;
  console.log(`Phase 5 tolerance: selY=${selY} ${pressureUnit || 'Pa'}, selY_Pa=${selY_Pa.toFixed(1)}, tolerancePct=${tolerancePct}%`);

  for (let rpm = rpmStart; rpm <= rpmEnd; rpm++) {
    // ratio = rpm / minRPM (matches VBA)
    const ratio = rpm / minRPM;

    // Interpolate to find predicted static pressure
    // VBA: predY = InterpolateInMemory(Xmins, Ymins, nPts, SelX, rpm / MinRPM)
    const predY = interpolateInMemory(Xmins, Ymins, nPts, selX, ratio);

    if (predY !== null) {
      // Match condition: |predY - SelY| <= tolFraction * |SelY|
      if (Math.abs(predY - selY) <= tolFraction * Math.abs(selY)) {
        matchingRPM = rpm;
        break;
      }

      // Early exit optimization (matches VBA)
      // VBA: If predY > SelY And rpm > MinRPM + 50 Then Exit For
      if (predY > selY && rpm > minRPM + 50) {
        break;
      }
    }
  }

  return {
    fanType,
    matchingRPM,
    userAirFlow: selX,
    userStaticPressure: selY,
  };
}

// ============================================================================
// PHASE 6: Calculate final fan performance using matching RPM from Phase 5
// ============================================================================
// Applies fan affinity laws using:
// - Density-corrected values from Phase 3
// - Matching RPM from Phase 5
// - Rated RPM from JSON
// Only runs for fans with valid matchingRPM from Phase 5
function calculatePhase6(fanData) {
  const { rawFan, phase3Result, matchingRPM } = fanData;

  if (!rawFan || !phase3Result || !matchingRPM) {
    console.warn(`Phase 6 early exit: rawFan=${!!rawFan}, phase3Result=${!!phase3Result}, matchingRPM=${matchingRPM}`);
    return null;
  }

  const model = rawFan.Blades?.Model || "Unknown";
  const innerDiameter = rawFan.Impeller?.innerDiameter || null;
  const ratedRPM = rawFan.RPM;

  if (!ratedRPM || ratedRPM <= 0) {
    console.warn(`Phase 6 early exit for ${model}: Invalid ratedRPM=${ratedRPM}`);
    return null;
  }

  // speedRatio = newRPM / ratedRPM
  const speedRatio = matchingRPM / ratedRPM;

  // Get Phase 3 density-corrected values (arrays of 10 points)
  const phase3Density = phase3Result.densityCorrected;
  const phase3Eff = phase3Result.efficiencies;

  if (!phase3Density || !phase3Eff) {
    console.warn(`Phase 6 early exit for ${model}: Missing phase3Density=${!!phase3Density} or phase3Eff=${!!phase3Eff}`);
    return null;
  }

  // Apply fan affinity laws to each data point
  // airFlow_new = airFlow_phase3 * speedRatio
  const airFlow_new = phase3Density.airFlow.map(v =>
    v !== null ? v * speedRatio : null
  );

  // totalPressure_new = totalPressure_phase3 * (speedRatio)^2
  const totalPressure_new = phase3Density.totalPressure.map(v =>
    v !== null ? v * Math.pow(speedRatio, 2) : null
  );

  // velocityPressure_new = velocityPressure_phase3 * (speedRatio)^2
  const velocityPressure_new = phase3Density.velocityPressure.map(v =>
    v !== null ? v * Math.pow(speedRatio, 2) : null
  );

  // staticPressure_new = totalPressure_new - velocityPressure_new
  const staticPressure_new = totalPressure_new.map((tp, i) => {
    const vp = velocityPressure_new[i];
    if (tp === null || vp === null) return null;
    return tp - vp;
  });

  // fanInputPower_new = fanInputPower_phase3 * (speedRatio)^3
  const fanInputPower_new = phase3Density.fanInputPower.map(v =>
    v !== null ? v * Math.pow(speedRatio, 3) : null
  );

  // Efficiencies remain unchanged (RPM cancels out)
  const totalEfficiency_new = [...phase3Eff.fanTotalEfficiency];
  const staticEfficiency_new = [...phase3Eff.fanStaticEfficiency];

  return {
    model,
    innerDiameter,
    ratedRPM,
    matchingRPM,
    phase6: {
      airFlow: airFlow_new,
      totalPressure: totalPressure_new,
      velocityPressure: velocityPressure_new,
      staticPressure: staticPressure_new,
      fanInputPower: fanInputPower_new,
      totalEfficiency: totalEfficiency_new,
      staticEfficiency: staticEfficiency_new,
    },
  };
}

// ============================================================================
// PHASE 7: Polynomial Curve Fitting & Prediction (Degree-6, No Intercept)
// ============================================================================
// Performs degree-6 polynomial regression matching Excel LINEST behavior:
// y = a1*x + a2*x^2 + a3*x^3 + a4*x^4 + a5*x^5 + a6*x^6 (no constant term)
// Uses least squares regression to fit coefficients

// Matrix operations for polynomial regression
function matrixMultiply(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result = Array(rowsA).fill(null).map(() => Array(colsB).fill(0));

  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

function matrixTranspose(A) {
  const rows = A.length;
  const cols = A[0].length;
  const result = Array(cols).fill(null).map(() => Array(rows).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = A[i][j];
    }
  }
  return result;
}

// Gauss-Jordan elimination for matrix inversion
function matrixInverse(A) {
  const n = A.length;
  // Create augmented matrix [A | I]
  const aug = A.map((row, i) => {
    const newRow = [...row];
    for (let j = 0; j < n; j++) {
      newRow.push(i === j ? 1 : 0);
    }
    return newRow;
  });

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    // Swap rows
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    // Check for singular matrix
    if (Math.abs(aug[col][col]) < 1e-12) {
      throw new Error("Matrix is singular, cannot invert");
    }

    // Scale pivot row
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    // Eliminate column
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  // Extract inverse from augmented matrix
  return aug.map(row => row.slice(n));
}

// Perform degree-6 polynomial regression WITH intercept (constant term)
// Matches Excel LINEST with powers {1,2,3,4,5,6}
// X_values: array of x values (airFlow)
// Y_values: array of y values (parameter to fit)
// Returns: [a0, a1, a2, a3, a4, a5, a6] coefficients (a0 is constant/intercept)
// Formula: y = a0 + a1*x + a2*x^2 + a3*x^3 + a4*x^4 + a5*x^5 + a6*x^6
function polynomialRegression(X_values, Y_values) {
  const n = X_values.length;
  const degree = 6;

  // Filter out null/undefined values
  const validPairs = [];
  for (let i = 0; i < n; i++) {
    if (X_values[i] !== null && X_values[i] !== undefined &&
      Y_values[i] !== null && Y_values[i] !== undefined &&
      !isNaN(X_values[i]) && !isNaN(Y_values[i])) {
      validPairs.push({ x: X_values[i], y: Y_values[i] });
    }
  }

  if (validPairs.length < degree + 1) {
    throw new Error(`Not enough valid data points for degree-${degree} polynomial regression with intercept`);
  }

  // Build design matrix X WITH intercept column
  // Each row: [1, x, x^2, x^3, x^4, x^5, x^6]
  const X = validPairs.map(pair => {
    const row = [1]; // Constant term (intercept)
    for (let p = 1; p <= degree; p++) {
      row.push(Math.pow(pair.x, p));
    }
    return row;
  });

  // Build Y vector as column matrix
  const Y = validPairs.map(pair => [pair.y]);

  // Solve using normal equations: (X'X)^-1 * X'Y
  const Xt = matrixTranspose(X);
  const XtX = matrixMultiply(Xt, X);
  const XtX_inv = matrixInverse(XtX);
  const XtY = matrixMultiply(Xt, Y);
  const coefficients = matrixMultiply(XtX_inv, XtY);

  // Return as flat array [a0, a1, a2, a3, a4, a5, a6]
  return coefficients.map(row => row[0]);
}

// Evaluate polynomial at a given x value
// coefficients: [a0, a1, a2, a3, a4, a5, a6]
// x: value to evaluate at
// Returns: y = a0 + a1*x + a2*x^2 + a3*x^3 + a4*x^4 + a5*x^5 + a6*x^6
function evaluatePolynomial(coefficients, x) {
  let result = 0;
  for (let p = 0; p < coefficients.length; p++) {
    result += coefficients[p] * Math.pow(x, p);
  }
  return result;
}

// Linear interpolation between two adjacent data points
// X_values: array of x values (must be sorted or will be sorted)
// Y_values: array of y values
// x_target: the x value to interpolate at
// Returns: interpolated y value
function linearInterpolate(X_values, Y_values, x_target) {
  // Create pairs and filter out null/undefined values
  const validPairs = [];
  for (let i = 0; i < X_values.length; i++) {
    if (X_values[i] !== null && X_values[i] !== undefined &&
      Y_values[i] !== null && Y_values[i] !== undefined &&
      !isNaN(X_values[i]) && !isNaN(Y_values[i])) {
      validPairs.push({ x: X_values[i], y: Y_values[i] });
    }
  }

  if (validPairs.length < 2) {
    throw new Error("Not enough valid data points for interpolation");
  }

  // Sort by x value
  validPairs.sort((a, b) => a.x - b.x);

  // Find the two points that bracket x_target
  for (let i = 0; i < validPairs.length - 1; i++) {
    const x0 = validPairs[i].x;
    const y0 = validPairs[i].y;
    const x1 = validPairs[i + 1].x;
    const y1 = validPairs[i + 1].y;

    if (x_target >= x0 && x_target <= x1) {
      // Linear interpolation: y = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
      if (x1 === x0) return y0; // Avoid division by zero
      return y0 + (y1 - y0) * (x_target - x0) / (x1 - x0);
    }
  }

  // If x_target is outside the range, extrapolate using nearest segment
  if (x_target < validPairs[0].x) {
    // Extrapolate using first two points
    const x0 = validPairs[0].x;
    const y0 = validPairs[0].y;
    const x1 = validPairs[1].x;
    const y1 = validPairs[1].y;
    if (x1 === x0) return y0;
    return y0 + (y1 - y0) * (x_target - x0) / (x1 - x0);
  } else {
    // Extrapolate using last two points
    const n = validPairs.length;
    const x0 = validPairs[n - 2].x;
    const y0 = validPairs[n - 2].y;
    const x1 = validPairs[n - 1].x;
    const y1 = validPairs[n - 1].y;
    if (x1 === x0) return y1;
    return y0 + (y1 - y0) * (x_target - x0) / (x1 - x0);
  }
}

// Calculate Phase 7 - Polynomial regression prediction for user airflow
// Uses degree-6 polynomial with intercept: y = a0 + a1*x + a2*x^2 + ... + a6*x^6
function calculatePhase7(phase6Data, airFlow_user) {
  if (!phase6Data || !phase6Data.phase6) {
    return null;
  }

  const p6 = phase6Data.phase6;
  const airFlow = p6.airFlow;

  if (!airFlow || airFlow.length === 0) {
    return null;
  }

  if (airFlow_user === null || airFlow_user === undefined || isNaN(airFlow_user)) {
    return null;
  }

  try {
    // Perform polynomial regression for each Y-parameter (with intercept)
    const totalPressureCoeffs = polynomialRegression(airFlow, p6.totalPressure);
    const velocityPressureCoeffs = polynomialRegression(airFlow, p6.velocityPressure);
    const staticPressureCoeffs = polynomialRegression(airFlow, p6.staticPressure);
    const fanInputPowerCoeffs = polynomialRegression(airFlow, p6.fanInputPower);
    const totalEfficiencyCoeffs = polynomialRegression(airFlow, p6.totalEfficiency);
    const staticEfficiencyCoeffs = polynomialRegression(airFlow, p6.staticEfficiency);

    // Debug: Log coefficients to compare with Excel
    console.log(`\n=== Phase 7 Coefficients Debug for ${phase6Data.model} ===`);
    console.log(`AirFlow data (first 3): ${airFlow.slice(0, 3)}`);
    console.log(`TotalPressure data (first 3): ${p6.totalPressure.slice(0, 3)}`);
    console.log(`Total Pressure Coefficients [a0, a1, a2, a3, a4, a5, a6]:`);
    console.log(`  a0 (constant): ${totalPressureCoeffs[0]}`);
    console.log(`  a1 (x^1): ${totalPressureCoeffs[1]}`);
    console.log(`  a2 (x^2): ${totalPressureCoeffs[2]}`);
    console.log(`  a3 (x^3): ${totalPressureCoeffs[3]}`);
    console.log(`  a4 (x^4): ${totalPressureCoeffs[4]}`);
    console.log(`  a5 (x^5): ${totalPressureCoeffs[5]}`);
    console.log(`  a6 (x^6): ${totalPressureCoeffs[6]}`);
    console.log(`User airFlow: ${airFlow_user}`);

    // Evaluate polynomials at user airflow
    const predicted = {
      totalPressure: evaluatePolynomial(totalPressureCoeffs, airFlow_user),
      velocityPressure: evaluatePolynomial(velocityPressureCoeffs, airFlow_user),
      staticPressure: evaluatePolynomial(staticPressureCoeffs, airFlow_user),
      fanInputPower: evaluatePolynomial(fanInputPowerCoeffs, airFlow_user),
      totalEfficiency: evaluatePolynomial(totalEfficiencyCoeffs, airFlow_user),
      staticEfficiency: evaluatePolynomial(staticEfficiencyCoeffs, airFlow_user),
    };

    console.log(`Predicted Total Pressure: ${predicted.totalPressure}`);

    return {
      model: phase6Data.model,
      innerDiameter: phase6Data.innerDiameter,
      airFlow_user,
      predicted,
      coefficients: {
        totalPressure: totalPressureCoeffs,
        velocityPressure: velocityPressureCoeffs,
        staticPressure: staticPressureCoeffs,
        fanInputPower: fanInputPowerCoeffs,
        totalEfficiency: totalEfficiencyCoeffs,
        staticEfficiency: staticEfficiencyCoeffs,
      },
    };
  } catch (error) {
    console.warn(`Phase 7 calculation failed for ${phase6Data.model}: ${error.message}`);
    return null;
  }
}

// ============================================================================
// PHASE 8: Append Predicted Point to Phase 6 Curves
// ============================================================================
// Takes Phase 6 arrays (10 points) and appends the Phase 7 predicted point
// Result: arrays with 11 points each
function calculatePhase8(phase6Data, phase7Data) {
  if (!phase6Data || !phase6Data.phase6 || !phase7Data || !phase7Data.predicted) {
    return null;
  }

  const p6 = phase6Data.phase6;
  const predicted = phase7Data.predicted;
  const airFlow_user = phase7Data.airFlow_user;

  // Append predicted point to each array
  return {
    model: phase6Data.model,
    innerDiameter: phase6Data.innerDiameter,
    ratedRPM: phase6Data.ratedRPM,
    matchingRPM: phase6Data.matchingRPM,
    phase8: {
      airFlow: [...p6.airFlow, airFlow_user],
      totalPressure: [...p6.totalPressure, predicted.totalPressure],
      velocityPressure: [...p6.velocityPressure, predicted.velocityPressure],
      staticPressure: [...p6.staticPressure, predicted.staticPressure],
      fanInputPower: [...p6.fanInputPower, predicted.fanInputPower],
      totalEfficiency: [...p6.totalEfficiency, predicted.totalEfficiency],
      staticEfficiency: [...p6.staticEfficiency, predicted.staticEfficiency],
    },
  };
}

// ============================================================================
// PHASE 9: Sorting & Filtering (Excel RQ-UK columns)
// ============================================================================
// Sorts ALL arrays by airFlow order (ascending) and filters by user airflow
// Excel Formula: RQ = TRANSPOSE(SORT(TRANSPOSE(OK:OU),,1)) - sorts airflow
// Other arrays (SC, SO, TA, TM, TY, UK) are filtered to match sorted airflow order
// Returns: sorted arrays for Phase 19 curve generation + filtered point for Phase 10
function calculatePhase9(phase8Data, airFlow_user) {
  if (!phase8Data || !phase8Data.phase8) {
    return null;
  }

  const p8 = phase8Data.phase8;

  if (!p8.airFlow || p8.airFlow.length === 0) {
    return null;
  }

  if (airFlow_user === null || airFlow_user === undefined || isNaN(airFlow_user)) {
    return null;
  }

  // Step 1: Create index mapping and sort by airFlow (ascending)
  // This matches Excel: TRANSPOSE(SORT(TRANSPOSE(OK:OU),,1))
  const indexedData = p8.airFlow.map((val, idx) => ({ val, idx }));
  indexedData.sort((a, b) => a.val - b.val);

  // Step 2: Reorder ALL arrays based on sorted airflow indices
  // This matches Excel FILTER functions that align arrays with sorted airflow
  const sortedArrays = {
    airFlow: indexedData.map(item => p8.airFlow[item.idx]),
    totalPressure: indexedData.map(item => p8.totalPressure[item.idx]),
    velocityPressure: indexedData.map(item => p8.velocityPressure[item.idx]),
    staticPressure: indexedData.map(item => p8.staticPressure[item.idx]),
    fanInputPower: indexedData.map(item => p8.fanInputPower[item.idx]),
    totalEfficiency: indexedData.map(item => p8.totalEfficiency[item.idx]),
    staticEfficiency: indexedData.map(item => p8.staticEfficiency[item.idx]),
  };

  console.log(`Phase 9 sortedArrays created for ${phase8Data.model}:`);
  console.log(`  Original airFlow: ${p8.airFlow}`);
  console.log(`  Sorted airFlow: ${sortedArrays.airFlow}`);

  // Step 3: Find index where airFlow matches user airflow (in original array)
  const tolerance = 0.0001;
  let matchIndex = -1;

  for (let i = 0; i < p8.airFlow.length; i++) {
    if (Math.abs(p8.airFlow[i] - airFlow_user) < tolerance || p8.airFlow[i] === airFlow_user) {
      matchIndex = i;
      break;
    }
  }

  // If no exact match found, return null
  if (matchIndex === -1) {
    console.warn(`Phase 9: No matching airFlow found for ${airFlow_user} in ${phase8Data.model}`);
    return null;
  }

  // Return both sorted arrays (for Phase 19) and filtered point (for Phase 10)
  return {
    model: phase8Data.model,
    innerDiameter: phase8Data.innerDiameter,
    matchingRPM: phase8Data.matchingRPM,
    ratedRPM: phase8Data.ratedRPM,
    // Sorted arrays for Phase 19 curve generation (Excel RQ-UK)
    sortedArrays: sortedArrays,
    // Filtered point for Phase 10 results table
    filteredPoint: {
      airFlow: p8.airFlow[matchIndex],
      totalPressure: p8.totalPressure[matchIndex],
      velocityPressure: p8.velocityPressure[matchIndex],
      staticPressure: p8.staticPressure[matchIndex],
      fanInputPower: p8.fanInputPower[matchIndex],
      totalEfficiency: p8.totalEfficiency[matchIndex],
      staticEfficiency: p8.staticEfficiency[matchIndex],
    },
  };
}

// ============================================================================
// PHASE 10: Final Results Table & Sorting
// ============================================================================
// Creates consolidated results table from Phase 8/9 data
// Sorts by Total Efficiency (descending)
function calculatePhase10(phase9Results, phase5Results, phase8Results, rawDataMap) {
  if (!phase9Results || phase9Results.length === 0) {
    return [];
  }

  // Build final results table
  // RPM comes directly from Phase 9 (which inherited it from Phase 6 → Phase 8 → Phase 9)
  const resultsTable = phase9Results
    .filter(p9 => p9 !== null && p9.filteredPoint)
    .map(p9 => {
      // Use matchingRPM directly from Phase 9 (propagated from Phase 6)
      const rpm = p9.matchingRPM;

      // Find original raw fan data for Phase 19 curve generation
      const rawFan = rawDataMap?.get(`${p9.model}-${p9.innerDiameter}`);

      // Debug: Log Phase 9 sortedArrays
      console.log(`Phase 10: ${p9.model} - sortedArrays exists: ${!!p9.sortedArrays}, airFlow first 3: ${p9.sortedArrays?.airFlow?.slice(0, 3)}`);

      return {
        fanModel: `${p9.model}-${p9.innerDiameter}`,
        model: p9.model,
        innerDiameter: p9.innerDiameter,
        airFlow: p9.filteredPoint.airFlow,
        staticPressure: p9.filteredPoint.staticPressure,
        velocityPressure: p9.filteredPoint.velocityPressure,
        totalPressure: p9.filteredPoint.totalPressure,
        fanInputPower: p9.filteredPoint.fanInputPower,
        totalEfficiency: p9.filteredPoint.totalEfficiency,
        staticEfficiency: p9.filteredPoint.staticEfficiency,
        rpm: rpm,
        // Include SORTED curve arrays from Phase 9 for Phase 19 (Excel RQ-UK columns)
        curveArrays: p9.sortedArrays ? {
          airFlow: p9.sortedArrays.airFlow,
          totalPressure: p9.sortedArrays.totalPressure,
          velocityPressure: p9.sortedArrays.velocityPressure,
          staticPressure: p9.sortedArrays.staticPressure,
          fanInputPower: p9.sortedArrays.fanInputPower,
          totalEfficiency: p9.sortedArrays.totalEfficiency,
          staticEfficiency: p9.sortedArrays.staticEfficiency,
        } : null,
        // Include original fan data with rated RPM for Phase 19 speed ratio calculation
        originalFanData: rawFan ? {
          airFlow: rawFan.airFlow,
          totPressure: rawFan.totPressure,
          velPressure: rawFan.velPressure,
          staticPressure: rawFan.staticPressure,
          fanInputPow: rawFan.fanInputPow,
          RPM: rawFan.RPM,
          desigDensity: rawFan.desigDensity,
        } : null,
        // Rated RPM from original fan data (VX column in Excel)
        RPM: rawFan?.RPM || p9.ratedRPM,
      };
    });

  // Sort by Total Efficiency (descending)
  resultsTable.sort((a, b) => b.totalEfficiency - a.totalEfficiency);

  return resultsTable;
}

// ============================================================================
// PHASE 11: Belt Selection Calculations
// ============================================================================
// Triggered when user selects a fan from Phase 10 and specifies belt type + motor poles
// Calculates pulley arrays for the selected belt type
function calculatePhase11(selectedFan, beltType, motorPoles, fanRPM) {
  if (!selectedFan || !beltType || !motorPoles || !fanRPM) {
    return null;
  }

  // Motor speed lookup based on poles
  const motorSpeedMap = {
    2: 2880,
    4: 1440,
    6: 960,
    8: 750,
  };

  const N1 = motorSpeedMap[motorPoles];
  if (!N1) {
    console.warn(`Invalid motor poles: ${motorPoles}`);
    return null;
  }

  // N2 = Fan RPM from Phase 5 (matching RPM)
  const N2 = fanRPM;

  // Load pulley database
  const pulleyDbPath = path.join(__dirname, "pully database.json");
  const pulleyStandardPath = path.join(__dirname, "Pulleys Standard .json");

  if (!fs.existsSync(pulleyDbPath)) {
    console.warn(`Pulley database not found: ${pulleyDbPath}`);
    return null;
  }

  if (!fs.existsSync(pulleyStandardPath)) {
    console.warn(`Pulleys Standard not found: ${pulleyStandardPath}`);
    return null;
  }

  let pulleyDb, pulleyStandard;
  try {
    pulleyDb = JSON.parse(fs.readFileSync(pulleyDbPath, "utf8"));
    pulleyStandard = JSON.parse(fs.readFileSync(pulleyStandardPath, "utf8"));
  } catch (err) {
    console.warn(`Error reading pulley files: ${err.message}`);
    return null;
  }

  // Filter pulley database entries by belt type
  const filteredPulleys = pulleyDb.filter(
    (entry) => entry["Belt Type"] === beltType
  );

  if (filteredPulleys.length === 0) {
    console.warn(`No pulley entries found for belt type: ${beltType}`);
    return null;
  }

  // Fixed standard pitch diameter sizes from Units sheet
  // These are the only valid D2 values that can be selected
  const standardSizes = [
    50, 56, 60, 63, 67, 71, 75, 80, 85, 90, 95, 100, 106, 112, 118, 125, 132, 140,
    150, 160, 170, 180, 190, 200, 212, 224, 236, 250, 265, 280, 300, 315, 335, 355,
    375, 400, 425, 450, 475, 500, 530, 560, 630, 710, 800, 900, 1000, 1250
  ];

  // Helper function to find nearest standard size
  function findNearestStandardSize(rawValue) {
    if (rawValue === null || isNaN(rawValue)) return null;

    let nearestSize = standardSizes[0];
    let minDiff = Math.abs(standardSizes[0] - rawValue);

    for (const size of standardSizes) {
      const diff = Math.abs(size - rawValue);
      if (diff < minDiff) {
        minDiff = diff;
        nearestSize = size;
      }
    }

    return nearestSize;
  }

  // Build arrays
  const N = filteredPulleys.length;

  // Array 1: Motor Speed (RPM) - N1[] - same value repeated
  const motorSpeed_N1 = Array(N).fill(N1);

  // Array 2: Fan Speed (RPM) - N2[] - same value repeated
  const fanSpeed_N2 = Array(N).fill(N2);

  // Array 3: Motor Pulley Diameter (mm) - D1[] - from pitchDiameter
  const motorPulleyDiameter_D1 = filteredPulleys.map((entry) => {
    const val = parseFloat(entry["Pitch Diameter"]);
    return isNaN(val) ? null : val;
  });

  // Array 4: Fan Pulley Diameter (Calculated) - D2_raw[] = (N1 * D1) / N2
  const fanPulleyDiameterRaw_D2_raw = motorPulleyDiameter_D1.map((D1) => {
    if (D1 === null || N2 === 0) return null;
    return (N1 * D1) / N2;
  });

  // Debug: Log first few D2 calculations
  console.log("Phase 11 Debug - N1:", N1, "N2:", N2);
  console.log("Phase 11 Debug - First 5 D1 values:", motorPulleyDiameter_D1.slice(0, 5));
  console.log("Phase 11 Debug - First 5 D2_raw values:", fanPulleyDiameterRaw_D2_raw.slice(0, 5));

  // Array 5: Fan Pulley Diameter (Standardized) - D2[] - nearest standard size
  const fanPulleyDiameterStandard_D2 = fanPulleyDiameterRaw_D2_raw.map(
    (D2_raw) => findNearestStandardSize(D2_raw)
  );

  // Array 5b: Validated D2 - Check if D2 standard actually exists in pulley database for this belt type
  // This is the critical filter from Excel: FILTER($WH:$WH,($WC:$WC=WN204)*($WB:$WB=WB204)*($WA:$WA=WA204))
  // If D2 doesn't exist as a pulley pitch diameter for this belt type, set to null
  const fanPulleyDiameterValidated_D2 = fanPulleyDiameterStandard_D2.map((D2_std) => {
    if (D2_std === null) return null;
    // Check if this D2 exists in the pulley database for the current belt type
    const existsInDb = filteredPulleys.some(p => parseFloat(p["Pitch Diameter"]) === parseFloat(D2_std));
    return existsInDb ? D2_std : null;
  });

  // Array 6: Corrected Fan Speed (RPM) - N2_corrected[] = (N1 * D1) / D2
  // Use validated D2, not just standard D2
  const correctedFanSpeed_N2_corrected = motorPulleyDiameter_D1.map((D1, i) => {
    const D2 = fanPulleyDiameterValidated_D2[i];
    if (D1 === null || D2 === null || D2 === 0) return null;
    return (N1 * D1) / D2;
  });

  // Array 7: Bush Number - BushNo[] - from Bush No.
  const bushNo = filteredPulleys.map((entry) => entry["Bush No."] || null);

  // Array 8: No. of Grooves - from pulley database
  const noOfGrooves = filteredPulleys.map((entry) => entry["No. of Grooves"] || null);

  return {
    fanModel: selectedFan.fanModel || selectedFan.model,
    innerDiameter: selectedFan.innerDiameter,
    beltType,
    motorPoles,
    entryCount: N,
    arrays: {
      motorSpeed_N1,
      fanSpeed_N2,
      motorPulleyDiameter_D1,
      fanPulleyDiameterRaw_D2_raw,
      fanPulleyDiameterStandard_D2: fanPulleyDiameterValidated_D2, // Use validated D2
      correctedFanSpeed_N2_corrected,
      bushNo,
      noOfGrooves,
    },
  };
}

// Exported function for Phase 11 endpoint
export function processPhase11(params) {
  const { selectedFan, beltType, motorPoles, fanRPM } = params;
  return calculatePhase11(selectedFan, beltType, motorPoles, fanRPM);
}

// ============================================================================
// PHASE 12: Fan Pulley Validation & Power Recalculation
// ============================================================================
// Validates fan pulley diameter against fan shaft diameter
// Recalculates fan input power considering RPM correction, friction losses, and SPF
function calculatePhase12(phase11Result, selectedFan, frictionLossesPercent, spfPercent) {
  if (!phase11Result || !phase11Result.arrays || !selectedFan) {
    return null;
  }

  const { beltType, innerDiameter } = phase11Result;
  const model = selectedFan.model;
  const oldRPM = selectedFan.rpm; // matchingRPM from Phase 5
  const fanInputPower_old = selectedFan.fanInputPower; // predicted value from Phase 8

  if (!oldRPM || !fanInputPower_old) {
    console.warn(`Phase 12: Missing oldRPM (${oldRPM}) or fanInputPower_old (${fanInputPower_old})`);
    return null;
  }

  // Default friction losses and SPF to 0 if not provided
  const frictionLosses = frictionLossesPercent || 0;
  const spf = spfPercent || 0;

  // Load centrifugal fan data to get fanShaftDiameter
  const fanDataPath = path.join(__dirname, "centrifugalFan.json");
  const pulleyDbPath = path.join(__dirname, "pully database.json");

  if (!fs.existsSync(fanDataPath) || !fs.existsSync(pulleyDbPath)) {
    console.warn("Phase 12: Required JSON files not found");
    return null;
  }

  let fanData, pulleyDb;
  try {
    fanData = JSON.parse(fs.readFileSync(fanDataPath, "utf8"));
    pulleyDb = JSON.parse(fs.readFileSync(pulleyDbPath, "utf8"));
  } catch (err) {
    console.warn(`Phase 12: Error reading JSON files: ${err.message}`);
    return null;
  }

  // Find the fan by model and innerDiameter to get fanShaftDiameter
  const matchingFan = fanData.find(
    (f) => f.Blades?.Model === model && f.Impeller?.innerDiameter === innerDiameter
  );

  if (!matchingFan) {
    console.warn(`Phase 12: No matching fan found for model=${model}, innerDiameter=${innerDiameter}`);
    return null;
  }

  const fanShaftDiameter = matchingFan.Impeller?.fanShaftDiameter;
  if (!fanShaftDiameter) {
    console.warn(`Phase 12: fanShaftDiameter not found for ${model}-${innerDiameter}`);
    return null;
  }

  // Filter pulley database by belt type
  const filteredPulleys = pulleyDb.filter((entry) => entry["Belt Type"] === beltType);

  if (filteredPulleys.length === 0) {
    console.warn(`Phase 12: No pulley entries found for belt type: ${beltType}`);
    return null;
  }

  // Get Phase 11 arrays
  const {
    motorSpeed_N1,
    fanSpeed_N2,
    motorPulleyDiameter_D1,
    fanPulleyDiameterStandard_D2,
    correctedFanSpeed_N2_corrected,
    bushNo,
    fanPulleyDiameterRaw_D2_raw,
  } = phase11Result.arrays;

  const N = phase11Result.entryCount;

  // Build Phase 12 arrays
  const D2_checked = [];
  const fanInputPower_new = [];
  const validIndices = [];

  // Get noOfGrooves from Phase 11
  const noOfGroovesArray = phase11Result.arrays.noOfGrooves || [];

  for (let i = 0; i < N; i++) {
    const D2_standard = fanPulleyDiameterStandard_D2[i];
    const correctedRPM = correctedFanSpeed_N2_corrected[i];
    const d1Grooves = parseInt(noOfGroovesArray[i]) || 0;

    // Skip if D2_standard is null (already invalidated in Phase 11)
    if (D2_standard === null || correctedRPM === null) {
      D2_checked.push(null);
      fanInputPower_new.push(null);
      continue;
    }

    // Filter 1: Groove count validation
    // Valid groove counts are determined by bore validation (fan shaft must fit in D1 pulley bore)
    // Different fans have different shaft diameters, so groove limits are not hardcoded
    // The bore check below will naturally filter out invalid groove counts
    // Skip only if groove count is 0 or negative (invalid data)
    if (d1Grooves <= 0) {
      D2_checked.push(null);
      fanInputPower_new.push(null);
      continue;
    }

    // Get D2 pulleys with MATCHING groove count (D1 and D2 must have same grooves)
    const matchingD2Pulleys = filteredPulleys.filter(p =>
      parseFloat(p["Pitch Diameter"]) === parseFloat(D2_standard) &&
      parseInt(p["No. of Grooves"]) === d1Grooves
    );
    if (matchingD2Pulleys.length === 0) {
      D2_checked.push(null);
      fanInputPower_new.push(null);
      continue;
    }

    // Array 1: Check Fan Pulley Dia. (mm) - D2_checked[]
    // IMPORTANT: Excel WS formula uses the D1 PULLEY ROW's bore range (WE, WF from same row)
    // NOT the D2 pulley's bore range. This is because each row in the pulley database
    // represents a D1 pulley, and the bore check validates if fan shaft fits in that row's bore.
    // Get the D1 pulley entry for this row to get its bore range
    const D1_value = motorPulleyDiameter_D1[i];
    const d1PulleyEntry = filteredPulleys.find(p =>
      parseFloat(p["Pitch Diameter"]) === parseFloat(D1_value) &&
      parseInt(p["No. of Grooves"]) === d1Grooves
    );

    let isValid = false;
    if (d1PulleyEntry) {
      const minBore = parseFloat(d1PulleyEntry["Min Bore"]);
      const maxBore = parseFloat(d1PulleyEntry["Max Bore"]);
      if (!isNaN(minBore) && !isNaN(maxBore)) {
        // Fan shaft must fit in D1 pulley row's bore range (Excel WS logic)
        isValid = fanShaftDiameter >= minBore && fanShaftDiameter <= maxBore;
      }
    }

    if (isValid) {
      D2_checked.push(D2_standard);
      validIndices.push(i);

      // Array 2: New Fan Input Power - fanInputPower_new[]
      // Excel AAM formula: Original Power × (New RPM / Original RPM)^3
      // Note: Friction losses and SPF are NOT applied here - they are accounted for
      // in Phase 13 via the safety factor (15%) and service factor (10%)
      const fanInputPower_calculated = fanInputPower_old * Math.pow(correctedRPM / oldRPM, 3);

      fanInputPower_new.push(Math.round(fanInputPower_calculated * 10000) / 10000); // 4 decimals
    } else {
      D2_checked.push(null);
      fanInputPower_new.push(null);
    }
  }

  // Filter out rows with null D2_checked (same structure as Phase 11 but only valid rows)
  const filteredArrays = {
    motorSpeed_N1: [],
    fanSpeed_N2: [],
    motorPulleyDiameter_D1: [],
    fanPulleyDiameterRaw_D2_raw: [],
    fanPulleyDiameterStandard_D2: [],
    correctedFanSpeed_N2_corrected: [],
    bushNo: [],
    noOfGrooves: [],
    D2_checked: [],
    fanInputPower_new: [],
  };

  // Get noOfGrooves from Phase 11
  const noOfGrooves = phase11Result.arrays.noOfGrooves || [];

  for (const i of validIndices) {
    filteredArrays.motorSpeed_N1.push(motorSpeed_N1[i]);
    filteredArrays.fanSpeed_N2.push(fanSpeed_N2[i]);
    filteredArrays.motorPulleyDiameter_D1.push(motorPulleyDiameter_D1[i]);
    filteredArrays.fanPulleyDiameterRaw_D2_raw.push(fanPulleyDiameterRaw_D2_raw[i]);
    filteredArrays.fanPulleyDiameterStandard_D2.push(fanPulleyDiameterStandard_D2[i]);
    filteredArrays.correctedFanSpeed_N2_corrected.push(
      Math.round(correctedFanSpeed_N2_corrected[i] * 10000) / 10000
    );
    filteredArrays.bushNo.push(bushNo[i]);
    filteredArrays.noOfGrooves.push(noOfGrooves[i]);
    filteredArrays.D2_checked.push(D2_checked[i]);
    filteredArrays.fanInputPower_new.push(fanInputPower_new[i]);
  }

  return {
    fanModel: phase11Result.fanModel,
    innerDiameter: phase11Result.innerDiameter,
    beltType: phase11Result.beltType,
    motorPoles: phase11Result.motorPoles,
    fanShaftDiameter,
    frictionLossesPercent: frictionLosses,
    spfPercent: spf,
    oldRPM,
    fanInputPower_old,
    entryCount: validIndices.length,
    originalEntryCount: N,
    arrays: filteredArrays,
  };
}

// Exported function for Phase 12 endpoint
export function processPhase12(params) {
  const { phase11Result, selectedFan, frictionLossesPercent, spfPercent } = params;
  return calculatePhase12(phase11Result, selectedFan, frictionLossesPercent, spfPercent);
}

// ============================================================================
// PHASE 13: Motor Selection Logic (Corrected to match Excel logic)
// ============================================================================
// Standard motor power values in kW (from Excel)
const STANDARD_MOTOR_POWERS_KW = [0.09, 0.12, 0.18, 0.25, 0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55];

// Helper function to round up to next standard motor power
function roundUpToStandardPower(powerKW) {
  for (const stdPower of STANDARD_MOTOR_POWERS_KW) {
    if (powerKW <= stdPower) {
      return stdPower;
    }
  }
  return null; // No standard power found (exceeds max)
}

// Selects the minimum suitable motor based on net fan power and user constraints
// Excel Logic (columns YX to ZL):
// 1. YX = Fan Input Power (from Phase 12)
// 2. YY = Motor Output Power = Fan Input Power × (1 + Safety Factor 15%)
// 3. ZF = Round YY up to standard kW values
// 4. ZG = Motor Efficiency (lookup from Motor Eff sheet for ZF + constraints)
// 5. ZH = Motor Power = (YY / ZG) × (1 + Service Factor 10%)
// 6. ZI = Round ZH up to standard kW values
// 7. ZK = Motor Model (lookup from Motor Eff sheet for ZI + constraints)
function calculatePhase13(netFanPowerKW, userPoles, userPhases, userInsulationClass, safetyFactor = 0.15, serviceFactor = 0.10) {
  if (!netFanPowerKW || netFanPowerKW <= 0) {
    return { error: "Invalid net fan power", details: "netFanPowerKW must be a positive number" };
  }

  if (!userPoles || !userPhases || !userInsulationClass) {
    return { error: "Missing required parameters", details: "userPoles, userPhases, and userInsulationClass are required" };
  }

  // Load motor data
  const motorDataPath = path.join(__dirname, "MotorData.json");
  if (!fs.existsSync(motorDataPath)) {
    return { error: "Motor data file not found", details: motorDataPath };
  }

  let motorData;
  try {
    motorData = JSON.parse(fs.readFileSync(motorDataPath, "utf8"));
  } catch (err) {
    return { error: "Error reading motor data", details: err.message };
  }

  // Step 1: Calculate Motor Output Power Required (YY in Excel)
  // Motor Output Power = Fan Input Power × (1 + Safety Factor)
  const motorOutputPowerRequired = netFanPowerKW * (1 + safetyFactor);

  // Step 2: Round up to standard motor power (ZF in Excel - Fan Input Power as Standard)
  const standardOutputPower = roundUpToStandardPower(motorOutputPowerRequired);
  if (!standardOutputPower) {
    return {
      error: "No motor satisfies power requirements",
      details: `Required motor output power ${motorOutputPowerRequired.toFixed(4)} kW exceeds maximum standard power`,
    };
  }

  // Step 3: Filter motors by user constraints first to find efficiency
  const constraintMatchedMotors = motorData.filter((m) => {
    const motorPoles = parseInt(m["No of Poles"]) || 0;
    const motorPhases = parseInt(m["No. of Phases"]) || 0;
    const motorInsulation = m["Insulation Class"] || "";
    return (
      motorPoles === parseInt(userPoles) &&
      motorPhases === parseInt(userPhases) &&
      motorInsulation === userInsulationClass
    );
  });

  if (constraintMatchedMotors.length === 0) {
    return {
      error: "No motor matches configuration requirements",
      details: `No motor found matching: Poles=${userPoles}, Phases=${userPhases}, Insulation=${userInsulationClass}`,
    };
  }

  // Step 4: Find motor efficiency for standard output power (ZG in Excel)
  // Look for motor with Power(kW) = standardOutputPower and matching constraints
  let motorEfficiency = null;
  const efficiencyMotor = constraintMatchedMotors.find((m) => {
    const powerKW = parseFloat(m["Power (kW)"]) || 0;
    return Math.abs(powerKW - standardOutputPower) < 0.001;
  });

  if (efficiencyMotor) {
    motorEfficiency = parseFloat(efficiencyMotor["Efficiency @ 50 Hz"]) || 0;
  }

  // If no exact match, find the closest motor with power >= standardOutputPower
  if (!motorEfficiency || motorEfficiency <= 0) {
    const sortedByPower = constraintMatchedMotors
      .map((m) => ({ ...m, powerKW: parseFloat(m["Power (kW)"]) || 0 }))
      .filter((m) => m.powerKW >= standardOutputPower)
      .sort((a, b) => a.powerKW - b.powerKW);

    if (sortedByPower.length > 0) {
      motorEfficiency = parseFloat(sortedByPower[0]["Efficiency @ 50 Hz"]) || 0.85;
    } else {
      motorEfficiency = 0.85; // Default efficiency if not found
    }
  }

  // Step 5: Calculate required Motor Input Power (ZH in Excel)
  // Motor Power = (Motor Output Power Required / Motor Efficiency) × (1 + Service Factor)
  const motorInputPowerRequired = (motorOutputPowerRequired / motorEfficiency) * (1 + serviceFactor);

  // Step 6: Round up to standard motor power (ZI in Excel - Motor Power as Standard kW)
  const standardMotorPower = roundUpToStandardPower(motorInputPowerRequired);
  if (!standardMotorPower) {
    return {
      error: "No motor satisfies power requirements",
      details: `Required motor input power ${motorInputPowerRequired.toFixed(4)} kW exceeds maximum standard power`,
    };
  }

  // Step 7: Select motor with Power(kW) = standardMotorPower and matching constraints (ZK in Excel)
  const selectedMotor = constraintMatchedMotors.find((m) => {
    const powerKW = parseFloat(m["Power (kW)"]) || 0;
    return Math.abs(powerKW - standardMotorPower) < 0.001;
  });

  if (!selectedMotor) {
    // If exact match not found, find closest motor with power >= standardMotorPower
    const sortedByPower = constraintMatchedMotors
      .map((m) => ({ ...m, powerKW: parseFloat(m["Power (kW)"]) || 0 }))
      .filter((m) => m.powerKW >= standardMotorPower)
      .sort((a, b) => a.powerKW - b.powerKW);

    if (sortedByPower.length === 0) {
      return {
        error: "No motor satisfies power and configuration requirements",
        details: `No motor found matching: Poles=${userPoles}, Phases=${userPhases}, Insulation=${userInsulationClass} with power >= ${standardMotorPower} kW`,
      };
    }

    const motor = sortedByPower[0];
    const efficiency50Hz = parseFloat(motor["Efficiency @ 50 Hz"]) || 0;
    return {
      noOfPoles: parseInt(motor["No of Poles"]) || null,
      noOfPhases: parseInt(motor["No. of Phases"]) || null,
      insulationClass: motor["Insulation Class"] || null,
      ie: motor["IE"] || null,
      capacitors: parseInt(motor["No. of Capacitors"]) || 0,
      efficiency50Hz: efficiency50Hz,
      powerKW: motor.powerKW,
      powerHP: parseFloat(motor["Power (HP)"]) || null,
      shaftKeyLengthMM: parseFloat(motor["Shaft Feather Key Length (mm)"]) || null,
      shaftDiameterMM: parseFloat(motor["Shaft Diameter (mm)"]) || null,
      model: motor["Model"] || null,
      motorOutputPowerRequired: Math.round(motorOutputPowerRequired * 10000) / 10000,
      standardOutputPower: standardOutputPower,
      motorEfficiencyUsed: Math.round(motorEfficiency * 10000) / 10000,
      motorInputPowerRequired: Math.round(motorInputPowerRequired * 10000) / 10000,
      standardMotorPower: standardMotorPower,
      netFanPowerRequired: Math.round(netFanPowerKW * 10000) / 10000,
    };
  }

  const efficiency50Hz = parseFloat(selectedMotor["Efficiency @ 50 Hz"]) || 0;
  const powerKW = parseFloat(selectedMotor["Power (kW)"]) || 0;

  return {
    noOfPoles: parseInt(selectedMotor["No of Poles"]) || null,
    noOfPhases: parseInt(selectedMotor["No. of Phases"]) || null,
    insulationClass: selectedMotor["Insulation Class"] || null,
    ie: selectedMotor["IE"] || null,
    capacitors: parseInt(selectedMotor["No. of Capacitors"]) || 0,
    efficiency50Hz: efficiency50Hz,
    powerKW: powerKW,
    powerHP: parseFloat(selectedMotor["Power (HP)"]) || null,
    shaftKeyLengthMM: parseFloat(selectedMotor["Shaft Feather Key Length (mm)"]) || null,
    shaftDiameterMM: parseFloat(selectedMotor["Shaft Diameter (mm)"]) || null,
    model: selectedMotor["Model"] || null,
    motorOutputPowerRequired: Math.round(motorOutputPowerRequired * 10000) / 10000,
    standardOutputPower: standardOutputPower,
    motorEfficiencyUsed: Math.round(motorEfficiency * 10000) / 10000,
    motorInputPowerRequired: Math.round(motorInputPowerRequired * 10000) / 10000,
    standardMotorPower: standardMotorPower,
    netFanPowerRequired: Math.round(netFanPowerKW * 10000) / 10000,
  };
}

// Exported function for Phase 13 endpoint
export function processPhase13(params) {
  const { netFanPowerKW, userPoles, userPhases, userInsulationClass } = params;
  return calculatePhase13(netFanPowerKW, userPoles, userPhases, userInsulationClass);
}

// ============================================================================
// PHASE 14: Check Motor Pulley Diameter (D1) Compatibility
// ============================================================================
// Validates whether motor pulley D1 is compatible with selected motor based on:
// - Shaft diameter vs pulley bore limits (Min Bore <= Shaft <= Max Bore)
// - Feather key length vs pulley F width (F Width <= Key Length)
function calculatePhase14(phase11Arrays, phase13Motors, beltType) {
  if (!phase11Arrays || !phase13Motors || !beltType) {
    return { error: "Missing required parameters for Phase 14" };
  }

  // Load pulley database
  const pulleyDbPath = path.join(__dirname, "pully database.json");
  if (!fs.existsSync(pulleyDbPath)) {
    return { error: "Pulley database file not found" };
  }

  let pulleyData;
  try {
    pulleyData = JSON.parse(fs.readFileSync(pulleyDbPath, "utf8"));
  } catch (err) {
    return { error: "Error reading pulley database", details: err.message };
  }

  // Filter pulleys by belt type
  const beltPulleys = pulleyData.filter(p => p["Belt Type"] === beltType);

  const entryCount = phase11Arrays.motorPulleyDiameter_D1?.length || 0;
  const checkMotorPulleyD1 = [];
  const validationDetails = [];

  for (let i = 0; i < entryCount; i++) {
    const d1 = phase11Arrays.motorPulleyDiameter_D1[i];
    const motor = phase13Motors[i];
    const grooves = phase11Arrays.noOfGrooves ? phase11Arrays.noOfGrooves[i] : null;

    // If no motor selected for this row, D1 is invalid
    if (!motor || !d1) {
      checkMotorPulleyD1.push(null);
      validationDetails.push({ index: i, valid: false, reason: "No motor or D1 available" });
      continue;
    }

    const motorShaftDiameter = motor.shaftDiameterMM;
    const motorShaftKeyLength = motor.shaftKeyLengthMM;

    // Find the pulley entry matching this D1, belt type, AND groove count
    // The groove count must match because different groove counts have different bore ranges and F(Width)
    const pulleyEntry = beltPulleys.find(p =>
      parseFloat(p["Pitch Diameter"]) === parseFloat(d1) &&
      (grooves === null || parseInt(p["No. of Grooves"]) === parseInt(grooves))
    );

    if (!pulleyEntry) {
      checkMotorPulleyD1.push(null);
      validationDetails.push({ index: i, valid: false, reason: `Pulley D1=${d1} not found in database for belt type ${beltType}` });
      continue;
    }

    const minBore = parseFloat(pulleyEntry["Min Bore"]) || 0;
    const maxBore = parseFloat(pulleyEntry["Max Bore"]) || 0;
    const fWidth = parseFloat(pulleyEntry["F (Width)"]) || 0;

    // Condition 1: Shaft Diameter Compatibility
    // Min Bore <= Motor Shaft Diameter <= Max Bore
    const shaftCompatible = motorShaftDiameter >= minBore && motorShaftDiameter <= maxBore;

    // Condition 2: Feather Key Length Compatibility
    // F (Width) <= Shaft Feather Key Length
    const keyCompatible = fWidth <= motorShaftKeyLength;

    if (shaftCompatible && keyCompatible) {
      checkMotorPulleyD1.push(d1);
      validationDetails.push({
        index: i,
        valid: true,
        d1: d1,
        motorShaftDiameter,
        motorShaftKeyLength,
        minBore,
        maxBore,
        fWidth,
      });
    } else {
      checkMotorPulleyD1.push(null);
      validationDetails.push({
        index: i,
        valid: false,
        d1: d1,
        motorShaftDiameter,
        motorShaftKeyLength,
        minBore,
        maxBore,
        fWidth,
        shaftCompatible,
        keyCompatible,
        reason: !shaftCompatible
          ? `Shaft diameter ${motorShaftDiameter}mm not in bore range [${minBore}-${maxBore}]mm`
          : `F width ${fWidth}mm exceeds key length ${motorShaftKeyLength}mm`,
      });
    }
  }

  const validCount = checkMotorPulleyD1.filter(d => d !== null).length;

  return {
    beltType,
    entryCount,
    validCount,
    arrays: {
      checkMotorPulleyD1,
    },
    validationDetails,
  };
}

// Exported function for Phase 14 endpoint
export function processPhase14(params) {
  const { phase11Arrays, phase13Motors, beltType } = params;
  return calculatePhase14(phase11Arrays, phase13Motors, beltType);
}

// ============================================================================
// PHASE 15: Belt Geometry & Standardization
// ============================================================================
// Calculates Belt Length, Belt Length per Standard, and Center Distance
// Inputs: D1 (from Phase 14), D2 (from Phase 12), Inner Diameter, Belt Section
function calculatePhase15(phase12Arrays, phase14Arrays, innerDiameter, beltSection) {
  if (!phase12Arrays || !phase14Arrays || !innerDiameter || !beltSection) {
    return { error: "Missing required parameters for Phase 15" };
  }

  // Load Belt Length per Standard JSON
  const beltStandardPath = path.join(__dirname, "Belt Length per Standard.json");
  if (!fs.existsSync(beltStandardPath)) {
    return { error: "Belt Length per Standard file not found" };
  }

  let beltStandardData;
  try {
    beltStandardData = JSON.parse(fs.readFileSync(beltStandardPath, "utf8"));
  } catch (err) {
    return { error: "Error reading Belt Length per Standard file", details: err.message };
  }

  // Extract standard belt lengths for the selected belt section
  const standardLengths = beltStandardData
    .map(entry => {
      const val = entry[beltSection];
      return val !== null && val !== undefined ? parseFloat(val) : null;
    })
    .filter(v => v !== null && !isNaN(v))
    .sort((a, b) => a - b);

  if (standardLengths.length === 0) {
    return { error: `No standard belt lengths found for belt section: ${beltSection}` };
  }

  const minStandard = standardLengths[0];
  const maxStandard = standardLengths[standardLengths.length - 1];

  // Get D1 from Phase 14 (checkMotorPulleyD1) and D2 from Phase 12 (D2_checked)
  const D1_array = phase14Arrays.checkMotorPulleyD1 || [];
  const D2_array = phase12Arrays.D2_checked || [];
  const entryCount = Math.max(D1_array.length, D2_array.length);

  const PI = 3.14159;

  // Output arrays
  const beltLength = [];
  const beltLengthStandard = [];
  const centerDistance = [];

  for (let i = 0; i < entryCount; i++) {
    const D1 = D1_array[i];
    const D2 = D2_array[i];

    // If any input is null, all outputs for this row are null
    if (D1 === null || D1 === undefined || D2 === null || D2 === undefined) {
      beltLength.push(null);
      beltLengthStandard.push(null);
      centerDistance.push(null);
      continue;
    }

    // ========== Column 1: Belt Length (mm) ==========
    // C = 1.4 × Inner Diameter
    const C = 1.4 * innerDiameter;

    // D = max(D1, D2), d = min(D1, D2)
    const D = Math.max(D1, D2);
    const d = Math.min(D1, D2);

    // Belt Length L = 2C + (π/2)(D + d) + (D − d)² / (4C)
    const L = 2 * C + (PI / 2) * (D + d) + Math.pow(D - d, 2) / (4 * C);
    beltLength.push(Math.round(L * 100) / 100); // 2 decimal places

    // ========== Column 2: Belt Length per Standard (mm) ==========
    // Find nearest standard length, clamping to min/max if out of range
    let L_standard = null;

    if (L < minStandard) {
      // Below min → clamp to minimum
      L_standard = minStandard;
    } else if (L > maxStandard) {
      // Above max → clamp to maximum
      L_standard = maxStandard;
    } else {
      // Within range → find nearest standard length
      let nearestLength = standardLengths[0];
      let minDiff = Math.abs(standardLengths[0] - L);

      for (const stdLen of standardLengths) {
        const diff = Math.abs(stdLen - L);
        if (diff < minDiff) {
          minDiff = diff;
          nearestLength = stdLen;
        }
      }
      L_standard = nearestLength;
    }

    beltLengthStandard.push(L_standard);

    // ========== Column 3: Center Distance (mm) ==========ss
    // Inverse formula: C = ((L - A) + sqrt((L - A)² - 2(D - d)²)) / 4
    // Where A = (π/2)(D + d)
    // Use L_standard for this calculation

    const A = (PI / 2) * (D + d);
    const L_minus_A = L_standard - A;
    const discriminant = Math.pow(L_minus_A, 2) - 2 * Math.pow(D - d, 2);

    if (discriminant < 0) {
      // Negative discriminant → no real solution
      centerDistance.push(null);
    } else {
      const C_calculated = (L_minus_A + Math.sqrt(discriminant)) / 4;
      centerDistance.push(Math.round(C_calculated)); // Round to nearest whole number
    }
  }

  const validCount = beltLength.filter(v => v !== null).length;

  return {
    beltSection,
    innerDiameter,
    entryCount,
    validCount,
    standardLengthRange: { min: minStandard, max: maxStandard },
    arrays: {
      beltLength,
      beltLengthStandard,
      centerDistance,
    },
  };
}

// Exported function for Phase 15 endpoint
export function processPhase15(params) {
  const { phase12Arrays, phase14Arrays, innerDiameter, beltSection } = params;
  return calculatePhase15(phase12Arrays, phase14Arrays, innerDiameter, beltSection);
}

// ============================================================================
// PHASE 16: Consolidated Filter Table
// ============================================================================
// Creates a filtered table combining valid results from Phases 11-15
// Filters rows based on RPM window: MinRPM <= UserRPM <= MinRPM + maxRpmChange
function calculatePhase16(phase11Data, phase12Arrays, phase14Arrays, phase15Arrays, userRPM, maxRpmChange) {
  if (!phase12Arrays) {
    return { error: "Missing Phase 12 data" };
  }

  // Use Phase 12 arrays as the base (already filtered from Phase 11)
  const beltType = phase11Data?.beltType || "SPA";
  const entryCount = phase12Arrays.D2_checked?.length || 0;

  // Result arrays for Phase 16
  const filteredRows = [];

  for (let i = 0; i < entryCount; i++) {
    // Get values from Phase 12 filtered arrays (indices are aligned)
    const D2 = phase12Arrays?.D2_checked?.[i] || null;  // Fan Pulley Dia from Phase 12
    const D1 = phase14Arrays?.checkMotorPulleyD1?.[i] || null;  // Motor Pulley Dia from Phase 14
    const N2_corrected = phase12Arrays?.correctedFanSpeed_N2_corrected?.[i] || null;  // Corrected Fan Speed from Phase 12
    const N1 = phase12Arrays?.motorSpeed_N1?.[i] || null;  // Motor Speed from Phase 12
    const noOfGrooves = phase12Arrays?.noOfGrooves?.[i] || null;  // No. of Grooves from Phase 12
    const bushNo = phase12Arrays?.bushNo?.[i] || null;  // Bush No. from Phase 12
    const beltLengthStandard = phase15Arrays?.beltLengthStandard?.[i] || null;  // Belt Length Standard from Phase 15
    const centerDistance = phase15Arrays?.centerDistance?.[i] || null;  // Center Distance from Phase 15

    // Skip if essential values are null
    if (D2 === null || D1 === null || N2_corrected === null) {
      continue;
    }

    // RPM Window Filter: UserRPM <= N2_corrected <= UserRPM + maxRpmChange
    // MinRPM = UserRPM (from Phase 10 selected fan)
    // MaxRPM = UserRPM + maxRpmChange
    // Include row only if N2_corrected falls within this range
    if (userRPM !== null && userRPM !== undefined && maxRpmChange !== null && maxRpmChange !== undefined) {
      const minRPM = userRPM;
      const maxRPM = userRPM + maxRpmChange;
      if (N2_corrected < minRPM || N2_corrected > maxRPM) {
        continue; // Skip this row - N2 doesn't fall within RPM window
      }
    }

    // Row passes all filters - add to results
    filteredRows.push({
      index: i,
      fanPulleyDia_D2: D2,
      motorPulleyDia_D1: D1,
      fanSpeed_N2: Math.round(N2_corrected * 100) / 100,
      motorSpeed_N1: N1,
      beltType: beltType,
      noOfGrooves: noOfGrooves,
      bushNo: bushNo,
      beltLengthStandard: beltLengthStandard,
      centerDistance: centerDistance,
    });
  }

  return {
    beltType,
    userRPM,
    maxRpmChange,
    totalEntries: entryCount,
    filteredCount: filteredRows.length,
    rows: filteredRows,
  };
}

// Exported function for Phase 16 endpoint
export function processPhase16(params) {
  const { phase11Data, phase12Arrays, phase14Arrays, phase15Arrays, userRPM, maxRpmChange } = params;
  return calculatePhase16(phase11Data, phase12Arrays, phase14Arrays, phase15Arrays, userRPM, maxRpmChange);
}

// ============================================================================
// PHASE 18: Final Output Table (Excel columns AAG to ABA, excluding AAX, AAY)
// ============================================================================
// Generates the final output data for a selected Phase 16 row
// Combines data from selected fan, Phase 16 row, and Phase 17 motor
function calculatePhase18(params) {
  const {
    selectedFan,        // Original fan data from Phase 10
    phase16Row,         // Selected row from Phase 16
    phase17Motor,       // Motor data from Phase 17 (recalled from Phase 13)
    userPoles,          // User-selected poles
    userPhases,         // User-selected phases (1 or 3)
    innerDiameter,      // Inner diameter from selected fan
  } = params;

  // Validate required inputs
  if (!selectedFan || !phase16Row || !phase17Motor) {
    return { error: "Missing required parameters for Phase 18" };
  }

  // Extract original fan data (from Phase 10 selected fan)
  // Phase 10 data uses: rpm, totalEfficiency, staticEfficiency, airFlow, staticPressure, velocityPressure, totalPressure, fanInputPower
  const originalSpeed = parseFloat(selectedFan.rpm) || parseFloat(selectedFan.speed) || parseFloat(selectedFan.Speed) || null;
  const originalTotalEff = parseFloat(selectedFan.totalEfficiency) || parseFloat(selectedFan["Total Eff."]) || null;
  const originalStaticEff = parseFloat(selectedFan.staticEfficiency) || parseFloat(selectedFan["Static Eff."]) || null;
  const originalAirFlow = parseFloat(selectedFan.airFlow) || parseFloat(selectedFan["Air Flow"]) || null;
  const originalStaticPressure = parseFloat(selectedFan.staticPressure) || parseFloat(selectedFan["Static Pressure"]) || null;
  const originalDynamicPressure = parseFloat(selectedFan.velocityPressure) || parseFloat(selectedFan.dynamicPressure) || parseFloat(selectedFan["Dynamic Pressure"]) || null;
  const originalTotalPressure = parseFloat(selectedFan.totalPressure) || parseFloat(selectedFan["Total Pressure"]) || null;
  const originalFanInputPower = parseFloat(selectedFan.fanInputPower) || parseFloat(selectedFan["Fan Input Power"]) || null;
  const fanModel = selectedFan.fanModel || selectedFan["Fan Model"] || selectedFan.model || null;

  // Extract Phase 16 row data
  const N2 = parseFloat(phase16Row.fanSpeed_N2) || null;  // Fan Speed (RPM)
  const D2 = parseFloat(phase16Row.fanPulleyDia_D2) || null;  // Fan Pulley Dia (mm)
  const N1 = parseFloat(phase16Row.motorSpeed_N1) || null;  // Motor Speed (RPM)
  const D1 = parseFloat(phase16Row.motorPulleyDia_D1) || null;  // Motor Pulley Dia (mm)
  const beltTypeRaw = phase16Row.beltType || null;  // Belt Type (SPA, SPB, SPC, SPZ)
  const noOfGrooves = phase16Row.noOfGrooves || null;  // No. of Grooves
  const beltLengthStandard = phase16Row.beltLengthStandard || null;  // Belt Length per Standard (mm)
  const centerDistance = phase16Row.centerDistance || null;  // Center Distance (mm)

  // Extract Phase 17 motor data
  // Motor object uses: powerHP, powerKW, noOfPoles, noOfPhases, etc.
  const motorPowerHP = parseFloat(phase17Motor.powerHP) || parseFloat(phase17Motor["Power (HP)"]) || null;
  const motorPoles = parseInt(phase17Motor.noOfPoles) || parseInt(phase17Motor["No of Poles"]) || userPoles || null;

  // Calculate speed ratio
  const speedRatio = (N2 !== null && originalSpeed !== null && originalSpeed !== 0)
    ? N2 / originalSpeed
    : null;

  // ========== AAG: Total Efficiency ==========
  // Direct lookup from fan data (no calculation needed)
  const totalEfficiency = originalTotalEff;

  // ========== AAH: Static Efficiency ==========
  // Direct lookup from fan data (no calculation needed)
  const staticEfficiency = originalStaticEff;

  // ========== AAI: Air Flow ==========
  // Air Flow = Original Air Flow × (N2 / Original Speed)
  const airFlow = (originalAirFlow !== null && speedRatio !== null)
    ? originalAirFlow * speedRatio
    : null;

  // ========== AAJ: Static Pressure ==========
  // Static Pressure = Original Static Pressure × (N2 / Original Speed)²
  const staticPressure = (originalStaticPressure !== null && speedRatio !== null)
    ? originalStaticPressure * Math.pow(speedRatio, 2)
    : null;

  // ========== AAK: Dynamic Pressure ==========
  // Dynamic Pressure = Original Dynamic Pressure × (N2 / Original Speed)²
  const dynamicPressure = (originalDynamicPressure !== null && speedRatio !== null)
    ? originalDynamicPressure * Math.pow(speedRatio, 2)
    : null;

  // ========== AAL: Total Pressure ==========
  // Total Pressure = Original Total Pressure × (N2 / Original Speed)²
  const totalPressure = (originalTotalPressure !== null && speedRatio !== null)
    ? originalTotalPressure * Math.pow(speedRatio, 2)
    : null;

  // ========== AAM: Fan Input Power ==========
  // Fan Input Power = Original Power × (N2 / Original Speed)³
  const fanInputPower = (originalFanInputPower !== null && speedRatio !== null)
    ? originalFanInputPower * Math.pow(speedRatio, 3)
    : null;

  // ========== AAN: Motor Power (HP) ==========
  // From Phase 13/17 motor selection (ZJ in Excel)
  const motorPowerHPOutput = motorPowerHP;

  // ========== AAO: Fan Speed (RPM) - N2 ==========
  const fanSpeedN2 = N2;

  // ========== AAP: Fan Pulley Dia. (mm) - D2 ==========
  const fanPulleyDiaD2 = D2;

  // ========== AAQ: Motor Speed (RPM) - N1 ==========
  const motorSpeedN1 = N1;

  // ========== AAR: Motor Pulley Dia. (mm) - D1 ==========
  const motorPulleyDiaD1 = D1;

  // ========== AAS: Belt Type ==========
  // Convert SPA/SPB/SPC/SPZ to "Type - A/B/C/Z"
  let beltTypeFormatted = null;
  if (beltTypeRaw) {
    if (beltTypeRaw === "SPA") beltTypeFormatted = "Type - A";
    else if (beltTypeRaw === "SPB") beltTypeFormatted = "Type - B";
    else if (beltTypeRaw === "SPC") beltTypeFormatted = "Type - C";
    else if (beltTypeRaw === "SPZ") beltTypeFormatted = "Type - Z";
    else beltTypeFormatted = beltTypeRaw;
  }

  // ========== AAT: No. of Grooves ==========
  const noOfGroovesOutput = noOfGrooves;

  // ========== AAU: Belt Length per Standard (mm) ==========
  const beltLengthStandardOutput = beltLengthStandard;

  // ========== AAV: Center Distance (mm) ==========
  const centerDistanceOutput = centerDistance;

  // ========== AAW: Inner Diameter (mm) ==========
  const innerDiameterOutput = innerDiameter || null;

  // ========== ABA: Fan Model (formatted string) ==========
  // Format: FanModel-PolesPhaseType-MotorHP [BeltType/Grooves-D2/D1]
  // Example: SCF-SIB-B-800-4T-3 [Type - A/2-630/280]
  // ZB = "T" if phases=3, "M" if phases=1
  const phaseCode = (userPhases === 3) ? "T" : "M";
  let fanModelFormatted = null;
  if (fanModel && motorPoles && motorPowerHPOutput && beltTypeFormatted && noOfGrooves && D2 && D1) {
    fanModelFormatted = `${fanModel}-${motorPoles}${phaseCode}-${motorPowerHPOutput} [${beltTypeFormatted}/${noOfGrooves}-${D2}/${D1}]`;
  }

  // Return Phase 18 results
  return {
    // AAG - Total Efficiency
    totalEfficiency: totalEfficiency !== null ? Math.round(totalEfficiency * 10000) / 10000 : null,
    // AAH - Static Efficiency
    staticEfficiency: staticEfficiency !== null ? Math.round(staticEfficiency * 10000) / 10000 : null,
    // AAI - Air Flow
    airFlow: airFlow !== null ? Math.round(airFlow * 100) / 100 : null,
    // AAJ - Static Pressure
    staticPressure: staticPressure !== null ? Math.round(staticPressure * 100) / 100 : null,
    // AAK - Dynamic Pressure
    dynamicPressure: dynamicPressure !== null ? Math.round(dynamicPressure * 100) / 100 : null,
    // AAL - Total Pressure
    totalPressure: totalPressure !== null ? Math.round(totalPressure * 100) / 100 : null,
    // AAM - Fan Input Power
    fanInputPower: fanInputPower !== null ? Math.round(fanInputPower * 10000) / 10000 : null,
    // AAN - Motor Power (HP)
    motorPowerHP: motorPowerHPOutput,
    // AAO - Fan Speed (RPM) - N2
    fanSpeedN2: fanSpeedN2,
    // AAP - Fan Pulley Dia. (mm) - D2
    fanPulleyDiaD2: fanPulleyDiaD2,
    // AAQ - Motor Speed (RPM) - N1
    motorSpeedN1: motorSpeedN1,
    // AAR - Motor Pulley Dia. (mm) - D1
    motorPulleyDiaD1: motorPulleyDiaD1,
    // AAS - Belt Type
    beltType: beltTypeFormatted,
    // AAT - No. of Grooves
    noOfGrooves: noOfGroovesOutput,
    // AAU - Belt Length per Standard (mm)
    beltLengthStandard: beltLengthStandardOutput,
    // AAV - Center Distance (mm)
    centerDistance: centerDistanceOutput,
    // AAW - Inner Diameter (mm)
    innerDiameter: innerDiameterOutput,
    // ABA - Fan Model (formatted)
    fanModelFormatted: fanModelFormatted,
    // Additional metadata
    speedRatio: speedRatio !== null ? Math.round(speedRatio * 10000) / 10000 : null,
    originalSpeed: originalSpeed,
  };
}

// Exported function for Phase 18 endpoint
export function processPhase18(params) {
  return calculatePhase18(params);
}

// ============================================================================
// PHASE 19: Fan Curve Data Generation (Based on Excel ABD-AEH columns)
// ============================================================================
// Generates 7 curve arrays for plotting fan performance curves
// Uses Phase 9 sorted arrays and applies fan affinity laws with N2/OriginalRPM ratio
// 
// Excel Formulas (Phase 19):
// ABD (Airflow): Phase9_Airflow * (N2 / OriginalRPM)
// ABP (Total Pressure): Phase9_TotalPressure * (N2 / OriginalRPM)²
// ACB (Velocity Pressure): Phase9_VelocityPressure * (N2 / OriginalRPM)²
// ACN (Static Pressure): Phase9_StaticPressure * (N2 / OriginalRPM)²
// ACZ (Fan Input Power): Phase9_FanInputPower * (N2 / OriginalRPM)³
// ADL (Total Efficiency): Phase9_TotalEfficiency (unchanged)
// ADX (Static Efficiency): Phase9_StaticEfficiency (unchanged)
//
// Input: selectedFan (contains Phase 9 curveArrays), phase18Result (contains N2)
// Output: 7 arrays - airFlow, totalPressure, velocityPressure, staticPressure, fanInputPower, totalEfficiency, staticEfficiency
export function processPhase19(params) {
  const { selectedFan, phase18Result, phase9Data } = params;

  console.log("\n=== PHASE 19 DEBUG ===");
  console.log("selectedFan keys:", selectedFan ? Object.keys(selectedFan) : "null");
  console.log("selectedFan.curveArrays exists:", !!selectedFan?.curveArrays);
  console.log("selectedFan.curveArrays?.airFlow first 3:", selectedFan?.curveArrays?.airFlow?.slice(0, 3));
  console.log("selectedFan.originalFanData exists:", !!selectedFan?.originalFanData);
  console.log("selectedFan.originalFanData?.airFlow first 3:", selectedFan?.originalFanData?.airFlow?.slice(0, 3));
  console.log("phase18Result:", phase18Result ? { fanSpeedN2: phase18Result.fanSpeedN2, originalSpeed: phase18Result.originalSpeed } : "null");

  if (!selectedFan || !phase18Result) {
    console.log("ERROR: Missing required parameters");
    return { error: "Missing required parameters", details: "selectedFan and phase18Result are required" };
  }

  // N2 = Fan Speed from Phase 18 (AAO column - the operating speed)
  const N2 = phase18Result.fanSpeedN2;
  if (!N2 || N2 <= 0) {
    console.log("ERROR: Invalid fan speed N2:", N2);
    return { error: "Invalid fan speed", details: "Phase 18 fanSpeedN2 is required and must be positive" };
  }

  // OriginalRPM = VX column in Excel (the original rated speed for this fan model)
  // This comes from the fan's rated RPM, not the matching RPM from Phase 6
  const originalRPM = selectedFan.rpm || selectedFan.RPM ||
    selectedFan.originalFanData?.RPM ||
    phase18Result.originalSpeed || 1000;

  console.log("N2 (operating speed):", N2);
  console.log("OriginalRPM (rated speed):", originalRPM);

  // Get Phase 9 sorted curve arrays
  // Phase 9 sorts Phase 8 arrays by airflow and filters by fan model
  // curveArrays should contain the sorted arrays from Phase 8/9
  let curveSource;
  let curveSourceName;
  if (phase9Data) {
    curveSource = phase9Data;
    curveSourceName = "phase9Data";
  } else if (selectedFan.curveArrays && selectedFan.curveArrays.airFlow && selectedFan.curveArrays.airFlow.length > 0) {
    curveSource = selectedFan.curveArrays;
    curveSourceName = "selectedFan.curveArrays";
  } else if (selectedFan.originalFanData) {
    curveSource = selectedFan.originalFanData;
    curveSourceName = "selectedFan.originalFanData (UNSORTED - BUG!)";
  } else {
    curveSource = selectedFan;
    curveSourceName = "selectedFan (UNSORTED - BUG!)";
  }
  console.log("curveSource used:", curveSourceName);
  console.log("curveSource.airFlow first 5:", curveSource.airFlow?.slice(0, 5));

  // Extract raw arrays from curveSource
  const rawAirFlow = Array.isArray(curveSource.airFlow) ? curveSource.airFlow : [];
  const rawTotalPressure = Array.isArray(curveSource.totalPressure) ? curveSource.totalPressure :
    (Array.isArray(curveSource.totPressure) ? curveSource.totPressure : []);
  const rawVelocityPressure = Array.isArray(curveSource.velocityPressure) ? curveSource.velocityPressure :
    (Array.isArray(curveSource.velPressure) ? curveSource.velPressure : []);
  const rawStaticPressure = Array.isArray(curveSource.staticPressure) ? curveSource.staticPressure : [];
  const rawFanInputPower = Array.isArray(curveSource.fanInputPower) ? curveSource.fanInputPower :
    (Array.isArray(curveSource.fanInputPow) ? curveSource.fanInputPow : []);
  const rawTotalEfficiency = Array.isArray(curveSource.totalEfficiency) ? curveSource.totalEfficiency : [];
  const rawStaticEfficiency = Array.isArray(curveSource.staticEfficiency) ? curveSource.staticEfficiency : [];

  // ALWAYS sort arrays by airflow ascending (matching Excel Phase 9 RQ-UK logic)
  // This ensures correct order even if curveArrays is null and we fall back to unsorted data
  const indexedData = rawAirFlow.map((val, idx) => ({ val, idx }));
  indexedData.sort((a, b) => a.val - b.val);

  const phase9AirFlow = indexedData.map(item => rawAirFlow[item.idx]);
  const phase9TotalPressure = indexedData.map(item => rawTotalPressure[item.idx]);
  const phase9VelocityPressure = indexedData.map(item => rawVelocityPressure[item.idx]);
  const phase9StaticPressure = indexedData.map(item => rawStaticPressure[item.idx]);
  const phase9FanInputPower = indexedData.map(item => rawFanInputPower[item.idx]);
  const phase9TotalEfficiency = indexedData.map(item => rawTotalEfficiency[item.idx]);
  const phase9StaticEfficiency = indexedData.map(item => rawStaticEfficiency[item.idx]);

  console.log("Phase 19 arrays (sorted by airflow):");
  console.log("  airFlow length:", phase9AirFlow.length, "first 3:", phase9AirFlow.slice(0, 3));
  console.log("  totalPressure length:", phase9TotalPressure.length);
  console.log("  velocityPressure length:", phase9VelocityPressure.length);
  console.log("  staticPressure length:", phase9StaticPressure.length);
  console.log("  fanInputPower length:", phase9FanInputPower.length);
  console.log("  totalEfficiency length:", phase9TotalEfficiency.length);
  console.log("  staticEfficiency length:", phase9StaticEfficiency.length);

  if (phase9AirFlow.length === 0) {
    console.log("ERROR: No Phase 9 airflow data found");
    console.log("Available keys in curveSource:", Object.keys(curveSource));
    return { error: "No airflow data", details: "Phase 9 airflow array is empty" };
  }

  // Calculate speed ratio: N2 / OriginalRPM
  const speedRatio = N2 / originalRPM;
  console.log("Speed ratio (N2/OriginalRPM):", speedRatio);

  // Helper to safely map arrays
  const safeMap = (arr, fn) => arr.map((v, i) => {
    if (v === null || v === undefined || isNaN(v)) return null;
    return fn(v, i);
  });

  // Apply fan affinity laws (Excel formulas from ABD-AEH)
  // ABD: Airflow at N2 = Phase9_Airflow × (N2/OriginalRPM)
  const airFlowNew = safeMap(phase9AirFlow, q => q * speedRatio);

  // ABP: Total Pressure at N2 = Phase9_TotalPressure × (N2/OriginalRPM)²
  const totalPressureNew = safeMap(phase9TotalPressure, p => p * Math.pow(speedRatio, 2));

  // ACB: Velocity Pressure at N2 = Phase9_VelocityPressure × (N2/OriginalRPM)²
  const velocityPressureNew = safeMap(phase9VelocityPressure, p => p * Math.pow(speedRatio, 2));

  // ACN: Static Pressure at N2 = Phase9_StaticPressure × (N2/OriginalRPM)²
  const staticPressureNew = safeMap(phase9StaticPressure, p => p * Math.pow(speedRatio, 2));

  // ACZ: Fan Input Power at N2 = Phase9_FanInputPower × (N2/OriginalRPM)³
  const fanInputPowerNew = safeMap(phase9FanInputPower, w => w * Math.pow(speedRatio, 3));

  // ADL: Total Efficiency - unchanged from Phase 9 (efficiency doesn't change with speed)
  const totalEfficiencyNew = safeMap(phase9TotalEfficiency, e => e);

  // ADX: Static Efficiency - unchanged from Phase 9
  const staticEfficiencyNew = safeMap(phase9StaticEfficiency, e => e);

  // Generate system curve points
  // System curve: P = k × Q² where k = P_operating / Q_operating²
  const operatingAirFlow = phase18Result.airFlow;
  const operatingStaticPressure = phase18Result.staticPressure;
  let systemCurve = [];

  if (operatingAirFlow && operatingAirFlow > 0 && operatingStaticPressure) {
    const k = operatingStaticPressure / Math.pow(operatingAirFlow, 2);
    systemCurve = airFlowNew.map(q => {
      if (q === null || q <= 0) return null;
      return k * Math.pow(q, 2);
    });
  }

  // Round values for output
  const roundArray = (arr, decimals = 2) => arr.map(v =>
    v !== null && !isNaN(v) ? Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals) : null
  );

  const result = {
    // 7 curve arrays for plotting (matching Excel ABD-AEH)
    airFlowNew: roundArray(airFlowNew, 2),
    totalPressureNew: roundArray(totalPressureNew, 2),
    velocityPressureNew: roundArray(velocityPressureNew, 2),
    staticPressureNew: roundArray(staticPressureNew, 2),
    fanInputPowerNew: roundArray(fanInputPowerNew, 4),
    totalEfficiencyNew: roundArray(totalEfficiencyNew, 4),
    staticEfficiencyNew: roundArray(staticEfficiencyNew, 4),
    systemCurve: roundArray(systemCurve, 2),

    // Operating point (from Phase 18)
    operatingPoint: {
      airFlow: phase18Result.airFlow,
      staticPressure: phase18Result.staticPressure,
      totalPressure: phase18Result.totalPressure,
      velocityPressure: phase18Result.dynamicPressure,
      fanInputPower: phase18Result.fanInputPower,
      staticEfficiency: phase18Result.staticEfficiency,
      totalEfficiency: phase18Result.totalEfficiency,
    },

    // Metadata
    fanSpeedN2: N2,
    originalRPM: originalRPM,
    speedRatio: Math.round(speedRatio * 10000) / 10000,
    fanModel: selectedFan.fanModel || selectedFan.model || phase18Result.fanModelFormatted,
  };

  console.log("Phase 19 result arrays lengths:");
  console.log("  airFlowNew:", result.airFlowNew.length);
  console.log("  totalPressureNew:", result.totalPressureNew.length);
  console.log("  staticPressureNew:", result.staticPressureNew.length);
  console.log("  fanInputPowerNew:", result.fanInputPowerNew.length);

  return result;
}

// ============================================================================
// Phase 20: Noise Data Calculation
// Excel columns ZN-AAE (LW(A) and LP(A) octave band analysis)
// ============================================================================
// Frequency bands (Hz): 62, 125, 250, 500, 1000, 2000, 4000, 8000
// LW(A) = Sound Power Level (dB)
// LP(A) = Sound Pressure Level (dB)
// 
// Formulas from Excel:
// YX = AAM (Fan Input Power from Phase 18)
// YY = YX * (1 + H22) where H22 = 0.15 (motor power factor)
// ZH = (YY / ZG) * (1 + F17) where ZG = motor efficiency, F17 = 0.1 (safety factor)
// ZV (LW Total) = 62 + 10*LOG(ZH) + 10*LOG(AAJ) where AAJ = Static Pressure
// 
// LW bands (ZN-ZU) = ZV - offset for each frequency
// Offsets: 62Hz=-31.73, 125Hz=-20.73, 250Hz=-4.23, 500Hz=-6.73, 
//          1000Hz=-5.73, 2000Hz=-7.73, 4000Hz=-10.73, 8000Hz=-15.73
//
// AAE (LP Total) = ZV - ABS(10*LOG(Q/(4*PI*r²)))
// where Q = directivity factor, r = distance in meters
//
// LP bands (ZW-AAD) = AAE - offset for each frequency
// Offsets: 62Hz=-31.81, 125Hz=-20.81, 250Hz=-4.31, 500Hz=-6.81,
//          1000Hz=-5.81, 2000Hz=-7.81, 4000Hz=-10.81, 8000Hz=-15.81
// ============================================================================
export function processPhase20(params) {
  const {
    phase18Result,      // Contains staticPressure, fanInputPower
    distance = 3,       // Distance r in meters (default 3m)
    directivityQ = 1,   // Directivity factor Q (default 1)
    motorPowerFactor = 0.15,  // H22 in Excel (default 15%)
    safetyFactor = 0.1  // F17 in Excel - Safety factor (default 10%)
  } = params;

  console.log("\n=== PHASE 20 NOISE CALCULATION ===");
  console.log("Input parameters:", { distance, directivityQ, motorPowerFactor, safetyFactor });

  if (!phase18Result) {
    return { error: "Missing required parameters", details: "phase18Result is required" };
  }

  // Get values from Phase 18
  const staticPressure = phase18Result.staticPressure; // AAJ in Excel
  const fanInputPower = phase18Result.fanInputPower;   // AAM in Excel (YX = AAM)

  // Motor efficiency - use from phase18 or default to 0.867 (from Excel ZG4)
  const motorEfficiency = phase18Result.motorEfficiency || 0.867;

  console.log("Phase 18 values:", { staticPressure, fanInputPower, motorEfficiency });

  if (!staticPressure || staticPressure <= 0 || !fanInputPower || fanInputPower <= 0) {
    return {
      error: "Invalid input values",
      details: "staticPressure and fanInputPower must be positive numbers"
    };
  }

  // Excel formula breakdown:
  // YX = AAM (fanInputPower)
  // YY = YX * (1 + H22) = fanInputPower * (1 + 0.15) = fanInputPower * 1.15
  const YY = fanInputPower * (1 + motorPowerFactor);

  // ZH = (YY / ZG) * (1 + F17) = (YY / motorEfficiency) * (1 + 0.1)
  const ZH = (YY / motorEfficiency) * (1 + safetyFactor);
  console.log("YY (motor output power):", YY);
  console.log("ZH (power factor):", ZH);

  // Calculate LW(A) Total (ZV column)
  // ZV = 62 + 10*LOG10(ZH) + 10*LOG10(staticPressure)
  const LW_Total = 62 + 10 * Math.log10(ZH) + 10 * Math.log10(staticPressure);
  console.log("LW(A) Total:", LW_Total);

  // LW(A) octave band offsets (from Excel formulas ZN-ZU)
  const LW_offsets = {
    hz62: 31.73,
    hz125: 20.73,
    hz250: 4.23,
    hz500: 6.73,
    hz1000: 5.73,
    hz2000: 7.73,
    hz4000: 10.73,
    hz8000: 15.73
  };

  // Calculate LW(A) for each frequency band
  const LW_bands = {
    hz62: LW_Total - LW_offsets.hz62,
    hz125: LW_Total - LW_offsets.hz125,
    hz250: LW_Total - LW_offsets.hz250,
    hz500: LW_Total - LW_offsets.hz500,
    hz1000: LW_Total - LW_offsets.hz1000,
    hz2000: LW_Total - LW_offsets.hz2000,
    hz4000: LW_Total - LW_offsets.hz4000,
    hz8000: LW_Total - LW_offsets.hz8000,
    total: LW_Total
  };

  // Calculate LP(A) Total (AAE column)
  // AAE = ZV - ABS(10*LOG10(Q/(4*PI*r²)))
  const distanceAttenuation = Math.abs(10 * Math.log10(directivityQ / (4 * Math.PI * Math.pow(distance, 2))));
  const LP_Total = LW_Total - distanceAttenuation;
  console.log("Distance attenuation:", distanceAttenuation);
  console.log("LP(A) Total:", LP_Total);

  // LP(A) octave band offsets (from Excel formulas ZW-AAD)
  const LP_offsets = {
    hz62: 31.81,
    hz125: 20.81,
    hz250: 4.31,
    hz500: 6.81,
    hz1000: 5.81,
    hz2000: 7.81,
    hz4000: 10.81,
    hz8000: 15.81
  };

  // Calculate LP(A) for each frequency band
  const LP_bands = {
    hz62: LP_Total - LP_offsets.hz62,
    hz125: LP_Total - LP_offsets.hz125,
    hz250: LP_Total - LP_offsets.hz250,
    hz500: LP_Total - LP_offsets.hz500,
    hz1000: LP_Total - LP_offsets.hz1000,
    hz2000: LP_Total - LP_offsets.hz2000,
    hz4000: LP_Total - LP_offsets.hz4000,
    hz8000: LP_Total - LP_offsets.hz8000,
    total: LP_Total
  };

  // Round all values to 2 decimal places
  const roundValue = (v) => Math.round(v * 100) / 100;

  const result = {
    // LW(A) - Sound Power Level
    LW: {
      hz62: roundValue(LW_bands.hz62),
      hz125: roundValue(LW_bands.hz125),
      hz250: roundValue(LW_bands.hz250),
      hz500: roundValue(LW_bands.hz500),
      hz1000: roundValue(LW_bands.hz1000),
      hz2000: roundValue(LW_bands.hz2000),
      hz4000: roundValue(LW_bands.hz4000),
      hz8000: roundValue(LW_bands.hz8000),
      total: roundValue(LW_bands.total)
    },
    // LP(A) - Sound Pressure Level
    LP: {
      hz62: roundValue(LP_bands.hz62),
      hz125: roundValue(LP_bands.hz125),
      hz250: roundValue(LP_bands.hz250),
      hz500: roundValue(LP_bands.hz500),
      hz1000: roundValue(LP_bands.hz1000),
      hz2000: roundValue(LP_bands.hz2000),
      hz4000: roundValue(LP_bands.hz4000),
      hz8000: roundValue(LP_bands.hz8000),
      total: roundValue(LP_bands.total)
    },
    // Arrays for plotting (frequency on x-axis, dB on y-axis)
    frequencies: [62, 125, 250, 500, 1000, 2000, 4000, 8000],
    LW_array: [
      roundValue(LW_bands.hz62),
      roundValue(LW_bands.hz125),
      roundValue(LW_bands.hz250),
      roundValue(LW_bands.hz500),
      roundValue(LW_bands.hz1000),
      roundValue(LW_bands.hz2000),
      roundValue(LW_bands.hz4000),
      roundValue(LW_bands.hz8000)
    ],
    LP_array: [
      roundValue(LP_bands.hz62),
      roundValue(LP_bands.hz125),
      roundValue(LP_bands.hz250),
      roundValue(LP_bands.hz500),
      roundValue(LP_bands.hz1000),
      roundValue(LP_bands.hz2000),
      roundValue(LP_bands.hz4000),
      roundValue(LP_bands.hz8000)
    ],
    // Metadata
    parameters: {
      distance: distance,
      directivityQ: directivityQ,
      motorPowerFactor: motorPowerFactor,
      safetyFactor: safetyFactor,
      staticPressure: staticPressure,
      fanInputPower: fanInputPower,
      motorEfficiency: motorEfficiency
    }
  };

  console.log("Phase 20 result:", {
    LW_Total: result.LW.total,
    LP_Total: result.LP.total,
    LW_array: result.LW_array,
    LP_array: result.LP_array
  });

  return result;
}

// ============================================================================
// Main Service Function: Process Fan Data through Phases 1-10
// ============================================================================
// Prisma client - lazy loaded only when needed (for database mode)
let prisma = null;
async function getPrismaClient() {
  if (!prisma) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const dbUrl = process.env.DATABASE_URL;

      console.log(`Centrifugal Service: Initializing PrismaClient with URL: ${dbUrl}`);

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
      console.log("Centrifugal Service: Prisma connected successfully");

    } catch (err) {
      console.error("Centrifugal Service: Prisma client not available or connection failed:", err.message);
      if (err.message.includes('engine') || err.message.includes('binary')) {
        console.error("This looks like a Prisma engine resolution error. Check PRISMA_QUERY_ENGINE_LIBRARY environment variable.");
      }
      prisma = null;
    }
  }
  return prisma;
}

export async function processFanDataService(inputOptions) {
  const { filePath, units, input, selectedFanType, dataSource } = inputOptions;

  console.log(`\n=== processFanDataService Debug ===`);
  console.log(`selectedFanType received: ${selectedFanType}`);
  console.log(`input.airFlow: ${input?.airFlow}, input.staticPressure: ${input?.staticPressure}`);
  console.log(`dataSource: ${dataSource}`);

  let rawData = [];

  if (dataSource === "db" || filePath === "db") {
    const prismaClient = await getPrismaClient();
    if (!prismaClient) throw new Error("Database not available");
    // Only fetch data relevant to the selected fan type if possible, or all if not filtered
    // Currently fetching all as filtering logic is complex with types
    const rows = await prismaClient.centrifugalFanData.findMany();

    rawData = rows.map((r) => ({
      Blades: {
        Type: r.bladesType,
        Model: r.bladesModel,
        minSpeedRPM: r.minSpeedRPM,
        highSpeedRPM: r.highSpeedRPM,
      },
      Impeller: {
        impellerType: r.impellerType,
        fanShaftDiameter: r.fanShaftDiameter,
        innerDiameter: r.innerDiameter,
      },
      desigDensity: r.desigDensity,
      RPM: r.RPM,
      airFlow: JSON.parse(r.airFlow),
      totPressure: JSON.parse(r.totPressure),
      velPressure: JSON.parse(r.velPressure),
      staticPressure: JSON.parse(r.staticPressure),
      fanInputPow: JSON.parse(r.fanInputPow),
    }));
  } else {
    // Load data from centrifugalFan.json
    let resolvedPath;
    if (filePath && path.isAbsolute(filePath)) {
      resolvedPath = filePath;
    } else if (filePath) {
      resolvedPath = path.join(__dirname, filePath);
    } else {
      resolvedPath = path.join(__dirname, "centrifugalFan.json");
    }

    if (!fs.existsSync(resolvedPath)) {
      const altPath1 = path.join(
        __dirname,
        "..",
        "CentrifugalFanData",
        "centrifugalFan.json"
      );
      const altPath2 = path.join(
        process.cwd(),
        "CentrifugalFanData",
        "centrifugalFan.json"
      );

      if (fs.existsSync(altPath1)) {
        resolvedPath = altPath1;
      } else if (fs.existsSync(altPath2)) {
        resolvedPath = altPath2;
      } else {
        throw new Error(`File not found: ${resolvedPath}`);
      }
    }

    try {
      const fileContent = fs.readFileSync(resolvedPath, "utf8");
      rawData = JSON.parse(fileContent);

      if (!Array.isArray(rawData)) {
        throw new Error(
          `Expected array in ${resolvedPath}, got ${typeof rawData}`
        );
      }

      if (rawData.length === 0) {
        throw new Error(`No fan data found in ${resolvedPath}`);
      }
    } catch (parseError) {
      if (parseError.code === "ENOENT") {
        throw new Error(`File not found: ${resolvedPath}`);
      } else if (parseError instanceof SyntaxError) {
        throw new Error(
          `Invalid JSON in ${resolvedPath}: ${parseError.message}`
        );
      } else {
        throw parseError;
      }
    }
  }

  // Validate input
  if (!input || typeof input.TempC !== "number" || isNaN(input.TempC)) {
    throw new Error("Invalid or missing input.TempC");
  }

  // Note: RPM validation removed - RPM is calculated dynamically per fan, not required as input

  // Calculate input density from temperature
  const inputDensity = calcDensity(input.TempC);

  // Process each fan through the 3 phases
  const results = rawData.map((fan, index) => {
    try {
      // Validate fan has required properties
      if (!fan.airFlow || !Array.isArray(fan.airFlow)) {
        throw new Error(`Fan ${index + 1}: Missing or invalid airFlow array`);
      }
      if (!fan.totPressure || !Array.isArray(fan.totPressure)) {
        throw new Error(`Fan ${index + 1}: Missing or invalid totPressure array`);
      }
      if (!fan.velPressure || !Array.isArray(fan.velPressure)) {
        throw new Error(`Fan ${index + 1}: Missing or invalid velPressure array`);
      }
      if (!fan.staticPressure || !Array.isArray(fan.staticPressure)) {
        throw new Error(`Fan ${index + 1}: Missing or invalid staticPressure array`);
      }
      if (!fan.fanInputPow || !Array.isArray(fan.fanInputPow)) {
        throw new Error(`Fan ${index + 1}: Missing or invalid fanInputPow array`);
      }
      if (!fan.desigDensity || typeof fan.desigDensity !== "number") {
        throw new Error(`Fan ${index + 1}: Missing or invalid desigDensity`);
      }

      // Phase 1: Load Raw Data
      const phase1Raw = loadRawData(fan);

      // Phase 2: Unit Conversion
      const phase2Converted = applyUnitConversions(phase1Raw, units);

      // Phase 3: Density Correction & Efficiency
      const phase3Results = applyDensityCorrectionAndEfficiency(
        phase2Converted,
        phase1Raw,
        inputDensity,
        fan.desigDensity
      );

      // Build fan identifier
      const fanId = fan.Blades?.Model
        ? `${fan.Blades.Model}-${fan.Impeller?.innerDiameter || index}`
        : `Fan-${index + 1}`;

      return {
        fanId,
        fanIndex: index,
        fanMetadata: {
          Blades: fan.Blades,
          Impeller: fan.Impeller,
          desigDensity: fan.desigDensity,
          RPM: fan.RPM,
        },
        phase1: {
          raw: phase1Raw,
        },
        phase2: {
          converted: phase2Converted,
        },
        phase3: phase3Results,
      };
    } catch (fanError) {
      throw new Error(`Error processing fan ${index + 1}: ${fanError.message}`);
    }
  });

  // ============================================================================
  // PHASE 4: Calculate at minimum and maximum RPM for selected fan type
  // ============================================================================
  let phase4Result = [];

  console.log(`\n=== Phase 4 Pre-check ===`);
  console.log(`selectedFanType: "${selectedFanType}"`);
  console.log(`results count: ${results?.length || 0}`);

  if (selectedFanType && results && results.length > 0) {
    try {
      // Debug: Log first few fan models to verify data structure
      console.log(`First 3 fan models in results:`);
      results.slice(0, 3).forEach((r, i) => {
        console.log(`  [${i}] Blades.Model: "${r.fanMetadata?.Blades?.Model}"`);
      });

      // Find all fans that match the selected fan type
      const matchingIndices = results
        .map((r, idx) => (r.fanMetadata?.Blades?.Model === selectedFanType ? idx : -1))
        .filter((idx) => idx >= 0);

      console.log(`Phase 4 matchingIndices count: ${matchingIndices.length}`);

      if (matchingIndices.length > 0) {
        phase4Result = matchingIndices.map((idx) => {
          const selectedFan = rawData[idx];
          const selectedPhase3Result = results[idx];
          return calculatePhase4(selectedFan, selectedPhase3Result, 10);
        });
      }
    } catch (phase4Error) {
      console.warn("Phase 4 calculation failed:", phase4Error.message);
      phase4Result = [];
    }
  } else {
    console.log(`Phase 4 skipped: selectedFanType=${selectedFanType}, results.length=${results?.length}`);
  }

  // ============================================================================
  // PHASE 5: Find matching RPM for user operating point
  // ============================================================================
  // Requires: user air flow (selX) and user static pressure (selY) from user input
  // Phase 5 runs for ALL fans matching the selected fan type
  let phase5Result = [];

  // Get user operating point from input
  const selX = input.airFlow; // User-selected air flow
  const selY = input.staticPressure; // User-selected static pressure

  console.log(`\n=== Phase 5 Pre-check ===`);
  console.log(`selectedFanType: ${selectedFanType}`);
  console.log(`selX (airFlow): ${selX}, selY (staticPressure): ${selY}`);
  console.log(`results count: ${results?.length || 0}`);
  if (results && results.length > 0) {
    console.log(`First fan Blades.Model: ${results[0]?.fanMetadata?.Blades?.Model}`);
  }

  if (selectedFanType && selX !== undefined && selX !== null && selY !== undefined && selY !== null) {
    try {
      // Find all fans that match the selected fan type
      // We need both rawData (for metadata like minRPM, maxRPM) and results (for Phase 2 converted data)
      const matchingIndices = results
        .map((r, idx) => (r.fanMetadata?.Blades?.Model === selectedFanType ? idx : -1))
        .filter((idx) => idx >= 0);

      console.log(`matchingIndices count: ${matchingIndices.length}`);

      if (matchingIndices.length > 0) {
        // Calculate Phase 5 for each matching fan using Phase 2 converted data
        // Pass pressure unit for dynamic tolerance calculation
        const pressureUnit = units.pressure || units.staticPressure || "Pa";
        phase5Result = matchingIndices.map((idx) => {
          const rawFan = rawData[idx];
          const phase2Converted = results[idx].phase2.converted;
          const p5Result = calculatePhase5({ rawFan, phase2Converted }, selX, selY, pressureUnit);
          // Store the index for Phase 6 lookup
          return { ...p5Result, fanIndex: idx };
        });
      }
    } catch (phase5Error) {
      console.warn("Phase 5 calculation failed:", phase5Error.message);
      phase5Result = [];
    }
  }

  // ============================================================================
  // PHASE 6: Calculate final performance for fans with valid Phase 5 RPM
  // ============================================================================
  let phase6Result = [];

  console.log(`\n=== Phase 6 Debug ===`);
  console.log(`Phase 5 results count: ${phase5Result.length}`);
  console.log(`Phase 5 results with valid RPM: ${phase5Result.filter(p5 => p5.matchingRPM !== null && p5.matchingRPM !== undefined).length}`);

  if (phase5Result.length > 0) {
    try {
      // Only process fans with valid matchingRPM from Phase 5
      const validPhase5 = phase5Result.filter(p5 => p5.matchingRPM !== null && p5.matchingRPM !== undefined);
      console.log(`Valid Phase 5 fans for Phase 6: ${validPhase5.length}`);

      phase6Result = validPhase5
        .map((p5, mapIdx) => {
          const idx = p5.fanIndex;
          const rawFan = rawData[idx];
          const phase3Result = results[idx].phase3;

          console.log(`Processing Phase 6 for fan ${mapIdx + 1}/${validPhase5.length}, fanIndex=${idx}, matchingRPM=${p5.matchingRPM}`);

          const p6 = calculatePhase6({
            rawFan,
            phase3Result,
            matchingRPM: p5.matchingRPM,
          });

          if (p6 === null) {
            console.warn(`Phase 6 returned null for fan index ${idx}`);
          }

          return p6;
        })
        .filter(p6 => p6 !== null); // Remove any null results

      console.log(`Phase 6 final results count: ${phase6Result.length}`);
    } catch (phase6Error) {
      console.warn("Phase 6 calculation failed:", phase6Error.message);
      console.error("Phase 6 error stack:", phase6Error.stack);
      phase6Result = [];
    }
  } else {
    console.log("No Phase 5 results available for Phase 6 calculation");
  }

  // ============================================================================
  // PHASE 7: Polynomial Curve Fitting & Prediction
  // ============================================================================
  // Uses Phase 6 results to perform degree-6 polynomial regression
  // Predicts values at user-input airflow
  let phase7Result = [];

  console.log(`\n=== Phase 7 Debug ===`);
  console.log(`Phase 6 results count: ${phase6Result.length}`);
  console.log(`User airFlow (selX): ${selX}`);

  if (phase6Result.length > 0 && selX !== undefined && selX !== null && !isNaN(selX)) {
    try {
      phase7Result = phase6Result
        .map((p6Data) => {
          console.log(`Processing Phase 7 for ${p6Data.model}`);
          const p7 = calculatePhase7(p6Data, selX);
          if (p7 === null) {
            console.warn(`Phase 7 returned null for ${p6Data.model}`);
          }
          return p7;
        })
        .filter(p7 => p7 !== null);

      console.log(`Phase 7 final results count: ${phase7Result.length}`);
    } catch (phase7Error) {
      console.warn("Phase 7 calculation failed:", phase7Error.message);
      console.error("Phase 7 error stack:", phase7Error.stack);
      phase7Result = [];
    }
  } else {
    console.log("No Phase 6 results or user airFlow not provided for Phase 7 calculation");
  }

  // ============================================================================
  // PHASE 8: Append Predicted Point to Phase 6 Curves
  // ============================================================================
  // Takes Phase 6 arrays (10 points) and appends Phase 7 predicted point
  // Result: arrays with 11 points each
  let phase8Result = [];

  console.log(`\n=== Phase 8 Debug ===`);
  console.log(`Phase 7 results count: ${phase7Result.length}`);

  if (phase7Result.length > 0 && phase6Result.length > 0) {
    try {
      // Match Phase 6 and Phase 7 results by model
      phase8Result = phase7Result
        .map((p7Data) => {
          // Find corresponding Phase 6 data
          const p6Data = phase6Result.find(p6 => p6.model === p7Data.model && p6.innerDiameter === p7Data.innerDiameter);
          if (!p6Data) {
            console.warn(`No matching Phase 6 data for Phase 8: ${p7Data.model}`);
            return null;
          }
          console.log(`Processing Phase 8 for ${p7Data.model}`);
          const p8 = calculatePhase8(p6Data, p7Data);
          return p8;
        })
        .filter(p8 => p8 !== null);

      console.log(`Phase 8 final results count: ${phase8Result.length}`);
    } catch (phase8Error) {
      console.warn("Phase 8 calculation failed:", phase8Error.message);
      console.error("Phase 8 error stack:", phase8Error.stack);
      phase8Result = [];
    }
  } else {
    console.log("No Phase 7 results available for Phase 8 calculation");
  }

  // ============================================================================
  // PHASE 9: Filtering & Alignment
  // ============================================================================
  // Sorts airFlow and filters arrays by user airflow
  let phase9Result = [];

  console.log(`\n=== Phase 9 Debug ===`);
  console.log(`Phase 8 results count: ${phase8Result.length}`);
  console.log(`User airFlow (selX): ${selX}`);

  if (phase8Result.length > 0 && selX !== undefined && selX !== null && !isNaN(selX)) {
    try {
      phase9Result = phase8Result
        .map((p8Data) => {
          console.log(`Processing Phase 9 for ${p8Data.model}`);
          const p9 = calculatePhase9(p8Data, selX);
          if (p9 === null) {
            console.warn(`Phase 9 returned null for ${p8Data.model}`);
          }
          return p9;
        })
        .filter(p9 => p9 !== null);

      console.log(`Phase 9 final results count: ${phase9Result.length}`);
    } catch (phase9Error) {
      console.warn("Phase 9 calculation failed:", phase9Error.message);
      console.error("Phase 9 error stack:", phase9Error.stack);
      phase9Result = [];
    }
  } else {
    console.log("No Phase 8 results or user airFlow not provided for Phase 9 calculation");
  }

  // ============================================================================
  // PHASE 10: Final Results Table & Sorting
  // ============================================================================
  // Creates consolidated table sorted by Total Efficiency (descending)
  let phase10Result = [];

  // Build rawDataMap for Phase 10 to include original fan data
  const rawDataMap = new Map();
  rawData.forEach(fan => {
    const model = fan.Blades?.Model || fan.model;
    const innerDia = fan.Impeller?.innerDia || fan.innerDiameter;
    if (model && innerDia) {
      rawDataMap.set(`${model}-${innerDia}`, fan);
    }
  });

  if (phase9Result.length > 0) {
    try {
      phase10Result = calculatePhase10(phase9Result, phase5Result, phase8Result, rawDataMap);
    } catch (phase10Error) {
      console.warn("Phase 10 calculation failed:", phase10Error.message);
      console.error("Phase 10 error stack:", phase10Error.stack);
      phase10Result = [];
    }
  } else {
    console.log("No Phase 9 results available for Phase 10 calculation");
  }

  return {
    results,
    phase4: phase4Result,
    phase5: phase5Result,
    phase6: phase6Result,
    phase7: phase7Result,
    phase8: phase8Result,
    phase9: phase9Result,
    phase10: phase10Result,
  };
}
