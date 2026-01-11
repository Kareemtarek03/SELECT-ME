import React, { useState } from "react";
import {
    Box,
    Text,
    Heading,
    Input,
    Button,
    Grid,
} from "@chakra-ui/react";
import {
    FaWind,
    FaTachometerAlt,
    FaBolt,
    FaCube,
    FaThermometerHalf,
    FaPlug,
    FaWeight,
    FaFire,
    FaSyncAlt,
    FaCopy,
    FaChevronDown,
    FaChevronUp,
} from "react-icons/fa";
import { GiGears } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu.jsx";

// Conversion factors and formulas
const conversions = {
    airFlow: {
        name: "Air Flow",
        icon: FaWind,
        units: ["m³/s", "m³/min", "m³/hr", "L/s", "L/min", "L/hr", "CFM"],
        // All values relative to m³/s
        factors: {
            "m³/s": 1,
            "m³/min": 60,
            "m³/hr": 3600,
            "L/s": 1000,
            "L/min": 60000,
            "L/hr": 3600000,
            "CFM": 2118.88,
        },
    },
    pressure: {
        name: "Pressure",
        icon: FaTachometerAlt,
        units: ["Pa", "kPa", "bar", "psi", "in.wg"],
        // All values relative to Pa
        factors: {
            "Pa": 1,
            "kPa": 0.001,
            "bar": 0.00001,
            "psi": 0.000145038,
            "in.wg": 0.00401865,
        },
    },
    power: {
        name: "Power",
        icon: FaBolt,
        units: ["W", "kW", "HP"],
        // All values relative to W
        factors: {
            "W": 1,
            "kW": 0.001,
            "HP": 0.00134102,
        },
    },
    volume: {
        name: "Volume",
        icon: FaCube,
        units: ["m³", "L", "ft³", "gal (US)", "gal (UK)"],
        // All values relative to m³
        factors: {
            "m³": 1,
            "L": 1000,
            "ft³": 35.3147,
            "gal (US)": 264.172,
            "gal (UK)": 219.969,
        },
    },
    temperature: {
        name: "Temperature",
        icon: FaThermometerHalf,
        units: ["°C", "K", "°F"],
        isSpecial: true,
    },
    tempToDensity: {
        name: "Temperature → Density",
        icon: FaThermometerHalf,
        units: ["°C"],
        outputUnit: "kg/m³",
        isSpecial: true,
    },
    voltage: {
        name: "Voltage",
        icon: FaPlug,
        units: ["V", "kV"],
        factors: {
            "V": 1,
            "kV": 0.001,
        },
    },
    current: {
        name: "Current",
        icon: FaPlug,
        units: ["A", "mA"],
        factors: {
            "A": 1,
            "mA": 1000,
        },
    },
    density: {
        name: "Density",
        icon: FaWeight,
        units: ["kg/m³", "lb/ft³"],
        factors: {
            "kg/m³": 1,
            "lb/ft³": 0.062428,
        },
    },
    heatTransfer: {
        name: "Heat Transfer",
        icon: FaFire,
        units: ["W", "kW", "BTU/hr", "TR"],
        factors: {
            "W": 1,
            "kW": 0.001,
            "BTU/hr": 3.41214,
            "TR": 0.000284345,
        },
    },
    mass: {
        name: "Mass",
        icon: FaWeight,
        units: ["kg", "lb", "g", "oz"],
        factors: {
            "kg": 1,
            "lb": 2.20462,
            "g": 1000,
            "oz": 35.274,
        },
    },
    speed: {
        name: "Speed (RPM)",
        icon: GiGears,
        units: ["RPM", "rad/s", "Hz"],
        factors: {
            "RPM": 1,
            "rad/s": 0.10472,
            "Hz": 0.0166667,
        },
    },
};

// Temperature conversion functions
const convertTemperature = (value, fromUnit, toUnit) => {
    let celsius;
    // Convert to Celsius first
    switch (fromUnit) {
        case "°C":
            celsius = value;
            break;
        case "K":
            celsius = value - 273.15;
            break;
        case "°F":
            celsius = (value - 32) * (5 / 9);
            break;
        default:
            celsius = value;
    }
    // Convert from Celsius to target
    switch (toUnit) {
        case "°C":
            return celsius;
        case "K":
            return celsius + 273.15;
        case "°F":
            return celsius * (9 / 5) + 32;
        default:
            return celsius;
    }
};

