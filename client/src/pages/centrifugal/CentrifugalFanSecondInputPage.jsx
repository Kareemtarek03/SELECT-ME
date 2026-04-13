import React, { useState, useEffect } from "react";
import {
    Box,
    Stack,
    Input,
    Button,
    Heading,
    Text,
    Grid,
    Spinner,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useFormData } from "../../context/FormContext";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";

export default function CentrifugalFanSecondInputPage() {
    const navigate = useNavigate();
    const { results: contextResults, setResults } = useFormData();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        insulationClass: "F",
        spf: 10,
        numberOfPhases: 3,
        numberOfPoles: 4,
        frictionLosses: 15,
        beltType: "SPA",
        maxRpmChange: 50,
        distance: 3,
        directivityQ: 1,
    });

    const selectedFan = contextResults?.selectedCentrifugalFan;

    useEffect(() => {
        if (!selectedFan) {
            navigate("/centrifugal/results");
        }
    }, [selectedFan, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { API_BASE: apiBaseUrl } = await import("../../utils/api");

            console.log("=== Starting Phase 11-16 Processing ===");
            console.log("Selected Fan for processing:", selectedFan);
            console.log("Form Data:", formData);

            // Step 1: Phase 11 - Belt Selection
            const phase11Payload = {
                selectedFan: selectedFan,
                beltType: formData.beltType,
                motorPoles: parseInt(formData.numberOfPoles),
                fanRPM: selectedFan.rpm,
            };
            console.log("Phase 11 Payload:", phase11Payload);

            const phase11Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase11`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(phase11Payload),
            });

            if (!phase11Resp.ok) {
                const errData = await phase11Resp.json();
                console.error("Phase 11 Error:", errData);
                throw new Error(errData.details || "Phase 11 failed");
            }
            const phase11Data = await phase11Resp.json();
            console.log("Phase 11 Result:", phase11Data);

            // Step 2: Phase 12 - Pulley Validation
            const phase12Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase12`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phase11Result: phase11Data.phase11,
                    selectedFan: selectedFan,
                    frictionLossesPercent: parseFloat(formData.frictionLosses),
                    spfPercent: parseFloat(formData.spf),
                }),
            });

            if (!phase12Resp.ok) {
                const errData = await phase12Resp.json();
                console.error("Phase 12 Error:", errData);
                throw new Error(errData.details || "Phase 12 failed");
            }
            const phase12Data = await phase12Resp.json();
            console.log("Phase 12 Result:", phase12Data);

            // Step 3: Phase 13 - Motor Selection (for each row in Phase 12)
            // Original index.ejs calls Phase 13 for EACH row to get motor selections
            const phase12Arrays = phase12Data.phase12?.arrays || phase12Data.phase12;
            const entryCount = phase12Arrays?.fanInputPower_new?.length || 0;
            console.log("Phase 13 - Processing", entryCount, "entries");

            const motorSelections = [];
            for (let i = 0; i < entryCount; i++) {
                const netFanPowerKW = phase12Arrays.fanInputPower_new?.[i];
                if (netFanPowerKW && formData.numberOfPoles && formData.numberOfPhases && formData.insulationClass) {
                    try {
                        const resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase13`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                netFanPowerKW: netFanPowerKW,
                                userPoles: parseInt(formData.numberOfPoles),
                                userPhases: parseInt(formData.numberOfPhases),
                                userInsulationClass: formData.insulationClass,
                            }),
                        });
                        const d = await resp.json();
                        motorSelections.push(d.phase13 || null);
                    } catch (e) {
                        console.error("Row", i, "- Phase 13 error:", e);
                        motorSelections.push(null);
                    }
                } else {
                    motorSelections.push(null);
                }
            }
            console.log("Phase 13 - Motor selections count:", motorSelections.length);

            // Step 4: Phase 14 - Motor Pulley D1 Validation
            // Use Phase 12 filtered arrays (not original Phase 11 arrays) to maintain index alignment
            // This matches the original index.ejs logic
            const phase14Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase14`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phase11Arrays: phase12Arrays,
                    phase13Motors: motorSelections,
                    beltType: formData.beltType,
                }),
            });

            if (!phase14Resp.ok) {
                const errData = await phase14Resp.json();
                console.error("Phase 14 Error:", errData);
                throw new Error(errData.details || "Phase 14 failed");
            }
            const phase14Data = await phase14Resp.json();
            console.log("Phase 14 Result:", phase14Data);

            // Step 5: Phase 15 - Belt Geometry & Standardization
            const phase15Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase15`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phase12Arrays: phase12Data.phase12?.arrays || phase12Data.phase12,
                    phase14Arrays: phase14Data.phase14?.arrays || phase14Data.phase14,
                    innerDiameter: selectedFan.innerDiameter,
                    beltSection: formData.beltType,
                }),
            });

            if (!phase15Resp.ok) {
                const errData = await phase15Resp.json();
                console.error("Phase 15 Error:", errData);
                throw new Error(errData.details || "Phase 15 failed");
            }
            const phase15Data = await phase15Resp.json();
            console.log("Phase 15 Result:", phase15Data);

            // Step 6: Phase 16 - Consolidated Filter Table
            // Pass the nested .arrays property directly, matching original index.ejs logic
            const phase16Payload = {
                phase11Data: phase11Data.phase11,
                phase12Arrays: phase12Data.phase12?.arrays || phase12Data.phase12,
                phase14Arrays: phase14Data.phase14?.arrays || phase14Data.phase14,
                phase15Arrays: phase15Data.phase15?.arrays || phase15Data.phase15,
                userRPM: selectedFan.rpm,
                maxRpmChange: parseFloat(formData.maxRpmChange),
            };
            console.log("Phase 16 Payload:", phase16Payload);
            const phase16Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase16`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(phase16Payload),
            });

            if (!phase16Resp.ok) {
                const errData = await phase16Resp.json();
                console.error("Phase 16 Error:", errData);
                throw new Error(errData.details || "Phase 16 failed");
            }
            const phase16Data = await phase16Resp.json();
            console.log("Phase 16 Result:", phase16Data);
            console.log("Phase 16 Rows:", phase16Data.phase16?.rows);

            // Step 7: Phase 18 - Calculate for ALL Phase 16 rows
            const phase16Rows = phase16Data.phase16?.rows || [];
            console.log("=== Phase 18 Batch Processing ===");
            console.log("Processing", phase16Rows.length, "Phase 16 rows for Phase 18");

            const phase18Results = [];
            for (let i = 0; i < phase16Rows.length; i++) {
                const row = phase16Rows[i];
                // Get the motor data from Phase 13 for this row
                const phase17Motor = motorSelections?.[row.index] || motorSelections?.[i] || null;
                console.log("🔍 phase17Motor:", phase17Motor);
                try {
                    const phase18Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase18`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            selectedFan: selectedFan,
                            phase16Row: row,
                            phase17Motor: phase17Motor,
                            userPoles: parseInt(formData.numberOfPoles) || 4,
                            userPhases: parseInt(formData.numberOfPhases) || 3,
                            innerDiameter: selectedFan?.innerDiameter,
                        }),
                    });

                    if (phase18Resp.ok) {
                        const phase18Data = await phase18Resp.json();

                        // Step 8: Phase 19 - Generate curve data for this configuration
                        let phase19Data = null;
                        try {
                            // Use curveArrays (sorted from Phase 9) for Phase 19 curve generation
                            // curveArrays contains arrays sorted by airflow ascending
                            console.log("Phase 19 - selectedFan.curveArrays exists:", !!selectedFan?.curveArrays);
                            console.log("Phase 19 - selectedFan.curveArrays?.airFlow first 3:", selectedFan?.curveArrays?.airFlow?.slice(0, 3));
                            console.log("Phase 19 - selectedFan.originalFanData exists:", !!selectedFan?.originalFanData);

                            const phase19Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase19`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    selectedFan: selectedFan, // Contains curveArrays (sorted) and RPM
                                    phase18Result: phase18Data.phase18,
                                }),
                            });

                            if (phase19Resp.ok) {
                                const phase19Result = await phase19Resp.json();
                                phase19Data = phase19Result.phase19;
                            } else {
                                console.warn(`Phase 19 failed for row ${i}`);
                            }
                        } catch (phase19Err) {
                            console.error(`Phase 19 error for row ${i}:`, phase19Err);
                        }

                        // Step 9: Phase 20 - Generate noise data for this configuration
                        let phase20Data = null;
                        try {
                            const phase20Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase20`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    phase18Result: phase18Data.phase18,
                                    distance: formData.distance,        // User-selected distance in meters
                                    directivityQ: formData.directivityQ, // User-selected directivity factor
                                    safetyFactor: formData.spf / 100    // User-selected safety factor (convert from % to decimal)
                                }),
                            });

                            if (phase20Resp.ok) {
                                const phase20Result = await phase20Resp.json();
                                phase20Data = phase20Result.phase20;
                            } else {
                                console.warn(`Phase 20 failed for row ${i}`);
                            }
                        } catch (phase20Err) {
                            console.error(`Phase 20 error for row ${i}:`, phase20Err);
                        }

                        phase18Results.push({
                            phase16Row: row,
                            phase17Motor: phase17Motor,
                            phase18: phase18Data.phase18,
                            phase19: phase19Data, // Include curve data
                            phase20: phase20Data, // Include noise data
                            index: i,
                        });
                    } else {
                        console.warn(`Phase 18 failed for row ${i}`);
                        phase18Results.push(null);
                    }
                } catch (err) {
                    console.error(`Phase 18 error for row ${i}:`, err);
                    phase18Results.push(null);
                }
            }

            console.log("Phase 18 Results:", phase18Results.filter(r => r !== null).length, "successful");
            console.log("Phase 19 (Curve Data) Results:", phase18Results.filter(r => r !== null && r.phase19 !== null).length, "successful");

            // Store all phase results and navigate to final results
            setResults((prev) => ({
                ...prev,
                phase11: phase11Data.phase11,
                phase12: phase12Data.phase12,
                phase13: motorSelections,
                phase14: phase14Data.phase14,
                phase15: phase15Data.phase15,
                phase16: phase16Data.phase16,
                phase18All: phase18Results.filter(r => r !== null), // All Phase 18 results
                secondInputData: formData,
            }));

            navigate("/centrifugal/final-result");
        } catch (err) {
            console.error("Phase processing error:", err);
            setMessage({
                type: "error",
                text: err.message || "Failed to process fan configuration.",
            });
        } finally {
            setLoading(false);
        }
    };

    const cardStyle = {
        bg: "white",
        borderRadius: "8px",
        p: 3,
        border: "1px solid #e2e8f0",
    };

    const inputStyle = {
        bg: "#f8fafc",
        color: "#1e293b",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        size: "md",
        h: "44px",
        fontSize: "md",
        _placeholder: { color: "#94a3b8" },
        _focus: { boxShadow: "0 0 0 2px #3b82f6", borderColor: "#3b82f6" },
        _hover: { borderColor: "#cbd5e1" },
    };

    const selectStyle = {
        width: "100%",
        padding: "10px 12px",
        backgroundColor: "#f8fafc",
        color: "#1e293b",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "14px",
        cursor: "pointer",
        height: "44px",
    };

    const sectionTitleStyle = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        mb: 3,
        mt: 2,
    };

    const labelStyle = {
        fontSize: "xs",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "wider",
        fontWeight: "medium",
        mb: 2,
    };

    const currentYear = new Date().getFullYear();

    if (!selectedFan) {
        return (
            <Box bg="white" h="100vh" display="flex" alignItems="center" justifyContent="center">
                <Spinner size="xl" color="#3b82f6" />
            </Box>
        );
    }

    return (
        <Box
            bg="white"
            h="100vh"
            display="flex"
            flexDirection="column"
            overflow="hidden"
            position="relative"
        >
            <HamburgerMenu />

            <Box flex={1} overflow="auto" px={6} py={4} bg="#f8fafc">
                <Box maxW="1200px" w="100%" mx="auto" bg="white" borderRadius="16px" p={{ base: 4, md: 6 }} boxShadow="0 1px 3px rgba(0,0,0,0.05)">
                    <Box mb={4}>
                        <Heading size="lg" color="#1e293b" mb={1} fontWeight="bold">
                            Configure {selectedFan?.fanModel || "Centrifugal Fan"}
                        </Heading>
                        <Text fontSize="sm" color="#64748b">
                            Set motor, belt, and sound parameters for the selected fan.
                        </Text>
                    </Box>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                        <Stack spacing={6}>
                            {/* Motor Data Section */}
                            <Box>
                                <Box {...sectionTitleStyle}>
                                    <Text fontSize="md" fontWeight="semibold" color="#1e293b">⚡ Motor Data</Text>
                                </Box>
                                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle} mb={0}>Insulation Class</Text>

                                        </Box>
                                        <select
                                            name="insulationClass"
                                            value={formData.insulationClass}
                                            onChange={(e) => handleSelectChange("insulationClass", e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="F">F</option>
                                            <option value="F(Atex)">F (ATEX)</option>
                                            <option value="H (F300)">H (F300)</option>
                                            <option value="H(F400)">H (F400)</option>
                                        </select>
                                    </Box>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle} mb={0}>S.P.F</Text>

                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Input
                                                name="spf"
                                                type="number"
                                                value={formData.spf}
                                                onChange={handleInputChange}
                                                placeholder="10"
                                                {...inputStyle}
                                                flex={1}
                                            />
                                            <Text color="#64748b" fontSize="sm" bg="#f8fafc" px={3} py={2} borderRadius="8px" border="1px solid #e2e8f0" h="44px" display="flex" alignItems="center">%</Text>
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle} mb={0}>Phases</Text>

                                        </Box>
                                        <select
                                            name="numberOfPhases"
                                            value={formData.numberOfPhases}
                                            onChange={(e) => handleSelectChange("numberOfPhases", e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="1">1</option>
                                            <option value="3">3</option>
                                        </select>
                                    </Box>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle} mb={0}>Poles</Text>

                                        </Box>
                                        <select
                                            name="numberOfPoles"
                                            value={formData.numberOfPoles}
                                            onChange={(e) => handleSelectChange("numberOfPoles", e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="2">2</option>
                                            <option value="4">4</option>
                                            <option value="6">6</option>
                                            <option value="8">8</option>
                                        </select>
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Belt Selection Section */}
                            <Box borderTop="1px solid #e2e8f0" pt={4}>
                                <Box {...sectionTitleStyle}>
                                    <Text fontSize="md" fontWeight="semibold" color="#1e293b">🔧 Belt Selection</Text>
                                </Box>
                                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle} mb={0}>Friction Losses</Text>

                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Input
                                                name="frictionLosses"
                                                type="number"
                                                value={formData.frictionLosses}
                                                onChange={handleInputChange}
                                                placeholder="15"
                                                {...inputStyle}
                                                flex={1}
                                            />
                                            <Text color="#64748b" fontSize="sm" bg="#f8fafc" px={3} py={2} borderRadius="8px" border="1px solid #e2e8f0" h="44px" display="flex" alignItems="center">%</Text>
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle} mb={0}>Belt Type</Text>
                                        </Box>
                                        <select
                                            name="beltType"
                                            value={formData.beltType}
                                            onChange={(e) => handleSelectChange("beltType", e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="SPA">SPA</option>
                                            <option value="SPB">SPB</option>
                                            <option value="SPC">SPC</option>
                                            <option value="SPZ">SPZ</option>
                                        </select>
                                    </Box>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle} mb={0}>Max RPM Change</Text>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Input
                                                name="maxRpmChange"
                                                type="number"
                                                value={formData.maxRpmChange}
                                                onChange={handleInputChange}
                                                placeholder="50"
                                                {...inputStyle}
                                                flex={1}
                                            />
                                            <Text color="#64748b" fontSize="sm" bg="#f8fafc" px={3} py={2} borderRadius="8px" border="1px solid #e2e8f0" h="44px" display="flex" alignItems="center">rpm</Text>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Sound Data Section */}
                            <Box borderTop="1px solid #e2e8f0" pt={4}>
                                <Box {...sectionTitleStyle}>
                                    <Text fontSize="md" fontWeight="semibold" color="#1e293b">🔊 Sound Data</Text>
                                </Box>
                                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle} mb={0}>Distance</Text>

                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <select
                                                name="distance"
                                                value={formData.distance}
                                                onChange={(e) => handleSelectChange("distance", parseFloat(e.target.value))}
                                                style={{ ...selectStyle, flex: 1 }}
                                            >
                                                {[1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
                                            <Text color="#64748b" fontSize="sm" bg="#f8fafc" px={3} py={2} borderRadius="8px" border="1px solid #e2e8f0" h="44px" display="flex" alignItems="center">m</Text>
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle} mb={0}>Directivity (Q)</Text>

                                        </Box>
                                        <select
                                            name="directivityQ"
                                            value={formData.directivityQ}
                                            onChange={(e) => handleSelectChange("directivityQ", parseInt(e.target.value))}
                                            style={selectStyle}
                                        >
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={4}>4</option>
                                            <option value={8}>8</option>
                                        </select>
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Error/Warning Message */}
                            {message && (
                                <Box
                                    bg={message.type === "error" ? "#fef2f2" : "#fffbeb"}
                                    borderRadius="lg"
                                    p={3}
                                    textAlign="center"
                                    color={message.type === "error" ? "#dc2626" : "#d97706"}
                                    fontWeight="medium"
                                    fontSize="sm"
                                    border="1px solid"
                                    borderColor={message.type === "error" ? "#fecaca" : "#fde68a"}
                                >
                                    {message.text}
                                </Box>
                            )}

                            {/* Action Buttons - Inside Card */}
                            <Box display="flex" justifyContent="space-between" alignItems="center" pt={4} mt={2} borderTop="1px solid #e2e8f0">
                                <Button
                                    variant="ghost"
                                    color="#64748b"
                                    type="button"
                                    size="md"
                                    onClick={() => navigate("/centrifugal/results")}
                                    _hover={{ bg: "#f1f5f9" }}
                                    leftIcon={<Text>←</Text>}
                                    fontWeight="medium"
                                >
                                    Back
                                </Button>
                                <Button
                                    bg="#3b82f6"
                                    color="white"
                                    type="submit"
                                    size="md"
                                    isLoading={loading}
                                    px={8}
                                    borderRadius="8px"
                                    _hover={{ bg: "#2563eb" }}
                                    _active={{ transform: "scale(0.98)" }}
                                    fontWeight="semibold"
                                    h="44px"
                                    onClick={handleSubmit}
                                >
                                    Calculate Configuration
                                </Button>
                            </Box>

                        </Stack>
                    </form>
                </Box>
            </Box>

            <Box py={3} textAlign="center" color="#94a3b8" fontSize="xs" bg="white" borderTop="1px solid #e2e8f0">
                <Text>© {currentYear} Mechatronics Fan Selector. All rights reserved.</Text>
            </Box>
        </Box>
    );
}
