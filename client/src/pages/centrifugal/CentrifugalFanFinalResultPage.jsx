import React, { useState } from "react";
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
} from "recharts";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";
import "./CentrifugalFanResultPage.css";

// Calculate input density from temperature (kg/m³)
// Formula: ρ = 1.293 × (273.15 / (273.15 + T))
function calculateDensity(tempC) {
    if (tempC === null || tempC === undefined) return null;
    const temp = parseFloat(tempC);
    if (isNaN(temp)) return null;
    return 1.293 * (273.15 / (273.15 + temp));
}

export default function CentrifugalFanFinalResultPage() {
    const navigate = useNavigate();
    const { results: contextResults, units, input } = useFormData();
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const [phase18Data, setPhase18Data] = useState(null);
    const [activeTab, setActiveTab] = useState("performance"); // 'performance', 'curve', 'noise'

    // Curve visibility state - all curves visible by default (must be before any returns)
    const [curveVisibility, setCurveVisibility] = useState({
        staticPressure: true,
        fanInputPower: true,
        staticEfficiency: true,
        totalEfficiency: true,
        systemCurve: true,
    });

    const currentYear = new Date().getFullYear();

    if (!contextResults || !contextResults.phase18All) {
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

    const { phase18All, selectedCentrifugalFan, secondInputData } = contextResults;

    // Debug logging
    console.log("Phase 18 All Models:", phase18All);

    // Handle row selection - show Phase 17 & 18 details
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
                const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";
                const phase20Resp = await fetch(`${apiBaseUrl}/api/centrifugal-fan-data/phase20`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        phase18Result: item.phase18,
                        distance: secondInputData?.distance || 3,
                        directivityQ: secondInputData?.directivityQ || 1,
                        safetyFactor: secondInputData?.spf ? secondInputData.spf / 100 : 0.1
                    }),
                });
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
            phase19: item.phase19, // Include curve data
            phase20: phase20Data, // Include noise data
        });
    };

    // Handle View Datasheet button click - generate PDF
    const handleViewDatasheet = async () => {
        if (!phase18Data) {
            console.error("No phase18Data available for PDF generation");
            return;
        }

        try {
            const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

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

            const response = await fetch(`${apiBaseUrl}/api/centrifugal/pdf/datasheet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fanData, userInput, units }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate PDF");
            }

            // Get the PDF blob and open in new tab
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
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
            if (xArray[i] != null && yArray[i] != null && !isNaN(xArray[i]) && !isNaN(yArray[i])) {
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
    };

    return (
        <Flex minH="100vh" bg="#f8fafc" flexDirection="column">
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
                            <h1 style={{ fontSize: "1.25rem", color: "#1e293b", marginBottom: "0.25rem", fontWeight: "600" }}>
                                All fan models for{" "}
                                <span style={{ color: "#3b82f6" }}>
                                    {selectedCentrifugalFan?.fanModel || "Selected Fan"}
                                </span>
                                {" "}
                                <span style={{ color: "#94a3b8", fontWeight: "400", fontSize: "0.875rem" }}>
                                    | Click a row to view all details
                                </span>
                            </h1>
                        </div>

                        {phase18All.length === 0 ? (
                            <div style={{ textAlign: "center", marginTop: "4rem", background: "white", padding: "3rem", borderRadius: "12px" }}>
                                <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "#1e293b" }}>
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
                                <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "1.5rem" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                <th style={{ padding: "1rem 1.25rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "500", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: "280px" }}>Fan Model</th>
                                                <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "500", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Airflow ({units?.airFlow || "CFM"})</th>
                                                <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "500", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Static Pressure ({units?.pressure || "Pa"})</th>
                                                <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "500", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fan Input Power ({units?.power || "kW"})</th>
                                                <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "500", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Static Efficiency (%)</th>
                                                <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "500", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Efficiency (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {phase18All.map((item, index) => (
                                                <tr
                                                    key={index}
                                                    onClick={() => handleRowSelect(item, index)}
                                                    style={{
                                                        cursor: "pointer",
                                                        borderBottom: index < phase18All.length - 1 ? "1px solid #f1f5f9" : "none",
                                                        borderLeft: selectedRowIndex === index ? "3px solid #3b82f6" : "3px solid transparent",
                                                        background: selectedRowIndex === index ? "#f8fafc" : "white",
                                                        transition: "all 0.15s ease"
                                                    }}
                                                    onMouseEnter={(e) => { if (selectedRowIndex !== index) e.currentTarget.style.background = "#f8fafc"; }}
                                                    onMouseLeave={(e) => { if (selectedRowIndex !== index) e.currentTarget.style.background = "white"; }}
                                                >
                                                    <td style={{ padding: "1rem 1.25rem", textAlign: "left", minWidth: "280px" }}>
                                                        <span style={{ color: "#3b82f6", fontWeight: "600", fontSize: "0.9375rem", whiteSpace: "nowrap" }}>{item.phase18?.fanModelFormatted || `Model ${index + 1}`}</span>
                                                    </td>
                                                    <td style={{ padding: "1rem 1.25rem", textAlign: "center", color: "#475569", fontSize: "0.9375rem" }}>{formatNumber(item.phase18?.airFlow)}</td>
                                                    <td style={{ padding: "1rem 1.25rem", textAlign: "center", color: "#475569", fontSize: "0.9375rem" }}>{formatNumber(item.phase18?.staticPressure)}</td>
                                                    <td style={{ padding: "1rem 1.25rem", textAlign: "center", color: "#475569", fontSize: "0.9375rem" }}>{formatNumber(item.phase18?.fanInputPower)}</td>
                                                    <td style={{ padding: "1rem 1.25rem", textAlign: "center", color: "#475569", fontSize: "0.9375rem" }}>{item.phase18?.staticEfficiency ? `${(item.phase18.staticEfficiency * 100).toFixed(1)}` : "—"}</td>
                                                    <td style={{ padding: "1rem 1.25rem", textAlign: "center", color: "#475569", fontSize: "0.9375rem" }}>{item.phase18?.totalEfficiency ? `${(item.phase18.totalEfficiency * 100).toFixed(1)}` : "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Tabbed Section - Shows when a row is selected */}
                                {selectedRowIndex !== null && phase18Data && (
                                    <Box bg="white" borderRadius="12px" p={6} border="1px solid #e2e8f0">
                                        {/* Header with Fan Model and View Datasheet Button */}
                                        <Flex justify="space-between" align="flex-start" mb={4}>
                                            <Box>
                                                <Text fontSize="xl" color="#1e293b" fontWeight="bold" mb={1}>
                                                    Details for {phase18Data.phase18?.fanModelFormatted || "Selected Fan"}
                                                </Text>
                                                <Text fontSize="sm" color="#64748b">
                                                    Review detailed specifications and performance metrics below.
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
                                                    color: activeTab === "performance" ? "#3b82f6" : "#64748b",
                                                    fontSize: "0.875rem",
                                                    fontWeight: activeTab === "performance" ? "600" : "500",
                                                    cursor: "pointer",
                                                    borderBottom: activeTab === "performance" ? "2px solid #3b82f6" : "2px solid transparent",
                                                    transition: "all 0.2s",
                                                    marginBottom: "-1px",
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (activeTab !== "performance") e.target.style.color = "#1e293b";
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (activeTab !== "performance") e.target.style.color = "#64748b";
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
                                                    borderBottom: activeTab === "curve" ? "2px solid #3b82f6" : "2px solid transparent",
                                                    transition: "all 0.2s",
                                                    marginBottom: "-1px",
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (activeTab !== "curve") e.target.style.color = "#1e293b";
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (activeTab !== "curve") e.target.style.color = "#64748b";
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
                                                    borderBottom: activeTab === "noise" ? "2px solid #3b82f6" : "2px solid transparent",
                                                    transition: "all 0.2s",
                                                    marginBottom: "-1px",
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (activeTab !== "noise") e.target.style.color = "#1e293b";
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (activeTab !== "noise") e.target.style.color = "#64748b";
                                                }}
                                            >
                                                Noise Graph
                                            </button>
                                        </div>

                                        {/* Tab Content */}
                                        {/* Performance Data Tab */}
                                        {activeTab === "performance" && (
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                                {/* Fan Specification Card */}
                                                <div style={{
                                                    background: "#f8fafc",
                                                    borderRadius: "12px",
                                                    border: "1px solid #e2e8f0",
                                                    padding: "1.25rem"
                                                }}>
                                                    <h4 style={{ color: "#1e293b", fontSize: "0.9375rem", fontWeight: "600", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <span style={{ color: "#3b82f6" }}>⚙</span> Fan Specifications
                                                    </h4>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Input Density</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {`${calculateDensity(input?.TempC ?? 20).toFixed(3)} kg/m³`}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Fan Speed</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase18?.fanSpeedN2 ? `${phase18Data.phase18.fanSpeedN2} RPM` : "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Fan Pulley</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase18?.fanPulleyDiaD2 ? `${phase18Data.phase18.fanPulleyDiaD2} mm` : "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Belt Type</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase18?.beltType ? `Type - ${phase18Data.phase18.beltType}` : "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Belt Length</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase18?.beltLengthStandard ? `${phase18Data.phase18.beltLengthStandard} mm` : "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Number of Grooves</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase18?.noOfGrooves || "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Center Distance</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase18?.centerDistance ? `${phase18Data.phase18.centerDistance} mm` : "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Inner Diameter</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase18?.innerDiameter ? `${phase18Data.phase18.innerDiameter} mm` : "—"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Motor Details Card */}
                                                <div style={{
                                                    background: "#f8fafc",
                                                    borderRadius: "12px",
                                                    border: "1px solid #e2e8f0",
                                                    padding: "1.25rem"
                                                }}>
                                                    <h4 style={{ color: "#1e293b", fontSize: "0.9375rem", fontWeight: "600", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <span style={{ color: "#3b82f6" }}>⚡</span> Motor Details
                                                    </h4>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Motor Model</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase17Motor?.model || "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Power (kW)</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase17Motor?.powerKW || "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>No. of Poles</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase17Motor?.noOfPoles || "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Volt / Phase / Freq</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase17Motor?.noOfPhases ? `380V / ${phase18Data.phase17Motor.noOfPhases}Ph / 50Hz` : "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Motor Efficiency</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase17Motor?.efficiency50Hz ? `${(phase18Data.phase17Motor.efficiency50Hz * 100).toFixed(1)}%` : "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Insulation Class</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase17Motor?.insulationClass || "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Motor Speed</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase18?.motorSpeedN1 ? `${phase18Data.phase18.motorSpeedN1} RPM` : "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid #e2e8f0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Motor Pulley</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase18?.motorPulleyDiaD1 ? `${phase18Data.phase18.motorPulleyDiaD1} mm` : "—"}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0" }}>
                                                        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Shaft Diameter</span>
                                                        <span style={{ color: "#1e293b", fontSize: "0.875rem", fontWeight: "500" }}>
                                                            {phase18Data.phase17Motor?.shaftDiameterMM ? `${phase18Data.phase17Motor.shaftDiameterMM} mm` : "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Fan Curve Tab - Dynamic Graphs */}
                                        {activeTab === "curve" && (
                                            <div>
                                                <h4 style={{ color: "#1e293b", fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>Fan Performance Curves</h4>

                                                {/* Legend Bar with Checkboxes */}
                                                <div style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "1.5rem",
                                                    justifyContent: "center",
                                                    marginBottom: "1.5rem",
                                                    backgroundColor: "#f1f5f9",
                                                    padding: "0.75rem 1.5rem",
                                                    borderRadius: "8px",
                                                }}>
                                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem" }}>
                                                        <input type="checkbox" checked={curveVisibility.staticPressure} onChange={() => toggleCurveVisibility("staticPressure")} style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#3b82f6" }} />
                                                        <span style={{ color: "#3b82f6", fontWeight: "500" }}>Static Pressure</span>
                                                    </label>
                                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem" }}>
                                                        <input type="checkbox" checked={curveVisibility.fanInputPower} onChange={() => toggleCurveVisibility("fanInputPower")} style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#10b981" }} />
                                                        <span style={{ color: "#10b981", fontWeight: "500" }}>Fan Input Power</span>
                                                    </label>
                                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem" }}>
                                                        <input type="checkbox" checked={curveVisibility.staticEfficiency} onChange={() => toggleCurveVisibility("staticEfficiency")} style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#8b5cf6" }} />
                                                        <span style={{ color: "#8b5cf6", fontWeight: "500" }}>Static Efficiency</span>
                                                    </label>
                                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem" }}>
                                                        <input type="checkbox" checked={curveVisibility.totalEfficiency} onChange={() => toggleCurveVisibility("totalEfficiency")} style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#ec4899" }} />
                                                        <span style={{ color: "#ec4899", fontWeight: "500" }}>Total Efficiency</span>
                                                    </label>
                                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem" }}>
                                                        <input type="checkbox" checked={curveVisibility.systemCurve} onChange={() => toggleCurveVisibility("systemCurve")} style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#ef4444" }} />
                                                        <span style={{ color: "#ef4444", fontWeight: "500" }}>System Curve</span>
                                                    </label>
                                                </div>

                                                {/* Chart Container */}
                                                <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1rem" }}>

                                                    {/* Chart Container */}
                                                    <div style={{ width: "100%", height: "550px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                                        {phase18Data?.phase19 ? (() => {
                                                            const p19 = phase18Data.phase19;
                                                            const p18 = phase18Data.phase18;
                                                            const airflowData = p19.airFlowNew || [];

                                                            if (airflowData.length < 2) {
                                                                return <Text color="#94a3b8">Insufficient data for curves</Text>;
                                                            }

                                                            // Build chart data with interpolation for smooth hover
                                                            // Linear interpolation helper
                                                            const linearInterpolate = (x, xArr, yArr) => {
                                                                if (!xArr || !yArr || xArr.length < 2) return null;
                                                                // Find the two points to interpolate between
                                                                for (let i = 0; i < xArr.length - 1; i++) {
                                                                    if (xArr[i] != null && xArr[i + 1] != null && yArr[i] != null && yArr[i + 1] != null) {
                                                                        if (x >= xArr[i] && x <= xArr[i + 1]) {
                                                                            const t = (x - xArr[i]) / (xArr[i + 1] - xArr[i]);
                                                                            return yArr[i] + t * (yArr[i + 1] - yArr[i]);
                                                                        }
                                                                    }
                                                                }
                                                                return null;
                                                            };

                                                            // Calculate system curve coefficient from Phase 18: a = staticPressure / airFlow²
                                                            const operatingAirFlow = p18?.airFlow || p19.operatingPoint?.airFlow;
                                                            const operatingStaticPressure = p18?.staticPressure || p19.operatingPoint?.staticPressure;
                                                            const systemCoefficient = (operatingAirFlow && operatingAirFlow > 0 && operatingStaticPressure)
                                                                ? operatingStaticPressure / Math.pow(operatingAirFlow, 2)
                                                                : null;

                                                            // Get min/max airflow for interpolation range
                                                            const validAirflowRaw = airflowData.filter(v => v != null);
                                                            const minAirflowRaw = Math.min(...validAirflowRaw);
                                                            const maxAirflowRaw = Math.max(...validAirflowRaw);

                                                            // Generate 80 interpolated points for smooth hover
                                                            const chartData = [];
                                                            const numPoints = 80;
                                                            for (let i = 0; i < numPoints; i++) {
                                                                const x = minAirflowRaw + (i / (numPoints - 1)) * (maxAirflowRaw - minAirflowRaw);
                                                                const point = {
                                                                    x: x,
                                                                    staticPressureNew: linearInterpolate(x, airflowData, p19.staticPressureNew),
                                                                    fanInputPowerNew: linearInterpolate(x, airflowData, p19.fanInputPowerNew),
                                                                    staticEfficiencyNew: linearInterpolate(x, airflowData, p19.staticEfficiencyNew) != null
                                                                        ? linearInterpolate(x, airflowData, p19.staticEfficiencyNew) * 100 : null,
                                                                    totalEfficiencyNew: linearInterpolate(x, airflowData, p19.totalEfficiencyNew) != null
                                                                        ? linearInterpolate(x, airflowData, p19.totalEfficiencyNew) * 100 : null,
                                                                    systemCurve: systemCoefficient != null
                                                                        ? systemCoefficient * Math.pow(x, 2) : null,
                                                                };
                                                                chartData.push(point);
                                                            }

                                                            // Sort by airflow (x) for proper line rendering
                                                            chartData.sort((a, b) => a.x - b.x);

                                                            // Calculate axis domains
                                                            const validAirflow = chartData.map(d => d.x).filter(v => v != null);
                                                            const minAirflow = Math.min(...validAirflow);
                                                            const maxAirflow = Math.max(...validAirflow);

                                                            const validPressure = chartData.map(d => d.staticPressureNew).filter(v => v != null);
                                                            const validSystem = chartData.map(d => d.systemCurve).filter(v => v != null);
                                                            const maxPressure = Math.max(...validPressure, ...validSystem, 100);

                                                            const validPower = chartData.map(d => d.fanInputPowerNew).filter(v => v != null);
                                                            const maxPower = Math.max(...validPower, 1);

                                                            // Generate nice tick values for X-axis (5-7 ticks)
                                                            const xRange = maxAirflow - minAirflow;
                                                            const xTickInterval = Math.ceil(xRange / 6 / 1000) * 1000; // Round to nearest 1000
                                                            const xTicks = [];
                                                            const xStart = Math.floor(minAirflow / xTickInterval) * xTickInterval;
                                                            for (let tick = xStart; tick <= maxAirflow + xTickInterval; tick += xTickInterval) {
                                                                if (tick >= 0) xTicks.push(tick);
                                                            }

                                                            // Generate nice tick values for Pressure Y-axis (5-6 ticks)
                                                            const pressureDomain = Math.ceil(maxPressure * 1.1 / 50) * 50;
                                                            const pressureTickInterval = Math.ceil(pressureDomain / 6 / 50) * 50;
                                                            const pressureTicks = [];
                                                            for (let tick = 0; tick <= pressureDomain; tick += pressureTickInterval) {
                                                                pressureTicks.push(tick);
                                                            }

                                                            // Generate nice tick values for Power Y-axis (5-6 ticks)
                                                            const powerDomain = Math.ceil(maxPower * 1.2 * 10) / 10;
                                                            const powerTickInterval = Math.ceil(powerDomain / 6 * 10) / 10;
                                                            const powerTicks = [];
                                                            for (let tick = 0; tick <= powerDomain + powerTickInterval; tick += powerTickInterval) {
                                                                powerTicks.push(Math.round(tick * 100) / 100);
                                                            }

                                                            return (
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <LineChart data={chartData} margin={{ top: 20, right: 90, left: 30, bottom: 50 }}>
                                                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                                        <XAxis
                                                                            dataKey="x"
                                                                            type="number"
                                                                            domain={[xTicks[0] || 0, xTicks[xTicks.length - 1] || maxAirflow]}
                                                                            ticks={xTicks}
                                                                            stroke="#94a3b8"
                                                                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                                                                            tickFormatter={(value) => Math.round(value).toLocaleString()}
                                                                            label={{ value: `Airflow (${units?.airFlow || "m³/h"})`, position: "insideBottom", fill: "#1e293b", fontSize: 14, fontWeight: "bold", dy: 15 }}
                                                                        />
                                                                        {/* Left Y-axis for Pressure */}
                                                                        <YAxis
                                                                            yAxisId="pressure"
                                                                            orientation="left"
                                                                            domain={[0, pressureDomain]}
                                                                            ticks={pressureTicks}
                                                                            stroke="#3b82f6"
                                                                            tick={{ fill: "#3b82f6", fontSize: 12 }}
                                                                            tickFormatter={(value) => Math.round(value)}
                                                                            label={{ value: `Pressure (${units?.pressure || "Pa"})`, angle: -90, position: "insideLeft", fill: "#3b82f6", fontSize: 13, fontWeight: "bold", dx: -15 }}
                                                                        />
                                                                        {/* Right Y-axis for Efficiency (0-100%) */}
                                                                        <YAxis
                                                                            yAxisId="efficiency"
                                                                            orientation="right"
                                                                            domain={[0, 100]}
                                                                            ticks={[0, 20, 40, 60, 80, 100]}
                                                                            stroke="#8b5cf6"
                                                                            tick={{ fill: "#8b5cf6", fontSize: 12 }}
                                                                            label={{ value: "Efficiency (%)", angle: 90, position: "insideRight", fill: "#8b5cf6", fontSize: 13, fontWeight: "bold", dx: -12 }}
                                                                        />
                                                                        {/* Far right Y-axis for Power - always visible */}
                                                                        <YAxis
                                                                            yAxisId="power"
                                                                            orientation="right"
                                                                            domain={[0, powerDomain]}
                                                                            ticks={powerTicks.slice(0, 6)}
                                                                            stroke="#10b981"
                                                                            tick={{ fill: "#10b981", fontSize: 12 }}
                                                                            tickFormatter={(value) => value.toFixed(1)}
                                                                            label={{ value: `Power (${units?.power || "kW"})`, angle: 90, position: "insideRight", fill: "#10b981", fontSize: 13, fontWeight: "bold", dx: 0 }}
                                                                        />
                                                                        <Tooltip
                                                                            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                                                                            labelStyle={{ color: "#e2e8f0" }}
                                                                            labelFormatter={(value) => `Airflow: ${Math.round(value).toLocaleString()} ${units?.airFlow || "m³/h"}`}
                                                                            formatter={(value, name) => {
                                                                                if (value == null) return ["-", name];
                                                                                if (name === "Static Pressure" || name === "System Curve")
                                                                                    return [`${value.toFixed(1)} ${units?.pressure || "Pa"}`, name];
                                                                                if (name === "Fan Input Power")
                                                                                    return [`${value.toFixed(3)} ${units?.power || "kW"}`, name];
                                                                                if (name === "Static Efficiency" || name === "Total Efficiency")
                                                                                    return [`${value.toFixed(1)}%`, name];
                                                                                return [value.toFixed(2), name];
                                                                            }}
                                                                        />

                                                                        {/* Static Pressure Line */}
                                                                        {curveVisibility.staticPressure && (
                                                                            <Line
                                                                                yAxisId="pressure"
                                                                                type="monotone"
                                                                                dataKey="staticPressureNew"
                                                                                stroke="#3b82f6"
                                                                                strokeWidth={2}
                                                                                dot={false}
                                                                                activeDot={{ r: 5 }}
                                                                                name="Static Pressure"
                                                                                connectNulls
                                                                            />
                                                                        )}

                                                                        {/* Fan Input Power Line - always render to keep Y-axis visible */}
                                                                        <Line
                                                                            yAxisId="power"
                                                                            type="monotone"
                                                                            dataKey="fanInputPowerNew"
                                                                            stroke={curveVisibility.fanInputPower ? "#10b981" : "transparent"}
                                                                            strokeWidth={curveVisibility.fanInputPower ? 2 : 0}
                                                                            dot={false}
                                                                            activeDot={curveVisibility.fanInputPower ? { r: 5 } : false}
                                                                            name="Fan Input Power"
                                                                            connectNulls
                                                                        />

                                                                        {/* Static Efficiency Line */}
                                                                        {curveVisibility.staticEfficiency && (
                                                                            <Line
                                                                                yAxisId="efficiency"
                                                                                type="monotone"
                                                                                dataKey="staticEfficiencyNew"
                                                                                stroke="#8b5cf6"
                                                                                strokeWidth={2}
                                                                                dot={false}
                                                                                activeDot={{ r: 5 }}
                                                                                name="Static Efficiency"
                                                                                connectNulls
                                                                            />
                                                                        )}

                                                                        {/* Total Efficiency Line */}
                                                                        {curveVisibility.totalEfficiency && (
                                                                            <Line
                                                                                yAxisId="efficiency"
                                                                                type="monotone"
                                                                                dataKey="totalEfficiencyNew"
                                                                                stroke="#ec4899"
                                                                                strokeWidth={2}
                                                                                dot={false}
                                                                                activeDot={{ r: 5 }}
                                                                                name="Total Efficiency"
                                                                                connectNulls
                                                                            />
                                                                        )}

                                                                        {/* System Curve Line (y = a * x²) */}
                                                                        {curveVisibility.systemCurve && (
                                                                            <Line
                                                                                yAxisId="pressure"
                                                                                type="monotone"
                                                                                dataKey="systemCurve"
                                                                                stroke="#ef4444"
                                                                                strokeWidth={2}
                                                                                strokeDasharray="5 5"
                                                                                dot={false}
                                                                                name="System Curve"
                                                                                connectNulls
                                                                            />
                                                                        )}
                                                                    </LineChart>
                                                                </ResponsiveContainer>
                                                            );
                                                        })() : (
                                                            <Text color="#94a3b8">No curve data available. Please select a fan configuration.</Text>
                                                        )}

                                                    </div>
                                                </div>

                                                {/* Operating Point Summary Bar */}
                                                {phase18Data?.phase18 && (
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", marginTop: "1.5rem", backgroundColor: "#e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                                                        <div style={{ textAlign: "center", padding: "1rem", borderRight: "1px solid #cbd5e1" }}>
                                                            <Text color="#1e293b" fontSize="xl" fontWeight="bold">
                                                                {phase18Data.phase18.staticPressure?.toFixed(2) || "—"}
                                                            </Text>
                                                            <Text color="#64748b" fontSize="xs" textTransform="uppercase" mt={1}>Pressure</Text>
                                                        </div>
                                                        <div style={{ textAlign: "center", padding: "1rem", borderRight: "1px solid #cbd5e1" }}>
                                                            <Text color="#1e293b" fontSize="xl" fontWeight="bold">
                                                                {phase18Data.phase18.fanInputPower?.toFixed(3) || "—"}
                                                            </Text>
                                                            <Text color="#64748b" fontSize="xs" textTransform="uppercase" mt={1}>Power</Text>
                                                        </div>
                                                        <div style={{ textAlign: "center", padding: "1rem", borderRight: "1px solid #cbd5e1" }}>
                                                            <Text color="#1e293b" fontSize="xl" fontWeight="bold">
                                                                {phase18Data.phase18.staticEfficiency ? (phase18Data.phase18.staticEfficiency * 100).toFixed(1) : "—"}
                                                            </Text>
                                                            <Text color="#64748b" fontSize="xs" textTransform="uppercase" mt={1}>Static Eff.</Text>
                                                        </div>
                                                        <div style={{ textAlign: "center", padding: "1rem" }}>
                                                            <Text color="#1e293b" fontSize="xl" fontWeight="bold">
                                                                {phase18Data.phase18.totalEfficiency ? (phase18Data.phase18.totalEfficiency * 100).toFixed(1) : "—"}
                                                            </Text>
                                                            <Text color="#64748b" fontSize="xs" textTransform="uppercase" mt={1}>Total Eff.</Text>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Noise Graph Tab - Using Phase 20 data with bar charts */}
                                        {activeTab === "noise" && (
                                            <div>
                                                {phase18Data?.phase20 ? (() => {
                                                    const noiseData = phase18Data.phase20;
                                                    const frequencies = noiseData.frequencies || [62, 125, 250, 500, 1000, 2000, 4000, 8000];

                                                    // Prepare data for bar charts - remove Hz from labels
                                                    const lwSpectrum = frequencies.map((freq, idx) => ({
                                                        frequency: String(freq),
                                                        soundPower: noiseData.LW_array?.[idx] || 0
                                                    }));

                                                    const lpSpectrum = frequencies.map((freq, idx) => ({
                                                        frequency: String(freq),
                                                        soundPressure: noiseData.LP_array?.[idx] || 0
                                                    }));

                                                    // Colors for bars - gradient blues and teals
                                                    const lwBarColors = ["#3b82f6", "#3b82f6", "#3b82f6", "#3b82f6", "#3b82f6", "#3b82f6", "#3b82f6", "#3b82f6"];
                                                    const lpBarColors = ["#14b8a6", "#14b8a6", "#14b8a6", "#14b8a6", "#14b8a6", "#14b8a6", "#14b8a6", "#14b8a6"];

                                                    return (
                                                        <>
                                                            {/* Summary Cards - Colored backgrounds */}
                                                            <div style={{
                                                                display: "grid",
                                                                gridTemplateColumns: "repeat(4, 1fr)",
                                                                gap: "1rem",
                                                                marginBottom: "1.5rem"
                                                            }}>
                                                                <div style={{ background: "#dbeafe", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
                                                                    <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.5rem", textTransform: "uppercase" }}>LW(A)</div>
                                                                    <div style={{ color: "#3b82f6", fontSize: "1.75rem", fontWeight: "bold" }}>
                                                                        {noiseData.LW?.total?.toFixed(1) || "—"}<span style={{ fontSize: "0.875rem", fontWeight: "normal" }}> dB(A)</span>
                                                                    </div>
                                                                </div>
                                                                <div style={{ background: "#fef3c7", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
                                                                    <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.5rem", textTransform: "uppercase" }}>LP(A)</div>
                                                                    <div style={{ color: "#f59e0b", fontSize: "1.75rem", fontWeight: "bold" }}>
                                                                        {noiseData.LP?.total?.toFixed(1) || "—"}<span style={{ fontSize: "0.875rem", fontWeight: "normal" }}> dB(A)</span>
                                                                    </div>
                                                                </div>
                                                                <div style={{ background: "#d1fae5", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
                                                                    <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.5rem", textTransform: "uppercase" }}>Directivity (Q)</div>
                                                                    <div style={{ color: "#10b981", fontSize: "1.75rem", fontWeight: "bold" }}>
                                                                        {noiseData.parameters?.directivityQ || 1}
                                                                    </div>
                                                                </div>
                                                                <div style={{ background: "#fce7f3", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
                                                                    <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "0.5rem", textTransform: "uppercase" }}>Distance (r)</div>
                                                                    <div style={{ color: "#ec4899", fontSize: "1.75rem", fontWeight: "bold" }}>
                                                                        {noiseData.parameters?.distance || 3}<span style={{ fontSize: "0.875rem", fontWeight: "normal" }}>m</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Two Graphs Side by Side */}
                                                            <div style={{
                                                                display: "grid",
                                                                gridTemplateColumns: "1fr 1fr",
                                                                gap: "1.5rem",
                                                                marginBottom: "1.5rem"
                                                            }}>
                                                                {/* LW(A) Graph */}
                                                                <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem" }}>
                                                                    <h4 style={{ color: "#1e293b", fontSize: "0.9375rem", fontWeight: "600", marginBottom: "1rem" }}>Sound Power Spectrum</h4>
                                                                    <div style={{ width: "100%", height: "280px" }}>
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <BarChart data={lwSpectrum} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                                                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                                                <XAxis
                                                                                    dataKey="frequency"
                                                                                    stroke="#94a3b8"
                                                                                    tick={{ fill: "#64748b", fontSize: 11 }}
                                                                                    label={{ value: "Frequency (Hz)", position: "insideBottom", offset: -10, fill: "#64748b", style: { fontSize: "12px" } }}
                                                                                />
                                                                                <YAxis
                                                                                    stroke="#94a3b8"
                                                                                    tick={{ fill: "#64748b", fontSize: 11 }}
                                                                                    domain={[0, "auto"]}
                                                                                    label={{ value: "dB", angle: -90, position: "insideLeft", fill: "#64748b", dx: 10, style: { fontSize: "12px" } }}
                                                                                />
                                                                                <Bar dataKey="soundPower" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                                                                    {lwSpectrum.map((entry, index) => (
                                                                                        <Cell key={`lw-cell-${index}`} fill={lwBarColors[index % lwBarColors.length]} />
                                                                                    ))}
                                                                                </Bar>
                                                                            </BarChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>

                                                                {/* LP(A) Graph */}
                                                                <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem" }}>
                                                                    <h4 style={{ color: "#1e293b", fontSize: "0.9375rem", fontWeight: "600", marginBottom: "1rem" }}>Sound Pressure Spectrum</h4>
                                                                    <div style={{ width: "100%", height: "280px" }}>
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <BarChart data={lpSpectrum} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                                                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                                                <XAxis
                                                                                    dataKey="frequency"
                                                                                    stroke="#94a3b8"
                                                                                    tick={{ fill: "#64748b", fontSize: 11 }}
                                                                                    label={{ value: "Frequency (Hz)", position: "insideBottom", offset: -10, fill: "#64748b", style: { fontSize: "12px" } }}
                                                                                />
                                                                                <YAxis
                                                                                    stroke="#94a3b8"
                                                                                    tick={{ fill: "#64748b", fontSize: 11 }}
                                                                                    domain={[0, "auto"]}
                                                                                    label={{ value: "dB", angle: -90, position: "insideLeft", fill: "#64748b", dx: 10, style: { fontSize: "12px" } }}
                                                                                />
                                                                                <Bar dataKey="soundPressure" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                                                                    {lpSpectrum.map((entry, index) => (
                                                                                        <Cell key={`lp-cell-${index}`} fill={lpBarColors[index % lpBarColors.length]} />
                                                                                    ))}
                                                                                </Bar>
                                                                            </BarChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Octave Band Data Table */}
                                                            <div>
                                                                <h4 style={{ color: "#1e293b", fontSize: "0.9375rem", fontWeight: "600", marginBottom: "1rem" }}>Octave Band Data</h4>
                                                                <div style={{ overflowX: "auto", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                                                                        <thead>
                                                                            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                                                <th style={{ padding: "0.875rem 1rem", textAlign: "left", color: "#64748b", fontWeight: "500", fontSize: "0.75rem", textTransform: "uppercase" }}>Frequency</th>
                                                                                {frequencies.map((freq, i) => (
                                                                                    <th key={i} style={{ padding: "0.875rem 1rem", textAlign: "center", color: "#64748b", fontWeight: "500", fontSize: "0.75rem" }}>{freq} Hz</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                                                                <td style={{ padding: "0.875rem 1rem", textAlign: "left", color: "#64748b", fontWeight: "500" }}>LW (dB)</td>
                                                                                {noiseData.LW_array?.map((val, i) => (
                                                                                    <td key={i} style={{ padding: "0.875rem 1rem", textAlign: "center", color: "#3b82f6", fontWeight: "600" }}>{val?.toFixed(1)}</td>
                                                                                ))}
                                                                            </tr>
                                                                            <tr>
                                                                                <td style={{ padding: "0.875rem 1rem", textAlign: "left", color: "#64748b", fontWeight: "500" }}>LP (dB)</td>
                                                                                {noiseData.LP_array?.map((val, i) => (
                                                                                    <td key={i} style={{ padding: "0.875rem 1rem", textAlign: "center", color: "#14b8a6", fontWeight: "600" }}>{val?.toFixed(1)}</td>
                                                                                ))}
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>


                                                        </>
                                                    );
                                                })() : (
                                                    <div className="detail-card" style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                                                        <p>Unable to calculate noise data. Missing fan input power or static pressure values.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Box>
                                )}

                                {/* Action Buttons - Inside Card */}
                                <Flex justify="space-between" align="center" gap={4} mt={6} pt={4} borderTop="1px solid #e2e8f0">
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
            <Text color="#64748b" fontSize="xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wider" mb={1}>
                {label}
            </Text>
            <Text color="#e2e8f0" fontSize="sm" fontWeight="medium">
                {value || "—"}
            </Text>
        </Box>
    );
}
