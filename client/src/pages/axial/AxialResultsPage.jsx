import React, { useState, useEffect, useMemo } from "react";
import { API_BASE } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { useFormData } from "../../context/FormContext";
import { Flex, Box, Text } from "@chakra-ui/react";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import {
  canRequestDatasheet,
  getDatasheetLimitMessage,
  registerDatasheetView,
} from "../../middleware/datasheetRequestLimiter";
import "./AxialResultsPage.css";

// Linear Interpolation (matches backend FanCalculationService.cs)
// Used for fan performance predictions - same as backend
class LinearInterpolator {
  constructor(xValues, yValues) {
    this.xValues = xValues;
    this.yValues = yValues;
  }

  // Linear interpolation formula: y = y1 + (y2 - y1) * (x - x1) / (x2 - x1)
  linearInterpolate(x1, y1, x2, y2, x) {
    const ZeroThreshold = 1e-10;
    if (Math.abs(x2 - x1) < ZeroThreshold) {
      return y1;
    }
    const t = (x - x1) / (x2 - x1);
    return y1 + (y2 - y1) * t;
  }

  // Interpolate value at target X
  at(targetX) {
    const xValues = this.xValues;
    const yValues = this.yValues;
    const MinPointSpacing = 1e-6;

    if (xValues.length === 1) {
      return yValues[0];
    }

    for (let i = 0; i < xValues.length - 1; i++) {
      const x1 = xValues[i];
      const x2 = xValues[i + 1];

      if (Math.abs(x2 - x1) < MinPointSpacing) continue;

      const isBetween =
        (x1 <= targetX && targetX <= x2) || (x2 <= targetX && targetX <= x1);

      if (isBetween) {
        return this.linearInterpolate(
          x1,
          yValues[i],
          x2,
          yValues[i + 1],
          targetX,
        );
      }
    }

    if (targetX < xValues[0]) {
      return yValues[0];
    } else {
      return yValues[yValues.length - 1];
    }
  }
}

function linearInterpolation(xArray, yArray, numSamples = 100) {
  if (!xArray || !yArray || xArray.length < 2 || yArray.length < 2) return [];

  const interpolator = new LinearInterpolator(xArray, yArray);

  const xMin = Math.min(...xArray);
  const xMax = Math.max(...xArray);
  const step = (xMax - xMin) / (numSamples - 1);

  const result = [];
  for (let i = 0; i < numSamples; i++) {
    const x = xMin + i * step;
    const y = interpolator.at(x);
    result.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
  }

  return result;
}

// Generate nice round tick values that tightly fit the data
// Returns { ticks: number[], max: number, step: number }
function generateNiceTicks(dataMax, numIntervals = 10) {
  if (!dataMax || dataMax <= 0)
    return {
      ticks: Array.from({ length: numIntervals + 1 }, (_, i) => i),
      max: numIntervals,
      step: 1,
    };
  const margin = dataMax * 1.05;
  const rawStep = margin / numIntervals;
  // Find the order of magnitude
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  // Pick the nearest nice multiplier
  let nice;
  if (norm <= 1) nice = 1;
  else if (norm <= 1.5) nice = 1.5;
  else if (norm <= 2) nice = 2;
  else if (norm <= 2.5) nice = 2.5;
  else if (norm <= 3) nice = 3;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  const step = nice * mag;
  // Use ceil to find minimum intervals that cover the data (tight fit)
  const count = Math.ceil(margin / step);
  const ticks = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(parseFloat((i * step).toFixed(8)));
  }
  return { ticks, max: ticks[ticks.length - 1], step };
}

// Generate nice round tick values for a data range [dataMin, dataMax].
// Supports non-zero minimum for dynamic Y-axis scaling.
// Returns { ticks: number[], min: number, max: number, step: number }
function generateNiceTicksRange(dataMin, dataMax, numIntervals = 10) {
  // Fallback: if range is invalid, delegate to zero-based
  if (
    dataMax == null ||
    dataMin == null ||
    !Number.isFinite(dataMin) ||
    !Number.isFinite(dataMax)
  ) {
    const result = generateNiceTicks(dataMax || 100, numIntervals);
    return { ...result, min: 0 };
  }

  let range = dataMax - dataMin;

  // Minimum range enforcement — prevents flat/tiny curves from being invisible
  const minRange = Math.abs(dataMax) * 0.1 || 1;
  if (range < minRange) {
    const center = (dataMax + dataMin) / 2;
    dataMin = center - minRange / 2;
    dataMax = center + minRange / 2;
    range = dataMax - dataMin;
  }

  // Add 10% padding
  const padding = range * 0.1;
  const paddedMin = dataMin - padding;
  const paddedMax = dataMax + padding;

  // If padded min is close to zero or negative, snap to 0
  if (paddedMin <= 0 || paddedMin < dataMax * 0.15) {
    const result = generateNiceTicks(paddedMax, numIntervals);
    return { ...result, min: 0 };
  }

  // Compute a nice step for the padded range
  const paddedRange = paddedMax - paddedMin;
  const rawStep = paddedRange / numIntervals;
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

  // Round min down and max up to nice step boundaries
  const niceMin = Math.floor(paddedMin / step) * step;
  const niceMax = Math.ceil(paddedMax / step) * step;

  const ticks = [];
  for (let v = niceMin; v <= niceMax + step * 0.001; v += step) {
    ticks.push(parseFloat(v.toFixed(8)));
  }

  return { ticks, min: ticks[0], max: ticks[ticks.length - 1], step };
}

// Interpolate a series value at a given X from merged chart data.
// Uses linear interpolation between nearest valid points and clamps outside range.
function interpolateSeriesAtX(data, dataKey, targetX) {
  if (!Array.isArray(data) || data.length === 0 || !Number.isFinite(targetX)) {
    return null;
  }

  const series = data
    .filter(
      (pt) =>
        pt != null && Number.isFinite(pt.x) && Number.isFinite(pt[dataKey]),
    )
    .sort((a, b) => a.x - b.x);

  if (series.length === 0) return null;

  if (targetX <= series[0].x) return Number(series[0][dataKey]);
  if (targetX >= series[series.length - 1].x) {
    return Number(series[series.length - 1][dataKey]);
  }

  for (let i = 0; i < series.length - 1; i++) {
    const p1 = series[i];
    const p2 = series[i + 1];
    if (targetX >= p1.x && targetX <= p2.x) {
      const dx = p2.x - p1.x;
      if (Math.abs(dx) < 1e-10) return Number(p1[dataKey]);
      const t = (targetX - p1.x) / dx;
      return (
        Number(p1[dataKey]) + (Number(p2[dataKey]) - Number(p1[dataKey])) * t
      );
    }
  }

  return null;
}

// Cubic spline interpolation for smooth curves
// Passes through ALL original data points exactly (no data modification)
// but produces smooth curves between them
function cubicSplineInterpolation(xArray, yArray, numSamples = 300) {
  if (!xArray || !yArray || xArray.length < 2 || yArray.length < 2) return [];
  const n = xArray.length;
  if (n === 2) return linearInterpolation(xArray, yArray, numSamples);

  // Natural cubic spline algorithm
  const h = [];
  for (let i = 0; i < n - 1; i++) h.push(xArray[i + 1] - xArray[i]);

  const alpha = [0];
  for (let i = 1; i < n - 1; i++) {
    alpha.push(
      (3 / h[i]) * (yArray[i + 1] - yArray[i]) -
        (3 / h[i - 1]) * (yArray[i] - yArray[i - 1]),
    );
  }

  const l = new Array(n).fill(1);
  const mu = new Array(n).fill(0);
  const z = new Array(n).fill(0);

  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (xArray[i + 1] - xArray[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }

  const b = new Array(n).fill(0);
  const c = new Array(n).fill(0);
  const d = new Array(n).fill(0);

  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] =
      (yArray[j + 1] - yArray[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }

  // Sample the spline
  const xMin = xArray[0];
  const xMax = xArray[n - 1];
  const step = (xMax - xMin) / (numSamples - 1);
  const result = [];

  for (let i = 0; i < numSamples; i++) {
    const x = xMin + i * step;
    // Find the right interval
    let seg = n - 2;
    for (let j = 0; j < n - 1; j++) {
      if (x <= xArray[j + 1]) {
        seg = j;
        break;
      }
    }
    const dx = x - xArray[seg];
    const y =
      yArray[seg] + b[seg] * dx + c[seg] * dx * dx + d[seg] * dx * dx * dx;
    result.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) });
  }

  return result;
}

// Calculate Sound Power LW(A) spectrum
// Formula: LW(A) = 62 + 10*LOG10(Motor Input Power) + 10*LOG10(Static Pressure)
// Motor Input Power = (Fan Input Power / Motor Efficiency) * (1 + SPF)
// Octave band corrections from base LW(A)
function calculateSoundPowerSpectrum(
  fanInputPower,
  staticPressure,
  motorEfficiency,
  spf,
  directivityFactor,
  distanceFromSource,
) {
  // Ensure positive values for logarithm
  if (
    !fanInputPower ||
    fanInputPower <= 0 ||
    !staticPressure ||
    staticPressure <= 0
  ) {
    return null;
  }

  // Default motor efficiency to 0.85 (85%) if not provided
  const efficiencyValue =
    motorEfficiency && motorEfficiency > 0 ? motorEfficiency : 0.85;

  // Default SPF to 0.05 (5%) if not provided
  const spfValue = spf != null ? spf / 100 : 0.05;

  // Default sound data values
  const Q = directivityFactor || 2; // Directivity factor
  const r = distanceFromSource || 1; // Distance in meters

  // Calculate Motor Input Power
  // Formula: Motor Input Power = (Fan Input Power / Motor Efficiency) * (1 + SPF)
  const motorInputPower = (fanInputPower / efficiencyValue) * (1 + spfValue);

  // Calculate base LW(A) in dB(A)
  // Formula: LW(A) = 62 + 10*log10(Motor Input Power in kW) + 10*log10(Static Pressure in Pa)
  const lwA =
    62 + 10 * Math.log10(motorInputPower) + 10 * Math.log10(staticPressure);

  // Calculate LP(A) - Sound Pressure Level
  // Formula: LP(A) = LW(A) - ABS(10 * LOG10(Q / (4 * PI * r^2)))
  const distanceAttenuation = Math.abs(
    10 * Math.log10(Q / (4 * Math.PI * Math.pow(r, 2))),
  );
  const lpA = lwA - distanceAttenuation;

  // Octave band frequencies and their corrections from LW(A) and LP(A)
  // LW corrections
  const lwOctaveBands = [
    { frequency: 62, correction: -31.7, label: "62" },
    { frequency: 125, correction: -20.7, label: "125" },
    { frequency: 250, correction: -4.2, label: "250" },
    { frequency: 500, correction: -6.7, label: "500" },
    { frequency: 1000, correction: -5.7, label: "1000" },
    { frequency: 2000, correction: -7.7, label: "2000" },
    { frequency: 4000, correction: -10.7, label: "4000" },
    { frequency: 8000, correction: -15.7, label: "8000" },
  ];

  // LP(A) corrections (from the image provided)
  const lpOctaveBands = [
    { frequency: 62, correction: -31.81, label: "62" },
    { frequency: 125, correction: -20.81, label: "125" },
    { frequency: 250, correction: -4.31, label: "250" },
    { frequency: 500, correction: -6.81, label: "500" },
    { frequency: 1000, correction: -5.81, label: "1000" },
    { frequency: 2000, correction: -7.81, label: "2000" },
    { frequency: 4000, correction: -10.81, label: "4000" },
    { frequency: 8000, correction: -15.81, label: "8000" },
  ];

  // Calculate sound power level for each octave band (LW)
  const lwSpectrumData = lwOctaveBands.map((band) => ({
    frequency: band.label,
    freqValue: band.frequency,
    soundPower: parseFloat((lwA + band.correction).toFixed(1)),
    correction: band.correction,
  }));

  // Calculate sound pressure level for each octave band (LP)
  const lpSpectrumData = lpOctaveBands.map((band) => ({
    frequency: band.label,
    freqValue: band.frequency,
    soundPressure: parseFloat((lpA + band.correction).toFixed(1)),
    correction: band.correction,
  }));

  return {
    lwA: parseFloat(lwA.toFixed(1)),
    lpA: parseFloat(lpA.toFixed(1)),
    motorInputPower: parseFloat(motorInputPower.toFixed(2)),
    distanceAttenuation: parseFloat(distanceAttenuation.toFixed(2)),
    Q,
    r,
    lwSpectrum: lwSpectrumData,
    lpSpectrum: lpSpectrumData,
    // Keep spectrum for backward compatibility
    spectrum: lwSpectrumData,
  };
}

