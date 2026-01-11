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
            const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "";

            // Phase 11 - Belt Selection
            const phase11Payload = {
                selectedFan: selectedFan,
                beltType: formData.beltType,
                motorPoles: parseInt(formData.numberOfPoles),
                fanRPM: selectedFan.rpm,
            };

            const phase11Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase11`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(phase11Payload),
            });

            if (!phase11Resp.ok) {
                const errData = await phase11Resp.json();
                throw new Error(errData.details || "Phase 11 failed");
            }
            const phase11Data = await phase11Resp.json();

            // Phase 12 - Pulley Validation
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
                throw new Error(errData.details || "Phase 12 failed");
            }
            const phase12Data = await phase12Resp.json();

            // Phase 13 - Motor Selection
            const phase12Arrays = phase12Data.phase12?.arrays || phase12Data.phase12;
            const entryCount = phase12Arrays?.fanInputPower_new?.length || 0;

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
                        motorSelections.push(null);
                    }
                } else {
                    motorSelections.push(null);
                }
            }

            // Phase 14 - Motor Pulley D1 Validation
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
                throw new Error(errData.details || "Phase 14 failed");
            }
            const phase14Data = await phase14Resp.json();

            // Phase 15 - Belt Geometry
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
                throw new Error(errData.details || "Phase 15 failed");
            }
            const phase15Data = await phase15Resp.json();

            // Phase 16 - Consolidated Filter Table
            const phase16Payload = {
                phase11Data: phase11Data.phase11,
                phase12Arrays: phase12Data.phase12?.arrays || phase12Data.phase12,
                phase14Arrays: phase14Data.phase14?.arrays || phase14Data.phase14,
                phase15Arrays: phase15Data.phase15?.arrays || phase15Data.phase15,
                userRPM: selectedFan.rpm,
                maxRpmChange: parseFloat(formData.maxRpmChange),
            };

            const phase16Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase16`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(phase16Payload),
            });

            if (!phase16Resp.ok) {
                const errData = await phase16Resp.json();
                throw new Error(errData.details || "Phase 16 failed");
            }
            const phase16Data = await phase16Resp.json();

            // Phase 17 - Sound Data
            const phase17Resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase17`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selectedFan: selectedFan,
                    distance: parseFloat(formData.distance),
                    directivityQ: parseInt(formData.directivityQ),
                }),
            });

            if (!phase17Resp.ok) {
                const errData = await phase17Resp.json();
                throw new Error(errData.details || "Phase 17 failed");
            }
            const phase17Data = await phase17Resp.json();

            // Phase 18 - All Models
            const phase18AllResp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/phase18-all`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phase16Data: phase16Data.phase16,
                    phase13Motors: motorSelections,
                    phase17Data: phase17Data.phase17,
                    selectedFan: selectedFan,
                }),
            });

            if (!phase18AllResp.ok) {
                const errData = await phase18AllResp.json();
                throw new Error(errData.details || "Phase 18 All failed");
            }
            const phase18AllData = await phase18AllResp.json();

            setResults((prev) => ({
                ...prev,
                phase18All: phase18AllData.phase18All,
                secondInputData: formData,
            }));

            navigate("/centrifugal/final-result");
        } catch (err) {
            console.error(err);
            setMessage({
                type: "error",
                text: err.message || "Failed to process configuration.",
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
                <Box maxW="950px" mx="auto" bg="white" borderRadius="16px" p={6} boxShadow="0 1px 3px rgba(0,0,0,0.05)">
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
                                <Grid templateColumns="repeat(4, 1fr)" gap={4}>
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
                                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
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
                                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
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
