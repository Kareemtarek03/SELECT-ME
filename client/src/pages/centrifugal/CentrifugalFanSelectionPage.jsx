import React, { useState } from "react";
import {
    Box,
    Stack,
    Input,
    Button,
    Heading,
    Text,
    Grid,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useFormData } from "../../context/FormContext";
import UnitSelect from "../../components/slectors.jsx";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";
import {
    airFlowUnits,
    pressureUnits,
    powerUnits,
} from "../../utils/units.js";

export default function CentrifugalFanSelectionPage() {
    const navigate = useNavigate();
    const { units, setUnits, input, setInput, setResults } = useFormData();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const DEFAULTS = {
        units: {
            airFlow: "CFM",
            pressure: "Pa",
            power: "kW",
        },
        input: { RPM: 1440, TempC: 20, fanUnitNo: "EX-01" },
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInput((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!input.airFlow || !input.staticPressure) {
            setMessage({
                type: "warning",
                text: "Please provide both Air Flow and Static Pressure.",
            });
            return;
        }

        if (!units.centrifugalFanType) {
            setMessage({
                type: "warning",
                text: "Please select a fan type from the Centrifugal Fan Types page.",
            });
            return;
        }

        setLoading(true);
        setMessage(null);

        const payload = {
            units: {
                airFlow: units.airFlow || DEFAULTS.units.airFlow,
                pressure: units.pressure || DEFAULTS.units.pressure,
                power: units.power || DEFAULTS.units.power,
                fanType: units.centrifugalFanType,
            },
            input: {
                RPM: parseFloat(input.RPM) || DEFAULTS.input.RPM,
                TempC: parseFloat(input.TempC) || DEFAULTS.input.TempC,
                airFlow: parseFloat(input.airFlow),
                staticPressure: parseFloat(input.staticPressure),
                fanUnitNo: input.fanUnitNo || DEFAULTS.input.fanUnitNo,
            },
        };

        try {
            const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "";
            const resp = await fetch(`${apiBaseUrl}/api/centrifugal/fan-data/process`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (resp.ok) {
                const data = await resp.json();
                setResults({ data, payload, units, fanCategory: "centrifugal" });
                navigate("/centrifugal/results");
            } else {
                const text = await resp.text();
                throw new Error(`API error: ${resp.status} ${text}`);
            }
        } catch (err) {
            console.error(err);
            setMessage({
                type: "error",
                text: err.message || "Failed to process fan data.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClearAll = () => {
        setInput({
            RPM: DEFAULTS.input.RPM,
            TempC: DEFAULTS.input.TempC,
            airFlow: "",
            staticPressure: "",
            fanUnitNo: DEFAULTS.input.fanUnitNo,
        });
        setUnits((prev) => ({
            airFlow: DEFAULTS.units.airFlow,
            pressure: DEFAULTS.units.pressure,
            power: DEFAULTS.units.power,
            centrifugalFanType: prev.centrifugalFanType,
        }));
        setMessage(null);
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

    const sectionTitleStyle = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        mb: 3,
        mt: 2,
    };

    const sectionCardStyle = {
        bg: "white",
        borderRadius: "12px",
        p: 5,
        border: "1px solid #e2e8f0",
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
                            Centrifugal Fan Selection - {units.centrifugalFanType || "Select Type"}
                        </Heading>
                        <Text fontSize="sm" color="#64748b">
                            Specify technical requirements to find optimal centrifugal fan models.
                        </Text>
                    </Box>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                        <Stack spacing={6}>
                            {/* Basic Parameters Section */}
                            <Box>
                                <Box {...sectionTitleStyle}>
                                    <Text fontSize="md" fontWeight="semibold" color="#1e293b">⚙️ Basic Parameters</Text>
                                </Box>
                                <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle}>RPM</Text>
                                            <Text color="#94a3b8" fontSize="sm">⟳</Text>
                                        </Box>
                                        <Input
                                            name="RPM"
                                            type="number"
                                            value={input.RPM || ""}
                                            onChange={handleInputChange}
                                            placeholder="1440"
                                            {...inputStyle}
                                        />
                                    </Box>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle}>Temperature</Text>
                                            <Text color="#94a3b8" fontSize="sm">🌡</Text>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Input
                                                name="TempC"
                                                type="number"
                                                value={input.TempC || ""}
                                                onChange={handleInputChange}
                                                placeholder="20"
                                                {...inputStyle}
                                                flex={1}
                                            />
                                            <Text color="#64748b" fontSize="sm" bg="#f8fafc" px={3} py={2} borderRadius="8px" border="1px solid #e2e8f0" h="44px" display="flex" alignItems="center">°C</Text>
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle}>Fan Type</Text>
                                            <Text color="#94a3b8" fontSize="sm">🌀</Text>
                                        </Box>
                                        <Text
                                            fontSize="md"
                                            color={units.centrifugalFanType ? "#3b82f6" : "#ef4444"}
                                            fontWeight="medium"
                                            bg={units.centrifugalFanType ? "#eff6ff" : "#fef2f2"}
                                            px={3}
                                            py={2}
                                            borderRadius="8px"
                                            border={units.centrifugalFanType ? "1px solid #bfdbfe" : "1px solid #fecaca"}
                                            cursor="pointer"
                                            onClick={() => navigate("/centrifugal/fan-types")}
                                            _hover={{ bg: units.centrifugalFanType ? "#dbeafe" : "#fee2e2" }}
                                            h="44px"
                                            display="flex"
                                            alignItems="center"
                                        >
                                            {units.centrifugalFanType || "Click to select"}
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Text {...labelStyle}>Fan Unit No.</Text>
                                            <Text color="#94a3b8" fontSize="sm">◇</Text>
                                        </Box>
                                        <Input
                                            name="fanUnitNo"
                                            type="text"
                                            maxLength={40}
                                            value={input.fanUnitNo || ""}
                                            onChange={handleInputChange}
                                            placeholder="e.g. EX-01"
                                            {...inputStyle}
                                        />
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Airflow & Pressure Section */}
                            <Box borderTop="1px solid #e2e8f0" pt={4}>
                                <Box {...sectionTitleStyle}>
                                    <Text fontSize="md" fontWeight="semibold" color="#1e293b">💨 Airflow & Pressure</Text>
                                </Box>
                                <Grid templateColumns="repeat(2, 1fr)" gap={5}>
                                    <Box {...sectionCardStyle}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                            <Text {...labelStyle} mb={0}>Required Airflow</Text>
                                            <Text color="#94a3b8" fontSize="sm">💨</Text>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Input
                                                name="airFlow"
                                                type="number"
                                                value={input.airFlow || ""}
                                                onChange={handleInputChange}
                                                placeholder="7193"
                                                {...inputStyle}
                                                flex={1}
                                            />
                                            <Box minW="80px">
                                                <UnitSelect
                                                    name="airFlow"
                                                    collection={airFlowUnits}
                                                    value={units.airFlow}
                                                    onChange={(v) => setUnits((u) => ({ ...u, airFlow: v }))}
                                                    placeholder="CFM"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box {...sectionCardStyle}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                            <Text {...labelStyle} mb={0}>Static Pressure</Text>
                                            <Text color="#94a3b8" fontSize="sm">↑</Text>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Input
                                                name="staticPressure"
                                                type="number"
                                                value={input.staticPressure || ""}
                                                onChange={handleInputChange}
                                                placeholder="315"
                                                {...inputStyle}
                                                flex={1}
                                            />
                                            <Box minW="80px">
                                                <UnitSelect
                                                    name="pressure"
                                                    collection={pressureUnits}
                                                    value={units.pressure}
                                                    onChange={(v) => setUnits((u) => ({ ...u, pressure: v }))}
                                                    placeholder="Pa"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Power Section */}
                            <Box borderTop="1px solid #e2e8f0" pt={4}>
                                <Box {...sectionTitleStyle}>
                                    <Text fontSize="md" fontWeight="semibold" color="#1e293b">⚡ Power Configuration</Text>
                                </Box>
                                <Grid templateColumns="repeat(2, 1fr)" gap={5}>
                                    <Box>
                                        <Text {...labelStyle}>Power Unit</Text>
                                        <UnitSelect
                                            name="power"
                                            collection={powerUnits}
                                            value={units.power}
                                            onChange={(v) => setUnits((u) => ({ ...u, power: v }))}
                                            placeholder="kW"
                                        />
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Error/Warning Message */}
                            {message && (
                                <Box
                                    bg={message.type === "error" ? "#fef2f2" : message.type === "warning" ? "#fffbeb" : "#f0fdf4"}
                                    borderRadius="lg"
                                    p={3}
                                    textAlign="center"
                                    color={message.type === "error" ? "#dc2626" : message.type === "warning" ? "#d97706" : "#16a34a"}
                                    fontWeight="medium"
                                    fontSize="sm"
                                    border="1px solid"
                                    borderColor={message.type === "error" ? "#fecaca" : message.type === "warning" ? "#fde68a" : "#bbf7d0"}
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
                                    onClick={() => navigate("/centrifugal/fan-types")}
                                    _hover={{ bg: "#f1f5f9" }}
                                    leftIcon={<Text>←</Text>}
                                    fontWeight="medium"
                                >
                                    Back
                                </Button>
                                <Box display="flex" gap={3}>
                                    <Button
                                        variant="outline"
                                        borderColor="#e2e8f0"
                                        color="#64748b"
                                        type="button"
                                        size="md"
                                        onClick={handleClearAll}
                                        px={6}
                                        borderRadius="8px"
                                        _hover={{ bg: "#f8fafc", borderColor: "#cbd5e1" }}
                                        fontWeight="medium"
                                        h="44px"
                                    >
                                        Clear All
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
                                        Find Fans
                                    </Button>
                                </Box>
                            </Box>

                        </Stack>
                    </form>
                </Box>
            </Box>

            <Box py={3} textAlign="center" color="#94a3b8" fontSize="xs" bg="white" borderTop="1px solid #e2e8f0">
                <Text>© {currentYear} Mechatronics Engineering Systems. All rights reserved.</Text>
            </Box>
        </Box>
    );
}