// Custom Tooltip Component that always shows all curve values
const CustomTooltip = ({ active, payload, label, units, chartData }) => {
  if (!active) return null;

  const hoveredXRaw = label ?? payload?.[0]?.payload?.x;
  const hoveredX = Number(hoveredXRaw);
  if (!Number.isFinite(hoveredX)) return null;

  const dataPoint = {
    x: hoveredX,
    StaticPressureNew: interpolateSeriesAtX(
      chartData,
      "StaticPressureNew",
      hoveredX,
    ),
    FanInputPowerNew: interpolateSeriesAtX(
      chartData,
      "FanInputPowerNew",
      hoveredX,
    ),
    FanStaticEfficiency: interpolateSeriesAtX(
      chartData,
      "FanStaticEfficiency",
      hoveredX,
    ),
    FanTotalEfficiency: interpolateSeriesAtX(
      chartData,
      "FanTotalEfficiency",
      hoveredX,
    ),
    SystemCurve: interpolateSeriesAtX(chartData, "SystemCurve", hoveredX),
  };

  const labels = {
    StaticPressureNew: "Pst",
    FanInputPowerNew: "Psh",
    FanStaticEfficiency: "ηst",
    FanTotalEfficiency: "ηtot",
    SystemCurve: "System",
  };

  const unitMap = {
    StaticPressureNew: units?.pressure || "Pa",
    FanInputPowerNew: units?.power || "kW",
    FanStaticEfficiency: "%",
    FanTotalEfficiency: "%",
    SystemCurve: units?.pressure || "Pa",
  };

  // Always show all curves in order
  const curves = [
    { key: "StaticPressureNew", color: "#000000" },
    { key: "FanInputPowerNew", color: "#002060" },
    { key: "FanStaticEfficiency", color: "#385723" },
    { key: "FanTotalEfficiency", color: "#385723" },
    { key: "SystemCurve", color: "#FF0000" },
  ];

  return (
    <div
      style={{
        backgroundColor: "transparent",
        border: "1px solid #1e293b",
        borderRadius: "8px",
        padding: "8px 12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          color: "#1e293b",
          fontWeight: "600",
          marginBottom: "6px",
          fontSize: "13px",
        }}
      >
        Q: {Number(dataPoint.x).toLocaleString()} {units?.airFlow || "CFM"}
      </div>
      {curves.map((curve) => {
        const value = dataPoint[curve.key];
        if (value == null || value === undefined) return null;

        let decimals = 2;
        if (
          curve.key === "StaticPressureNew" ||
          curve.key === "FanStaticEfficiency" ||
          curve.key === "FanTotalEfficiency" ||
          curve.key === "SystemCurve"
        ) {
          decimals = 1;
        }

        return (
          <div
            key={curve.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              fontSize: "12px",
              marginTop: "4px",
              color: "#000000",
            }}
          >
            <span style={{ color: curve.color, fontWeight: "500" }}>
              {labels[curve.key]}:
            </span>
            <span style={{ fontWeight: "600" }}>
              {value.toFixed(decimals)} {unitMap[curve.key]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function ResultsPage() {
  const navigate = useNavigate();
  const { results: contextResults, units, input } = useFormData();
  const [selectedFanIndex, setSelectedFanIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("performance"); // 'performance', 'curve', 'noise', or 'pricing'
  // Pricing for selected fan (impeller, casing, accessories)
  const [impellerPricing, setImpellerPricing] = useState(null);
  const [casingPricing, setCasingPricing] = useState(null);
  const [accessoryPricing, setAccessoryPricing] = useState(null);
  const [impellerPricingLoading, setImpellerPricingLoading] = useState(false);
  const [casingPricingLoading, setCasingPricingLoading] = useState(false);
  const [accessoryPricingLoading, setAccessoryPricingLoading] = useState(false);
  // Redesigned Results Page with tabbed interface

  // Curve visibility state - all curves visible by default
  const [curveVisibility, setCurveVisibility] = useState({
    StaticPressureNew: true,
    FanInputPowerNew: true,
    FanStaticEfficiency: true,
    FanTotalEfficiency: true,
    SystemCurve: true,
  });

  // Selected chart point state for interactive click-to-lock tooltip
  const [selectedChartPoint, setSelectedChartPoint] = useState(null);
  // Lock state: when true, tooltip is locked on selectedChartPoint; click same point to unlock
  const [isLocked, setIsLocked] = useState(false);

  // Toggle curve visibility - use functional update to ensure state consistency
  const toggleCurveVisibility = (dataKey) => {
    setCurveVisibility((prev) => {
      const newState = { ...prev };
      newState[dataKey] = !prev[dataKey];
      return newState;
    });
  };

  // Filter state for Inner Diameter, Configuration, and Material
  const [filterInnerDia, setFilterInnerDia] = useState("");
  const [filterConfig, setFilterConfig] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");

  // Filter options (hardcoded from database values)
  const innerDiaOptions = [
    315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1100, 1250, 1350,
  ];
  const configOptions =
    filterMaterial === "PF"
      ? ["3-6", "6-6"]
      : ["5-5", "6-3", "6-6", "9-3", "9-9", "12-6", "12-12", "16-8", "16-16"];

  // Graph types for cycling - using the recalculated arrays from backend
  // Velocity Pressure removed per requirements
  const graphTypes = [
    {
      name: "Static Pressure",
      dataKey: "StaticPressureNew",
      airflowKey: "AirFlowNew",
      unit: units?.pressure || "Pa",
      color: "#000000",
    },
    {
      name: "Fan Input Power",
      dataKey: "FanInputPowerNew",
      airflowKey: "AirFlowNew",
      unit: units?.power || "kW",
      color: "#002060",
    },
    {
      name: "Static Efficiency",
      dataKey: "FanStaticEfficiency",
      airflowKey: "AirFlowNew",
      unit: "%",
      multiplier: 100,
      color: "#385723",
    },
    {
      name: "Total Efficiency",
      dataKey: "FanTotalEfficiency",
      airflowKey: "AirFlowNew",
      unit: "%",
      multiplier: 100,
      color: "#385723",
    },
  ];

  // Extract results from context
  const apiData = contextResults?.data;
  const fans = useMemo(
    () => (Array.isArray(apiData?.data) ? apiData.data : []),
    [apiData?.data],
  );

  // Apply filters to fans (must be before early return so hooks run unconditionally)
  const filteredFans = useMemo(
    () =>
      fans.filter((fan) => {
        const innerDia = fan.Impeller?.innerDia;
        const conf = fan.Impeller?.conf;
        const material = fan.Blades?.material;
        const symbol = fan.Blades?.symbol;
        if (filterInnerDia && innerDia !== Number(filterInnerDia)) return false;
        if (filterConfig && conf !== filterConfig) return false;
        if (
          filterMaterial &&
          (material !== filterMaterial[0] || symbol !== filterMaterial[1])
        )
          return false;
        return true;
      }),
    [fans, filterInnerDia, filterConfig, filterMaterial],
  );

  // Clamp selectedFanIndex when filtered list changes (e.g. after applying a filter)
  useEffect(() => {
    if (filteredFans.length === 0) {
      setSelectedFanIndex(null);
    } else if (
      selectedFanIndex === null ||
      selectedFanIndex >= filteredFans.length
    ) {
      setSelectedFanIndex(0);
    }
  }, [
    filteredFans.length,
    filterInnerDia,
    filterConfig,
    filterMaterial,
    selectedFanIndex,
  ]);

  // Fetch impeller, casing, and accessory pricing when selected fan changes
  useEffect(() => {
    const item = filteredFans[selectedFanIndex];
    const fanType = units?.fanType || "";
    if (!item) {
      setImpellerPricing(null);
      setCasingPricing(null);
      setAccessoryPricing(null);
      setImpellerPricingLoading(false);
      setCasingPricingLoading(false);
      setAccessoryPricingLoading(false);
      return;
    }
    const innerDia = item.Impeller?.innerDia;
    const bladeSymbol = item.Blades?.symbol;
    const bladeMaterial = item.Blades?.material;
    const hubSymbol = item.hubType;
    const frameSizeMm = item.matchedMotor?.frameSize;
    const numberOfBlades = item.Blades?.noBlades;
    const impellerConf = item.Impeller?.conf;

    // Impeller cost
    if (
      bladeSymbol &&
      bladeMaterial &&
      hubSymbol != null &&
      frameSizeMm != null &&
      numberOfBlades != null
    ) {
      setImpellerPricingLoading(true);
      setImpellerPricing(null);
      fetch("/api/pricing/axial-impeller/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bladeSymbol,
          bladeMaterial,
          hubSymbol: String(hubSymbol),
          frameSizeMm: Number(frameSizeMm),
          numberOfBlades: Number(numberOfBlades),
        }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data) => {
          if (data?.data?.totalCost != null)
            setImpellerPricing(data.data.totalCost);
        })
        .catch(() => setImpellerPricing(null))
        .finally(() => setImpellerPricingLoading(false));
    } else {
      setImpellerPricing(null);
      setImpellerPricingLoading(false);
    }

    // Casing cost
    if (fanType && innerDia != null) {
      setCasingPricingLoading(true);
      setCasingPricing(null);
      fetch(`${API_BASE}/api/axial/pricing/casing/calculate-casing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fanType, sizeMm: Number(innerDia) }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((result) => {
          if (result?.totalCost != null) setCasingPricing(result.totalCost);
        })
        .catch(() => {
          if (impellerConf) {
            return fetch(
              `${API_BASE}/api/axial/pricing/casing/calculate-casing`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: fanType,
                  sizeMm: Number(innerDia),
                }),
              },
            )
              .then((r) => (r.ok ? r.json() : Promise.reject(r)))
              .then((result) => {
                if (result?.totalCost != null)
                  setCasingPricing(result.totalCost);
                console.log("Casing Pricing:", result);
              });
          }
        })
        .catch(() => setCasingPricing(null))
        .finally(() => setCasingPricingLoading(false));
    } else {
      setCasingPricing(null);
      setCasingPricingLoading(false);
    }

    // Accessory pricing
    if (fanType && innerDia != null) {
      setAccessoryPricingLoading(true);
      setAccessoryPricing(null);
      fetch(
        `/api/accessories-pricing/lookup/${encodeURIComponent(fanType)}/${encodeURIComponent(innerDia)}`,
      )
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data) => setAccessoryPricing(data))
        .catch(() => setAccessoryPricing(null))
        .finally(() => setAccessoryPricingLoading(false));
    } else {
      setAccessoryPricing(null);
      setAccessoryPricingLoading(false);
    }
  }, [selectedFanIndex, filteredFans, units?.fanType]);

  const getDefaultForField = (type, name) => {
    const DEFAULTS = {
      units: {
        airFlow: "CFM",
        pressure: "Pa",
        power: "kW",
        fanType: "AF-L",
        insulationClass: "F",
      },
      input: {
        RPM: 1440,
        TempC: 20,
        NoPhases: 3,
        SPF: 10,
        Safety: 5,
        directivityFactor: 1,
        distanceFromSource: 3,
      },
    };
    return DEFAULTS[type][name];
  };

  // Check if we have valid data
  if (
    !contextResults ||
    !apiData ||
    !apiData.data ||
    !Array.isArray(apiData.data)
  ) {
    return (
      <div
        className="results-page-container"
        style={{
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              marginBottom: "1rem",
              color: "#374151",
            }}
          >
            No Results Found
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            Please perform a search first.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate("/")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Go to Search
          </button>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <Flex minH="100vh" bg="#f8fafc" flexDirection="column">
      <HamburgerMenu />
      {/* Main Content */}
      <Box flex={1} display="flex" flexDirection="column">
        {/* Content Area */}
        <Box flex={1} py={{ base: 6, md: 8 }} px={{ base: 4, md: 8, lg: 12 }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            {/* Header */}
            <div
              className="results-header"
              style={{ marginBottom: "2rem", textAlign: "center" }}
            >
              <h1
                style={{
                  fontSize: "1.5rem",
                  color: "#1e293b",
                  marginBottom: "1rem",
                  fontWeight: "600",
                }}
              >
                Matched Fans
              </h1>
            </div>
            <>
              <div
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {/* Inner Diameter Filter */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      color: "#000000",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Inner Diameter:
                  </label>
                  <select
                    value={filterInnerDia}
                    onChange={(e) => {
                      setFilterInnerDia(e.target.value);
                      setSelectedFanIndex(0);
                    }}
                    style={{
                      background: "#ffffff",
                      color: "#000000",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.375rem",
                      padding: "0.5rem 1rem",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      minWidth: "120px",
                    }}
                  >
                    <option value="">All</option>
                    {innerDiaOptions.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia} mm
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      color: "#000000",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Material:
                  </label>
                  <select
                    value={filterMaterial}
                    onChange={(e) => {
                      setFilterMaterial(e.target.value);
                      setSelectedFanIndex(0);
                    }}
                    style={{
                      background: "#ffffff",
                      color: "#000000",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.375rem",
                      padding: "0.5rem 1rem",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      minWidth: "100px",
                    }}
                  >
                    <option value="">All</option>
                    <option value="AM">Aluminum M</option>
                    <option value="AG">Aluminum G</option>
                    <option value="AV">Aluminum V</option>
                    <option value="PV">Plastic V</option>
                    <option value="PF">Plastic F</option>
                  </select>
                </div>

                {/* Configuration Filter */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      color: "#000000",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    Configuration:
                  </label>
                  <select
                    value={filterConfig}
                    onChange={(e) => {
                      setFilterConfig(e.target.value);
                      setSelectedFanIndex(0);
                    }}
                    style={{
                      background: "#ffffff",
                      color: "#000000",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.375rem",
                      padding: "0.5rem 1rem",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      minWidth: "120px",
                    }}
                  >
                    <option value="">All</option>
                    {configOptions.map((conf) => (
                      <option key={conf} value={conf}>
                        {conf}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Results count */}
                <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                  Showing {filteredFans.length} of {fans.length} fans
                </span>
              </div>

              <div className="results-table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      {/* <th className="center">No</th> */}
                      <th className="center">Model Number</th>
                      <th className="center">
                        Air Flow (
                        {units?.airFlow ||
                          getDefaultForField("units", "airFlow")}
                        )
                      </th>
                      <th className="center">
                        Static Pressure (
                        {units?.pressure ||
                          getDefaultForField("units", "pressure")}
                        )
                      </th>
                      <th className="center">
                        Fan Input Power (
                        {units?.power || getDefaultForField("units", "power")})
                      </th>

                      <th className="center">Static Efficiency (%)</th>
                      <th className="center">Total Efficiency (%)</th>
                    </tr>
                  </thead>
                  <tbody
                    style={{
                      maxHeight: 100,
                      overflowY: "scroll",
                    }}
                  >
                    {filteredFans.length > 0 ? (
                      filteredFans.map((fan, idx) => {
                        const predictions = fan.predictions || {};
                        const pressureValue =
                          predictions.StaticPressurePred?.toFixed(2) || "-";
                        const powerValue =
                          predictions.FanInputPowerPred?.toFixed(2) || "-";
                        const staticEfficiencyValue =
                          predictions.FanStaticEfficiencyPred
                            ? (
                                predictions.FanStaticEfficiencyPred * 100
                              ).toFixed(2)
                            : "-";
                        const totalEfficiencyValue =
                          predictions.FanTotalEfficiencyPred
                            ? (
                                predictions.FanTotalEfficiencyPred * 100
                              ).toFixed(2)
                            : "-";
                        const AirFlow =
                          parseInt(input.airFlow)?.toFixed(2) || "-";

                        return (
                          <tr
                            key={idx}
                            className={
                              selectedFanIndex === idx ? "selected" : ""
                            }
                            onClick={() =>
                              setSelectedFanIndex(
                                selectedFanIndex === idx ? null : idx,
                              )
                            }
                          >
                            {/* <td className="center">{fan.No ?? "-"}</td> */}
                            <td className="center">
                              <span className="fan-model">
                                {fan.FanModel || `Model ${fan.Id}`}
                              </span>
                            </td>
                            <td className="center">{AirFlow}</td>
                            <td className="center">{pressureValue}</td>
                            <td className="center">{powerValue}</td>
                            <td className="center">{staticEfficiencyValue}</td>
                            <td className="center">{totalEfficiencyValue}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="center">
                          No results found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
            {/* Detailed Fan Information Card - Only show selected fan */}
            {selectedFanIndex !== null &&
              filteredFans[selectedFanIndex] != null && (
                <div className="detail-section" style={{ marginTop: "2rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#1e293b",
                      }}
                    >
                      Details:{" "}
                      {filteredFans[selectedFanIndex]?.FanModel ||
                        `Fan ${selectedFanIndex + 1}`}
                    </h2>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      {/* <button
                      onClick={() => handleOpenAddToProject(selectedFanIndex)}
                      style={{
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        color: "white",
                        border: "none",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 6px 20px rgba(59, 130, 246, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(59, 130, 246, 0.3)";
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Add to Project
                    </button> */}

                      <button
                        onClick={() => {
                          if (!canRequestDatasheet()) {
                            // alert(getDatasheetLimitMessage());
                            return;
                          }

                          const fan = filteredFans[selectedFanIndex];
                          const payload = {
                            fanData: fan,
                            userInput: {
                              ...input,
                              RPM: input?.RPM ?? 1440,
                              TempC: input?.TempC ?? 20,
                              NoPhases: input?.NoPhases ?? 3,
                              SPF: input?.SPF ?? 10,
                              Safety: input?.Safety ?? 5,
                              directivityFactor: input?.directivityFactor ?? 1,
                              distanceFromSource:
                                input?.distanceFromSource ?? 3,
                            },
                            units: {
                              ...units,
                              power: units?.power ?? "kW",
                              insulationClass: units?.insulationClass ?? "F",
                              fanUnitNo:
                                input?.fanUnitNo ?? units?.fanUnitNo ?? "EX-01",
                            },
                          };

                          const targetName = `axialDatasheet_${Date.now()}`;
                          const previewWindow = window.open("", targetName);
                          if (!previewWindow) {
                            alert(
                              "Please allow popups to preview the datasheet.",
                            );
                            return;
                          }

                          const form = document.createElement("form");
                          const fileBase =
                            String(
                              input?.fanUnitNo ??
                                units?.fanUnitNo ??
                                "Datasheet",
                            ).trim() || "Datasheet";
                          const filePathPart = `${encodeURIComponent(fileBase)}.pdf`;
                          form.method = "POST";
                          form.action = `${API_BASE}/api/axial/pdf/datasheet/${filePathPart}`;
                          form.target = targetName;
                          form.style.display = "none";

                          const payloadInput = document.createElement("input");
                          payloadInput.type = "hidden";
                          payloadInput.name = "jsonPayload";
                          payloadInput.value = JSON.stringify(payload);

                          form.appendChild(payloadInput);
                          document.body.appendChild(form);
                          registerDatasheetView();
                          form.submit();
                          document.body.removeChild(form);
                        }}
                        style={{
                          background:
                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                          border: "none",
                          padding: "0.75rem 1.5rem",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 20px rgba(16, 185, 129, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(16, 185, 129, 0.3)";
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        View Datasheet
                      </button>
                    </div>
                  </div>
                  {/* Tab Buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: "0",
                      marginBottom: "1.5rem",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <button
                      onClick={() => setActiveTab("performance")}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "0.75rem 1.25rem",
                        color:
                          activeTab === "performance" ? "#1e293b" : "#94a3b8",
                        fontSize: "0.875rem",
                        fontWeight: activeTab === "performance" ? "600" : "400",
                        cursor: "pointer",
                        borderBottom:
                          activeTab === "performance"
                            ? "2px solid #1e293b"
                            : "2px solid transparent",
                        transition: "all 0.2s",
                        marginBottom: "-1px",
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== "performance")
                          e.target.style.color = "#64748b";
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== "performance")
                          e.target.style.color = "#94a3b8";
                      }}
                    >
                      Performance Data
                    </button>
                    <button
                      onClick={() => setActiveTab("curve")}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "0.75rem 1.25rem",
                        color: activeTab === "curve" ? "#1e293b" : "#94a3b8",
                        fontSize: "0.875rem",
                        fontWeight: activeTab === "curve" ? "600" : "400",
                        cursor: "pointer",
                        borderBottom:
                          activeTab === "curve"
                            ? "2px solid #1e293b"
                            : "2px solid transparent",
                        transition: "all 0.2s",
                        marginBottom: "-1px",
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== "curve")
                          e.target.style.color = "#64748b";
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== "curve")
                          e.target.style.color = "#94a3b8";
                      }}
                    >
                      Fan Curve
                    </button>
                    <button
                      onClick={() => setActiveTab("noise")}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "0.75rem 1.25rem",
                        color: activeTab === "noise" ? "#1e293b" : "#94a3b8",
                        fontSize: "0.875rem",
                        fontWeight: activeTab === "noise" ? "600" : "400",
                        cursor: "pointer",
                        borderBottom:
                          activeTab === "noise"
                            ? "2px solid #1e293b"
                            : "2px solid transparent",
                        transition: "all 0.2s",
                        marginBottom: "-1px",
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== "noise")
                          e.target.style.color = "#64748b";
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== "noise")
                          e.target.style.color = "#94a3b8";
                      }}
                    >
                      Noise Graph
                    </button>
                    <button
                      onClick={() => setActiveTab("pricing")}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "0.75rem 1.25rem",
                        color: activeTab === "pricing" ? "#1e293b" : "#94a3b8",
                        fontSize: "0.875rem",
                        fontWeight: activeTab === "pricing" ? "600" : "400",
                        cursor: "pointer",
                        borderBottom:
                          activeTab === "pricing"
                            ? "2px solid #1e293b"
                            : "2px solid transparent",
                        transition: "all 0.2s",
                        marginBottom: "-1px",
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== "pricing")
                          e.target.style.color = "#64748b";
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== "pricing")
                          e.target.style.color = "#94a3b8";
                      }}
                    >
                      Pricing
                    </button>
                  </div>

                  {(() => {
                    const item = filteredFans[selectedFanIndex];
                    const idx = selectedFanIndex;
                    if (!item) {
                      return (
                        <div style={{ padding: "1rem", color: "#64748b" }}>
                          Select a fan from the table above.
                        </div>
                      );
                    }
                    const summaryFields = {
                      FanModel: item.FanModel,
                      Id: item.Id,
                      RPM: input?.RPM || item.RPM,
                      desigDensity: item.desigDensity,
                      InputDensity: item.InputDensity,
                    };

                    // Build blade designation: materialCode + symbol (e.g. "AM")
                    const bladeMat = item.Blades?.material;
                    const bladeMatDisplay =
                      bladeMat === "A" || bladeMat === "Aluminum"
                        ? "Aluminum"
                        : bladeMat === "P" || bladeMat === "PAG"
                          ? "Plastic"
                          : bladeMat || "";
                    const bladeSym = item.Blades?.symbol;
                    const bladeMatCode =
                      bladeMat === "Aluminum"
                        ? "A"
                        : bladeMat === "PAG"
                          ? "P"
                          : bladeMat
                            ? bladeMat.charAt(0)
                            : "";
                    const bladeDesignation =
                      bladeMatCode && bladeSym
                        ? `${bladeMatCode}${bladeSym}`
                        : bladeSym || "";
                    const bladeNoBlades = item.Blades?.noBlades;
                    const bladeAngle = item.Blades?.angle;

                    // Impeller data
                    const impConf = item.Impeller?.conf;
                    const impInnerDia = item.Impeller?.innerDia;
                    const hubType = item.hubType;

                    const motor = item.matchedMotor;
                    console.log("Motor", motor);
                    // console.log("Electrical Motor Cost", motor.otherPriceWithoutVat, motor.b3PriceWithoutVat);
                    // Motor efficiency: try efficiency50Hz first, then effCurve[0]
                    // Handle both decimal (0.936) and percentage (93.6) formats
                    let motorEff =
                      motor?.efficiency50Hz ??
                      (motor &&
                      Array.isArray(motor.effCurve) &&
                      motor.effCurve.length > 0
                        ? motor.effCurve[0]
                        : null);
                    // If efficiency is already a percentage (>1), convert to decimal for display
                    if (motorEff != null && motorEff > 1) {
                      motorEff = motorEff / 100;
                    }

                    return (
                      <div key={idx}>
                        {/* Performance Data Section - Only show when activeTab is 'performance' */}
                        {activeTab === "performance" && (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "1.5rem",
                            }}
                          >
                            {/* Fan Specifications Card */}
                            <div
                              style={{
                                background: "#f8fafc",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                padding: "1.25rem",
                              }}
                            >
                              <h4
                                style={{
                                  color: "#1e293b",
                                  fontSize: "0.9375rem",
                                  fontWeight: "600",
                                  marginBottom: "1rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <span style={{ color: "#3b82f6" }}>⚙</span> Fan
                                Specifications
                              </h4>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "0.625rem 0",
                                  borderBottom: "1px solid #e2e8f0",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#64748b",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Input Density
                                </span>
                                <span
                                  style={{
                                    color: "#1e293b",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  {summaryFields.InputDensity
                                    ? `${summaryFields.InputDensity} kg/m³`
                                    : "—"}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "0.625rem 0",
                                  borderBottom: "1px solid #e2e8f0",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#64748b",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Fan Speed
                                </span>
                                <span
                                  style={{
                                    color: "#1e293b",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  {summaryFields.RPM
                                    ? `${summaryFields.RPM} RPM`
                                    : "—"}
                                </span>
                              </div>
                              {/* Blades Section */}
                              <div
                                style={{
                                  padding: "0.625rem 0",
                                  borderBottom: "1px solid #e2e8f0",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "0.375rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "#64748b",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    Blades
                                  </span>
                                  {bladeDesignation && (
                                    <span
                                      style={{
                                        background: "#eff6ff",
                                        color: "#1d4ed8",
                                        fontSize: "0.8125rem",
                                        fontWeight: "700",
                                        padding: "0.125rem 0.625rem",
                                        borderRadius: "4px",
                                        letterSpacing: "0.05em",
                                      }}
                                    >
                                      {bladeDesignation}
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "0.25rem",
                                    paddingLeft: "0.5rem",
                                  }}
                                >
                                  <div>
                                    <span
                                      style={{
                                        color: "#94a3b8",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      Material
                                    </span>
                                    <div
                                      style={{
                                        color: "#1e293b",
                                        fontSize: "0.8125rem",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {bladeMatDisplay || "—"}
                                    </div>
                                  </div>
                                  <div>
                                    <span
                                      style={{
                                        color: "#94a3b8",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      No. of Blades
                                    </span>
                                    <div
                                      style={{
                                        color: "#1e293b",
                                        fontSize: "0.8125rem",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {bladeNoBlades ?? "—"}
                                    </div>
                                  </div>
                                  <div>
                                    <span
                                      style={{
                                        color: "#94a3b8",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      Angle
                                    </span>
                                    <div
                                      style={{
                                        color: "#1e293b",
                                        fontSize: "0.8125rem",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {bladeAngle != null
                                        ? `${bladeAngle}°`
                                        : "—"}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Impeller Section */}
                              <div
                                style={{
                                  padding: "0.625rem 0",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "0.375rem",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "#64748b",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    Impeller
                                  </span>
                                  {impConf && (
                                    <span
                                      style={{
                                        background: "#f0fdf4",
                                        color: "#15803d",
                                        fontSize: "0.8125rem",
                                        fontWeight: "700",
                                        padding: "0.125rem 0.625rem",
                                        borderRadius: "4px",
                                        letterSpacing: "0.05em",
                                      }}
                                    >
                                      {impConf}
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "0.25rem",
                                    paddingLeft: "0.5rem",
                                  }}
                                >
                                  <div>
                                    <span
                                      style={{
                                        color: "#94a3b8",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      Inner Diameter
                                    </span>
                                    <div
                                      style={{
                                        color: "#1e293b",
                                        fontSize: "0.8125rem",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {impInnerDia != null
                                        ? `${impInnerDia} mm`
                                        : "—"}
                                    </div>
                                  </div>
                                  <div>
                                    <span
                                      style={{
                                        color: "#94a3b8",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      Hub Type
                                    </span>
                                    <div
                                      style={{
                                        color: "#1e293b",
                                        fontSize: "0.8125rem",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {hubType ?? "—"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Motor Details Card */}
                            <div
                              style={{
                                background: "#f8fafc",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                padding: "1.25rem",
                              }}
                            >
                              <h4
                                style={{
                                  color: "#1e293b",
                                  fontSize: "0.9375rem",
                                  fontWeight: "600",
                                  marginBottom: "1rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <span style={{ color: "#3b82f6" }}>⚡</span>{" "}
                                Motor Details
                              </h4>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "0.625rem 0",
                                  borderBottom: "1px solid #e2e8f0",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#64748b",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Motor Model
                                </span>
                                <span
                                  style={{
                                    color: "#1e293b",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  {motor?.model || "—"}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "0.625rem 0",
                                  borderBottom: "1px solid #e2e8f0",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#64748b",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Power (kW)
                                </span>
                                <span
                                  style={{
                                    color: "#1e293b",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  {motor?.powerKW || "—"}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "0.625rem 0",
                                  borderBottom: "1px solid #e2e8f0",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#64748b",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  No. of Poles
                                </span>
                                <span
                                  style={{
                                    color: "#1e293b",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  {motor?.noOfPoles || "—"}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "0.625rem 0",
                                  borderBottom: "1px solid #e2e8f0",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#64748b",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Volt / Phase / Freq
                                </span>
                                <span
                                  style={{
                                    color: "#1e293b",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  {motor?.NoPhases
                                    ? `${
                                        motor.NoPhases === 1
                                          ? "220"
                                          : motor.NoPhases === 3
                                            ? "380"
                                            : "—"
                                      }V / ${motor.NoPhases}Ph / 50Hz`
                                    : "—"}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "0.625rem 0",
                                  borderBottom: "1px solid #e2e8f0",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#64748b",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Motor Efficiency
                                </span>
                                <span
                                  style={{
                                    color: "#1e293b",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  {motorEff != null
                                    ? `${(motorEff * 100).toFixed(1)}%`
                                    : "—"}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "0.625rem 0",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#64748b",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Insulation Class
                                </span>
                                <span
                                  style={{
                                    color: "#1e293b",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  {motor?.insClass || "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Fan Curve Section - Only show when activeTab is 'curve' */}
                        {activeTab === "curve" && (
                          <div style={{ marginBottom: "1.5rem" }}>
                            <div style={{ position: "relative" }}>
                              <h4
                                style={{
                                  color: "#1e293b",
                                  fontSize: "1rem",
                                  fontWeight: "600",
                                  marginBottom: "1rem",
                                }}
                              >
                                Fan Performance Curves
                              </h4>
                              {/* Curve visibility checkboxes - above chart */}
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "1.5rem",
                                  justifyContent: "center",
                                  marginBottom: "1rem",
                                  backgroundColor: "#f1f5f9",
                                  padding: "0.75rem 1.5rem",
                                  borderRadius: "8px",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                {[
                                  {
                                    key: "StaticPressureNew",
                                    label: "Static Pressure",
                                    color: "#000000",
                                  },
                                  {
                                    key: "FanInputPowerNew",
                                    label: "Fan Input Power",
                                    color: "#002060",
                                  },
                                  {
                                    key: "FanStaticEfficiency",
                                    label: "Static Efficiency",
                                    color: "#385723",
                                  },
                                  {
                                    key: "FanTotalEfficiency",
                                    label: "Total Efficiency",
                                    color: "#385723",
                                    dashed: true,
                                  },
                                  {
                                    key: "SystemCurve",
                                    label: "System Curve",
                                    color: "#FF0000",
                                  },
                                ].map((curve) => (
                                  <label
                                    key={curve.key}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                      cursor: "pointer",
                                      fontSize: "0.85rem",
                                      userSelect: "none",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={curveVisibility[curve.key]}
                                      onChange={() =>
                                        toggleCurveVisibility(curve.key)
                                      }
                                      style={{
                                        cursor: "pointer",
                                        width: "16px",
                                        height: "16px",
                                        accentColor: curve.color,
                                      }}
                                    />
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        color: curve.color,
                                        fontWeight: "500",
                                      }}
                                    >
                                      <span
                                        style={{
                                          display: "inline-block",
                                          width: "20px",
                                          height: "3px",
                                          backgroundColor: curve.color,
                                          borderTop: curve.dashed
                                            ? "2px dashed"
                                            : "none",
                                          borderColor: curve.color,
                                        }}
                                      />
                                      {curve.label}
                                    </span>
                                  </label>
                                ))}
                              </div>

                              {/* Chart Container */}
                              <div
                                style={{
                                  background: "transparent",
                                  borderRadius: "12px",
                                  border: "none",
                                  padding: "1rem",
                                }}
                              >
                                <div
                                  style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "500px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    {(() => {
                                      const airflowData =
                                        item["AirFlowNew"] || [];

                                      // Build combined data for all curves
                                      // First, get all valid airflow values and sort them
                                      const validAirflows = airflowData
                                        .filter((v) => v != null && !isNaN(v))
                                        .map(Number);
                                      if (validAirflows.length < 2) {
                                        return (
                                          <div style={{ color: "#94a3b8" }}>
                                            Insufficient data for curves
                                          </div>
                                        );
                                      }

                                      const dataXMax = Math.max(
                                        ...validAirflows,
                                      );

                                      // ===== DYNAMIC X-AXIS: exactly 10 intervals (11 ticks including 0) =====
                                      const xTickResult = generateNiceTicks(
                                        dataXMax,
                                        10,
                                      );
                                      const xTicks = xTickResult.ticks;
                                      const xDomainMax = xTickResult.max;

                                      // Prepare interpolated data for each curve
                                      // Always generate all curve data to ensure consistent behavior when toggling
                                      const curveData = {};
                                      graphTypes.forEach((graph) => {
                                        const yData = item[graph.dataKey] || [];
                                        // Filter out null/undefined values and sort by airflow
                                        const validIndices = [];
                                        for (
                                          let i = 0;
                                          i < airflowData.length;
                                          i++
                                        ) {
                                          if (
                                            airflowData[i] != null &&
                                            yData[i] != null &&
                                            !isNaN(airflowData[i]) &&
                                            !isNaN(yData[i])
                                          ) {
                                            validIndices.push(i);
                                          }
                                        }

                                        // Sort indices by airflow value
                                        validIndices.sort(
                                          (a, b) =>
                                            airflowData[a] - airflowData[b],
                                        );

                                        // Create sorted arrays
                                        const xArray = validIndices.map((i) =>
                                          Number(airflowData[i]),
                                        );
                                        const yArray = validIndices.map(
                                          (i) =>
                                            Number(yData[i]) *
                                            (graph.multiplier || 1),
                                        );

                                        if (xArray.length >= 2) {
                                          curveData[graph.dataKey] =
                                            cubicSplineInterpolation(
                                              xArray,
                                              yArray,
                                              800,
                                            );
                                        } else {
                                          curveData[graph.dataKey] = xArray.map(
                                            (x, i) => ({ x, y: yArray[i] }),
                                          );
                                        }
                                      });

                                      // ===== CURVE DATA: normalize all curves to shared clean airflow steps =====
                                      // Generate shared clean airflow sample points from 0 to xDomainMax
                                      const numSamples = 800;
                                      const sampleStep =
                                        xDomainMax / (numSamples - 1);
                                      const sharedXPoints = [];
                                      for (let i = 0; i < numSamples; i++) {
                                        sharedXPoints.push(
                                          parseFloat(
                                            (i * sampleStep).toFixed(4),
                                          ),
                                        );
                                      }

                                      // Merge all curve data into a single dataset keyed by shared x
                                      const mergedDataMap = new Map();
                                      // Seed with shared X points so all curves align
                                      sharedXPoints.forEach((xVal) => {
                                        const xKey = xVal.toFixed(4);
                                        mergedDataMap.set(xKey, { x: xVal });
                                      });
                                      graphTypes.forEach((graph) => {
                                        const data =
                                          curveData[graph.dataKey] || [];
                                        data.forEach((point) => {
                                          const xKey = point.x.toFixed(4);
                                          if (!mergedDataMap.has(xKey)) {
                                            mergedDataMap.set(xKey, {
                                              x: point.x,
                                            });
                                          }
                                          mergedDataMap.get(xKey)[
                                            graph.dataKey
                                          ] = point.y;
                                        });
                                      });

                                      // Ensure origin (0,0) exists for System Curve start
                                      if (!mergedDataMap.has("0.0000")) {
                                        mergedDataMap.set("0.0000", { x: 0 });
                                      }

                                      // Calculate System Curve: y = a * x²
                                      // a = predictedStaticPressure / (userAirflowInput²)
                                      const itemPredictions =
                                        item.predictions || {};
                                      const predictedStaticPressure =
                                        itemPredictions.StaticPressurePred;
                                      const userAirflowInput = input?.airFlow;

                                      if (
                                        predictedStaticPressure &&
                                        userAirflowInput &&
                                        userAirflowInput > 0
                                      ) {
                                        const coefficientA =
                                          predictedStaticPressure /
                                          Math.pow(userAirflowInput, 2);

                                        // Generate System Curve points for all x values in mergedDataMap
                                        mergedDataMap.forEach(
                                          (dataPoint, xKey) => {
                                            const x = dataPoint.x;
                                            const systemY =
                                              coefficientA * Math.pow(x, 2);
                                            dataPoint.SystemCurve = systemY;
                                          },
                                        );
                                      }

                                      // Convert to array and sort by x
                                      const mergedData = Array.from(
                                        mergedDataMap.values(),
                                      ).sort((a, b) => a.x - b.x);

                                      // ===== DYNAMIC Y-AXIS SCALING: exactly 10 intervals (11 ticks including 0) =====

                                      // --- Pressure Y-Axis (data-driven min/max from all rendered pressure data) ---
                                      // Collect all visible pressure values from mergedData (fan curve + system curve)
                                      const allPressureVals = [];
                                      mergedData.forEach((pt) => {
                                        if (
                                          pt.StaticPressureNew != null &&
                                          Number.isFinite(pt.StaticPressureNew)
                                        ) {
                                          allPressureVals.push(
                                            pt.StaticPressureNew,
                                          );
                                        }
                                        if (
                                          pt.SystemCurve != null &&
                                          Number.isFinite(pt.SystemCurve)
                                        ) {
                                          allPressureVals.push(pt.SystemCurve);
                                        }
                                      });
                                      // Also include the operating point pressure
                                      if (
                                        predictedStaticPressure &&
                                        Number.isFinite(predictedStaticPressure)
                                      ) {
                                        allPressureVals.push(
                                          predictedStaticPressure,
                                        );
                                      }

                                      let pMin =
                                        allPressureVals.length > 0
                                          ? Math.min(...allPressureVals)
                                          : 0;
                                      let pMax =
                                        allPressureVals.length > 0
                                          ? Math.max(...allPressureVals)
                                          : 600;

                                      // Cap system curve extremes: if the system curve pushes pMax far beyond the
                                      // fan's static pressure range, limit it to avoid compressing the fan curve
                                      const rawPressureData =
                                        item["StaticPressureNew"] || [];
                                      const validPressureValues =
                                        rawPressureData
                                          .filter((v) => v != null && !isNaN(v))
                                          .map(Number);
                                      if (validPressureValues.length > 0) {
                                        const fanPMax = Math.max(
                                          ...validPressureValues,
                                        );
                                        // Don't let system curve inflate axis beyond 2× the fan curve max
                                        if (pMax > fanPMax * 2) {
                                          pMax = fanPMax * 2;
                                        }
                                      }

                                      const pTickResult =
                                        generateNiceTicksRange(
                                          pMin,
                                          pMax || 600,
                                          10,
                                        );
                                      const pressureTicks = pTickResult.ticks;
                                      const pressureAxisMin = pTickResult.min;
                                      const pressureAxisMax = pTickResult.max;

                                      // --- Power Y-Axis (20% margin) ---
                                      const rawPowerData =
                                        item["FanInputPowerNew"] || [];
                                      const validPowerValues = rawPowerData
                                        .filter((v) => v != null && !isNaN(v))
                                        .map(Number);
                                      let pwDataMax =
                                        validPowerValues.length > 0
                                          ? Math.max(...validPowerValues)
                                          : 0;
                                      pwDataMax = pwDataMax * 1.2 || 1.8;

                                      const pwTickResult = generateNiceTicks(
                                        pwDataMax,
                                        10,
                                      );
                                      const powerTicks = pwTickResult.ticks;

                                      // --- Efficiency Y-Axis (fixed 0-100%, 11 ticks) ---
                                      const efficiencyTicks = [
                                        0, 10, 20, 30, 40, 50, 60, 70, 80, 90,
                                        100,
                                      ];

                                      // Get prediction values for summary
                                      const predictions =
                                        item.predictions || {};
                                      return (
                                        <LineChart
                                          data={mergedData}
                                          margin={{
                                            top: 20,
                                            right: 120,
                                            left: 30,
                                            bottom: 50,
                                          }}
                                          onClick={(e) => {
                                            if (!e) return;

                                            const clickedXRaw =
                                              e.activeLabel ??
                                              e.activePayload?.[0]?.payload?.x;
                                            const clickedX =
                                              Number(clickedXRaw);

                                            if (!Number.isFinite(clickedX)) {
                                              return;
                                            }

                                            const lockedPoint = {
                                              x: clickedX,
                                              StaticPressureNew:
                                                interpolateSeriesAtX(
                                                  mergedData,
                                                  "StaticPressureNew",
                                                  clickedX,
                                                ),
                                              FanInputPowerNew:
                                                interpolateSeriesAtX(
                                                  mergedData,
                                                  "FanInputPowerNew",
                                                  clickedX,
                                                ),
                                              FanStaticEfficiency:
                                                interpolateSeriesAtX(
                                                  mergedData,
                                                  "FanStaticEfficiency",
                                                  clickedX,
                                                ),
                                              FanTotalEfficiency:
                                                interpolateSeriesAtX(
                                                  mergedData,
                                                  "FanTotalEfficiency",
                                                  clickedX,
                                                ),
                                              SystemCurve: interpolateSeriesAtX(
                                                mergedData,
                                                "SystemCurve",
                                                clickedX,
                                              ),
                                            };

                                            setSelectedChartPoint({
                                              ...lockedPoint,
                                            });
                                            setIsLocked(true);
                                          }}
                                        >
                                          <CartesianGrid
                                            strokeDasharray=""
                                            stroke="#d0d0d0"
                                            strokeWidth={1}
                                            horizontal={true}
                                            vertical={true}
                                          />
                                          <XAxis
                                            dataKey="x"
                                            stroke="#000000"
                                            tick={{
                                              fill: "#000000",
                                              fontSize: 14,
                                            }}
                                            ticks={xTicks}
                                            domain={[0, xDomainMax]}
                                            type="number"
                                            label={{
                                              value: `Air Flow (${
                                                units?.airFlow || "CFM"
                                              })`,
                                              position: "insideBottom",
                                              offset: -10,
                                              fill: "#000000",
                                              style: {
                                                fontSize: "16px",
                                                fontWeight: "600",
                                              },
                                            }}
                                          />
                                          <YAxis
                                            orientation="left"
                                            stroke="#000000"
                                            tick={{
                                              fill: "#000000",
                                              fontSize: 14,
                                            }}
                                            ticks={pressureTicks}
                                            tickCount={pressureTicks.length}
                                            domain={[
                                              pressureAxisMin,
                                              pressureAxisMax,
                                            ]}
                                            hide={false}
                                            allowDataOverflow={true}
                                            label={{
                                              value: `Pressure (${
                                                units?.pressure || "Pa"
                                              })`,
                                              angle: -90,
                                              position: "insideLeft",
                                              offset: -10,
                                              fill: "#000000",
                                              style: {
                                                fontSize: "18px",
                                                fontWeight: "600",
                                                textAnchor: "middle",
                                              },
                                            }}
                                          />
                                          {/* Right Y-Axis: Efficiency (%) */}
                                          <YAxis
                                            yAxisId="efficiency"
                                            orientation="right"
                                            stroke="#385723"
                                            tick={{
                                              fill: "#385723",
                                              fontSize: 14,
                                            }}
                                            ticks={efficiencyTicks}
                                            domain={[0, 100]}
                                            hide={false}
                                            allowDataOverflow={true}
                                            label={{
                                              value: "Efficiency (%)",
                                              angle: 90,
                                              position: "right",
                                              offset: 0,
                                              dx: -20,
                                              fill: "#385723",
                                              style: {
                                                fontSize: "18px",
                                                fontWeight: "600",
                                                textAnchor: "middle",
                                              },
                                            }}
                                          />
                                          {/* Far Right Y-Axis: Power (kW) */}
                                          <YAxis
                                            yAxisId="power"
                                            orientation="right"
                                            stroke="#002060"
                                            tick={{
                                              fill: "#002060",
                                              fontSize: 14,
                                            }}
                                            ticks={powerTicks}
                                            domain={[
                                              0,
                                              powerTicks[
                                                powerTicks.length - 1
                                              ] || 10,
                                            ]}
                                            hide={false}
                                            allowDataOverflow={true}
                                            axisLine={{ stroke: "#002060" }}
                                            tickLine={{ stroke: "#002060" }}
                                            label={{
                                              value: `Power (${
                                                units?.power || "kW"
                                              })`,
                                              angle: 90,
                                              position: "right",
                                              offset: 0,
                                              dx: 3,
                                              fill: "#002060",
                                              style: {
                                                fontSize: "18px",
                                                fontWeight: "600",
                                                textAnchor: "middle",
                                              },
                                            }}
                                          />
                                          {isLocked &&
                                            selectedChartPoint &&
                                            Number.isFinite(
                                              Number(selectedChartPoint.x),
                                            ) && (
                                              <ReferenceLine
                                                x={Number(selectedChartPoint.x)}
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                strokeDasharray="6 4"
                                              />
                                            )}
                                          {!isLocked && (
                                            <Tooltip
                                              content={
                                                <CustomTooltip
                                                  units={units}
                                                  chartData={mergedData}
                                                />
                                              }
                                            />
                                          )}
                                          {/* Static Pressure */}
                                          {curveVisibility.StaticPressureNew && (
                                            <Line
                                              type="basis"
                                              dataKey="StaticPressureNew"
                                              stroke="#000000"
                                              strokeWidth={2.5}
                                              dot={false}
                                              activeDot={false}
                                              style={{ pointerEvents: "none" }}
                                              isAnimationActive={true}
                                              connectNulls
                                            />
                                          )}
                                          {/* Fan Input Power */}
                                          {curveVisibility.FanInputPowerNew && (
                                            <Line
                                              yAxisId="power"
                                              type="basis"
                                              dataKey="FanInputPowerNew"
                                              stroke="#002060"
                                              strokeWidth={2.5}
                                              dot={false}
                                              activeDot={false}
                                              style={{ pointerEvents: "none" }}
                                              isAnimationActive={true}
                                              connectNulls
                                            />
                                          )}
                                          {/* Static Efficiency */}
                                          {curveVisibility.FanStaticEfficiency && (
                                            <Line
                                              yAxisId="efficiency"
                                              type="basis"
                                              dataKey="FanStaticEfficiency"
                                              stroke="#385723"
                                              strokeWidth={2.5}
                                              dot={false}
                                              activeDot={false}
                                              style={{ pointerEvents: "none" }}
                                              isAnimationActive={true}
                                              connectNulls
                                            />
                                          )}
                                          {/* Total Efficiency - Dashed */}
                                          {curveVisibility.FanTotalEfficiency && (
                                            <Line
                                              yAxisId="efficiency"
                                              type="basis"
                                              dataKey="FanTotalEfficiency"
                                              stroke="#385723"
                                              strokeDasharray="5 5"
                                              strokeWidth={2.5}
                                              dot={false}
                                              activeDot={false}
                                              style={{ pointerEvents: "none" }}
                                              isAnimationActive={true}
                                              connectNulls
                                            />
                                          )}
                                          {/* System Curve - Red */}
                                          {curveVisibility.SystemCurve && (
                                            <Line
                                              type="basis"
                                              dataKey="SystemCurve"
                                              stroke="#FF0000"
                                              strokeWidth={2.5}
                                              dot={false}
                                              activeDot={false}
                                              style={{ pointerEvents: "none" }}
                                              isAnimationActive={true}
                                              connectNulls
                                            />
                                          )}
                                          {/* Operating Point Intersection Dots - clickable to lock/unlock */}
                                          {(() => {
                                            const opAirflow = Number(
                                              input?.airFlow,
                                            );

                                            const hasLockedPoint =
                                              isLocked &&
                                              selectedChartPoint &&
                                              Number.isFinite(
                                                Number(selectedChartPoint.x),
                                              );
                                            const hasOperatingPoint =
                                              Number.isFinite(opAirflow) &&
                                              opAirflow > 0;

                                            if (
                                              !hasLockedPoint &&
                                              !hasOperatingPoint
                                            ) {
                                              return null;
                                            }

                                            const markerX = hasLockedPoint
                                              ? Number(selectedChartPoint.x)
                                              : opAirflow;

                                            const markerValues = hasLockedPoint
                                              ? {
                                                  StaticPressureNew:
                                                    selectedChartPoint.StaticPressureNew,
                                                  FanInputPowerNew:
                                                    selectedChartPoint.FanInputPowerNew,
                                                  FanStaticEfficiency:
                                                    selectedChartPoint.FanStaticEfficiency,
                                                  FanTotalEfficiency:
                                                    selectedChartPoint.FanTotalEfficiency,
                                                  SystemCurve:
                                                    selectedChartPoint.SystemCurve,
                                                }
                                              : {
                                                  StaticPressureNew:
                                                    predictions.StaticPressurePred,
                                                  FanInputPowerNew:
                                                    predictions.FanInputPowerPred,
                                                  FanStaticEfficiency:
                                                    predictions.FanStaticEfficiencyPred !=
                                                    null
                                                      ? predictions.FanStaticEfficiencyPred *
                                                        100
                                                      : null,
                                                  FanTotalEfficiency:
                                                    predictions.FanTotalEfficiencyPred !=
                                                    null
                                                      ? predictions.FanTotalEfficiencyPred *
                                                        100
                                                      : null,
                                                  SystemCurve:
                                                    predictedStaticPressure,
                                                };

                                            const dots = [];
                                            const dotStyle = {
                                              cursor: "pointer",
                                            };
                                            const selectedStroke = "#f59e0b";
                                            const normalStroke = "#ffffff";

                                            const handleDotClick = (e) => {
                                              if (e && e.stopPropagation)
                                                e.stopPropagation();
                                              if (isLocked) {
                                                setIsLocked(false);
                                                setSelectedChartPoint(null);
                                              } else {
                                                setSelectedChartPoint({
                                                  x: markerX,
                                                  ...markerValues,
                                                });
                                                setIsLocked(true);
                                              }
                                            };

                                            if (
                                              curveVisibility.StaticPressureNew &&
                                              markerValues.StaticPressureNew !=
                                                null
                                            ) {
                                              dots.push(
                                                <ReferenceDot
                                                  key="op-pressure"
                                                  x={markerX}
                                                  y={
                                                    markerValues.StaticPressureNew
                                                  }
                                                  r={isLocked ? 8 : 6}
                                                  fill="#FF0000"
                                                  stroke={
                                                    isLocked
                                                      ? selectedStroke
                                                      : normalStroke
                                                  }
                                                  strokeWidth={isLocked ? 3 : 2}
                                                  style={dotStyle}
                                                  onClick={handleDotClick}
                                                />,
                                              );
                                            }
                                            if (
                                              curveVisibility.FanInputPowerNew &&
                                              markerValues.FanInputPowerNew !=
                                                null
                                            ) {
                                              dots.push(
                                                <ReferenceDot
                                                  key="op-power"
                                                  x={markerX}
                                                  y={
                                                    markerValues.FanInputPowerNew
                                                  }
                                                  yAxisId="power"
                                                  r={isLocked ? 8 : 6}
                                                  fill="#FF0000"
                                                  stroke={
                                                    isLocked
                                                      ? selectedStroke
                                                      : normalStroke
                                                  }
                                                  strokeWidth={isLocked ? 3 : 2}
                                                  style={dotStyle}
                                                  onClick={handleDotClick}
                                                />,
                                              );
                                            }
                                            if (
                                              curveVisibility.FanStaticEfficiency &&
                                              markerValues.FanStaticEfficiency !=
                                                null
                                            ) {
                                              dots.push(
                                                <ReferenceDot
                                                  key="op-seff"
                                                  x={markerX}
                                                  y={
                                                    markerValues.FanStaticEfficiency
                                                  }
                                                  yAxisId="efficiency"
                                                  r={isLocked ? 8 : 6}
                                                  fill="#FF0000"
                                                  stroke={
                                                    isLocked
                                                      ? selectedStroke
                                                      : normalStroke
                                                  }
                                                  strokeWidth={isLocked ? 3 : 2}
                                                  style={dotStyle}
                                                  onClick={handleDotClick}
                                                />,
                                              );
                                            }
                                            if (
                                              curveVisibility.FanTotalEfficiency &&
                                              markerValues.FanTotalEfficiency !=
                                                null
                                            ) {
                                              dots.push(
                                                <ReferenceDot
                                                  key="op-teff"
                                                  x={markerX}
                                                  y={
                                                    markerValues.FanTotalEfficiency
                                                  }
                                                  yAxisId="efficiency"
                                                  r={isLocked ? 8 : 6}
                                                  fill="#FF0000"
                                                  stroke={
                                                    isLocked
                                                      ? selectedStroke
                                                      : normalStroke
                                                  }
                                                  strokeWidth={isLocked ? 3 : 2}
                                                  style={dotStyle}
                                                  onClick={handleDotClick}
                                                />,
                                              );
                                            }
                                            if (
                                              curveVisibility.SystemCurve &&
                                              markerValues.SystemCurve != null
                                            ) {
                                              dots.push(
                                                <ReferenceDot
                                                  key="op-sys"
                                                  x={markerX}
                                                  y={markerValues.SystemCurve}
                                                  r={isLocked ? 8 : 6}
                                                  fill="#FF0000"
                                                  stroke={
                                                    isLocked
                                                      ? selectedStroke
                                                      : normalStroke
                                                  }
                                                  strokeWidth={isLocked ? 3 : 2}
                                                  style={dotStyle}
                                                  onClick={handleDotClick}
                                                />,
                                              );
                                            }
                                            return dots;
                                          })()}
                                        </LineChart>
                                      );
                                    })()}
                                  </ResponsiveContainer>
                                  {/* Locked data box - shows when a point is selected */}
                                  {isLocked && selectedChartPoint && (
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: "30px",
                                        right: "140px",
                                        backgroundColor: "#ffffff",
                                        border: "2px solid #1e293b",
                                        borderRadius: "8px",
                                        padding: "10px 14px",
                                        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                                        zIndex: 10,
                                        minWidth: "180px",
                                        cursor: "pointer",
                                      }}
                                      onClick={() => {
                                        setIsLocked(false);
                                        setSelectedChartPoint(null);
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontWeight: "700",
                                          fontSize: "13px",
                                          color: "#1e293b",
                                          marginBottom: "6px",
                                          borderBottom: "1px solid #e2e8f0",
                                          paddingBottom: "4px",
                                        }}
                                      >
                                        Q:{" "}
                                        {Number(
                                          selectedChartPoint.x,
                                        ).toLocaleString()}{" "}
                                        {units?.airFlow || "CFM"}
                                      </div>
                                      {selectedChartPoint.StaticPressureNew !=
                                        null && (
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "12px",
                                            marginTop: "3px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "#000000",
                                              fontWeight: "500",
                                            }}
                                          >
                                            Pst:
                                          </span>
                                          <span style={{ fontWeight: "600" }}>
                                            {selectedChartPoint.StaticPressureNew.toFixed(
                                              1,
                                            )}{" "}
                                            {units?.pressure || "Pa"}
                                          </span>
                                        </div>
                                      )}
                                      {selectedChartPoint.FanInputPowerNew !=
                                        null && (
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "12px",
                                            marginTop: "3px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "#002060",
                                              fontWeight: "500",
                                            }}
                                          >
                                            Psh:
                                          </span>
                                          <span style={{ fontWeight: "600" }}>
                                            {selectedChartPoint.FanInputPowerNew.toFixed(
                                              2,
                                            )}{" "}
                                            {units?.power || "kW"}
                                          </span>
                                        </div>
                                      )}
                                      {selectedChartPoint.FanStaticEfficiency !=
                                        null && (
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "12px",
                                            marginTop: "3px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "#385723",
                                              fontWeight: "500",
                                            }}
                                          >
                                            ηst:
                                          </span>
                                          <span style={{ fontWeight: "600" }}>
                                            {selectedChartPoint.FanStaticEfficiency.toFixed(
                                              1,
                                            )}{" "}
                                            %
                                          </span>
                                        </div>
                                      )}
                                      {selectedChartPoint.FanTotalEfficiency !=
                                        null && (
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "12px",
                                            marginTop: "3px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "#385723",
                                              fontWeight: "500",
                                            }}
                                          >
                                            ηtot:
                                          </span>
                                          <span style={{ fontWeight: "600" }}>
                                            {selectedChartPoint.FanTotalEfficiency.toFixed(
                                              1,
                                            )}{" "}
                                            %
                                          </span>
                                        </div>
                                      )}
                                      {selectedChartPoint.SystemCurve !=
                                        null && (
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "12px",
                                            marginTop: "3px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "#FF0000",
                                              fontWeight: "500",
                                            }}
                                          >
                                            System:
                                          </span>
                                          <span style={{ fontWeight: "600" }}>
                                            {selectedChartPoint.SystemCurve.toFixed(
                                              1,
                                            )}{" "}
                                            {units?.pressure || "Pa"}
                                          </span>
                                        </div>
                                      )}
                                      <div
                                        style={{
                                          fontSize: "10px",
                                          color: "#94a3b8",
                                          marginTop: "6px",
                                          textAlign: "center",
                                        }}
                                      >
                                        Click to dismiss
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Operating Point Summary Bar */}
                              {(() => {
                                const predictions = item.predictions || {};
                                return (
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(4, 1fr)",
                                      marginTop: "1.5rem",
                                      backgroundColor: "#f8fafc",
                                      borderRadius: "8px",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        textAlign: "center",
                                        padding: "1rem",
                                        borderRight: "1px solid #cbd5e1",
                                      }}
                                    >
                                      <Text
                                        color="#000000"
                                        fontSize="xl"
                                        fontWeight="bold"
                                      >
                                        {predictions.StaticPressurePred?.toFixed(
                                          2,
                                        ) || "—"}
                                      </Text>
                                      <Text
                                        color="#000000"
                                        fontSize="xs"
                                        textTransform="uppercase"
                                        mt={1}
                                      >
                                        static pressure
                                      </Text>
                                    </div>
                                    <div
                                      style={{
                                        textAlign: "center",
                                        padding: "1rem",
                                        borderRight: "1px solid #cbd5e1",
                                      }}
                                    >
                                      <Text
                                        color="#002060"
                                        fontSize="xl"
                                        fontWeight="bold"
                                      >
                                        {predictions.FanInputPowerPred?.toFixed(
                                          3,
                                        ) || "—"}
                                      </Text>
                                      <Text
                                        color="#002060"
                                        fontSize="xs"
                                        textTransform="uppercase"
                                        mt={1}
                                      >
                                        fan input Power
                                      </Text>
                                    </div>
                                    <div
                                      style={{
                                        textAlign: "center",
                                        padding: "1rem",
                                        borderRight: "1px solid #cbd5e1",
                                      }}
                                    >
                                      <Text
                                        color="#385723"
                                        fontSize="xl"
                                        fontWeight="bold"
                                      >
                                        {predictions.FanStaticEfficiencyPred
                                          ? (
                                              predictions.FanStaticEfficiencyPred *
                                              100
                                            ).toFixed(1)
                                          : "—"}
                                      </Text>
                                      <Text
                                        color="#385723"
                                        fontSize="xs"
                                        textTransform="uppercase"
                                        mt={1}
                                      >
                                        Static efficiency
                                      </Text>
                                    </div>
                                    <div
                                      style={{
                                        textAlign: "center",
                                        padding: "1rem",
                                      }}
                                    >
                                      <Text
                                        color="#385723"
                                        fontSize="xl"
                                        fontWeight="bold"
                                      >
                                        {predictions.FanTotalEfficiencyPred
                                          ? (
                                              predictions.FanTotalEfficiencyPred *
                                              100
                                            ).toFixed(1)
                                          : "—"}
                                      </Text>
                                      <Text
                                        color="#385723"
                                        fontSize="xs"
                                        textTransform="uppercase"
                                        mt={1}
                                      >
                                        Total efficiency
                                      </Text>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Noise Graph Section - Only show when activeTab is 'noise' */}
                        {activeTab === "noise" && (
                          <div style={{ marginBottom: "1.5rem" }}>
                            {(() => {
                              const predictions = item.predictions || {};
                              const fanInputPower =
                                predictions.FanInputPowerPred;
                              const staticPressure =
                                predictions.StaticPressurePred;

                              // Get motor efficiency from matched motor
                              // Try efficiency50Hz first, then effCurve average
                              let motorEfficiency = 0.85;
                              if (motor?.efficiency50Hz != null) {
                                motorEfficiency = motor.efficiency50Hz;
                              } else if (
                                motor &&
                                Array.isArray(motor.effCurve) &&
                                motor.effCurve.length > 0
                              ) {
                                motorEfficiency =
                                  motor.effCurve.reduce((a, b) => a + b, 0) /
                                  motor.effCurve.length;
                              }
                              // If efficiency is already a percentage (>1), convert to decimal
                              if (motorEfficiency > 1) {
                                motorEfficiency = motorEfficiency / 100;
                              }

                              // Get SPF and sound data from user input
                              const spf = input?.SPF || 5;
                              const directivityFactor =
                                input?.directivityFactor || 2;
                              const distanceFromSource =
                                input?.distanceFromSource || 1;

                              const noiseData = calculateSoundPowerSpectrum(
                                fanInputPower,
                                staticPressure,
                                motorEfficiency,
                                spf,
                                directivityFactor,
                                distanceFromSource,
                              );

                              if (!noiseData) {
                                return (
                                  <div
                                    className="detail-card"
                                    style={{
                                      padding: "2rem",
                                      textAlign: "center",
                                      color: "#94a3b8",
                                    }}
                                  >
                                    <p>
                                      Unable to calculate noise data. Missing
                                      fan input power or static pressure values.
                                    </p>
                                  </div>
                                );
                              }

                              // Colors for bars - solid colors
                              const lwBarColors = [
                                "#3b82f6",
                                "#3b82f6",
                                "#3b82f6",
                                "#3b82f6",
                                "#3b82f6",
                                "#3b82f6",
                                "#3b82f6",
                                "#3b82f6",
                              ];
                              const lpBarColors = [
                                "#14b8a6",
                                "#14b8a6",
                                "#14b8a6",
                                "#14b8a6",
                                "#14b8a6",
                                "#14b8a6",
                                "#14b8a6",
                                "#14b8a6",
                              ];

                              return (
                                <>
                                  {/* Summary Cards - Colored backgrounds */}
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(4, 1fr)",
                                      gap: "1rem",
                                      marginBottom: "1.5rem",
                                    }}
                                  >
                                    <div
                                      style={{
                                        background: "#dbeafe",
                                        borderRadius: "12px",
                                        padding: "1.25rem",
                                        textAlign: "center",
                                      }}
                                    >
                                      <div
                                        style={{
                                          color: "#64748b",
                                          fontSize: "0.75rem",
                                          marginBottom: "0.5rem",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        LW(A)
                                      </div>
                                      <div
                                        style={{
                                          color: "#3b82f6",
                                          fontSize: "1.75rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {noiseData.lwA}
                                        <span
                                          style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "normal",
                                          }}
                                        >
                                          {" "}
                                          dB(A)
                                        </span>
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        background: "#fef3c7",
                                        borderRadius: "12px",
                                        padding: "1.25rem",
                                        textAlign: "center",
                                      }}
                                    >
                                      <div
                                        style={{
                                          color: "#64748b",
                                          fontSize: "0.75rem",
                                          marginBottom: "0.5rem",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        LP(A)
                                      </div>
                                      <div
                                        style={{
                                          color: "#f59e0b",
                                          fontSize: "1.75rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {noiseData.lpA}
                                        <span
                                          style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "normal",
                                          }}
                                        >
                                          {" "}
                                          dB(A)
                                        </span>
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        background: "#d1fae5",
                                        borderRadius: "12px",
                                        padding: "1.25rem",
                                        textAlign: "center",
                                      }}
                                    >
                                      <div
                                        style={{
                                          color: "#64748b",
                                          fontSize: "0.75rem",
                                          marginBottom: "0.5rem",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        Directivity (Q)
                                      </div>
                                      <div
                                        style={{
                                          color: "#10b981",
                                          fontSize: "1.75rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {noiseData.Q}
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        background: "#fce7f3",
                                        borderRadius: "12px",
                                        padding: "1.25rem",
                                        textAlign: "center",
                                      }}
                                    >
                                      <div
                                        style={{
                                          color: "#64748b",
                                          fontSize: "0.75rem",
                                          marginBottom: "0.5rem",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        Distance (r)
                                      </div>
                                      <div
                                        style={{
                                          color: "#ec4899",
                                          fontSize: "1.75rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {noiseData.r}
                                        <span
                                          style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "normal",
                                          }}
                                        >
                                          m
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Two Graphs Side by Side */}
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "1fr 1fr",
                                      gap: "1.5rem",
                                      marginBottom: "1.5rem",
                                    }}
                                  >
                                    {/* LW(A) Graph */}
                                    <div
                                      style={{
                                        background: "#f8fafc",
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        padding: "1.25rem",
                                      }}
                                    >
                                      <h4
                                        style={{
                                          color: "#1e293b",
                                          fontSize: "0.9375rem",
                                          fontWeight: "600",
                                          marginBottom: "1rem",
                                        }}
                                      >
                                        Sound Power Spectrum
                                      </h4>
                                      <div
                                        style={{
                                          width: "100%",
                                          height: "280px",
                                        }}
                                      >
                                        <ResponsiveContainer
                                          width="100%"
                                          height="100%"
                                        >
                                          <BarChart
                                            data={noiseData.lwSpectrum}
                                            margin={{
                                              top: 10,
                                              right: 10,
                                              left: 0,
                                              bottom: 30,
                                            }}
                                          >
                                            <CartesianGrid
                                              strokeDasharray="3 3"
                                              stroke="#e2e8f0"
                                            />
                                            <XAxis
                                              dataKey="frequency"
                                              stroke="#94a3b8"
                                              tick={{
                                                fill: "#64748b",
                                                fontSize: 11,
                                              }}
                                              label={{
                                                value: "Frequency (Hz)",
                                                position: "insideBottom",
                                                offset: -10,
                                                fill: "#64748b",
                                                style: { fontSize: "12px" },
                                              }}
                                            />
                                            <YAxis
                                              stroke="#94a3b8"
                                              tick={{
                                                fill: "#64748b",
                                                fontSize: 11,
                                              }}
                                              domain={[0, "auto"]}
                                              label={{
                                                value: "dB",
                                                angle: -90,
                                                position: "insideLeft",
                                                fill: "#64748b",
                                                dx: 10,
                                                style: { fontSize: "12px" },
                                              }}
                                            />
                                            <Bar
                                              dataKey="soundPower"
                                              radius={[4, 4, 0, 0]}
                                              isAnimationActive={false}
                                            >
                                              {noiseData.lwSpectrum.map(
                                                (entry, index) => (
                                                  <Cell
                                                    key={`lw-cell-${index}`}
                                                    fill={
                                                      lwBarColors[
                                                        index %
                                                          lwBarColors.length
                                                      ]
                                                    }
                                                  />
                                                ),
                                              )}
                                            </Bar>
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>

                                    {/* LP(A) Graph */}
                                    <div
                                      style={{
                                        background: "#f8fafc",
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        padding: "1.25rem",
                                      }}
                                    >
                                      <h4
                                        style={{
                                          color: "#1e293b",
                                          fontSize: "0.9375rem",
                                          fontWeight: "600",
                                          marginBottom: "1rem",
                                        }}
                                      >
                                        Sound Pressure Spectrum
                                      </h4>
                                      <div
                                        style={{
                                          width: "100%",
                                          height: "280px",
                                        }}
                                      >
                                        <ResponsiveContainer
                                          width="100%"
                                          height="100%"
                                        >
                                          <BarChart
                                            data={noiseData.lpSpectrum}
                                            margin={{
                                              top: 10,
                                              right: 10,
                                              left: 0,
                                              bottom: 30,
                                            }}
                                          >
                                            <CartesianGrid
                                              strokeDasharray="3 3"
                                              stroke="#e2e8f0"
                                            />
                                            <XAxis
                                              dataKey="frequency"
                                              stroke="#94a3b8"
                                              tick={{
                                                fill: "#64748b",
                                                fontSize: 11,
                                              }}
                                              label={{
                                                value: "Frequency (Hz)",
                                                position: "insideBottom",
                                                offset: -10,
                                                fill: "#64748b",
                                                style: { fontSize: "12px" },
                                              }}
                                            />
                                            <YAxis
                                              stroke="#94a3b8"
                                              tick={{
                                                fill: "#64748b",
                                                fontSize: 11,
                                              }}
                                              domain={[0, "auto"]}
                                              label={{
                                                value: "dB",
                                                angle: -90,
                                                position: "insideLeft",
                                                fill: "#64748b",
                                                dx: 10,
                                                style: { fontSize: "12px" },
                                              }}
                                            />
                                            <Bar
                                              dataKey="soundPressure"
                                              radius={[4, 4, 0, 0]}
                                              isAnimationActive={false}
                                            >
                                              {noiseData.lpSpectrum.map(
                                                (entry, index) => (
                                                  <Cell
                                                    key={`lp-cell-${index}`}
                                                    fill={
                                                      lpBarColors[
                                                        index %
                                                          lpBarColors.length
                                                      ]
                                                    }
                                                  />
                                                ),
                                              )}
                                            </Bar>
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Octave Band Data Table */}
                                  <div>
                                    <h4
                                      style={{
                                        color: "#1e293b",
                                        fontSize: "0.9375rem",
                                        fontWeight: "600",
                                        marginBottom: "1rem",
                                      }}
                                    >
                                      Octave Band Data
                                    </h4>
                                    <div
                                      style={{
                                        overflowX: "auto",
                                        background: "#f8fafc",
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <table
                                        style={{
                                          width: "100%",
                                          borderCollapse: "collapse",
                                          fontSize: "0.875rem",
                                        }}
                                      >
                                        <thead>
                                          <tr
                                            style={{
                                              borderBottom: "1px solid #e2e8f0",
                                            }}
                                          >
                                            <th
                                              style={{
                                                padding: "0.875rem 1rem",
                                                textAlign: "left",
                                                color: "#64748b",
                                                fontWeight: "500",
                                                fontSize: "0.75rem",
                                                textTransform: "uppercase",
                                              }}
                                            >
                                              Frequency
                                            </th>
                                            {noiseData.lwSpectrum.map(
                                              (band, i) => (
                                                <th
                                                  key={i}
                                                  style={{
                                                    padding: "0.875rem 1rem",
                                                    textAlign: "center",
                                                    color: "#64748b",
                                                    fontWeight: "500",
                                                    fontSize: "0.75rem",
                                                  }}
                                                >
                                                  {band.frequency}
                                                </th>
                                              ),
                                            )}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr
                                            style={{
                                              borderBottom: "1px solid #e2e8f0",
                                            }}
                                          >
                                            <td
                                              style={{
                                                padding: "0.875rem 1rem",
                                                textAlign: "left",
                                                color: "#64748b",
                                                fontWeight: "500",
                                              }}
                                            >
                                              LW (dB)
                                            </td>
                                            {noiseData.lwSpectrum.map(
                                              (band, i) => (
                                                <td
                                                  key={i}
                                                  style={{
                                                    padding: "0.875rem 1rem",
                                                    textAlign: "center",
                                                    color: "#3b82f6",
                                                    fontWeight: "600",
                                                  }}
                                                >
                                                  {band.soundPower}
                                                </td>
                                              ),
                                            )}
                                          </tr>
                                          <tr>
                                            <td
                                              style={{
                                                padding: "0.875rem 1rem",
                                                textAlign: "left",
                                                color: "#64748b",
                                                fontWeight: "500",
                                              }}
                                            >
                                              LP (dB)
                                            </td>
                                            {noiseData.lpSpectrum.map(
                                              (band, i) => (
                                                <td
                                                  key={i}
                                                  style={{
                                                    padding: "0.875rem 1rem",
                                                    textAlign: "center",
                                                    color: "#14b8a6",
                                                    fontWeight: "600",
                                                  }}
                                                >
                                                  {band.soundPressure}
                                                </td>
                                              ),
                                            )}
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                        {/* Pricing Section - Only show when activeTab is 'pricing' */}
                        {activeTab === "pricing" && (
                          <div style={{ marginBottom: "1.5rem" }}>
                            {(() => {
                              // Check if motor is selected
                              if (!motor) {
                                return (
                                  <div
                                    className="detail-card"
                                    style={{
                                      padding: "2rem",
                                      textAlign: "center",
                                      color: "#64748b",
                                    }}
                                  >
                                    <p>
                                      No motor selected. Please select a fan to
                                      view pricing information.
                                    </p>
                                  </div>
                                );
                              }

                              // Determine which column to use for Electrical Motor Cost based on fan type
                              // WF or ARTF → Other Price with VAT & Factor (L.E)
                              // Any other fan type → B3 Price with VAT & Factor (L.E)
                              const fanType = units?.fanType || "";
                              const isWFOrARTF =
                                fanType === "WF" || fanType === "ARTF";

                              // Get pricing values from the matched motor
                              // These values are fetched exactly as stored in the database
                              let electricalMotorCost = isWFOrARTF
                                ? motor.otherPriceWithVat
                                : motor.b3PriceWithVat;

                              if (!electricalMotorCost) {
                                electricalMotorCost =
                                  (isWFOrARTF
                                    ? motor.otherPriceWithoutVat
                                    : motor.b3PriceWithoutVat) * 1.14;
                              }
                              const electricalComponentCost =
                                motor.totalPriceWithVat;

                              // Format currency value
                              const formatPricingValue = (value) => {
                                if (value === null || value === undefined)
                                  return "—";
                                const num =
                                  typeof value === "number"
                                    ? value
                                    : parseFloat(value);
                                if (isNaN(num)) return "—";
                                return num.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                });
                              };
                              const impellerCost = impellerPricing;
                              const casingCost = casingPricing;
                              const accessoriesCost =
                                accessoryPricing?.priceWithVatLe;

                              const toNumberOrNull = (value) => {
                                if (value === null || value === undefined)
                                  return null;
                                const n =
                                  typeof value === "number"
                                    ? value
                                    : parseFloat(value);
                                return Number.isFinite(n) ? n : null;
                              };

                              const directCostValues = [
                                electricalMotorCost,
                                electricalComponentCost,
                                impellerCost,
                                casingCost,
                                accessoriesCost,
                              ]
                                .map(toNumberOrNull)
                                .filter((v) => v != null);

                              const totalDirectCost =
                                directCostValues.length > 0
                                  ? directCostValues.reduce(
                                      (sum, val) => sum + val,
                                      0,
                                    )
                                  : null;

                              const isAnyPricingLoading =
                                impellerPricingLoading ||
                                casingPricingLoading ||
                                accessoryPricingLoading;

                              return (
                                <div className="detail-card">
                                  <h4>Pricing Information</h4>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "1.5rem",
                                      marginTop: "1rem",
                                    }}
                                  >
                                    {/* Total Direct Cost */}
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "1rem 1.5rem",
                                        background:
                                          "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #34d399",
                                      }}
                                    >
                                      <div>
                                        <span
                                          style={{
                                            color: "#065f46",
                                            fontSize: "0.875rem",
                                            fontWeight: "600",
                                          }}
                                        >
                                          Total Direct Cost
                                        </span>
                                        <div
                                          style={{
                                            color: "#047857",
                                            fontSize: "0.75rem",
                                            marginTop: "0.25rem",
                                          }}
                                        >
                                          Motor + Electrical Component +
                                          Impeller + Casing + Accessories
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          color: "#047857",
                                          fontSize: "1.35rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {isAnyPricingLoading
                                          ? "Loading..."
                                          : formatPricingValue(
                                              totalDirectCost,
                                            )}{" "}
                                        <span
                                          style={{
                                            fontSize: "0.875rem",
                                            color: "#065f46",
                                            fontWeight: "normal",
                                          }}
                                        >
                                          L.E
                                        </span>
                                      </span>
                                    </div>

                                    {/* Electrical Motor Cost */}
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "1rem 1.5rem",
                                        background: "#f8fafc",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <div>
                                        <span
                                          style={{
                                            color: "#475569",
                                            fontSize: "0.875rem",
                                          }}
                                        >
                                          Electrical Motor Cost
                                        </span>
                                        <div
                                          style={{
                                            color: "#64748b",
                                            fontSize: "0.75rem",
                                            marginTop: "0.25rem",
                                          }}
                                        >
                                          {isWFOrARTF
                                            ? "Other Price with VAT & Factor"
                                            : "B3 Price with VAT & Factor"}
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          color: "#059669",
                                          fontSize: "1.25rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {formatPricingValue(
                                          electricalMotorCost,
                                        )}{" "}
                                        <span
                                          style={{
                                            fontSize: "0.875rem",
                                            color: "#64748b",
                                            fontWeight: "normal",
                                          }}
                                        >
                                          L.E
                                        </span>
                                      </span>
                                    </div>

                                    {/* Electrical Component Cost */}
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "1rem 1.5rem",
                                        background: "#f8fafc",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <div>
                                        <span
                                          style={{
                                            color: "#475569",
                                            fontSize: "0.875rem",
                                          }}
                                        >
                                          Electrical Component Cost
                                        </span>
                                        <div
                                          style={{
                                            color: "#64748b",
                                            fontSize: "0.75rem",
                                            marginTop: "0.25rem",
                                          }}
                                        >
                                          Price With VAT Per Meter (Total)
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          color: "#2563eb",
                                          fontSize: "1.25rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {formatPricingValue(
                                          electricalComponentCost,
                                        )}{" "}
                                        <span
                                          style={{
                                            fontSize: "0.875rem",
                                            color: "#64748b",
                                            fontWeight: "normal",
                                          }}
                                        >
                                          L.E
                                        </span>
                                      </span>
                                    </div>

                                    {/* Axial Impeller Cost */}
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "1rem 1.5rem",
                                        background: "#f8fafc",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <div>
                                        <span
                                          style={{
                                            color: "#475569",
                                            fontSize: "0.875rem",
                                          }}
                                        >
                                          Axial Impeller Cost
                                        </span>
                                        <div
                                          style={{
                                            color: "#64748b",
                                            fontSize: "0.75rem",
                                            marginTop: "0.25rem",
                                          }}
                                        >
                                          {item.Blades?.symbol &&
                                          item.Blades?.material
                                            ? `Blade: ${item.Blades.symbol} (${
                                                item.Blades.material
                                              }), Hub: ${
                                                item.hubType || "—"
                                              }, Frame: ${
                                                item.matchedMotor?.frameSize ||
                                                "—"
                                              } mm`
                                            : "Impeller components"}
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          color: "#7c3aed",
                                          fontSize: "1.25rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {impellerPricingLoading
                                          ? "Loading..."
                                          : formatPricingValue(
                                              impellerCost,
                                            )}{" "}
                                        <span
                                          style={{
                                            fontSize: "0.875rem",
                                            color: "#64748b",
                                            fontWeight: "normal",
                                          }}
                                        >
                                          L.E
                                        </span>
                                      </span>
                                    </div>

                                    {/* Axial Casing Cost */}
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "1rem 1.5rem",
                                        background: "#f8fafc",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <div>
                                        <span
                                          style={{
                                            color: "#475569",
                                            fontSize: "0.875rem",
                                          }}
                                        >
                                          Axial Casing Cost
                                        </span>
                                        <div
                                          style={{
                                            color: "#64748b",
                                            fontSize: "0.75rem",
                                            marginTop: "0.25rem",
                                          }}
                                        >
                                          {`Model: ${fanType || "—"}, Size: ${
                                            item.Impeller?.innerDia || "—"
                                          } mm`}
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          color: "#0891b2",
                                          fontSize: "1.25rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {casingPricingLoading
                                          ? "Loading..."
                                          : formatPricingValue(casingCost)}{" "}
                                        <span
                                          style={{
                                            fontSize: "0.875rem",
                                            color: "#64748b",
                                            fontWeight: "normal",
                                          }}
                                        >
                                          L.E
                                        </span>
                                      </span>
                                    </div>

                                    {/* Other Accessories Cost */}
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "1rem 1.5rem",
                                        background: "#f8fafc",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <div>
                                        <span
                                          style={{
                                            color: "#475569",
                                            fontSize: "0.875rem",
                                          }}
                                        >
                                          Other Accessories Cost
                                        </span>
                                        <div
                                          style={{
                                            color: "#64748b",
                                            fontSize: "0.75rem",
                                            marginTop: "0.25rem",
                                          }}
                                        >
                                          Price with VAT (Fan: {fanType}, Size:{" "}
                                          {item.Impeller?.innerDia || "—"} mm)
                                        </div>
                                      </div>
                                      <span
                                        style={{
                                          color: "#d97706",
                                          fontSize: "1.25rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {accessoryPricingLoading
                                          ? "Loading..."
                                          : formatPricingValue(
                                              accessoriesCost,
                                            )}{" "}
                                        <span
                                          style={{
                                            fontSize: "0.875rem",
                                            color: "#64748b",
                                            fontWeight: "normal",
                                          }}
                                        >
                                          L.E
                                        </span>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Info note */}
                                  <div
                                    style={{
                                      marginTop: "1.5rem",
                                      padding: "0.75rem 1rem",
                                      background: "#f1f5f9",
                                      borderRadius: "0.375rem",
                                      borderLeft: "3px solid #3b82f6",
                                    }}
                                  >
                                    <p
                                      style={{
                                        color: "#475569",
                                        fontSize: "0.8rem",
                                        margin: 0,
                                      }}
                                    >
                                      <strong style={{ color: "#1e293b" }}>
                                        Note:
                                      </strong>{" "}
                                      Pricing values are fetched from the
                                      selected motor ({motor.model || "N/A"}).
                                      {isWFOrARTF
                                        ? " Using 'Other Price' for WF/ARTF fan type."
                                        : " Using 'B3 Price' for standard fan type."}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

            {/* Save to Project Button */}

            {/* Back to Search */}
            <div
              style={{
                textAlign: "center",
                marginTop: "2rem",
                marginBottom: "2rem",
              }}
            >
              <button
                onClick={() => navigate("/axial/fan-selection")}
                style={{
                  background: "#1e293b",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#334155";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1e293b";
                }}
              >
                <span>←</span> Back to Search
              </button>
            </div>
          </div>
        </Box>

        {/* Footer */}
        <Box
          py={6}
          px={{ base: 4, md: 8, lg: 12 }}
          borderTop="1px solid"
          borderColor="rgba(148, 163, 184, 0.1)"
        >
          <Text color="#64748B" fontSize="sm" textAlign="center">
            &copy; {currentYear} Mechatronics Fan Selection. All rights
            reserved.
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}