// Temperature to Density conversion
const tempToDensity = (tempCelsius) => {
    const density = 101325 / ((tempCelsius + 273.15) * 287.1);
    return Math.round(density * 100) / 100;
};

// Generic conversion function
const convert = (value, fromUnit, toUnit, category) => {
    if (category === "temperature") {
        return convertTemperature(value, fromUnit, toUnit);
    }
    if (category === "tempToDensity") {
        return tempToDensity(value);
    }
    const factors = conversions[category].factors;
    // Convert to base unit, then to target unit
    const baseValue = value / factors[fromUnit];
    return baseValue * factors[toUnit];
};

// Converter Card Component
function ConverterCard({ category, data }) {
    const [isExpanded, setIsExpanded] = useState(category === "airFlow");
    const [inputValue, setInputValue] = useState("");
    const [fromUnit, setFromUnit] = useState(data.units[0]);
    const [toUnit, setToUnit] = useState(data.units.length > 1 ? data.units[1] : data.units[0]);
    const [result, setResult] = useState("");

    const IconComponent = data.icon;

    const handleConvert = () => {
        const value = parseFloat(inputValue);
        if (isNaN(value)) {
            setResult("Invalid input");
            return;
        }
        const converted = convert(value, fromUnit, toUnit, category);
        setResult(typeof converted === "number" ? converted.toFixed(4).replace(/\.?0+$/, "") : converted);
    };

    const handleSwap = () => {
        if (category !== "tempToDensity") {
            const temp = fromUnit;
            setFromUnit(toUnit);
            setToUnit(temp);
            if (inputValue && result) {
                setInputValue(result);
                handleConvert();
            }
        }
    };

    const copyToClipboard = () => {
        if (result) {
            navigator.clipboard.writeText(result);
        }
    };

    return (
        <Box
            bg="white"
            borderRadius="xl"
            border="1px solid #e2e8f0"
            overflow="hidden"
            mb={4}
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.05)"
        >
            {/* Header */}
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                p={4}
                cursor="pointer"
                onClick={() => setIsExpanded(!isExpanded)}
                _hover={{ bg: "#f8fafc" }}
                transition="background 0.2s"
            >
                <Box display="flex" alignItems="center" gap={3}>
                    <Box color="#3b82f6">
                        <IconComponent size={20} />
                    </Box>
                    <Text color="#1e293b" fontWeight="600" fontSize="lg">
                        {data.name}
                    </Text>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                    <Box color="#94a3b8" p={1}>
                        <Box as="span" fontSize="lg">⋮⋮</Box>
                    </Box>
                    <Box color="#64748b">
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </Box>
                </Box>
            </Box>

            {/* Content */}
            {isExpanded && (
                <Box p={4} pt={0}>
                    <Grid
                        templateColumns={{ base: "1fr", md: "1fr auto 1fr" }}
                        gap={4}
                        alignItems="end"
                    >
                        {/* From Section */}
                        <Box>
                            <Text color="#64748b" fontSize="sm" mb={2}>
                                From
                            </Text>
                            <Box display="flex" gap={2}>
                                <Input
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleConvert()}
                                    placeholder="Enter value"
                                    bg="white"
                                    border="1px solid #e2e8f0"
                                    color="#1e293b"
                                    _placeholder={{ color: "#94a3b8" }}
                                    _focus={{ borderColor: "#3b82f6", boxShadow: "0 0 0 1px #3b82f6" }}
                                    borderRadius="lg"
                                    flex={1}
                                />
                                <select
                                    value={fromUnit}
                                    onChange={(e) => setFromUnit(e.target.value)}
                                    style={{
                                        background: "white",
                                        border: "1px solid #e2e8f0",
                                        color: "#1e293b",
                                        borderRadius: "8px",
                                        padding: "8px 12px",
                                        minWidth: "100px",
                                        outline: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    {data.units.map((unit) => (
                                        <option key={unit} value={unit} style={{ background: "white" }}>
                                            {unit}
                                        </option>
                                    ))}
                                </select>
                            </Box>
                        </Box>

                        {/* Swap Button */}
                        <Box display="flex" justifyContent="center" pb={1}>
                            <Button
                                onClick={handleSwap}
                                bg="#f1f5f9"
                                color="#64748b"
                                borderRadius="full"
                                p={3}
                                _hover={{ bg: "#e2e8f0", color: "#1e293b" }}
                                isDisabled={category === "tempToDensity"}
                            >
                                <FaSyncAlt />
                            </Button>
                        </Box>

                        {/* To Section */}
                        <Box>
                            <Text color="#64748b" fontSize="sm" mb={2}>
                                To
                            </Text>
                            <Box display="flex" gap={2}>
                                <Input
                                    value={result}
                                    readOnly
                                    placeholder="Result"
                                    bg="#f8fafc"
                                    border="1px solid #e2e8f0"
                                    color="#1e293b"
                                    _placeholder={{ color: "#94a3b8" }}
                                    borderRadius="lg"
                                    flex={1}
                                />
                                {category === "tempToDensity" ? (
                                    <Box
                                        bg="#f8fafc"
                                        border="1px solid #e2e8f0"
                                        borderRadius="lg"
                                        px={4}
                                        display="flex"
                                        alignItems="center"
                                        color="#1e293b"
                                        minW="100px"
                                    >
                                        {data.outputUnit}
                                    </Box>
                                ) : (
                                    <select
                                        value={toUnit}
                                        onChange={(e) => setToUnit(e.target.value)}
                                        style={{
                                            background: "white",
                                            border: "1px solid #e2e8f0",
                                            color: "#1e293b",
                                            borderRadius: "8px",
                                            padding: "8px 12px",
                                            minWidth: "100px",
                                            outline: "none",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {data.units.map((unit) => (
                                            <option key={unit} value={unit} style={{ background: "white" }}>
                                                {unit}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <Button
                                    onClick={copyToClipboard}
                                    bg="#f1f5f9"
                                    color="#64748b"
                                    borderRadius="lg"
                                    _hover={{ bg: "#e2e8f0", color: "#1e293b" }}
                                    title="Copy result"
                                >
                                    <FaCopy />
                                </Button>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Convert Button */}
                    <Box mt={4}>
                        <Button
                            onClick={handleConvert}
                            bg="#3b82f6"
                            color="white"
                            w="100%"
                            py={5}
                            borderRadius="lg"
                            fontWeight="semibold"
                            _hover={{ bg: "#2563eb" }}
                            _active={{ transform: "scale(0.98)" }}
                        >
                            Convert
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

// Main Unit Converter Component
export default function UnitConverter() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const categoryOrder = [
        "airFlow",
        "pressure",
        "power",
        "volume",
        "temperature",
        "tempToDensity",
        "voltage",
        "current",
        "density",
        "heatTransfer",
        "mass",
        "speed",
    ];

    return (
        <Box
            bg="#f8fafc"
            minH="100vh"
            py={{ base: 4, md: 6 }}
            px={{ base: 4, md: 6, lg: 8 }}
            pt={{ base: "60px", md: "60px" }}
            position="relative"
        >
            <HamburgerMenu />

            {/* Back Button */}
            <Button
                onClick={() => navigate(-1)}
                position="fixed"
                top="1rem"
                right="1rem"
                zIndex={1000}
                bg="white"
                color="#1e293b"
                border="1px solid #e2e8f0"
                borderRadius="0.5rem"
                px={4}
                py={2}
                fontSize="sm"
                fontWeight="500"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
                _hover={{ bg: "#f1f5f9", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
                display="flex"
                alignItems="center"
                gap={2}
            >
                <Box as="span" fontSize="md">←</Box>
                Back
            </Button>

            <Box maxW="900px" w="100%" mx="auto">
                {/* Page Title */}
                <Heading
                    as="h1"
                    size="2xl"
                    color="#1e293b"
                    fontWeight="bold"
                    mb={2}
                    fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
                    textAlign="center"
                >
                    Unit Converter
                </Heading>

                <Text color="#64748b" fontSize="sm" mb={6} textAlign="center">
                    A collection of engineering tools for quick and accurate unit conversions.
                </Text>

                {/* Converter Cards */}
                {categoryOrder.map((category) => (
                    <ConverterCard
                        key={category}
                        category={category}
                        data={conversions[category]}
                    />
                ))}

                {/* Footer */}
                <Box py={4} textAlign="center" color="#94a3b8" fontSize="xs" mt={4}>
                    <Text>© {currentYear} Mechtronics Fan Selection. All rights reserved.</Text>
                </Box>
            </Box>
        </Box>
    );
}
