import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { useFormData } from "../../context/FormContext";
import {
  Box,
  Text,
  Flex,
  Heading,
  Button,
  Spinner,
  Badge,
  Grid,
} from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import {
  canRequestDatasheet,
  getDatasheetLimitMessage,
  registerDatasheetView,
} from "../../middleware/datasheetRequestLimiter";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";
import "./CentrifugalFanResultPage.css";

// Linear Interpolation (matches backend FanCalculationService.cs)
class LinearInterpolator {
  constructor(xValues, yValues) {
    this.xValues = xValues;
    this.yValues = yValues;
  }

  linearInterpolate(x1, y1, x2, y2, x) {
    const ZeroThreshold = 1e-10;
    if (Math.abs(x2 - x1) < ZeroThreshold) {
      return y1;
    }
    const t = (x - x1) / (x2 - x1);
    return y1 + (y2 - y1) * t;
  }

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
    result.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) });
  }

  return result;
}

// Cubic spline interpolation for smooth curves
function cubicSplineInterpolation(xArray, yArray, numSamples = 300) {
  if (!xArray || !yArray || xArray.length < 2 || yArray.length < 2) return [];
  const n = xArray.length;
  if (n === 2) return linearInterpolation(xArray, yArray, numSamples);

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

  const xMin = xArray[0];
  const xMax = xArray[n - 1];
  const step = (xMax - xMin) / (numSamples - 1);
  const result = [];

  for (let i = 0; i < numSamples; i++) {
    const x = xMin + i * step;
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
  // Use ceil to find minimum intervals that cover the data (tight fit)
  const count = Math.ceil(margin / step);
  const axisMax = step * count;
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
  const minRange = Math.abs(dataMax) * 0.1 || 1;
  if (range < minRange) {
    const center = (dataMax + dataMin) / 2;
    dataMin = center - minRange / 2;
    dataMax = center + minRange / 2;
    range = dataMax - dataMin;
  }

  const padding = range * 0.1;
  const paddedMin = dataMin - padding;
  const paddedMax = dataMax + padding;

  if (paddedMin <= 0 || paddedMin < dataMax * 0.15) {
    const result = generateNiceTicks(paddedMax, numIntervals);
    return { ...result, min: 0 };
  }

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
      return Number(p1[dataKey]) + (Number(p2[dataKey]) - Number(p1[dataKey])) * t;
    }
  }

  return null;
}

// Calculate input density from temperature (kg/m³)
function calculateDensity(tempC) {
  if (tempC === null || tempC === undefined) return null;
  const temp = parseFloat(tempC);
  if (isNaN(temp)) return null;
  return 1.293 * (273.15 / (273.15 + temp));
}

