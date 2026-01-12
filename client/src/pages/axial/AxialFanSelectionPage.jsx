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
  InsulationClassUnits,
  NoPhases,
} from "../../utils/units.js";

export default function AxialFanSelectionPage() {
  const navigate = useNavigate();
  const { units, setUnits, input, setInput, setResults } = useFormData();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const DEFAULTS = {
    units: {
      airFlow: "CFM",
      pressure: "Pa",
      power: "kW",
      fanType: "AF-L",
      insulationClass: "F",
    },
    input: { RPM: 1440, TempC: 20, NoPhases: 3, SPF: 10, Safety: 5, fanUnitNo: "EX-01", directivityFactor: 1, distanceFromSource: 3 },
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
        text: "Please enter Airflow and Static Pressure to continue.",
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
        fanType: units.fanType || DEFAULTS.units.fanType,
        insulationClass: units.insulationClass || DEFAULTS.units.insulationClass,
      },
      input: {
        RPM: parseFloat(input.RPM) || DEFAULTS.input.RPM,
        TempC: parseFloat(input.TempC) || DEFAULTS.input.TempC,
        airFlow: parseFloat(input.airFlow),
        NoPhases: parseFloat(input.NoPhases) || DEFAULTS.input.NoPhases,
        staticPressure: parseFloat(input.staticPressure),
        SPF: parseInt(input.SPF) || DEFAULTS.input.SPF,
        Safety: parseInt(input.Safety) || DEFAULTS.input.Safety,
        fanUnitNo: input.fanUnitNo || DEFAULTS.input.fanUnitNo,
      },
    };

    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "";
      const resp = await fetch(`${apiBaseUrl}/api/axial/fan-data/filter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        const data = await resp.json();
        setResults({ data, payload, units });
        navigate("/axial/results");
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
      NoPhases: DEFAULTS.input.NoPhases,
      SPF: DEFAULTS.input.SPF,
      Safety: DEFAULTS.input.Safety,
      directivityFactor: 1,
      distanceFromSource: 3,
      fanUnitNo: DEFAULTS.input.fanUnitNo,
    });
    setUnits((prev) => ({
      airFlow: DEFAULTS.units.airFlow,
      pressure: DEFAULTS.units.pressure,
      power: DEFAULTS.units.power,
      fanType: prev.fanType,
      insulationClass: DEFAULTS.units.insulationClass,
    }));
    setMessage(null);
  };

  const cardStyle = {
    bg: "white",
    borderRadius: "8px",
    p: 2,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
  };

  const inputStyle = {
    bg: "#f8fafc",
    color: "#1e293b",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    size: "sm",
    h: "32px",
    fontSize: "sm",
    _placeholder: { color: "#94a3b8" },
    _focus: { boxShadow: "0 0 0 2px #3b82f6", borderColor: "#3b82f6" },
    _hover: { borderColor: "#cbd5e1" },
  };

  const selectStyle = {
    width: "100%",
    padding: "6px 10px",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    height: "32px",
  };

  const sectionTitleStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    mb: 1,
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

      <Box flex={1} overflow="auto" px={4} py={2}>
        <Box maxW="1200px" w="100%" mx="auto" h="100%" display="flex" flexDirection="column">
          <Box mb={2}>
            <Heading size="md" color="#1e293b" mb={0} fontWeight="bold">
              Axial Fan Selection - {units.fanType || "Select Type"}
            </Heading>
            <Text fontSize="xs" color="#64748b" maxW="500px">
              Specify technical requirements to find optimal axial fan models.
            </Text>
          </Box>

          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Stack spacing={2} flex={1}>
              {/* Basic Parameters Section */}
              <Box>
                <Box {...sectionTitleStyle}>
                  <Text fontSize="sm" fontWeight="semibold" color="#1e293b">⚙️ Basic Parameters</Text>
                </Box>
                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={3}>
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">RPM</Text>

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
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">Temperature</Text>

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
                      <Text color="#64748b" fontSize="xs" bg="#f1f5f9" px={2} py={1} borderRadius="6px" border="1px solid #e2e8f0">°C</Text>
                    </Box>
                  </Box>
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">Fan Type</Text>

                    </Box>
                    <Text fontSize="sm" color="#1e293b" fontWeight="medium" bg="#f1f5f9" px={2} py={1} borderRadius="6px" border="1px solid #e2e8f0">
                      {units.fanType || "Not Selected"}
                    </Text>
                  </Box>
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">Fan Unit No.</Text>

                    </Box>
                    <Input
                      name="fanUnitNo"
                      type="text"
                      maxLength={40}
                      value={input.fanUnitNo || ""}
                      onChange={handleInputChange}
                      placeholder="EX-01"
                      {...inputStyle}
                    />
                  </Box>
                </Grid>
              </Box>

              {/* Airflow & Pressure Section */}
              <Box>
                <Box {...sectionTitleStyle}>
                  <Text fontSize="sm" fontWeight="semibold" color="#1e293b">💨 Airflow & Pressure</Text>
                </Box>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3}>
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">Airflow</Text>

                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Input
                        name="airFlow"
                        type="number"
                        value={input.airFlow || ""}
                        onChange={handleInputChange}
                        placeholder="35000"
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
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">Static Pressure</Text>

                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Input
                        name="staticPressure"
                        type="number"
                        value={input.staticPressure || ""}
                        onChange={handleInputChange}
                        placeholder="500"
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

              {/* Power & Safety Section */}
              <Box>
                <Box {...sectionTitleStyle}>
                  <Text fontSize="sm" fontWeight="semibold" color="#1e293b">⚡ Power & Safety</Text>
                </Box>
                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={3}>
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">Power Unit</Text>

                    </Box>
                    <UnitSelect
                      name="power"
                      collection={powerUnits}
                      value={units.power}
                      onChange={(v) => setUnits((u) => ({ ...u, power: v }))}
                      placeholder="kW"
                    />
                  </Box>
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">No. of Phases</Text>

                    </Box>
                    <UnitSelect
                      name="NoPhases"
                      collection={NoPhases}
                      value={input.NoPhases}
                      onChange={(v) => setInput((u) => ({ ...u, NoPhases: v }))}
                      placeholder="3"
                    />
                  </Box>
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">Insulation Class</Text>

                    </Box>
                    <UnitSelect
                      name="insulationClass"
                      collection={InsulationClassUnits}
                      value={units.insulationClass}
                      onChange={(v) => setUnits((u) => ({ ...u, insulationClass: v }))}
                      placeholder="F"
                    />
                  </Box>
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">S.P.F</Text>

                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Input
                        name="Safety"
                        type="number"
                        value={input.Safety || ""}
                        onChange={handleInputChange}
                        placeholder="5"
                        {...inputStyle}
                        flex={1}
                      />
                      <Text color="#64748b" fontSize="xs" bg="#f1f5f9" px={2} py={1} borderRadius="6px" border="1px solid #e2e8f0">%</Text>
                    </Box>
                  </Box>
                </Grid>
              </Box>

              {/* Sound Data Section */}
              <Box>
                <Box {...sectionTitleStyle}>
                  <Text fontSize="sm" fontWeight="semibold" color="#1e293b">🔊 Sound Data</Text>
                </Box>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3}>
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">Directivity Factor (Q)</Text>

                    </Box>
                    <select
                      name="directivityFactor"
                      value={input.directivityFactor || 2}
                      onChange={(e) =>
                        setInput((prev) => ({
                          ...prev,
                          directivityFactor: parseFloat(e.target.value),
                        }))
                      }
                      style={selectStyle}
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={4}>4</option>
                      <option value={8}>8</option>
                    </select>
                  </Box>
                  <Box {...cardStyle}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Text fontSize="xs" color="#64748b" textTransform="uppercase" letterSpacing="wide">Distance from Source</Text>

                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <select
                        name="distanceFromSource"
                        value={input.distanceFromSource || 1}
                        onChange={(e) =>
                          setInput((prev) => ({
                            ...prev,
                            distanceFromSource: parseFloat(e.target.value),
                          }))
                        }
                        style={{ ...selectStyle, flex: 1 }}
                      >
                        {[1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                      <Text color="#64748b" fontSize="xs" bg="#f1f5f9" px={2} py={1} borderRadius="6px" border="1px solid #e2e8f0">m</Text>
                    </Box>
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

              {/* Footer Buttons */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                pt={3}
                borderTop="1px solid #e2e8f0"
                mt={1}
              >
                <Button
                  variant="ghost"
                  color="#64748b"
                  type="button"
                  size="sm"
                  onClick={() => navigate("/axial/fan-types")}
                  _hover={{ bg: "#f1f5f9" }}
                  leftIcon={<Text>←</Text>}
                >
                  Back
                </Button>
                <Box display="flex" gap={2}>
                  <Button
                    variant="outline"
                    borderColor="#e2e8f0"
                    color="#64748b"
                    type="button"
                    size="sm"
                    onClick={handleClearAll}
                    px={4}
                    borderRadius="md"
                    _hover={{ bg: "#f8fafc", borderColor: "#cbd5e1" }}
                    fontWeight="medium"
                  >
                    Clear All
                  </Button>
                  <Button
                    bg="#3b82f6"
                    color="white"
                    type="submit"
                    size="sm"
                    isLoading={loading}
                    px={6}
                    borderRadius="md"
                    _hover={{ bg: "#2563eb" }}
                    _active={{ transform: "scale(0.98)" }}
                    fontWeight="semibold"
                    leftIcon={<Text>🔍</Text>}
                  >
                    Find Fans
                  </Button>
                </Box>
              </Box>
            </Stack>
          </form>
        </Box>
      </Box>

      <Box py={2} textAlign="center" color="#94a3b8" fontSize="xs" borderTop="1px solid #e2e8f0">
        <Text>© {currentYear} Mechtronics Fan Selection. All rights reserved.</Text>
      </Box>
    </Box>
  );
}
