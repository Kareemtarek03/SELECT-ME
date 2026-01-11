import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormData } from "../../context/FormContext";
import {
    Box,
    Text,
    Flex,
    Button,
    Spinner,
} from "@chakra-ui/react";
import "./CentrifugalFanResultPage.css";

export default function CentrifugalFanResultPage() {
    const navigate = useNavigate();
    const { results: contextResults, units, setResults } = useFormData();
    const [selectedFanIndex, setSelectedFanIndex] = useState(null);

    const currentYear = new Date().getFullYear();

    // Handle row click - select/deselect row
    const handleRowClick = (fan, index) => {
        setSelectedFanIndex(selectedFanIndex === index ? null : index);
    };

    // Handle proceed to second input page
    const handleProceedToSecondInput = () => {
        if (selectedFanIndex === null) return;

        const selectedFan = phase10Results[selectedFanIndex];
        // Debug: Log selected fan data to verify curveArrays is included
        console.log("=== Selected Fan Debug ===");
        console.log("selectedFan keys:", Object.keys(selectedFan));
        console.log("selectedFan.curveArrays exists:", !!selectedFan?.curveArrays);
        console.log("selectedFan.curveArrays?.airFlow:", selectedFan?.curveArrays?.airFlow);
        console.log("selectedFan.originalFanData exists:", !!selectedFan?.originalFanData);

        // Store selected fan in results context for the second input page
        setResults((prev) => ({
            ...prev,
            selectedCentrifugalFan: selectedFan,
            selectedFanIndex: selectedFanIndex,
        }));
        navigate("/centrifugal/second-input");
    };

    if (!contextResults || !contextResults.data) {
        return (
            <Flex minH="100vh" bg="white">
                <Box
                    flex={1}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Box textAlign="center">
                        <Spinner size="xl" color="#3b82f6" mb={4} />
                        <Text color="#1e293b">Loading results...</Text>
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

    const { data } = contextResults;
    const phase10Results = data?.phase10 || [];

    return (
        <Flex minH="100vh" bg="#f8fafc" flexDirection="column">
            <Box flex={1} display="flex" flexDirection="column">
                {/* Content Area */}
                <Box flex={1} py={8} px={6}>
                    <Box maxW="1000px" mx="auto" bg="white" borderRadius="16px" p={8} boxShadow="0 1px 3px rgba(0,0,0,0.05)">
                        {/* Header */}
                        <Box mb={6} textAlign="center">
                            <Text fontSize="2xl" color="#1e293b" fontWeight="bold" mb={2}>
                                Matched Centrifugal Fans
                            </Text>
                            <Text className="results-header-subtitle">
                                <span className="count">{phase10Results.length} fan(s) found</span> — Click a row to select, then proceed to configure
                            </Text>
                        </Box>

                        {phase10Results.length === 0 ? (
                            <Box textAlign="center" mt={16}>
                                <Text fontSize="xl" mb={4} color="#1e293b">
                                    No fans match the selected criteria.
                                </Text>
                                <Button
                                    bg="#3b82f6"
                                    color="white"
                                    onClick={() => navigate("/centrifugal/fan-selection")}
                                    _hover={{ bg: "#2563eb" }}
                                    borderRadius="8px"
                                    px={6}
                                    h="44px"
                                >
                                    Back to Search
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <div className="results-table-container">
                                    <table className="results-table">
                                        <thead>
                                            <tr>
                                                <th>Fan Model</th>
                                                <th className="center">Air Flow<br /><span style={{ fontWeight: 400, fontSize: '0.6875rem' }}>({units?.airFlow || "CFM"})</span></th>
                                                <th className="center">Static Pressure<br /><span style={{ fontWeight: 400, fontSize: '0.6875rem' }}>({units?.pressure || "Pa"})</span></th>
                                                <th className="center">Input Power<br /><span style={{ fontWeight: 400, fontSize: '0.6875rem' }}>({units?.power || "kW"})</span></th>
                                                <th className="center">Static Eff.<br /><span style={{ fontWeight: 400, fontSize: '0.6875rem' }}>(%)</span></th>
                                                <th className="center">Total Eff.<br /><span style={{ fontWeight: 400, fontSize: '0.6875rem' }}>(%)</span></th>
                                                <th className="center">RPM</th>
                                                <th style={{ width: '50px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {phase10Results.map((fan, index) => (
                                                <tr
                                                    key={index}
                                                    className={selectedFanIndex === index ? "selected" : ""}
                                                    onClick={() => handleRowClick(fan, index)}
                                                >
                                                    <td>
                                                        <div className="fan-model-cell">
                                                            <span className="fan-model">
                                                                {fan.fanModel || `${fan.model}-${fan.innerDiameter}`}
                                                            </span>
                                                            {selectedFanIndex === index && (
                                                                <span className="best-match-badge">Best Match</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="center">{formatNumber(fan.airFlow)}</td>
                                                    <td className="center">{formatNumber(fan.staticPressure)}</td>
                                                    <td className="center">{formatNumber(fan.fanInputPower)}</td>
                                                    <td className="center">{formatNumber(fan.staticEfficiency * 100)}%</td>
                                                    <td className="center">{formatNumber(fan.totalEfficiency * 100)}%</td>
                                                    <td className="center">{Math.round(fan.rpm)}</td>
                                                    <td className="center">
                                                        <div className={`selection-indicator ${selectedFanIndex === index ? 'selected' : ''}`}></div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="results-count">
                                        Showing {phase10Results.length} of {phase10Results.length} results
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <Flex gap={4} justify="center" mt={8}>
                                    <Button
                                        variant="outline"
                                        borderColor="#e2e8f0"
                                        color="#475569"
                                        onClick={() => navigate("/centrifugal/fan-selection")}
                                        _hover={{ bg: "#f8fafc", borderColor: "#cbd5e1" }}
                                        size="lg"
                                        px={8}
                                        borderRadius="8px"
                                        fontWeight="500"
                                        h="48px"
                                    >
                                        ← Back to Search
                                    </Button>
                                    <Button
                                        bg="#3b82f6"
                                        color="white"
                                        onClick={handleProceedToSecondInput}
                                        isDisabled={selectedFanIndex === null}
                                        _hover={{ bg: "#2563eb" }}
                                        _disabled={{ cursor: "not-allowed", opacity: 0.5, bg: "#94a3b8" }}
                                        size="lg"
                                        px={8}
                                        borderRadius="8px"
                                        fontWeight="500"
                                        h="48px"
                                    >
                                        Configure Selected Fan →
                                    </Button>
                                </Flex>
                            </>
                        )}
                    </Box>
                </Box>

                {/* Footer */}
                <Box py={4} bg="white" borderTop="1px solid #e2e8f0">
                    <Text color="#94a3b8" fontSize="sm" textAlign="center">
                        © {currentYear} Mechatronics Fan Selection. All rights reserved.
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