// Custom Tooltip Component that always shows all curve values
const CustomTooltip = ({ active, payload, label, units, chartData }) => {
  if (!active) return null;

  const hoveredXRaw = label ?? payload?.[0]?.payload?.x;
  const hoveredX = Number(hoveredXRaw);
  if (!Number.isFinite(hoveredX)) return null;

  const dataPoint = {
    x: hoveredX,
    staticPressureNew: interpolateSeriesAtX(chartData, "staticPressureNew", hoveredX),
    fanInputPowerNew: interpolateSeriesAtX(chartData, "fanInputPowerNew", hoveredX),
    staticEfficiencyNew: interpolateSeriesAtX(chartData, "staticEfficiencyNew", hoveredX),
    totalEfficiencyNew: interpolateSeriesAtX(chartData, "totalEfficiencyNew", hoveredX),
    systemCurve: interpolateSeriesAtX(chartData, "systemCurve", hoveredX),
  };

  const labels = {
    staticPressureNew: "Pst",
    fanInputPowerNew: "Psh",
    staticEfficiencyNew: "ηst",
    totalEfficiencyNew: "ηtot",
    systemCurve: "System",
  };

  const unitMap = {
    staticPressureNew: units?.pressure || "Pa",
    fanInputPowerNew: units?.power || "kW",
    staticEfficiencyNew: "%",
    totalEfficiencyNew: "%",
    systemCurve: units?.pressure || "Pa",
  };

  const curves = [
    { key: "staticPressureNew", color: "#000000" },
    { key: "fanInputPowerNew", color: "#002060" },
    { key: "staticEfficiencyNew", color: "#385723" },
    { key: "totalEfficiencyNew", color: "#385723" },
    { key: "systemCurve", color: "#FF0000" },
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
        Q: {Number(dataPoint.x).toLocaleString()} {units?.airFlow || "m³/h"}
      </div>
      {curves.map((curve) => {
        const value = dataPoint[curve.key];
        if (value == null || value === undefined) return null;

        let decimals = 2;
        if (
          curve.key === "staticPressureNew" ||
          curve.key === "staticEfficiencyNew" ||
          curve.key === "totalEfficiencyNew" ||
          curve.key === "systemCurve"
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

export default function CentrifugalFanFinalResultPage() {
  const navigate = useNavigate();
  const { results: contextResults, units, input } = useFormData();
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [phase18Data, setPhase18Data] = useState(null);
  const [activeTab, setActiveTab] = useState("performance"); // 'performance', 'curve', 'noise', 'pricing'
  const [casingPriceResult, setCasingPriceResult] = useState(null);
  const [casingPriceLoading, setCasingPriceLoading] = useState(false);

  // Curve visibility state - all curves visible by default (must be before any returns)
  const [curveVisibility, setCurveVisibility] = useState({
    staticPressureNew: true,
    fanInputPowerNew: true,
    staticEfficiencyNew: true,
    totalEfficiencyNew: true,
    systemCurve: true,
  });

  // Selected chart point state for interactive click-to-lock tooltip
  const [selectedChartPoint, setSelectedChartPoint] = useState(null);
  // Lock state: when true, tooltip is locked on selectedChartPoint; click same point to unlock
  const [isLocked, setIsLocked] = useState(false);

  const currentYear = new Date().getFullYear();
  const autoSelectedRef = useRef(false);

  // Extract values from contextResults before hooks/early returns (React hooks rules)
  const phase18All = contextResults?.phase18All;
  const selectedCentrifugalFan = contextResults?.selectedCentrifugalFan;
  const secondInputData = contextResults?.secondInputData;

  // Handle row selection - show Phase 17 & 18 details
  // Defined before useEffect so the closure is valid in all renders
  const handleRowSelect = async (item, index) => {
    // Toggle selection
    if (selectedRowIndex === index) {
      setSelectedRowIndex(null);
      setPhase18Data(null);
      return;
    }

    setSelectedRowIndex(index);

    // Start with existing data
    let phase20Data = item.phase20;

    // If Phase 20 data doesn't exist, fetch it on-demand using user-provided sound parameters
    if (!phase20Data && item.phase18) {
      try {
        const apiBaseUrl = API_BASE;
        const phase20Resp = await fetch(
          `${apiBaseUrl}/api/centrifugal/fan-data/phase20`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phase18Result: item.phase18,
              distance: secondInputData?.distance || 3,
              directivityQ: secondInputData?.directivityQ || 1,
              safetyFactor: secondInputData?.spf
                ? secondInputData.spf / 100
                : 0.1,
            }),
          },
        );
        if (phase20Resp.ok) {
          const phase20Result = await phase20Resp.json();
          phase20Data = phase20Result.phase20;
        }
      } catch (err) {
        console.error("Failed to fetch Phase 20 data:", err);
      }
    }

    setPhase18Data({
      phase17Motor: item.phase17Motor,
      phase18: item.phase18,
      phase19: item.phase19,
      phase20: phase20Data,
    });
  };

  const fetchCasingPrice = async (innerDiameter) => {
    if (innerDiameter == null) {
      setCasingPriceResult(null);
      setCasingPriceLoading(false);
      return;
    }
    setCasingPriceLoading(true);
    setCasingPriceResult(null);
    try {
      const apiBaseUrl = API_BASE;
      const type = "SISW Centrifugal Fan - Belt";
      const r = await fetch(`${apiBaseUrl}/api/centrifugal/data/casing-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, size: innerDiameter }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Calculate price failed");
      }
      const data = await r.json();
      setCasingPriceResult(data);
    } catch (err) {
      console.error("Calculate price error:", err);
      setCasingPriceResult({ error: err.message });
    } finally {
      setCasingPriceLoading(false);
    }
  };

  // Auto-select first fan on page load (must be before any early returns per React hooks rules)
  useEffect(() => {
    if (!autoSelectedRef.current && phase18All && phase18All.length > 0) {
      autoSelectedRef.current = true;
      handleRowSelect(phase18All[0], 0);
    }
  }, [phase18All]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fetch casing price when selected fan changes
  useEffect(() => {
    const innerDiameter = phase18Data?.phase18?.innerDiameter;
    fetchCasingPrice(innerDiameter);
  }, [phase18Data?.phase18?.innerDiameter]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!contextResults || !phase18All) {
    return (
      <Flex minH="100vh" bg="#f8fafc" flexDirection="column">
        <HamburgerMenu />
        <Box
          flex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box textAlign="center" color="white">
            <Spinner size="xl" color="#3b82f6" mb={4} />
            <Text>Loading final results...</Text>
            <Button
              mt={4}
              bg="#3b82f6"
              color="white"
              onClick={() => navigate("/centrifugal/fan-selection")}
              _hover={{ bg: "#2563eb" }}
            >
              Go to Selection Page
            </Button>
          </Box>
        </Box>
      </Flex>
    );
  }

  // Debug logging
  console.log("Phase 18 All Models:", phase18All);

  // Handle View Datasheet button click - generate PDF
  const handleViewDatasheet = () => {
    if (!phase18Data) {
      console.error("No phase18Data available for PDF generation");
      return;
    }

    if (!canRequestDatasheet()) {
      // alert(getDatasheetLimitMessage());
      return;
    }

    try {
      const apiBaseUrl = API_BASE;

      // Prepare fan data for PDF generation
      const fanData = {
        phase18: phase18Data.phase18,
        phase17Motor: phase18Data.phase17Motor,
        phase19: phase18Data.phase19,
        phase20: phase18Data.phase20,
        selectedFan: selectedCentrifugalFan,
      };

      const userInput = {
        TempC: input?.TempC ?? 20,
        RPM: input?.RPM ?? 1440,
        airFlow: input?.airFlow,
        staticPressure: input?.staticPressure,
        SPF: secondInputData?.spf ?? 10,
        frictionLosses: secondInputData?.frictionLosses ?? 15,
        fanUnitNo: input?.fanUnitNo ?? "EX-01",
        NoPhases: input?.NoPhases ?? 3,
        directivityFactor: input?.directivityFactor ?? 1,
        distanceFromSource: input?.distanceFromSource ?? 3,
      };

      const payload = {
        fanData,
        userInput,
        units: {
          ...units,
          fanUnitNo: input?.fanUnitNo ?? units?.fanUnitNo ?? "EX-01",
        },
      };

      const targetName = `centrifugalDatasheet_${Date.now()}`;
      const previewWindow = window.open("", targetName);
      if (!previewWindow) {
        throw new Error("Please allow popups to preview the datasheet.");
      }

      const form = document.createElement("form");
      const fileBase =
        String(input?.fanUnitNo ?? units?.fanUnitNo ?? "Datasheet").trim() ||
        "Datasheet";
      const filePathPart = `${encodeURIComponent(fileBase)}.pdf`;
      form.method = "POST";
      form.action = `${apiBaseUrl}/api/centrifugal/pdf/datasheet/${filePathPart}`;
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
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate datasheet PDF: " + error.message);
    }
  };

  // Toggle curve visibility
  const toggleCurveVisibility = (dataKey) => {
    setCurveVisibility((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  };

  // Graph types for the fan curves
  const graphTypes = [
    {
      name: "Static Pressure",
      dataKey: "staticPressureNew",
      unit: units?.pressure || "Pa",
      color: "#3b82f6",
    },
    {
      name: "Fan Input Power",
      dataKey: "fanInputPowerNew",
      unit: units?.power || "kW",
      color: "#10b981",
    },
    {
      name: "Static Efficiency",
      dataKey: "staticEfficiencyNew",
      unit: "%",
      multiplier: 100,
      color: "#8b5cf6",
    },
    {
      name: "Total Efficiency",
      dataKey: "totalEfficiencyNew",
      unit: "%",
      multiplier: 100,
      color: "#ec4899",
    },
  ];

  // Linear interpolation helper for smooth curves
  const linearInterpolation = (xArray, yArray, numSamples = 100) => {
    if (!xArray || !yArray || xArray.length < 2 || yArray.length < 2) return [];

    const validPairs = [];
    for (let i = 0; i < xArray.length; i++) {
      if (
        xArray[i] != null &&
        yArray[i] != null &&
        !isNaN(xArray[i]) &&
        !isNaN(yArray[i])
      ) {
        validPairs.push({ x: Number(xArray[i]), y: Number(yArray[i]) });
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
            y = y0 + ((y1 - y0) * (targetX - x0)) / (x1 - x0);
          }
          break;
        }
      }

      if (y === null && targetX <= validPairs[0].x) {
        y = validPairs[0].y;
      } else if (y === null) {
        y = validPairs[validPairs.length - 1].y;
      }

      result.push({
        x: parseFloat(targetX.toFixed(2)),
        y: parseFloat(y.toFixed(4)),
      });
    }

    return result;
  };

  return (
    <Flex minH="100vh" bg="#f8fafc" flexDirection="column" marginTop={"2rem"}>
      <HamburgerMenu />
      <Box
        flex={1}
        transition="margin-left 0.3s ease"
        display="flex"
        flexDirection="column"
      >
        {/* Content Area */}
        <Box flex={1} py={6} px={6}>
          <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h1
                style={{
                  fontSize: "1.25rem",
                  color: "#1e293b",
                  marginBottom: "0.25rem",
                  fontWeight: "600",
                }}
              >
                All fan models for{" "}
                <span style={{ color: "#3b82f6" }}>
                  {selectedCentrifugalFan?.fanModel || "Selected Fan"}
                </span>{" "}
                <span
                  style={{
                    color: "#94a3b8",
                    fontWeight: "400",
                    fontSize: "0.875rem",
                  }}
                >
                  | Click a row to view all details
                </span>
              </h1>
            </div>

            {phase18All.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "4rem",
                  background: "white",
                  padding: "3rem",
                  borderRadius: "12px",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.25rem",
                    marginBottom: "1rem",
                    color: "#1e293b",
                  }}
                >
                  No valid configurations found for the selected parameters.
                </h2>
                <Text color="#64748b" mb={4}>
                  Try adjusting the belt type, motor poles, or max RPM change.
                </Text>
                <Button
                  bg="#3b82f6"
                  color="white"
                  onClick={() => navigate("/centrifugal/second-input")}
                  _hover={{ bg: "#2563eb" }}
                  borderRadius="8px"
                >
                  Back to Configuration
                </Button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: "#1e293b",
                    }}
                  >
                    Matched Fans:{" "}
                    <span style={{ color: "#3b82f6" }}>
                      {phase18All.length}
                    </span>
                  </span>
                </div>
                <div
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    overflowY: "auto",
                    maxHeight: "250px",
                    marginBottom: "1.5rem",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "#ffffff",
                        zIndex: 10,
                      }}
                    >
                      <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <th
                          style={{
                            padding: "1rem 1.25rem",
                            textAlign: "left",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            minWidth: "280px",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          Fan Model
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.25rem",
                            textAlign: "center",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          Airflow ({units?.airFlow || "CFM"})
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.25rem",
                            textAlign: "center",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          Static Pressure ({units?.pressure || "Pa"})
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.25rem",
                            textAlign: "center",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          Fan Input Power ({units?.power || "kW"})
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.25rem",
                            textAlign: "center",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          Static Efficiency (%)
                        </th>
                        <th
                          style={{
                            padding: "1rem 1.25rem",
                            textAlign: "center",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          Total Efficiency (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {phase18All.map((item, index) => (
                        <tr
                          key={index}
                          onClick={() => handleRowSelect(item, index)}
                          style={{
                            cursor: "pointer",
                            borderBottom:
                              index < phase18All.length - 1
                                ? "1px solid #f1f5f9"
                                : "none",
                            borderLeft:
                              selectedRowIndex === index
                                ? "3px solid #3b82f6"
                                : "3px solid transparent",
                            background:
                              selectedRowIndex === index ? "#f8fafc" : "white",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedRowIndex !== index)
                              e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            if (selectedRowIndex !== index)
                              e.currentTarget.style.background = "white";
                          }}
                        >
                          <td
                            style={{
                              padding: "1rem 1.25rem",
                              textAlign: "left",
                              minWidth: "280px",
                            }}
                          >
                            <span
                              style={{
                                color: "#3b82f6",
                                fontWeight: "600",
                                fontSize: "0.9375rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.phase18?.fanModelFormatted ||
                                `Model ${index + 1}`}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.25rem",
                              textAlign: "center",
                              color: "#475569",
                              fontSize: "0.9375rem",
                            }}
                          >
                            {formatNumber(item.phase18?.airFlow)}
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.25rem",
                              textAlign: "center",
                              color: "#475569",
                              fontSize: "0.9375rem",
                            }}
                          >
                            {formatNumber(item.phase18?.staticPressure)}
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.25rem",
                              textAlign: "center",
                              color: "#475569",
                              fontSize: "0.9375rem",
                            }}
                          >
                            {formatNumber(item.phase18?.fanInputPower)}
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.25rem",
                              textAlign: "center",
                              color: "#475569",
                              fontSize: "0.9375rem",
                            }}
                          >
                            {item.phase18?.staticEfficiency
                              ? `${(item.phase18.staticEfficiency * 100).toFixed(1)}`
                              : "—"}
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.25rem",
                              textAlign: "center",
                              color: "#475569",
                              fontSize: "0.9375rem",
                            }}
                          >
                            {item.phase18?.totalEfficiency
                              ? `${(item.phase18.totalEfficiency * 100).toFixed(1)}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tabbed Section - Shows when a row is selected */}
                {selectedRowIndex !== null && phase18Data && (
                  <Box
                    bg="white"
                    borderRadius="12px"
                    p={6}
                    border="1px solid #e2e8f0"
                  >
                    {/* Header with Fan Model and View Datasheet Button */}
                    <Flex justify="space-between" align="flex-start" mb={4}>
                      <Box>
                        <Text
                          fontSize="xl"
                          color="#1e293b"
                          fontWeight="bold"
                          mb={1}
                        >
                          Details for{" "}
                          {phase18Data.phase18?.fanModelFormatted ||
                            "Selected Fan"}
                        </Text>
                        <Text fontSize="sm" color="#64748b">
                          Review detailed specifications and performance metrics
                          below.
                        </Text>
                      </Box>
                      <Button
                        bg="#22c55e"
                        color="white"
                        size="md"
                        px={5}
                        borderRadius="lg"
                        _hover={{ bg: "#16a34a" }}
                        leftIcon={<span>📄</span>}
                        fontWeight="semibold"
                        onClick={handleViewDatasheet}
                      >
                        View Datasheet
                      </Button>
                    </Flex>

                    {/* Tab Navigation */}
                    <div
                      style={{
                        display: "flex",
                        borderBottom: "1px solid #e2e8f0",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <button
                        onClick={() => setActiveTab("performance")}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "0.75rem 1.25rem",
                          color:
                            activeTab === "performance" ? "#3b82f6" : "#64748b",
                          fontSize: "0.875rem",
                          fontWeight:
                            activeTab === "performance" ? "600" : "500",
                          cursor: "pointer",
                          borderBottom:
                            activeTab === "performance"
                              ? "2px solid #3b82f6"
                              : "2px solid transparent",
                          transition: "all 0.2s",
                          marginBottom: "-1px",
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== "performance")
                            e.target.style.color = "#1e293b";
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== "performance")
                            e.target.style.color = "#64748b";
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
                          color: activeTab === "curve" ? "#3b82f6" : "#64748b",
                          fontSize: "0.875rem",
                          fontWeight: activeTab === "curve" ? "600" : "500",
                          cursor: "pointer",
                          borderBottom:
                            activeTab === "curve"
                              ? "2px solid #3b82f6"
                              : "2px solid transparent",
                          transition: "all 0.2s",
                          marginBottom: "-1px",
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== "curve")
                            e.target.style.color = "#1e293b";
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== "curve")
                            e.target.style.color = "#64748b";
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
                          color: activeTab === "noise" ? "#3b82f6" : "#64748b",
                          fontSize: "0.875rem",
                          fontWeight: activeTab === "noise" ? "600" : "500",
                          cursor: "pointer",
                          borderBottom:
                            activeTab === "noise"
                              ? "2px solid #3b82f6"
                              : "2px solid transparent",
                          transition: "all 0.2s",
                          marginBottom: "-1px",
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== "noise")
                            e.target.style.color = "#1e293b";
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== "noise")
                            e.target.style.color = "#64748b";
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
                          color:
                            activeTab === "pricing" ? "#3b82f6" : "#64748b",
                          fontSize: "0.875rem",
                          fontWeight: activeTab === "pricing" ? "600" : "500",
                          cursor: "pointer",
                          borderBottom:
                            activeTab === "pricing"
                              ? "2px solid #3b82f6"
                              : "2px solid transparent",
                          transition: "all 0.2s",
                          marginBottom: "-1px",
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== "pricing")
                            e.target.style.color = "#1e293b";
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== "pricing")
                            e.target.style.color = "#64748b";
                        }}
                      >
                        Pricing
                      </button>
                    </div>

                    {/* Tab Content */}
                    {/* Performance Data Tab */}
                    {activeTab === "performance" && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1.5rem",
                        }}
                      >
                        {/* Fan Specification Card */}
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
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
                              {`${calculateDensity(input?.TempC ?? 20).toFixed(3)} kg/m³`}
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
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
                              {phase18Data.phase18?.fanSpeedN2
                                ? `${phase18Data.phase18.fanSpeedN2} RPM`
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
                            >
                              Fan Pulley
                            </span>
                            <span
                              style={{
                                color: "#1e293b",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {phase18Data.phase18?.fanPulleyDiaD2
                                ? `${phase18Data.phase18.fanPulleyDiaD2} mm`
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
                            >
                              Belt Type
                            </span>
                            <span
                              style={{
                                color: "#1e293b",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {phase18Data.phase18?.beltType
                                ? `Type - ${phase18Data.phase18.beltType}`
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
                            >
                              Belt Length
                            </span>
                            <span
                              style={{
                                color: "#1e293b",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {phase18Data.phase18?.beltLengthStandard
                                ? `${phase18Data.phase18.beltLengthStandard} mm`
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
                            >
                              Number of Grooves
                            </span>
                            <span
                              style={{
                                color: "#1e293b",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {phase18Data.phase18?.noOfGrooves || "—"}
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
                            >
                              Center Distance
                            </span>
                            <span
                              style={{
                                color: "#1e293b",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {phase18Data.phase18?.centerDistance
                                ? `${phase18Data.phase18.centerDistance} mm`
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
                            >
                              Inner Diameter
                            </span>
                            <span
                              style={{
                                color: "#1e293b",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {phase18Data.phase18?.innerDiameter
                                ? `${phase18Data.phase18.innerDiameter} mm`
                                : "—"}
                            </span>
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
                            <span style={{ color: "#3b82f6" }}>⚡</span> Motor
                            Details
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
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
                              {phase18Data.phase17Motor?.model || "—"}
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
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
                              {phase18Data.phase17Motor?.powerKW || "—"}
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
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
                              {phase18Data.phase17Motor?.noOfPoles || "—"}
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
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
                              {phase18Data.phase17Motor?.noOfPhases
                                ? `380V / ${phase18Data.phase17Motor.noOfPhases}Ph / 50Hz`
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
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
                              {phase18Data.phase17Motor?.efficiency50Hz
                                ? `${(phase18Data.phase17Motor.efficiency50Hz * 100).toFixed(1)}%`
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
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
                              {phase18Data.phase17Motor?.insulationClass || "—"}
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
                            >
                              Motor Speed
                            </span>
                            <span
                              style={{
                                color: "#1e293b",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {phase18Data.phase18?.motorSpeedN1
                                ? `${phase18Data.phase18.motorSpeedN1} RPM`
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
                            >
                              Motor Pulley
                            </span>
                            <span
                              style={{
                                color: "#1e293b",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {phase18Data.phase18?.motorPulleyDiaD1
                                ? `${phase18Data.phase18.motorPulleyDiaD1} mm`
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
                              style={{ color: "#64748b", fontSize: "0.875rem" }}
                            >
                              Shaft Diameter
                            </span>
                            <span
                              style={{
                                color: "#1e293b",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {phase18Data.phase17Motor?.shaftDiameterMM
                                ? `${phase18Data.phase17Motor.shaftDiameterMM} mm`
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fan Curve Tab - Dynamic Graphs */}
                    {activeTab === "curve" && (
                      <div>
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

                        {/* Legend Bar with Checkboxes */}
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
                              key: "staticPressureNew",
                              label: "Static Pressure",
                              color: "#000000",
                            },
                            {
                              key: "fanInputPowerNew",
                              label: "Fan Input Power",
                              color: "#002060",
                            },
                            {
                              key: "staticEfficiencyNew",
                              label: "Static Efficiency",
                              color: "#385723",
                            },
                            {
                              key: "totalEfficiencyNew",
                              label: "Total Efficiency",
                              color: "#385723",
                              dashed: true,
                            },
                            {
                              key: "systemCurve",
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
                                onChange={() => toggleCurveVisibility(curve.key)}
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
                                    borderTop: curve.dashed ? "2px dashed" : "none",
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
                            {phase18Data?.phase19 ? (
                              (() => {
                                const p19 = phase18Data.phase19;
                                const p18 = phase18Data.phase18;
                                const airflowData = p19.airFlowNew || [];

                                const validAirflows = airflowData
                                  .filter((v) => v != null && !isNaN(v))
                                  .map(Number);
                                if (validAirflows.length < 2) {
                                  return (
                                    <Text color="#94a3b8">
                                      Insufficient data for curves
                                    </Text>
                                  );
                                }

                                const operatingAirFlow =
                                  p18?.airFlow ||
                                  p19.operatingPoint?.airFlow ||
                                  input?.airFlow;
                                const operatingStaticPressure =
                                  p18?.staticPressure ||
                                  p19.operatingPoint?.staticPressure;

                                const dataXMax = Math.max(...validAirflows);
                                const xTickResult = generateNiceTicks(
                                  dataXMax,
                                  10,
                                );
                                const xTicks = xTickResult.ticks;
                                const xDomainMax = xTickResult.max;

                                const numSamples = 800;
                                const sampleStep = xDomainMax / (numSamples - 1);
                                const sharedXPoints = [];
                                for (let i = 0; i < numSamples; i++) {
                                  sharedXPoints.push(
                                    parseFloat((i * sampleStep).toFixed(4)),
                                  );
                                }

                                const graphTypesForInterp = [
                                  { dataKey: "staticPressureNew", multiplier: 1 },
                                  { dataKey: "fanInputPowerNew", multiplier: 1 },
                                  { dataKey: "staticEfficiencyNew", multiplier: 100 },
                                  { dataKey: "totalEfficiencyNew", multiplier: 100 },
                                ];

                                const curveData = {};
                                graphTypesForInterp.forEach((graph) => {
                                  const yData = p19[graph.dataKey] || [];
                                  const validIndices = [];
                                  for (let i = 0; i < airflowData.length; i++) {
                                    if (
                                      airflowData[i] != null &&
                                      yData[i] != null &&
                                      !isNaN(airflowData[i]) &&
                                      !isNaN(yData[i])
                                    ) {
                                      validIndices.push(i);
                                    }
                                  }

                                  validIndices.sort(
                                    (a, b) => airflowData[a] - airflowData[b],
                                  );

                                  const xArray = validIndices.map((i) =>
                                    Number(airflowData[i]),
                                  );
                                  const yArray = validIndices.map(
                                    (i) =>
                                      Number(yData[i]) * (graph.multiplier || 1),
                                  );

                                  if (xArray.length >= 2) {
                                    curveData[graph.dataKey] =
                                      cubicSplineInterpolation(
                                        xArray,
                                        yArray,
                                        numSamples,
                                      );
                                  } else {
                                    curveData[graph.dataKey] = xArray.map(
                                      (x, i) => ({ x, y: yArray[i] }),
                                    );
                                  }
                                });

                                const mergedDataMap = new Map();
                                sharedXPoints.forEach((xVal) => {
                                  const xKey = xVal.toFixed(4);
                                  mergedDataMap.set(xKey, { x: xVal });
                                });
                                graphTypesForInterp.forEach((graph) => {
                                  const data = curveData[graph.dataKey] || [];
                                  data.forEach((point) => {
                                    const xKey = point.x.toFixed(4);
                                    if (!mergedDataMap.has(xKey)) {
                                      mergedDataMap.set(xKey, { x: point.x });
                                    }
                                    mergedDataMap.get(xKey)[graph.dataKey] =
                                      point.y;
                                  });
                                });

                                if (!mergedDataMap.has("0.0000")) {
                                  mergedDataMap.set("0.0000", { x: 0 });
                                }

                                if (
                                  operatingStaticPressure &&
                                  operatingAirFlow &&
                                  operatingAirFlow > 0
                                ) {
                                  const coefficientA =
                                    operatingStaticPressure /
                                    Math.pow(operatingAirFlow, 2);

                                  mergedDataMap.forEach((dataPoint) => {
                                    const x = dataPoint.x;
                                    dataPoint.systemCurve = coefficientA * Math.pow(x, 2);
                                  });
                                }

                                const mergedData = Array.from(
                                  mergedDataMap.values(),
                                ).sort((a, b) => a.x - b.x);

                                const allPressureVals = [];
                                mergedData.forEach((pt) => {
                                  if (
                                    pt.staticPressureNew != null &&
                                    Number.isFinite(pt.staticPressureNew)
                                  ) {
                                    allPressureVals.push(pt.staticPressureNew);
                                  }
                                  if (
                                    pt.systemCurve != null &&
                                    Number.isFinite(pt.systemCurve)
                                  ) {
                                    allPressureVals.push(pt.systemCurve);
                                  }
                                });
                                if (
                                  operatingStaticPressure &&
                                  Number.isFinite(operatingStaticPressure)
                                ) {
                                  allPressureVals.push(operatingStaticPressure);
                                }

                                let pMin =
                                  allPressureVals.length > 0
                                    ? Math.min(...allPressureVals)
                                    : 0;
                                let pMax =
                                  allPressureVals.length > 0
                                    ? Math.max(...allPressureVals)
                                    : 600;

                                const rawPressureData = p19["staticPressureNew"] || [];
                                const validPressureValues = rawPressureData
                                  .filter((v) => v != null && !isNaN(v))
                                  .map(Number);
                                if (validPressureValues.length > 0) {
                                  const fanPMax = Math.max(...validPressureValues);
                                  if (pMax > fanPMax * 2) {
                                    pMax = fanPMax * 2;
                                  }
                                }

                                const pTickResult = generateNiceTicksRange(
                                  pMin,
                                  pMax || 600,
                                  10,
                                );
                                const pressureTicks = pTickResult.ticks;
                                const pressureAxisMin = pTickResult.min;
                                const pressureAxisMax = pTickResult.max;

                                const rawPowerData = p19["fanInputPowerNew"] || [];
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

                                const efficiencyTicks = [
                                  0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
                                ];

                                return (
                                  <ResponsiveContainer width="100%" height="100%">
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
                                          e.activeLabel ?? e.activePayload?.[0]?.payload?.x;
                                        const clickedX = Number(clickedXRaw);

                                        if (!Number.isFinite(clickedX)) {
                                          return;
                                        }

                                        const lockedPoint = {
                                          x: clickedX,
                                          staticPressureNew: interpolateSeriesAtX(
                                            mergedData,
                                            "staticPressureNew",
                                            clickedX,
                                          ),
                                          fanInputPowerNew: interpolateSeriesAtX(
                                            mergedData,
                                            "fanInputPowerNew",
                                            clickedX,
                                          ),
                                          staticEfficiencyNew: interpolateSeriesAtX(
                                            mergedData,
                                            "staticEfficiencyNew",
                                            clickedX,
                                          ),
                                          totalEfficiencyNew: interpolateSeriesAtX(
                                            mergedData,
                                            "totalEfficiencyNew",
                                            clickedX,
                                          ),
                                          systemCurve: interpolateSeriesAtX(
                                            mergedData,
                                            "systemCurve",
                                            clickedX,
                                          ),
                                        };

                                        setSelectedChartPoint({ ...lockedPoint });
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
                                        tick={{ fill: "#000000", fontSize: 14 }}
                                        ticks={xTicks}
                                        domain={[0, xDomainMax]}
                                        type="number"
                                        label={{
                                          value: `Air Flow (${units?.airFlow || "m³/h"})`,
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
                                        yAxisId="pressure"
                                        orientation="left"
                                        stroke="#000000"
                                        tick={{ fill: "#000000", fontSize: 14 }}
                                        ticks={pressureTicks}
                                        tickCount={pressureTicks.length}
                                        domain={[pressureAxisMin, pressureAxisMax]}
                                        hide={false}
                                        allowDataOverflow={true}
                                        label={{
                                          value: `Pressure (${units?.pressure || "Pa"})`,
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
                                      <YAxis
                                        yAxisId="efficiency"
                                        orientation="right"
                                        stroke="#385723"
                                        tick={{ fill: "#385723", fontSize: 14 }}
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
                                      <YAxis
                                        yAxisId="power"
                                        orientation="right"
                                        stroke="#002060"
                                        tick={{ fill: "#002060", fontSize: 14 }}
                                        ticks={powerTicks}
                                        domain={[0, powerTicks[powerTicks.length - 1] || 10]}
                                        hide={false}
                                        allowDataOverflow={true}
                                        axisLine={{ stroke: "#002060" }}
                                        tickLine={{ stroke: "#002060" }}
                                        label={{
                                          value: `Power (${units?.power || "kW"})`,
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
                                        Number.isFinite(Number(selectedChartPoint.x)) && (
                                          <ReferenceLine
                                            yAxisId="pressure"
                                            x={Number(selectedChartPoint.x)}
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            strokeDasharray="6 4"
                                            ifOverflow="visible"
                                            isFront={true}
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
                                      {curveVisibility.staticPressureNew && (
                                        <Line
                                          yAxisId="pressure"
                                          type="basis"
                                          dataKey="staticPressureNew"
                                          stroke="#000000"
                                          strokeWidth={2.5}
                                          dot={false}
                                          activeDot={false}
                                          style={{ pointerEvents: "none" }}
                                          isAnimationActive={true}
                                          connectNulls
                                        />
                                      )}
                                      {curveVisibility.fanInputPowerNew && (
                                        <Line
                                          yAxisId="power"
                                          type="basis"
                                          dataKey="fanInputPowerNew"
                                          stroke="#002060"
                                          strokeWidth={2.5}
                                          dot={false}
                                          activeDot={false}
                                          style={{ pointerEvents: "none" }}
                                          isAnimationActive={true}
                                          connectNulls
                                        />
                                      )}
                                      {curveVisibility.staticEfficiencyNew && (
                                        <Line
                                          yAxisId="efficiency"
                                          type="basis"
                                          dataKey="staticEfficiencyNew"
                                          stroke="#385723"
                                          strokeWidth={2.5}
                                          dot={false}
                                          activeDot={false}
                                          style={{ pointerEvents: "none" }}
                                          isAnimationActive={true}
                                          connectNulls
                                        />
                                      )}
                                      {curveVisibility.totalEfficiencyNew && (
                                        <Line
                                          yAxisId="efficiency"
                                          type="basis"
                                          dataKey="totalEfficiencyNew"
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
                                      {curveVisibility.systemCurve && (
                                        <Line
                                          yAxisId="pressure"
                                          type="basis"
                                          dataKey="systemCurve"
                                          stroke="#FF0000"
                                          strokeWidth={2.5}
                                          dot={false}
                                          activeDot={false}
                                          style={{ pointerEvents: "none" }}
                                          isAnimationActive={true}
                                          connectNulls
                                        />
                                      )}
                                      {(() => {
                                        const opAirflow = Number(operatingAirFlow);

                                        const hasLockedPoint =
                                          isLocked &&
                                          selectedChartPoint &&
                                          Number.isFinite(Number(selectedChartPoint.x));
                                        const hasOperatingPoint =
                                          Number.isFinite(opAirflow) && opAirflow > 0;

                                        if (!hasLockedPoint && !hasOperatingPoint) {
                                          return null;
                                        }

                                        const markerX = hasLockedPoint
                                          ? Number(selectedChartPoint.x)
                                          : opAirflow;

                                        const markerValues = hasLockedPoint
                                          ? {
                                              staticPressureNew:
                                                selectedChartPoint.staticPressureNew,
                                              fanInputPowerNew:
                                                selectedChartPoint.fanInputPowerNew,
                                              staticEfficiencyNew:
                                                selectedChartPoint.staticEfficiencyNew,
                                              totalEfficiencyNew:
                                                selectedChartPoint.totalEfficiencyNew,
                                              systemCurve: selectedChartPoint.systemCurve,
                                            }
                                          : {
                                              staticPressureNew: operatingStaticPressure,
                                              fanInputPowerNew:
                                                p18?.fanInputPower ??
                                                p19?.operatingPoint?.fanInputPower,
                                              staticEfficiencyNew:
                                                p18?.staticEfficiency != null
                                                  ? p18.staticEfficiency * 100
                                                  : p19?.operatingPoint
                                                        ?.staticEfficiency != null
                                                    ? p19.operatingPoint
                                                        .staticEfficiency * 100
                                                    : null,
                                              totalEfficiencyNew:
                                                p18?.totalEfficiency != null
                                                  ? p18.totalEfficiency * 100
                                                  : p19?.operatingPoint
                                                        ?.totalEfficiency != null
                                                    ? p19.operatingPoint
                                                        .totalEfficiency * 100
                                                    : null,
                                              systemCurve: operatingStaticPressure,
                                            };

                                        const dots = [];
                                        const dotStyle = { cursor: "pointer" };
                                        const selectedStroke = "#f59e0b";
                                        const normalStroke = "#ffffff";

                                        const handleDotClick = (e) => {
                                          if (e && e.stopPropagation) {
                                            e.stopPropagation();
                                          }
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
                                          curveVisibility.staticPressureNew &&
                                          markerValues.staticPressureNew != null
                                        ) {
                                          dots.push(
                                            <ReferenceDot
                                              key="op-pressure"
                                              x={markerX}
                                              y={markerValues.staticPressureNew}
                                              yAxisId="pressure"
                                              r={isLocked ? 8 : 6}
                                              fill="#FF0000"
                                              stroke={
                                                isLocked ? selectedStroke : normalStroke
                                              }
                                              strokeWidth={isLocked ? 3 : 2}
                                              style={dotStyle}
                                              onClick={handleDotClick}
                                            />,
                                          );
                                        }
                                        if (
                                          curveVisibility.fanInputPowerNew &&
                                          markerValues.fanInputPowerNew != null
                                        ) {
                                          dots.push(
                                            <ReferenceDot
                                              key="op-power"
                                              x={markerX}
                                              y={markerValues.fanInputPowerNew}
                                              yAxisId="power"
                                              r={isLocked ? 8 : 6}
                                              fill="#FF0000"
                                              stroke={
                                                isLocked ? selectedStroke : normalStroke
                                              }
                                              strokeWidth={isLocked ? 3 : 2}
                                              style={dotStyle}
                                              onClick={handleDotClick}
                                            />,
                                          );
                                        }
                                        if (
                                          curveVisibility.staticEfficiencyNew &&
                                          markerValues.staticEfficiencyNew != null
                                        ) {
                                          dots.push(
                                            <ReferenceDot
                                              key="op-seff"
                                              x={markerX}
                                              y={markerValues.staticEfficiencyNew}
                                              yAxisId="efficiency"
                                              r={isLocked ? 8 : 6}
                                              fill="#FF0000"
                                              stroke={
                                                isLocked ? selectedStroke : normalStroke
                                              }
                                              strokeWidth={isLocked ? 3 : 2}
                                              style={dotStyle}
                                              onClick={handleDotClick}
                                            />,
                                          );
                                        }
                                        if (
                                          curveVisibility.totalEfficiencyNew &&
                                          markerValues.totalEfficiencyNew != null
                                        ) {
                                          dots.push(
                                            <ReferenceDot
                                              key="op-teff"
                                              x={markerX}
                                              y={markerValues.totalEfficiencyNew}
                                              yAxisId="efficiency"
                                              r={isLocked ? 8 : 6}
                                              fill="#FF0000"
                                              stroke={
                                                isLocked ? selectedStroke : normalStroke
                                              }
                                              strokeWidth={isLocked ? 3 : 2}
                                              style={dotStyle}
                                              onClick={handleDotClick}
                                            />,
                                          );
                                        }
                                        if (
                                          curveVisibility.systemCurve &&
                                          markerValues.systemCurve != null
                                        ) {
                                          dots.push(
                                            <ReferenceDot
                                              key="op-sys"
                                              x={markerX}
                                              y={markerValues.systemCurve}
                                              yAxisId="pressure"
                                              r={isLocked ? 8 : 6}
                                              fill="#FF0000"
                                              stroke={
                                                isLocked ? selectedStroke : normalStroke
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
                                  </ResponsiveContainer>
                                );
                              })()
                            ) : (
                              <Text color="#94a3b8">
                                No curve data available. Please select a fan
                                configuration.
                              </Text>
                            )}

                            {isLocked && selectedChartPoint && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "30px",
                                  right: "120px",
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
                                  Q: {Number(selectedChartPoint.x).toLocaleString()} {units?.airFlow || "m³/h"}
                                </div>
                                {selectedChartPoint.staticPressureNew != null && (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      fontSize: "12px",
                                      marginTop: "3px",
                                    }}
                                  >
                                    <span style={{ color: "#000000", fontWeight: "500" }}>
                                      Pst:
                                    </span>
                                    <span style={{ fontWeight: "600" }}>
                                      {selectedChartPoint.staticPressureNew.toFixed(1)} {units?.pressure || "Pa"}
                                    </span>
                                  </div>
                                )}
                                {selectedChartPoint.fanInputPowerNew != null && (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      fontSize: "12px",
                                      marginTop: "3px",
                                    }}
                                  >
                                    <span style={{ color: "#002060", fontWeight: "500" }}>
                                      Psh:
                                    </span>
                                    <span style={{ fontWeight: "600" }}>
                                      {selectedChartPoint.fanInputPowerNew.toFixed(2)} {units?.power || "kW"}
                                    </span>
                                  </div>
                                )}
                                {selectedChartPoint.staticEfficiencyNew != null && (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      fontSize: "12px",
                                      marginTop: "3px",
                                    }}
                                  >
                                    <span style={{ color: "#385723", fontWeight: "500" }}>
                                      ηst:
                                    </span>
                                    <span style={{ fontWeight: "600" }}>
                                      {selectedChartPoint.staticEfficiencyNew.toFixed(1)} %
                                    </span>
                                  </div>
                                )}
                                {selectedChartPoint.totalEfficiencyNew != null && (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      fontSize: "12px",
                                      marginTop: "3px",
                                    }}
                                  >
                                    <span style={{ color: "#385723", fontWeight: "500" }}>
                                      ηtot:
                                    </span>
                                    <span style={{ fontWeight: "600" }}>
                                      {selectedChartPoint.totalEfficiencyNew.toFixed(1)} %
                                    </span>
                                  </div>
                                )}
                                {selectedChartPoint.systemCurve != null && (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      fontSize: "12px",
                                      marginTop: "3px",
                                    }}
                                  >
                                    <span style={{ color: "#FF0000", fontWeight: "500" }}>
                                      System:
                                    </span>
                                    <span style={{ fontWeight: "600" }}>
                                      {selectedChartPoint.systemCurve.toFixed(1)} {units?.pressure || "Pa"}
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
                        {phase18Data?.phase18 && (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(4, 1fr)",
                              marginTop: "1.5rem",
                              backgroundColor: "#e2e8f0",
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
                                color="#1e293b"
                                fontSize="xl"
                                fontWeight="bold"
                              >
                                {phase18Data.phase18.staticPressure?.toFixed(
                                  2,
                                ) || "—"}
                              </Text>
                              <Text
                                color="#64748b"
                                fontSize="xs"
                                textTransform="uppercase"
                                mt={1}
                              >
                                Pressure
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
                                color="#1e293b"
                                fontSize="xl"
                                fontWeight="bold"
                              >
                                {phase18Data.phase18.fanInputPower?.toFixed(
                                  3,
                                ) || "—"}
                              </Text>
                              <Text
                                color="#64748b"
                                fontSize="xs"
                                textTransform="uppercase"
                                mt={1}
                              >
                                Power
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
                                color="#1e293b"
                                fontSize="xl"
                                fontWeight="bold"
                              >
                                {phase18Data.phase18.staticEfficiency
                                  ? (
                                      phase18Data.phase18.staticEfficiency * 100
                                    ).toFixed(1)
                                  : "—"}
                              </Text>
                              <Text
                                color="#64748b"
                                fontSize="xs"
                                textTransform="uppercase"
                                mt={1}
                              >
                                Static Eff.
                              </Text>
                            </div>
                            <div
                              style={{ textAlign: "center", padding: "1rem" }}
                            >
                              <Text
                                color="#1e293b"
                                fontSize="xl"
                                fontWeight="bold"
                              >
                                {phase18Data.phase18.totalEfficiency
                                  ? (
                                      phase18Data.phase18.totalEfficiency * 100
                                    ).toFixed(1)
                                  : "—"}
                              </Text>
                              <Text
                                color="#64748b"
                                fontSize="xs"
                                textTransform="uppercase"
                                mt={1}
                              >
                                Total Eff.
                              </Text>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Noise Graph Tab - Using Phase 20 data with bar charts */}
                    {activeTab === "noise" && (
                      <div>
                        {phase18Data?.phase20 ? (
                          (() => {
                            const noiseData = phase18Data.phase20;
                            const frequencies = noiseData.frequencies || [
                              62, 125, 250, 500, 1000, 2000, 4000, 8000,
                            ];

                            // Prepare data for bar charts - remove Hz from labels
                            const lwSpectrum = frequencies.map((freq, idx) => ({
                              frequency: String(freq),
                              soundPower: noiseData.LW_array?.[idx] || 0,
                            }));

                            const lpSpectrum = frequencies.map((freq, idx) => ({
                              frequency: String(freq),
                              soundPressure: noiseData.LP_array?.[idx] || 0,
                            }));

                            // Colors for bars - gradient blues and teals
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
                                      {noiseData.LW?.total?.toFixed(1) || "—"}
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
                                      {noiseData.LP?.total?.toFixed(1) || "—"}
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
                                      {noiseData.parameters?.directivityQ || 1}
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
                                      {noiseData.parameters?.distance || 3}
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
                                      style={{ width: "100%", height: "280px" }}
                                    >
                                      <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                      >
                                        <BarChart
                                          data={lwSpectrum}
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
                                            {lwSpectrum.map((entry, index) => (
                                              <Cell
                                                key={`lw-cell-${index}`}
                                                fill={
                                                  lwBarColors[
                                                    index % lwBarColors.length
                                                  ]
                                                }
                                              />
                                            ))}
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
                                      style={{ width: "100%", height: "280px" }}
                                    >
                                      <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                      >
                                        <BarChart
                                          data={lpSpectrum}
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
                                            {lpSpectrum.map((entry, index) => (
                                              <Cell
                                                key={`lp-cell-${index}`}
                                                fill={
                                                  lpBarColors[
                                                    index % lpBarColors.length
                                                  ]
                                                }
                                              />
                                            ))}
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
                                          {frequencies.map((freq, i) => (
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
                                              {freq} Hz
                                            </th>
                                          ))}
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
                                          {noiseData.LW_array?.map((val, i) => (
                                            <td
                                              key={i}
                                              style={{
                                                padding: "0.875rem 1rem",
                                                textAlign: "center",
                                                color: "#3b82f6",
                                                fontWeight: "600",
                                              }}
                                            >
                                              {val?.toFixed(1)}
                                            </td>
                                          ))}
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
                                          {noiseData.LP_array?.map((val, i) => (
                                            <td
                                              key={i}
                                              style={{
                                                padding: "0.875rem 1rem",
                                                textAlign: "center",
                                                color: "#14b8a6",
                                                fontWeight: "600",
                                              }}
                                            >
                                              {val?.toFixed(1)}
                                            </td>
                                          ))}
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </>
                            );
                          })()
                        ) : (
                          <div
                            className="detail-card"
                            style={{
                              padding: "2rem",
                              textAlign: "center",
                              color: "#94a3b8",
                            }}
                          >
                            <p>
                              Unable to calculate noise data. Missing fan input
                              power or static pressure values.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing Tab - includes fan + motor totals */}
                    {activeTab === "pricing" &&
                      (() => {
                        const motor = phase18Data?.phase17Motor || null;
                        const fanType = units?.fanType || "";
                        const isWFOrARTF =
                          fanType === "WF" || fanType === "ARTF";

                        const toNumberOrNull = (value) => {
                          if (value === null || value === undefined)
                            return null;
                          const parsed =
                            typeof value === "number" ? value : Number(value);
                          return Number.isFinite(parsed) ? parsed : null;
                        };

                        const formatPriceLe = (value) => {
                          const numberValue = toNumberOrNull(value);
                          if (numberValue == null) return "—";
                          return `${numberValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} L.E`;
                        };

                        let electricalMotorCost = isWFOrARTF
                          ? motor?.otherPriceWithVat
                          : motor?.b3PriceWithVat;
                        if (electricalMotorCost == null) {
                          const withoutVatCost = isWFOrARTF
                            ? motor?.otherPriceWithoutVat
                            : motor?.b3PriceWithoutVat;
                          const parsedWithoutVat =
                            toNumberOrNull(withoutVatCost);
                          electricalMotorCost =
                            parsedWithoutVat != null
                              ? parsedWithoutVat * 1.14
                              : null;
                        }

                        const electricalComponentCost =
                          motor?.totalPriceWithVat;
                        const fanPriceWithVat =
                          casingPriceResult?.totalFanPriceWithVat;
                        const fanPriceWithVatScrap =
                          casingPriceResult?.totalFanPriceWithVatScrapRecycle;

                        const totalWithMotor = [
                          fanPriceWithVat,
                          electricalMotorCost,
                          electricalComponentCost,
                        ]
                          .map(toNumberOrNull)
                          .filter((v) => v != null)
                          .reduce((sum, value) => sum + value, 0);

                        const totalWithMotorScrap = [
                          fanPriceWithVatScrap,
                          electricalMotorCost,
                          electricalComponentCost,
                        ]
                          .map(toNumberOrNull)
                          .filter((v) => v != null)
                          .reduce((sum, value) => sum + value, 0);

                        const hasTotalWithMotor = [
                          fanPriceWithVat,
                          electricalMotorCost,
                          electricalComponentCost,
                        ]
                          .map(toNumberOrNull)
                          .some((v) => v != null);
                        const hasTotalWithMotorScrap = [
                          fanPriceWithVatScrap,
                          electricalMotorCost,
                          electricalComponentCost,
                        ]
                          .map(toNumberOrNull)
                          .some((v) => v != null);

                        return (
                          <div
                            style={{
                              background: "#f8fafc",
                              borderRadius: "12px",
                              border: "1px solid #dbeafe",
                              padding: "1.5rem",
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
                              <span style={{ color: "#3b82f6" }}>
                                Pricing Breakdown
                              </span>
                            </h4>

                            {casingPriceLoading ? (
                              <Flex align="center" gap={2} py={6}>
                                <Spinner size="sm" color="#3b82f6" />
                                <Text color="#64748b" fontSize="sm">
                                  Loading pricing...
                                </Text>
                              </Flex>
                            ) : (
                              <>
                                {casingPriceResult?.error ? (
                                  <Text color="#dc2626" fontSize="sm" py={2}>
                                    {casingPriceResult.error}
                                  </Text>
                                ) : casingPriceResult ? (
                                  <Box>
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "0 2rem",
                                        marginBottom: "1rem",
                                      }}
                                    >
                                      {[
                                        { key: "volute", label: "Volute" },
                                        {
                                          key: "voluteWithoutScrap",
                                          label: "Volute (w/o Scrap)",
                                        },
                                        { key: "frame", label: "Frame" },
                                        {
                                          key: "frameWithoutScrap",
                                          label: "Frame (w/o Scrap)",
                                        },
                                        { key: "impeller", label: "Impeller" },
                                        {
                                          key: "impellerWithoutScrap",
                                          label: "Impeller (w/o Scrap)",
                                        },
                                        { key: "funnels", label: "Funnels" },
                                        {
                                          key: "sleeveShaft",
                                          label: "Sleeve & Shaft",
                                        },
                                        {
                                          key: "matchingFlange",
                                          label:
                                            "Matching Flange With Bearing House",
                                        },
                                        {
                                          key: "bearingAssembly",
                                          label: "Bearing Assembly",
                                        },
                                        { key: "fanBase", label: "Fan Base" },
                                        {
                                          key: "fanBaseWithoutScrap",
                                          label: "Fan Base (w/o Scrap)",
                                        },
                                        {
                                          key: "beltCover",
                                          label: "Belt Cover",
                                        },
                                        {
                                          key: "beltCoverWithoutScrap",
                                          label: "Belt Cover (w/o Scrap)",
                                        },
                                        {
                                          key: "motorBase",
                                          label: "Motor Base",
                                        },
                                        {
                                          key: "motorBaseWithoutScrap",
                                          label: "Motor Base (w/o Scrap)",
                                        },
                                        {
                                          key: "accessories",
                                          label: "Accessories",
                                        },
                                      ].map(({ key, label }) => {
                                        const val = casingPriceResult[key];
                                        return (
                                          <div
                                            key={key}
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              padding: "0.5rem 0",
                                              borderBottom: "1px solid #e2e8f0",
                                              alignItems: "center",
                                            }}
                                          >
                                            <span
                                              style={{
                                                color: "#64748b",
                                                fontSize: "0.8125rem",
                                              }}
                                            >
                                              {label}
                                            </span>
                                            <span
                                              style={{
                                                color: "#1e293b",
                                                fontSize: "0.8125rem",
                                                fontWeight: "500",
                                              }}
                                            >
                                              {formatPriceLe(val)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </Box>
                                ) : (
                                  <Text color="#94a3b8" fontSize="sm" py={2}>
                                    No fan pricing data available for this fan.
                                  </Text>
                                )}

                                <div
                                  style={{
                                    marginTop: "0.75rem",
                                    padding: "1rem 1.25rem",
                                    borderRadius: "10px",
                                    border: "1px solid #bfdbfe",
                                    background: "#eff6ff",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      padding: "0.3rem 0",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "#1e3a8a",
                                        fontSize: "0.875rem",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Fan Price (with VAT)
                                    </span>
                                    <span
                                      style={{
                                        color: "#1e3a8a",
                                        fontSize: "0.875rem",
                                        fontWeight: "700",
                                      }}
                                    >
                                      {formatPriceLe(fanPriceWithVat)}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      padding: "0.3rem 0",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "#1e3a8a",
                                        fontSize: "0.875rem",
                                      }}
                                    >
                                      Electrical Motor Cost{" "}
                                      {isWFOrARTF
                                        ? "(Other Price with VAT)"
                                        : "(B3 Price with VAT)"}
                                    </span>
                                    <span
                                      style={{
                                        color: "#1e3a8a",
                                        fontSize: "0.875rem",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {formatPriceLe(electricalMotorCost)}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      padding: "0.3rem 0",
                                      borderBottom: "1px solid #bfdbfe",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "#1e3a8a",
                                        fontSize: "0.875rem",
                                      }}
                                    >
                                      Electrical Component Cost
                                    </span>
                                    <span
                                      style={{
                                        color: "#1e3a8a",
                                        fontSize: "0.875rem",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {formatPriceLe(electricalComponentCost)}
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      padding: "0.55rem 0 0.3rem",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "#1d4ed8",
                                        fontSize: "0.9375rem",
                                        fontWeight: "700",
                                      }}
                                    >
                                      Total Price (with VAT + Motor)
                                    </span>
                                    <span
                                      style={{
                                        color: "#1d4ed8",
                                        fontSize: "1rem",
                                        fontWeight: "800",
                                      }}
                                    >
                                      {hasTotalWithMotor
                                        ? formatPriceLe(totalWithMotor)
                                        : "—"}
                                    </span>
                                  </div>

                                  {hasTotalWithMotorScrap && (
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "0.3rem 0",
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "#334155",
                                          fontSize: "0.8125rem",
                                        }}
                                      >
                                        With Scrap Recycle + Motor
                                      </span>
                                      <span
                                        style={{
                                          color: "#0f766e",
                                          fontSize: "0.875rem",
                                          fontWeight: "700",
                                        }}
                                      >
                                        {formatPriceLe(totalWithMotorScrap)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                  </Box>
                )}

                {/* Action Buttons - Inside Card */}
                <Flex
                  justify="space-between"
                  align="center"
                  gap={4}
                  mt={6}
                  pt={4}
                  borderTop="1px solid #e2e8f0"
                >
                  <Button
                    variant="outline"
                    borderColor="#e2e8f0"
                    color="#475569"
                    onClick={() => navigate("/centrifugal/second-input")}
                    _hover={{ bg: "#f8fafc", borderColor: "#cbd5e1" }}
                    size="md"
                    px={6}
                    borderRadius="8px"
                    fontWeight="500"
                    h="44px"
                  >
                    ← Back
                  </Button>
                  <Button
                    bg="#3b82f6"
                    color="white"
                    onClick={() => navigate("/centrifugal/fan-selection")}
                    _hover={{ bg: "#2563eb" }}
                    size="md"
                    px={6}
                    borderRadius="8px"
                    fontWeight="500"
                    h="44px"
                  >
                    New Search
                  </Button>
                </Flex>
              </>
            )}
          </div>
        </Box>

        {/* Footer */}
        <Box py={4} bg="white" borderTop="1px solid #e2e8f0">
          <Text color="#94a3b8" fontSize="sm" textAlign="center">
            © {currentYear} Mechtronics Fan Selection. All rights reserved.
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}

// Helper function
function formatNumber(value) {
  if (value === null || value === undefined) return "—";
  return typeof value === "number" ? value.toFixed(2) : value;
}

// Detail item component for Phase 17/18 display
function DetailItem({ label, value, fullWidth }) {
  return (
    <Box gridColumn={fullWidth ? "1 / -1" : "auto"}>
      <Text
        color="#64748b"
        fontSize="xs"
        fontWeight="medium"
        textTransform="uppercase"
        letterSpacing="wider"
        mb={1}
      >
        {label}
      </Text>
      <Text color="#e2e8f0" fontSize="sm" fontWeight="medium">
        {value || "—"}
      </Text>
    </Box>
  );
}
