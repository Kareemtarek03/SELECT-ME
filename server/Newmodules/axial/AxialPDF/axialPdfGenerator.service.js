import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create require function that resolves from the main app's node_modules
// This is needed because when unpacked from asar, ES modules can't find packages
const require = createRequire(import.meta.url);

// Try to resolve pdfkit from multiple locations
let PDFDocument, SVGtoPDF;
try {
  // First try normal import (works in development)
  PDFDocument = (await import("pdfkit")).default;
  SVGtoPDF = (await import("svg-to-pdfkit")).default;
} catch (err) {
  // In production, try to require from the asar's node_modules
  try {
    // Get the asar path by removing .unpacked from current path
    const asarPath = __dirname.replace(/\.unpacked/, '').replace(/server[\\/]Newmodules[\\/]axial[\\/]AxialPDF$/, '');
    const asarRequire = createRequire(path.join(asarPath, 'package.json'));
    PDFDocument = asarRequire("pdfkit");
    SVGtoPDF = asarRequire("svg-to-pdfkit");
  } catch (err2) {
    console.error("Failed to load PDF dependencies:", err2);
    throw new Error("PDF generation dependencies not available");
  }
}

// ===== EXACT COLORS FROM REFERENCE SCREENSHOTS =====
const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#C00000",              // Red for series name
  teal: "#008080",             // Teal/Cyan for section headers (Performance Data, Fan Data, Motor Data)
  gray: "#808080",             // Gray for notes text
  lightGray: "#E0E0E0",        // Light gray for borders
  gridGreen: "#90EE90",        // Light green for graph grid
  // Curve colors - aligned with fan curve tab
  curveGreen: "#385723",       // Efficiency curves (η)
  curveRed: "#FF0000",         // System curve
  curveBlue: "#002060",        // Fan input power
  curveBlack: "#000000",       // Static pressure

};

// ===== UTILITY FUNCTIONS =====
function fmt(v, d = 0) {
  return v == null || isNaN(v) ? "—" : Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtPct(v) {
  if (v == null || isNaN(v)) return "—";
  const pct = Number(v) * 100;
  return pct.toFixed(1) + "%";
}

function calculateDensity(tempC) {
  if (tempC === null || tempC === undefined) return null;
  const temp = parseFloat(tempC);
  if (isNaN(temp)) return null;
  return 1.293 * (273.15 / (273.15 + temp));
}

// Calculate Motor Input Power using Phase 20 formula from Excel
// Motor Output Power / YY = fanInputPower * (1 + motorPowerFactor) where motorPowerFactor = frictionLosses from user input
// Motor Input Power / ZH = (YY / motorEfficiency) * (1 + safetyFactor) where safetyFactor = SPF from user input
function calculateMotorInputPower(fanInputPower, motorEfficiency, motorPowerFactor, safetyFactor) {
  if (!fanInputPower || fanInputPower <= 0) return null;
  if (motorEfficiency == null || motorEfficiency <= 0) return null;
  if (motorPowerFactor == null) return null;
  if (safetyFactor == null) return null;

  const YY = fanInputPower * (1 + motorPowerFactor);
  const ZH = (YY / motorEfficiency) * (1 + safetyFactor);
  return parseFloat(ZH.toFixed(3));
}

// Linear interpolation helper for smooth curves (matches frontend approach)
function linearInterpolation(xArray, yArray, mult = 1, numSamples = 100) {
  if (!xArray || !yArray || xArray.length < 2 || yArray.length < 2) return [];

  const validPairs = [];
  for (let i = 0; i < xArray.length; i++) {
    if (xArray[i] != null && yArray[i] != null && !isNaN(xArray[i]) && !isNaN(yArray[i])) {
      validPairs.push({ x: Number(xArray[i]), y: Number(yArray[i]) * mult });
    }
  }

  if (validPairs.length < 2) return validPairs;

  validPairs.sort((a, b) => a.x - b.x);

  const xMin = validPairs[0].x;
  const xMax = validPairs[validPairs.length - 1].x;
  const step = (xMax - xMin) / (numSamples - 1);

  const result = [];
  for (let i = 0; i < numSamples; i++) {
    const targetX = xMin + i * step;
    let y = null;

    for (let j = 0; j < validPairs.length - 1; j++) {
      const x0 = validPairs[j].x;
      const y0 = validPairs[j].y;
      const x1 = validPairs[j + 1].x;
      const y1 = validPairs[j + 1].y;

      if (targetX >= x0 && targetX <= x1) {
        if (x1 === x0) {
          y = y0;
        } else {
          y = y0 + (y1 - y0) * (targetX - x0) / (x1 - x0);
        }
        break;
      }
    }

    if (y === null && targetX <= validPairs[0].x) {
      y = validPairs[0].y;
    } else if (y === null) {
      y = validPairs[validPairs.length - 1].y;
    }

    result.push({ x: parseFloat(targetX.toFixed(2)), y: parseFloat(y.toFixed(4)) });
  }

  return result;
}

// Cubic spline interpolation (aligned with frontend fan-curve tab behavior)
function cubicSplineInterpolation(xArray, yArray, mult = 1, numSamples = 800) {
  if (!xArray || !yArray || xArray.length < 2 || yArray.length < 2) return [];

  const validPairs = [];
  for (let i = 0; i < xArray.length; i++) {
    if (xArray[i] != null && yArray[i] != null && !isNaN(xArray[i]) && !isNaN(yArray[i])) {
      validPairs.push({ x: Number(xArray[i]), y: Number(yArray[i]) * mult });
    }
  }

  if (validPairs.length < 2) return validPairs;
  validPairs.sort((a, b) => a.x - b.x);

  const xs = validPairs.map((p) => p.x);
  const ys = validPairs.map((p) => p.y);
  const n = xs.length;

  if (n === 2) return linearInterpolation(xs, ys, 1, numSamples);

  const h = [];
  for (let i = 0; i < n - 1; i++) h.push(xs[i + 1] - xs[i]);

  const alpha = [0];
  for (let i = 1; i < n - 1; i++) {
    alpha.push((3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]));
  }

  const l = new Array(n).fill(1);
  const mu = new Array(n).fill(0);
  const z = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }

  const b = new Array(n).fill(0);
  const c = new Array(n).fill(0);
  const d = new Array(n).fill(0);
  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (ys[j + 1] - ys[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }

  const xMin = xs[0];
  const xMax = xs[n - 1];
  const step = (xMax - xMin) / (numSamples - 1);
  const result = [];

  for (let i = 0; i < numSamples; i++) {
    const x = xMin + i * step;
    let seg = n - 2;
    for (let j = 0; j < n - 1; j++) {
      if (x <= xs[j + 1]) {
        seg = j;
        break;
      }
    }
    const dx = x - xs[seg];
    const y = ys[seg] + b[seg] * dx + c[seg] * dx * dx + d[seg] * dx * dx * dx;
    result.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) });
  }

  return result;
}

// Get curve points using same interpolation mode as fan curve tab
function getCurvePoints(xArr, yArr, mult = 1) {
  return cubicSplineInterpolation(xArr, yArr, mult, 800);
}

// Convert mm to points (1mm = 2.83465 points)
function mm(millimeters) {
  return millimeters * 2.83465;
}

// ===== MAIN PDF GENERATOR =====
export function generateFanDatasheetPDF(fanData, userInput, units) {
  console.log(units)
  // Page setup - A4
  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const W = doc.page.width;   // 595.28 points (210mm)
  const H = doc.page.height;  // 841.89 points (297mm)

  // Register custom fonts - Helvetica Neue LT Std
  const boldFontPath = path.join(__dirname, "PDF", "assets", "fonts", "Helvetica Neue LT Std 77 Bold Condensed.otf");
  const lightFontPath = path.join(__dirname, "PDF", "assets", "fonts", "Helvetica Neue LT Std 47 Light Condensed.otf");
  let useCustomFont = false;
  try {
    if (fs.existsSync(boldFontPath) && fs.existsSync(lightFontPath)) {
      doc.registerFont("HelveticaNeueBoldCondensed", boldFontPath);
      doc.registerFont("HelveticaNeueLightCondensed", lightFontPath);
      useCustomFont = true;
    }
  } catch (e) {
    console.log("Custom fonts not available, using default Helvetica:", e.message);
  }

  // Helper function to get font name
  // "bold" = Bold Condensed (77) for headers, titles, and values
  // "regular" = Light Condensed (47) for labels and body text
  const getFont = (style = "regular") => {
    if (useCustomFont) {
      return style === "bold" ? "HelveticaNeueBoldCondensed" : "HelveticaNeueLightCondensed";
    }
    // Fallback to default fonts
    return style === "bold" ? "Helvetica-Bold" : "Helvetica";
  }

  // ===== EXACT MEASUREMENTS FROM REFERENCE (converted from inches to points) =====
  // 1 inch = 72 points
  const M = 0.590551 * 72;                    // 0.54 in = 38.88 pt top/side margin
  const STANDARDS_WIDTH = 7.07 * 72;      // 7.07 in = 509.04 pt
  const FAN_DATA_WIDTH = 3.5433 * 72;       // 3.53 in = 254.16 pt
  const PERF_DATA_WIDTH = 3.5433 * 72;      // 3.54 in = 254.88 pt
  const SPECTRUM_WIDTH = 3.54 * 72;       // 3.50 in = 252 pt
  const RIGHT_MARGIN = 0.59055 * 72;         // 0.74 in = 53.28 pt
  const SMALL_GAP = 0.11 * 72;            // 0.07 in = 5.04 pt
  const SPECTRUM_GAP = 0.08 * 72;         // 0.08 in gap between the two spectrum boxes
  const GRAPH_WIDTH = 5.7 * 72;          // 5.47 in = 393.84 pt
  const GRAPH_HEIGHT = 2.90 * 72;           // 3.5 in = 252 pt
  const Y_AXIS_WIDTH = 1.40 * 72;         // 1.46 in = 105.12 pt
  const X_AXIS_HEIGHT = 0.90 * 72;        // 0.80 in = 57.6 pt
  const DATA_TABLE_HEIGHT = 3.00 * 72;    // 3.00 in = 216 pt - height of data table box
  // TOP_TO_DATA_TABLE: M + 16 + 20 + (3 boxes × 15mm) + (2 gaps × 3mm) + 8.955mm gap to data tables
  const TOP_TO_DATA_TABLE = M + 16 + 20 + (3 * mm(15)) + (2 * mm(3)) + mm(8.955);
  const ICON_SPACING = mm(3);               // 3mm spacing between icon boxes

  // Extract data for axial fan
  const pred = fanData.predictions || {};
  const blades = fanData.Blades || {};
  const impeller = fanData.Impeller || {};
  const motor = fanData.matchedMotor || {};

  // Motor efficiency: try multiple sources - efficiency50Hz, effCurve[0], or default
  // Support both property names and handle percentage vs decimal format
  let motorEff = motor.efficiency50Hz ??
    (Array.isArray(motor.effCurve) && motor.effCurve.length > 0 ? motor.effCurve[0] : null) ??
    0.85;
  // If efficiency is already a percentage (>1), convert to decimal
  if (motorEff && motorEff > 1) {
    motorEff = motorEff / 100;
  }

  // Use userInput values with fallbacks from fanData or defaults
  // Temperature: userInput -> default 20°C
  // RPM: userInput -> fanData.RPM (from backend recalculation)
  // InputDensity: fanData.InputDensity (calculated by backend) -> calculate from temp
  const tempC = userInput?.TempC ?? 20;
  const fanRPM = userInput?.RPM ?? fanData.RPM ?? 1440;
  const inputDensity = fanData.InputDensity ?? calculateDensity(tempC);

  // Model number from selected fan in axial results page
  const modelNum = fanData.FanModel || "AF-L-1250-8|30\\AM-8T-7.5";

  // Series name is the first part of the model number (e.g., "SF" from "SF-1250-6...")
  const seriesName = modelNum.split("-")[0] + " Series";

  // Fan type mapping for image folder selection
  const fanTypeToFolder = {
    "ABSF-C": "ABSF-C",
    "ABSF-S": "ABSF-S",
    "AF-L": "AF",
    "AF-S": "AF",
    "ARTF": "ARTF",
    "SARTF": "SARTF",
    "WF": "WF",
    "SF": "SF",
    "SWF": "SWF",
    "SABF": "SABF",
    "AJF": "AJF",
  };

  // Find matching fan type from model number (check longer prefixes first)
  const knownPrefixes = Object.keys(fanTypeToFolder).sort((a, b) => b.length - a.length);
  const matchedPrefix = knownPrefixes.find(
    (prefix) => modelNum.startsWith(prefix + "-") || modelNum === prefix
  );
  const fanType = matchedPrefix ? fanTypeToFolder[matchedPrefix] : modelNum.split("-")[0];

  // Determine if smoke/fire rated fan
  // Normal fans: AF-S, AF-L, WF, ARTF, AJF
  // Smoke fans: SF, ABSF-C, ABSF-S, SARTF, SWF, SABF
  const normalFanTypes = ["AF-S", "AF-L", "WF", "ARTF", "AJF"];
  const Type = units?.fanType || "AF-L";
  const isSmoke = !normalFanTypes.includes(Type);

  // Blade and impeller data for image path
  const bladeSymbol = blades.symbol || "AM";
  const numBlades = blades.noBlades || "8";
  const Material = blades.material || "P";

  // Calculate sound levels for axial fan
  const sound = {
    lwA: null,
    lpA: null,
    motorInputPower: null,
    octaveLW: [],
    octaveLP: []
  };

  // Calculate motor input power and sound if we have the necessary data
  if (pred.FanInputPowerPred && pred.StaticPressurePred && motorEff) {
    const spfValue = userInput?.SPF != null ? userInput.SPF / 100 : 0.05;
    const motorInputPower = (pred.FanInputPowerPred / motorEff) * (1 + spfValue);
    const lwA = 62 + 10 * Math.log10(motorInputPower) + 10 * Math.log10(pred.StaticPressurePred);
    const Q = 1;
    const r = 3;
    const distAtten = Math.abs(10 * Math.log10(Q / (4 * Math.PI * r * r)));
    const lpA = lwA - distAtten;

    const corrections = [-31.7, -20.7, -4.2, -6.7, -5.7, -7.7, -10.7, -15.7];
    const octaveLW = corrections.map((c) => parseFloat((lwA + c).toFixed(1)));
    const octaveLP = corrections.map((c) => parseFloat((lpA + c).toFixed(1)));

    sound.lwA = parseFloat(lwA.toFixed(1));
    sound.lpA = parseFloat(lpA.toFixed(1));
    sound.motorInputPower = parseFloat(motorInputPower.toFixed(3));
    sound.octaveLW = octaveLW;
    sound.octaveLP = octaveLP;
  }

  // ========== SECTION 1: HEADER (from Image 1) ==========
  let y = M;
  // Model number - from selected fan in axial results page
  doc.fontSize(16).font(getFont("bold")).fillColor(COLORS.black)
    .text(modelNum, M, y);

  // Series name - first part of model number
  y += 16;
  doc.fontSize(12).font(getFont("bold")).fillColor(COLORS.black)
    .text(seriesName, M, y);

  // ===== LEFT: 3 INFO BOXES with icons =====
  y += 20;
  const boxSize = mm(15);           // 15mm × 15mm box size
  const boxGap = mm(3);             // 3mm gap between boxes
  const textOffsetX = boxSize + 8.50394;

  // ===== BACKGROUND LOGO (behind info boxes) =====
  // Logo: 38.667mm × 38.667mm, positioned with 3mm gap from info boxes
  const logoSize = mm(50);
  const logoGap = mm(3);
  const logoX = M + (boxSize * 0.3) + (boxGap * 3) + logoGap;
  const logoY = y;

  // Render SVG logo using svg-to-pdfkit
  const logoSvgPath = path.join(__dirname, "PDF", "assets", "Logo.svg");
  try {
    if (fs.existsSync(logoSvgPath)) {
      const svgContent = fs.readFileSync(logoSvgPath, 'utf8');
      SVGtoPDF(doc, svgContent, logoX, logoY, { width: logoSize, height: logoSize, preserveAspectRatio: 'xMidYMid meet' });
    }
  } catch (e) {
    console.log("Logo not rendered:", e.message);
  }

  // Axial fan specific data
  const hubType = impeller?.conf?.split("-")[0] || "3";
  const innerDia = impeller?.innerDia ? impeller.innerDia + "mm" : "1250mm";
  const bladeMat = blades.material === "P" ? "Plastic" : "Aluminum";

  // Smoke/Normal prefix for icon selection
  const smokePrefix = isSmoke ? "Smoke" : "Normal";

  // Box 1: Nominal Diameter - load icon from axial assets
  const diaIconPath = path.join(__dirname, "PDF", "assets", "Icons", smokePrefix, `${Material}${bladeSymbol}`, `D-${numBlades}.jpg`);
  try {
    if (fs.existsSync(diaIconPath)) {
      doc.image(diaIconPath, M, y, { width: boxSize, height: boxSize });
    } else {
      doc.rect(M, y, boxSize, boxSize).fillAndStroke("#FFE4E1", COLORS.white);
    }
  } catch (e) {
    doc.rect(M, y, boxSize, boxSize).fillAndStroke("#FFE4E1", COLORS.white);
    console.error("Failed to load Nominal Diameter icon:", e.message);
  }
  doc.fontSize(10).font(getFont()).fillColor(COLORS.black)
    .text("Nominal Diameter", M + textOffsetX, y + 8);
  doc.fontSize(10).font(getFont()).fillColor(COLORS.black)
    .text(innerDia.split("mm")[0] + ' ' + 'mm', M + textOffsetX, y + 22);

  y += boxSize + boxGap;

  // Box 2: Hub Type - load icon from axial assets
  const hubIconPath = path.join(__dirname, "PDF", "assets", "Icons", smokePrefix, `${Material}${bladeSymbol}`, `H-${numBlades}.jpg`);
  try {
    if (fs.existsSync(hubIconPath)) {
      doc.image(hubIconPath, M, y, { width: boxSize, height: boxSize });
    } else {
      doc.rect(M, y, boxSize, boxSize).fillAndStroke("#FFE4E1", COLORS.white);
    }
  } catch (e) {
    doc.rect(M, y, boxSize, boxSize).fillAndStroke("#FFE4E1", COLORS.white);
    console.error("Failed to load Hub Type icon:", e.message);
  }
  doc.fontSize(10).font(getFont()).fillColor(COLORS.black)
    .text("Hub Type", M + textOffsetX, y + 8);
  doc.fontSize(10).font(getFont()).fillColor(COLORS.black)
    .text(hubType, M + textOffsetX, y + 22);

  y += boxSize + boxGap;

  // Box 3: Number of Blades - load icon from axial assets
  const bladeIconPath = path.join(__dirname, "PDF", "assets", "Icons", smokePrefix, `${Material}${bladeSymbol}`, `B-${numBlades}.jpg`);
  try {
    if (fs.existsSync(bladeIconPath)) {
      doc.image(bladeIconPath, M, y, { width: boxSize, height: boxSize });
    } else {
      doc.rect(M, y, boxSize, boxSize).fillAndStroke("#FFE4E1", COLORS.white);
    }
  } catch (e) {
    doc.rect(M, y, boxSize, boxSize).fillAndStroke("#FFE4E1", COLORS.white);
    console.error("Failed to load Blades icon:", e.message);
  }
  doc.fontSize(10).font(getFont()).fillColor(COLORS.black)
    .text("Number of Blades", M + textOffsetX, y + 8);
  doc.fontSize(10).font(getFont()).fillColor(COLORS.black)
    .text(numBlades, M + textOffsetX, y + 22);

  // After Box 3, ensure 8.955mm gap to DATA TABLES section
  // This is handled by TOP_TO_DATA_TABLE constant

  // ===== MIDDLE: Performance Curve Section =====
  // Position based on measured layout
  const perfX = M + mm(67);  // Adjusted for proper spacing
  const perfY = M;

  // "Performance Curve" title with fire icon
  doc.fontSize(16).font(getFont("bold")).fillColor(COLORS.black)
    .text("Performance Curve", perfX, perfY);


  // Performance notes - gray text in box
  const notesY = perfY + 20;
  doc.fontSize(10).font(getFont()).fillColor(COLORS.black);
  doc.text("Performance Shown in diagrams refer to air", perfX, notesY);
  doc.text("density  1.2 kg/m³", perfX, notesY + 10);
  doc.text("Performance tested is for installation type B free", perfX, notesY + 20);
  doc.text("inlet, ducted outlet.", perfX, notesY + 30);
  doc.text("Power rating (kW) does not include transmission", perfX, notesY + 40);
  doc.text("losses.", perfX, notesY + 50);
  doc.text("Performance ratings do not include the effect of", perfX, notesY + 60);
  doc.text("accessories.", perfX, notesY + 70);

  // Fire/Normal logo beside performance notes
  const fireW = mm(9);
  const fireH = mm(9);
  const fireX = perfX + mm(62);  // Position to the right of performance notes
  const fireY = notesY - mm(7);
  try {
    const fireImageName = isSmoke ? "Fire.jpg" : "normal.jpg";
    const firePath = path.join(__dirname, "PDF", "assets", "Fire", fireImageName);
    if (fs.existsSync(firePath)) {
      doc.image(firePath, fireX, fireY, { width: fireW, height: fireH });
    }
  } catch (e) { console.error("Failed to load Fire/Normal icon:", e.message); }

  // Performance image box - 40mm × 14.857mm, 2mm gap from notes
  const perfImageBoxY = notesY + 90;  // 70 + 10 (last line) = 80, then 2mm gap
  const perfImageBoxW = mm(40);       // 40 mm width
  const perfImageBoxH = mm(14.857);   // 14.857 mm height

  // Render performance image based on fan category
  try {
    const perfImageName = isSmoke ? "Smoke.jpg" : "Normal.jpg";
    const perfImagePath = path.join(__dirname, "PDF", "assets", "Performance", perfImageName);
    if (fs.existsSync(perfImagePath)) {
      doc.image(perfImagePath, perfX, perfImageBoxY, {
        width: perfImageBoxW,
        height: perfImageBoxH,
        fit: [perfImageBoxW, perfImageBoxH],
        align: "center",
        valign: "center"
      });
    }
  } catch (e) { console.error("Failed to load performance image:", e.message); }

  // Standards section - in a box with 15.968mm height, 2mm gaps top and bottom
  const standardsBoxY = perfImageBoxY + perfImageBoxH + mm(8);  // 2mm gap from performance image box
  const standardsBoxW = mm(60);       // Width for standards box
  const standardsBoxH = mm(15.968);   // 15.968 mm height
  const standardsTextY = standardsBoxY + mm(1);  // 3mm padding from top of box
  doc.fontSize(10).font(getFont()).fillColor(COLORS.black);
  doc.text("BS ISO 5801 : 2017", perfX + mm(0), standardsTextY);
  doc.text("AMCA 210 : 2025", perfX + mm(0), standardsTextY + mm(5));
  // Standards text inside the box
  if (isSmoke) {
    doc.text("EN 12101-3 : 2015", perfX + mm(30), standardsTextY);
    doc.text("Type B Installation", perfX + mm(30), standardsTextY + mm(5));
  }
  else {

    doc.text("Type B Installation", perfX + mm(30), standardsTextY);
  }

  // Note: 2mm gap from bottom of standards box to data tables is ensured by TOP_TO_DATA_TABLE constant

  // ===== RIGHT: Fan Image =====
  // Right margin is 0.74 in from edge
  const fanImgW = mm(43);   // Fan image width
  const fanImgH = mm(55);   // Fan image height
  const fanImgX = W - RIGHT_MARGIN - fanImgW;
  const fanImgY = M;


  // Load fan image from Rander folder based on series/material/blades
  // Path structure: PDF/assets/Rander/{fanType}/{Material}{bladeSymbol}/{numBlades}.jpg
  // ARTF and SARTF use fan type name as filename instead of blade count
  try {
    const imageFilename = (fanType === "ARTF" || fanType === "SARTF")
      ? `${fanType}.jpg`
      : `${numBlades}.jpg`;
    const imagePath = path.join(__dirname, "PDF", "assets", "Rander", fanType, `${Material}${bladeSymbol}`, imageFilename);
    if (fs.existsSync(imagePath)) {
      doc.image(imagePath, fanImgX + 2, fanImgY + 2, {
        width: fanImgW - 4, height: fanImgH - 4,
        fit: [fanImgW - 4, fanImgH - 4], align: "center", valign: "center",
      });
    } else {
      console.log("Fan image not found at:", imagePath);
    }
  } catch (e) { console.error("Failed to load fan image:", e.message); }

  // Certification icons below fan image - 2mm gap from fan image
  const certIconsY = fanImgY + fanImgH + mm(0.5);  // 2mm gap from fan image
  const certIconsX = fanImgX + mm(-5);            // shift row 1mm to the right

  // Icon 1: AMCA - 9.502mm × 10.201mm
  const amcaW = mm(9);
  const amcaH = mm(9);

  try {
    const amcaPath = path.join(__dirname, "PDF", "assets", "AMCA.png");
    if (fs.existsSync(amcaPath)) {
      doc.image(amcaPath, certIconsX, certIconsY, { width: amcaW, height: amcaH });
    }
  } catch (e) { console.error("Failed to load AMCA icon:", e.message); }

  // Icon 2: ISO - 10.421mm × 9.037mm
  const isoW = mm(9);
  const isoH = mm(9);
  const isoX = certIconsX + amcaW + mm(2);  // 2mm gap from AMCA
  try {
    const isoPath = path.join(__dirname, "PDF", "assets", "ISO.png");
    if (fs.existsSync(isoPath)) {
      doc.image(isoPath, isoX, certIconsY, { width: isoW, height: isoH });
    }
  } catch (e) { console.error("Failed to load ISO icon:", e.message); }

  // Icon 3: EOS - 8.835mm × 9.037mm
  const eosW = mm(9);
  const eosH = mm(9);
  const eosX = isoX + isoW + mm(2);  // 2mm gap between icons
  try {
    const eosPath = path.join(__dirname, "PDF", "assets", "EOS.png");
    if (fs.existsSync(eosPath)) {
      doc.image(eosPath, eosX, certIconsY, { width: eosW, height: eosH });
    }
  } catch (e) { console.error("Failed to load EOS icon:", e.message); }

  // Calculate the tallest icon height to ensure proper spacing to data table
  const maxIconHeight = Math.max(amcaH, isoH, eosH);
  // Note: 2mm gap from bottom of icons to data table is ensured by TOP_TO_DATA_TABLE constant

  // ========== SECTION 2: DATA TABLES (from Image 2) ==========
  // Performance Data width: 3.54 in, Fan Data width: 3.53 in
  // Top of page to data table: 3.42 in, Table height: 3.00 in
  const dataY = TOP_TO_DATA_TABLE;         // 3.42 in from top
  const dataW = W - M - RIGHT_MARGIN;      // Full width minus margins
  const colW = PERF_DATA_WIDTH;            // 3.54 in for left column
  const rowH = mm(5.5);
  // .stroke(COLORS.black)
  // Draw main border - height is 3.00 in
  doc.rect(M, dataY, dataW, DATA_TABLE_HEIGHT).strokeColor(COLORS.black).lineWidth(1).stroke();

  // Vertical divider
  doc.moveTo(M + colW, dataY).lineTo(M + colW, dataY + DATA_TABLE_HEIGHT).strokeColor(COLORS.black).lineWidth(2).stroke();

  // ===== LEFT COLUMN: Performance Data =====
  let leftY = dataY + mm(3);
  const leftX = M + mm(3);

  // Header 
  doc.fontSize(12).font(getFont("bold")).fillColor(COLORS.black)
    .text("Performance Data", leftX, leftY);
  const perfTextW = doc.widthOfString("Performance Data");
  doc.moveTo(leftX, leftY + 10).lineTo(leftX + perfTextW, leftY + 10)
    .strokeColor(COLORS.black).lineWidth(0.5).stroke();
  leftY += mm(7);

  // Data rows - using axial data structures
  const perfRows = [
    ["- Fan Unit No. [As Per Schedule]", ":", userInput?.fanUnitNo || "EX-01"],
    [`- Design Air Flow [${units?.airFlow || "CFM"}]`, ":", fmt(userInput?.airFlow, (userInput?.airFlow < 10) ? 2 : 0)],
    [`- Design Static Pressure [${units?.pressure || "Pa"}]`, ":", fmt(pred.StaticPressurePred, (pred.StaticPressurePred < 10) ? 2 : 0)],
    ["- Design Fan Input Power [kW]", ":", fmt(pred.FanInputPowerPred, 2)],
    ["- Design Motor Input Power [kW]", ":", fmt(pred.FanInputPowerPred / motorEff, 2)],
    ["- Design Fan Static Efficiency [%]", ":", fmtPct(pred.FanStaticEfficiencyPred)],
    ["- Design Fan Total Efficiency [%]", ":", fmtPct(pred.FanTotalEfficiencyPred)],
    ["- Temperature [C°]", ":", fmt(tempC, 0)],
    ["- Density [kg/m3]", ":", fmt(inputDensity, 3)],
    ["- Fan Speed [RPM]", ":", fmt(fanRPM, 0)],
    ["- Sound Pressure @ 3 m [dBA]", ":", fmt(sound.lpA, 1)],
    ["- Sound Power @ 3 m [dBA]", ":", fmt(sound.lwA, 1)],
  ];

  perfRows.forEach((row) => {
    doc.fontSize(8).font(getFont()).fillColor(COLORS.black)
      .text(row[0], leftX, leftY);
    doc.text(row[1], leftX + mm(48), leftY);
    doc.font(getFont()).text(row[2], leftX + mm(52), leftY);
    leftY += rowH;
  });

  // ===== RIGHT COLUMN: Fan Data + Motor Data =====
  let rightY = dataY + mm(3);
  const rightX = M + colW + mm(3);

  // Fan Data header - TEAL with underline
  doc.fontSize(12).font(getFont("bold")).fillColor(COLORS.black)
    .text("Fan Data", rightX, rightY);
  const fanTextW = doc.widthOfString("Fan Data");
  doc.moveTo(rightX, rightY + 10).lineTo(rightX + fanTextW, rightY + 10)
    .strokeColor(COLORS.black).lineWidth(0.5).stroke();
  rightY += mm(7);

  // Format blade angle with decimal precision (e.g., 37.5 instead of 38)
  const formattedBladeAngle = blades.angle != null
    ? parseFloat(blades.angle).toFixed(1)
    : "—";

  const fanRows = [
    ["- Impeller Type", ":", "Axial"],
    ["- Blades Symbol", ":", blades.symbol || "AM"],
    ["- Blades Material", ":", bladeMat],
    ["- Blades Angle [degree]", ":", formattedBladeAngle],
    ["- Configurations (Hub-Blades)", ":", impeller.conf || "16-8"],
  ];

  fanRows.forEach((row) => {
    doc.fontSize(8).font(getFont()).fillColor(COLORS.black)
      .text(row[0], rightX, rightY);
    doc.text(row[1], rightX + mm(42), rightY);
    doc.font(getFont()).text(row[2], rightX + mm(46), rightY);
    rightY += rowH;
  });

  // Motor Data header - TEAL with underline
  rightY += mm(0);
  doc.fontSize(12).font(getFont("bold")).fillColor(COLORS.black)
    .text("Motor Data", rightX, rightY);
  const motorTextW = doc.widthOfString("Motor Data");
  doc.moveTo(rightX, rightY + 10).lineTo(rightX + motorTextW, rightY + 10)
    .strokeColor(COLORS.black).lineWidth(0.5).stroke();
  rightY += mm(7);

  const motorRows = [
    ["- Motor Model", ":", motor.model || "—"],
    ["- Motor Power [kW]", ":", fmt(motor.powerKW, 1)],
    ["- No. of Poles", ":", fmt(motor.NoPoles, 0)],
    ["- Voltage [V]/Phase/Frequency [Hz]", ":", `${motor.Phase === 3 ? "380" : "220"}/${motor.Phase || "—"}/50`],
    ["- Motor Efficiency [%]", ":", fmtPct(motorEff)],
    ["- Insulation Class", ":", motor.insClass || "F"],
  ];

  motorRows.forEach((row) => {
    doc.fontSize(8).font(getFont()).fillColor(COLORS.black)
      .text(row[0], rightX, rightY);
    doc.text(row[1], rightX + mm(42), rightY);
    doc.font(getFont()).text(row[2], rightX + mm(46), rightY);
    rightY += rowH;
  });

  // ========== SECTION 3: SOUND SPECTRUM (from Image 2) ==========
  // Each spectrum section is 3.50 in wide
  const spectrumY = dataY + DATA_TABLE_HEIGHT + mm(2);
  const spectrumH = 0.88 * 72;         // 0.81 in (from reference)
  const spectrumW = 3.51 * 72;         // 3.61 in (from reference)

  const octaveLP = sound.octaveLP || [];
  const octaveLW = sound.octaveLW || [];
  const lpAValue = sound.lpA;
  const lwAValue = sound.lwA;
  const bands = ["62", "125", "250", "500", "1000", "2000", "4000", "8000"];

  // ===== LEFT: Sound Pressure Spectrum =====
  doc.rect(M, spectrumY, spectrumW, spectrumH).strokeColor(COLORS.black).lineWidth(1).stroke();

  // Title
  doc.fontSize(8).font(getFont("bold")).fillColor(COLORS.black)
    .text("Power spectrum of the sound pressure", M + mm(2), spectrumY + mm(2));

  // Draw bars
  const numBars = 9;
  const labelColW = 0.25 * 72;         // left label column width (reference shows 0.21 in)
  const barStartX = M + labelColW;
  const barGap = 0.21 * 72;            // 0.21 inch gap between bars (from reference)
  const cellH = mm(3.5);
  const barTopY = spectrumY + mm(6);
  const barAreaH = Math.max(mm(6), spectrumH - (barTopY - spectrumY) - (cellH * 2));
  const barY = barTopY;
  const tableY = barY + barAreaH;
  const barW = (spectrumW - (barStartX - M) - mm(2) - (barGap * (numBars - 1))) / numBars;

  if (octaveLP.length) {
    const allVals = [...octaveLP, lpAValue].filter(v => v != null);
    const minV = Math.min(...allVals) - 10;
    const maxV = Math.max(...allVals) + 5;

    // Light blue bars for octave bands (matching photo)
    bands.forEach((b, i) => {
      const val = octaveLP[i] || 0;
      const bH = Math.max(2, ((val - minV) / (maxV - minV)) * barAreaH);
      const x = barStartX + i * (barW + barGap);
      doc.rect(x, barY + barAreaH - bH, barW, bH)
        .fillAndStroke("#00AEEF", "#FFFFFF");  // Light blue fill with white border


    });
    // Purple/blue bar for LP(A) total (matching photo)
    const lpTotalH = Math.max(2, ((lpAValue - minV) / (maxV - minV)) * barAreaH);
    {
      const x = barStartX + 8 * (barW + barGap);
      doc.rect(x, barY + barAreaH - lpTotalH, barW, lpTotalH)
        .fillAndStroke("#2E3192", "#FFFFFF");

    }
  }

  // Table below bars - matching photo styling

  // Draw table grid lines with vertical lines between each value
  doc.strokeColor("#000000").lineWidth(0.5);
  // Horizontal lines
  doc.moveTo(M, tableY).lineTo(M + spectrumW, tableY).stroke();
  doc.moveTo(M, tableY + cellH).lineTo(M + spectrumW, tableY + cellH).stroke();
  doc.moveTo(M, tableY + cellH * 2).lineTo(M + spectrumW, tableY + cellH * 2).stroke();
  // Vertical lines - only left and right borders (no cell dividers)
  doc.moveTo(M, tableY).lineTo(M, tableY + cellH * 2).stroke();
  doc.moveTo(M + spectrumW, tableY).lineTo(M + spectrumW, tableY + cellH * 2).stroke();

  // Hz row
  doc.fontSize(5.5).font(getFont()).fillColor(COLORS.black);
  doc.text("Hz", M, tableY + mm(0.8), { width: labelColW, align: "center" });
  bands.forEach((b, i) => {
    doc.text(b, barStartX + i * (barW + barGap), tableY + mm(0.8), { width: barW, align: "center" });
  });
  const textOffsetY_LP = (cellH - 4) / 2;  // Center 4pt text vertically in cell
  doc.fontSize(5).text("LP(A)", barStartX + 8 * (barW + barGap), tableY + textOffsetY_LP, { width: barW, align: "center" });
  doc.fontSize(5);

  // dBA row
  doc.fontSize(5.5).font(getFont()).fillColor(COLORS.black);
  doc.text("dBA", M, tableY + cellH + mm(0.8), { width: labelColW, align: "center" });
  octaveLP.forEach((v, i) => {
    doc.text(fmt(v, 1), barStartX + i * (barW + barGap), tableY + cellH + mm(0.8), { width: barW, align: "center" });
  });
  doc.text(fmt(lpAValue, 1), barStartX + 8 * (barW + barGap), tableY + cellH + mm(0.8), { width: barW, align: "center" });

  // ===== RIGHT: Sound Power Spectrum =====
  const rwX = M + spectrumW + SPECTRUM_GAP;  // 0.08 in gap between spectrum sections
  doc.rect(rwX, spectrumY, spectrumW, spectrumH).strokeColor(COLORS.black).lineWidth(1).stroke();

  // Title
  doc.fontSize(8).font(getFont("bold")).fillColor(COLORS.black)
    .text("Power spectrum of the sound power", rwX + mm(2), spectrumY + mm(2));

  // Draw bars
  const rwBarStartX = rwX + labelColW;

  if (octaveLW.length) {
    const allVals = [...octaveLW, lwAValue].filter(v => v != null);
    const minV = Math.min(...allVals) - 10;
    const maxV = Math.max(...allVals) + 5;

    // Light blue bars for octave bands (matching photo)
    bands.forEach((b, i) => {
      const val = octaveLW[i] || 0;
      const bH = Math.max(2, ((val - minV) / (maxV - minV)) * barAreaH);
      const x = rwBarStartX + i * (barW + barGap);
      doc.rect(x, barY + barAreaH - bH, barW, bH)
        .fillAndStroke("#00AEEF", "#FFFFFF");
    });
    // Purple/blue bar for LW(A) total (matching photo)
    const lwTotalH = Math.max(2, ((lwAValue - minV) / (maxV - minV)) * barAreaH);
    {
      const x = rwBarStartX + 8 * (barW + barGap);
      doc.rect(x, barY + barAreaH - lwTotalH, barW, lwTotalH)
        .fillAndStroke("#2E3192", "#FFFFFF");

    }
  }

  // Table - matching photo styling
  // Draw table grid lines (only horizontal lines and outer borders, no vertical cell dividers)
  doc.strokeColor("#000000").lineWidth(0.5);
  // Horizontal lines
  doc.moveTo(rwX, tableY).lineTo(rwX + spectrumW, tableY).stroke();
  doc.moveTo(rwX, tableY + cellH).lineTo(rwX + spectrumW, tableY + cellH).stroke();
  doc.moveTo(rwX, tableY + cellH * 2).lineTo(rwX + spectrumW, tableY + cellH * 2).stroke();
  // Vertical lines - only left and right borders (no cell dividers)
  doc.moveTo(rwX, tableY).lineTo(rwX, tableY + cellH * 2).stroke();
  doc.moveTo(rwX + spectrumW, tableY).lineTo(rwX + spectrumW, tableY + cellH * 2).stroke();

  // Hz row
  doc.fontSize(5.5).font(getFont()).fillColor(COLORS.black);
  doc.text("Hz", rwX, tableY + mm(0.8), { width: labelColW, align: "center" });
  bands.forEach((b, i) => {
    doc.text(b, rwBarStartX + i * (barW + barGap), tableY + mm(0.8), { width: barW, align: "center" });
  });
  doc.fontSize(5).text("LW(A)", rwBarStartX + 8 * (barW + barGap), tableY + mm(1), { width: barW, align: "center" });


  // dBA row
  doc.fontSize(5, 5).font(getFont()).fillColor(COLORS.black);
  doc.text("dBA", rwX, tableY + cellH + mm(0.8), { width: labelColW, align: "center" });
  octaveLW.forEach((v, i) => {
    doc.text(fmt(v, 1), rwBarStartX + i * (barW + barGap), tableY + cellH + mm(0.8), { width: barW, align: "center" });
  });
  doc.text(fmt(lwAValue, 1), rwBarStartX + 8 * (barW + barGap), tableY + cellH + mm(0.8), { width: barW, align: "center" });





  // ========== SECTION 4: PERFORMANCE GRAPH  ==========
  // Graph width: 5.47 in, Y-axis labels: 1.46 in, Graph height: 2.4 in
  const graphBoxY = spectrumY + spectrumH + mm(2);
  const graphBoxH = GRAPH_HEIGHT + X_AXIS_HEIGHT + mm(10);  // Graph + X-axis area
  const graphBoxW = W - M - RIGHT_MARGIN;

  // Y-axis labels area - 1.46 in wide
  const yAxisW = Y_AXIS_WIDTH;          // 1.46 in = 105.12 pt
  const graphX = M + yAxisW;
  const graphY = graphBoxY + mm(10);
  const graphW = GRAPH_WIDTH;           // 5.47 in = 393.84 pt
  const graphH = GRAPH_HEIGHT;          // 2.4 in = 172.8 pt

  // Draw graph border
  doc.rect(graphX, graphY, graphW, graphH).stroke(COLORS.black);

  // Draw grid lines matching reference image
  // Grid has both minor (fine, light gray) and major (thicker, medium gray) lines
  // Minor grid: every small division (appears to be ~50 divisions total)
  // Major grid: every 5th division (appears to be ~10 major divisions)

  const minorGridDivisions = 50;  // Fine grid divisions
  const majorGridInterval = 5;    // Major line every 5 minor divisions

  // Draw vertical grid lines
  for (let i = 0; i <= minorGridDivisions; i++) {
    const gx = graphX + (i / minorGridDivisions) * graphW;
    const isMajor = (i % majorGridInterval === 0);

    if (isMajor) {
      // Major grid line - medium gray, thicker
      doc.strokeColor("#C0C0C0").lineWidth(0.5);
    } else {
      // Minor grid line - light gray, thin
      doc.strokeColor("#E8E8E8").lineWidth(0.3);
    }
    doc.moveTo(gx, graphY).lineTo(gx, graphY + graphH).stroke();
  }

  // Draw horizontal grid lines
  for (let i = 0; i <= minorGridDivisions; i++) {
    const gy = graphY + (i / minorGridDivisions) * graphH;
    const isMajor = (i % majorGridInterval === 0);

    if (isMajor) {
      // Major grid line - medium gray, thicker
      doc.strokeColor("#C0C0C0").lineWidth(0.5);
    } else {
      // Minor grid line - light gray, thin
      doc.strokeColor("#E8E8E8").lineWidth(0.3);
    }
    doc.moveTo(graphX, gy).lineTo(graphX + graphW, gy).stroke();
  }

  // Get curve data - using axial data structures
  const airflow = fanData.AirFlowNew || [];
  const staticP = fanData.StaticPressureNew || [];
  const power = fanData.FanInputPowerNew || [];
  const effStatic = fanData.FanStaticEfficiency || [];
  const effTotal = fanData.FanTotalEfficiency || [];

  const pCurve = getCurvePoints(airflow, staticP);
  const pwCurve = getCurvePoints(airflow, power);
  const effStaticCurve = getCurvePoints(airflow, effStatic, 100);
  const effTotalCurve = getCurvePoints(airflow, effTotal, 100);

  // System Curve: y = a * x² where a = predictedStaticPressure / (userAirflowInput²)
  const operatingAirFlow = userInput?.airFlow;
  const operatingStaticPressure = pred.StaticPressurePred;
  let systemCurve = [];
  if (operatingStaticPressure && operatingAirFlow && operatingAirFlow > 0) {
    const coefficientA = operatingStaticPressure / Math.pow(operatingAirFlow, 2);
    // systemCurve = pCurve.map((pt) => ({ x: pt.x, y: coefficientA * Math.pow(pt.x, 2) }));

    // Generate smooth system curve starting from 0
    const maxFlow = pCurve.length > 0 ? pCurve[pCurve.length - 1].x : (operatingAirFlow * 1.2 || 10000);
    const steps = 50;
    systemCurve = [];
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * maxFlow;
      systemCurve.push({ x, y: coefficientA * Math.pow(x, 2) });
    }
  }

  // Calculate ranges
  let dataXMax = 0;
  let pMax = 0, pwMax = 0;
  pCurve.forEach((pt) => {
    if (pt.x > dataXMax) dataXMax = pt.x;
    if (pt.y > pMax) pMax = pt.y;
  });
  pwCurve.forEach((pt) => { if (pt.y > pwMax) pwMax = pt.y; });

  // ===== Shared nice-tick algorithm (must match frontend generateNiceTicks) =====
  function generateNiceTicks(dataMax, numIntervals = 10) {
    if (dataMax == null || isNaN(dataMax) || dataMax <= 0) {
      return { ticks: Array.from({ length: numIntervals + 1 }, (_, i) => i), max: numIntervals, step: 1, decimals: 0 };
    }
    const margin = dataMax * 1.05;
    const rawStep = margin / numIntervals;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    let nice;
    if (norm <= 1) nice = 1;
    else if (norm <= 1.5) nice = 1.5;
    else if (norm <= 2) nice = 2;
    else if (norm <= 2.5) nice = 2.5;
    else if (norm <= 3) nice = 3;
    else if (norm <= 5) nice = 5;
    else nice = 10;
    const step = nice * mag;
    // Use ceil to find minimum intervals that cover the data (tight fit, matching frontend)
    const count = Math.ceil(margin / step);
    const axisMax = step * count;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(parseFloat((i * step).toFixed(8)));
    }
    let decimals = 0;
    if (step < 0.01) decimals = 3;
    else if (step < 0.1) decimals = 2;
    else if (step < 1) decimals = 1;
    else decimals = 0;
    return { ticks, max: ticks[ticks.length - 1] || axisMax, step, decimals };
  }

  const xMin = 0;
  // X-axis: exactly 10 intervals (matching frontend)
  const xTickResult = generateNiceTicks(dataXMax || 14000, 10);
  const xMax = xTickResult.max;
  const xStep = xTickResult.step;

  const pMin = 0;
  // Include system curve peak in pMax
  if (operatingStaticPressure && operatingAirFlow && operatingAirFlow > 0) {
    const coeffA = operatingStaticPressure / Math.pow(operatingAirFlow, 2);
    const maxSysP = coeffA * Math.pow(dataXMax, 2);
    if (maxSysP > pMax) pMax = maxSysP;
  }
  if (operatingStaticPressure && operatingStaticPressure > pMax) pMax = operatingStaticPressure;
  // Ps Y-axis: exactly 10 intervals
  const pTickResult = generateNiceTicks(pMax || 600, 10);
  const finalPMax = pTickResult.max;
  const pStep = pTickResult.step;

  const pwMin = 0;
  // Pshaft Y-axis: exactly 10 intervals
  const pwDataMax = pwMax * 1.2 || 1.8;
  const pwTickResult = generateNiceTicks(pwDataMax, 10);
  const finalPwMax = pwTickResult.max;
  const pwStep = pwTickResult.step;

  const effMin = 0, effMax = 100;

  // ===== Y-AXIS LABELS =====
  // Y-axis width is 1.46 in, divide into 3 columns for η, Pshaft, Ps
  const axisColW = yAxisW / 3;          // Each axis label column
  const axis1X = M + mm(6.8);              // η [%] axis line position
  const axis2X = M + axisColW + mm(8.5);   // Pshaft [kW] axis line position
  const axis3X = M + axisColW * 2 + mm(12.2); // Ps [Pa] axis line position
  const tickLen = mm(2);                 // Tick mark length

  // Draw η [%] axis
  doc.strokeColor("#005610").lineWidth(1.5);
  doc.moveTo(axis1X, graphY).lineTo(axis1X, graphY + graphH).stroke();

  // η axis title at top
  doc.fontSize(8).font(getFont("bold")).fillColor("#005610");
  doc.text("Eff", axis1X - mm(5), graphY - mm(8), { width: mm(6), align: "center" });
  doc.text("[%]", axis1X - mm(6), graphY - mm(5), { width: mm(8), align: "center" });

  // η tick marks and labels (0%, 10%, 20%... 100%)
  doc.fontSize(8).font(getFont("bold")).fillColor("#005610");
  for (let i = 0; i <= 10; i++) {
    const yPos = graphY + graphH - (i / 10) * graphH;
    // Tick mark
    doc.moveTo(axis1X - tickLen, yPos).lineTo(axis1X, yPos).stroke();
    // Label
    doc.text(`${i * 10}%`, axis1X - mm(12), yPos - mm(1.5), { width: mm(8), align: "right" });
  }

  // Draw Pshaft [kW] axis
  doc.strokeColor("#002060").lineWidth(1.5);
  doc.moveTo(axis2X, graphY).lineTo(axis2X, graphY + graphH).stroke();

  // Pshaft axis title at top
  doc.fontSize(8).font(getFont("bold")).fillColor("#002060");
  doc.text("Pshaft", axis2X - mm(10), graphY - mm(8), { width: mm(12), align: "center" });
  doc.text(`[${units?.power}]`, axis2X - mm(9), graphY - mm(5), { width: mm(10), align: "center" });

  // Pshaft tick marks and labels using generateNiceTicks result
  doc.fontSize(8).font(getFont("bold")).fillColor("#002060");
  const pwTicks = Math.round((finalPwMax - pwMin) / pwStep);
  for (let i = 0; i <= pwTicks; i++) {
    const val = pwMin + i * pwStep;
    const yPos = graphY + graphH - ((val - pwMin) / (finalPwMax - pwMin)) * graphH;
    if (yPos >= graphY && yPos <= graphY + graphH + 1) {
      // Tick mark
      doc.moveTo(axis2X - tickLen, yPos).lineTo(axis2X, yPos).stroke();
      // Label
      doc.text(fmt(val, pwTickResult.decimals), axis2X - mm(12), yPos - mm(1.5), { width: mm(8), align: "right" });
    }
  }

  // Draw Ps [Pa] axis
  doc.strokeColor("#595959").lineWidth(1.5);
  doc.moveTo(axis3X, graphY).lineTo(axis3X, graphY + graphH).stroke();

  // Ps axis title at top
  doc.fontSize(8).font(getFont("bold")).fillColor("#595959");
  doc.text("Ps", axis3X - mm(9), graphY - mm(8), { width: mm(6), align: "center" });
  doc.text(`[${units?.pressure}]`, axis3X - mm(10), graphY - mm(5), { width: mm(8), align: "center" });

  // Ps tick marks and labels using generateNiceTicks result
  doc.fontSize(8).font(getFont("bold")).fillColor("#595959");
  const pTicks = Math.round((finalPMax - pMin) / pStep);
  for (let i = 0; i <= pTicks; i++) {
    const val = pMin + i * pStep;
    const yPos = graphY + graphH - ((val - pMin) / (finalPMax - pMin)) * graphH;
    if (yPos >= graphY && yPos <= graphY + graphH) {
      // Tick mark
      doc.moveTo(axis3X - tickLen, yPos).lineTo(axis3X, yPos).stroke();
      // Label
      doc.text(fmt(val, pTickResult.decimals), axis3X - mm(10), yPos - mm(1.5), { width: mm(8), align: "center" });
    }
  }

  // X-AXIS: Q [CFM]
  // X-axis height is 0.80 in
  const xAxisY = graphY + graphH + mm(2);
  doc.fontSize(8).font(getFont("bold")).fillColor(COLORS.black);

  const xTicks = Math.round((xMax - xMin) / xStep);
  for (let i = 0; i <= xTicks; i++) {
    const val = xMin + i * xStep;
    const xPos = graphX + ((val - xMin) / (xMax - xMin)) * graphW;
    doc.text(fmt(val, 0), xPos - mm(5), xAxisY, { width: mm(10), align: "center" });
  }
  // X-axis label positioned within the 0.80 in X-axis area
  doc.fontSize(8).font(getFont("bold"))
    .text(`Q [${units?.airFlow}]`, graphX + graphW / 2 - mm(8), xAxisY + mm(8));

  // ===== DRAW CURVES =====
  function drawCurve(curve, color, yMin, yMax, lineWidth = 2, dashed = false) {
    if (!curve || curve.length < 2) return;
    doc.strokeColor(color).lineWidth(lineWidth);
    if (dashed) doc.dash(5, { space: 3 });

    let started = false;
    curve.forEach((pt) => {
      const px = graphX + ((pt.x - xMin) / (xMax - xMin)) * graphW;
      const py = graphY + graphH - ((pt.y - yMin) / (yMax - yMin)) * graphH;

      // Check if point is within graph boundaries (both x and y)
      const isInBounds = (px >= graphX && px <= graphX + graphW && py >= graphY && py <= graphY + graphH);

      if (isInBounds) {
        if (!started) {
          doc.moveTo(px, py);
          started = true;
        } else {
          doc.lineTo(px, py);
        }
      } else {
        // If point goes out of bounds, stop the current path and restart when back in bounds
        if (started) {
          doc.stroke();
          started = false;
        }
      }
    });
    if (started) doc.stroke();
    if (dashed) doc.undash();
  }

  // Draw curves with exact colors from reference image
  // Order: back to front for proper layering
  drawCurve(systemCurve, COLORS.curveRed, pMin, finalPMax, 1);         // System curve
  drawCurve(effTotalCurve, COLORS.curveGreen, effMin, effMax, 1, true);     // Total Efficiency - dashed dark green
  drawCurve(effStaticCurve, COLORS.curveGreen, effMin, effMax, 1);        // Static Efficiency - solid dark green (thick)
  drawCurve(pCurve, COLORS.curveBlack, pMin, finalPMax, 1);                     // Static Pressure - solid black (thick)
  drawCurve(pwCurve, COLORS.curveBlue, pwMin, finalPwMax, 1);                   // Power - solid blue (thick)

  // ===== INTERSECTION MARKERS at operating point (matching fan curve tab) =====
  function drawIntersectionDot(xVal, yVal, yMin, yMax, color, radius = 3) {
    if (xVal == null || yVal == null || isNaN(xVal) || isNaN(yVal)) return;
    const px = graphX + ((xVal - xMin) / (xMax - xMin)) * graphW;
    const py = graphY + graphH - ((yVal - yMin) / (yMax - yMin)) * graphH;
    if (px >= graphX && px <= graphX + graphW && py >= graphY && py <= graphY + graphH) {
      doc.circle(px, py, radius).fillAndStroke(color, COLORS.white);
    }
  }

  if (operatingAirFlow && operatingAirFlow > 0) {
    // Static Pressure intersection
    if (operatingStaticPressure != null) {
      drawIntersectionDot(operatingAirFlow, operatingStaticPressure, pMin, finalPMax, COLORS.curveBlack);
    }
    // Fan Input Power intersection
    if (pred.FanInputPowerPred != null) {
      drawIntersectionDot(operatingAirFlow, pred.FanInputPowerPred, pwMin, finalPwMax, COLORS.curveBlue);
    }
    // Static Efficiency intersection
    if (pred.FanStaticEfficiencyPred != null) {
      drawIntersectionDot(operatingAirFlow, pred.FanStaticEfficiencyPred * 100, effMin, effMax, COLORS.curveGreen);
    }
    // Total Efficiency intersection
    if (pred.FanTotalEfficiencyPred != null) {
      drawIntersectionDot(operatingAirFlow, pred.FanTotalEfficiencyPred * 100, effMin, effMax, COLORS.curveGreen);
    }
    // System Curve intersection (same point as static pressure at operating airflow)
    if (operatingStaticPressure != null) {
      drawIntersectionDot(operatingAirFlow, operatingStaticPressure, pMin, finalPMax, COLORS.curveRed);
    }
  }

  return doc;
}
