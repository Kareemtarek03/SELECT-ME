import React, { useState } from "react";
import { Box, Text, Heading, Grid, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useFormData } from "../../context/FormContext";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";

// Import centrifugal fan type images
import CFSIBB_Image from "../../assets/CF-SIB-B.png";
import CFDIBB_Image from "../../assets/CF-DIB-B.png";
import SCFSIBB_Image from "../../assets/SCF-SIB-B.png";
import CFSCFB_Image from "../../assets/CF-SCF-B.png";
import CFDCFB_Image from "../../assets/CF-DCF-B.png";

const normalCentrifugalFanTypes = [
    { id: "CF-SIB-B", name: "Single Inlet Backward", description: "High efficiency centrifugal fan designed for clean air applications.", backendValue: "CF-SIB-B", image: CFSIBB_Image },
    { id: "CF-DIB-B", name: "Double Inlet Backward", description: "Ideal for high volume airflow requirements with backward curved blades.", backendValue: "CF-DIB-B", image: CFDIBB_Image },
    { id: "CF-SCF-B", name: "Single Inlet Forward", description: "Compact design with forward curved blades for low pressure applications.", backendValue: "CF-SCF-B", image: CFSCFB_Image },
    { id: "CF-DCF-B", name: "Double Inlet Forward", description: "High volume output in a compact footprint with forward curved impeller.", backendValue: "CF-DCF-B", image: CFDCFB_Image },
];

const smokeCentrifugalFanTypes = [
    { id: "SCF-SIB-B", name: "Smoke Single Inlet Backward", description: "High temperature smoke extraction fan for emergency ventilation.", backendValue: "SCF-SIB-B", image: SCFSIBB_Image },
];

export default function CentrifugalFanTypesPage() {
    const navigate = useNavigate();
    const { setUnits } = useFormData();
    const [activeTab, setActiveTab] = useState("normal");

    const handleFanTypeSelect = (fanType) => {
        setUnits((prev) => ({ ...prev, centrifugalFanType: fanType.backendValue }));
        navigate("/centrifugal/fan-selection");
    };

    const currentFanTypes = activeTab === "normal" ? normalCentrifugalFanTypes : smokeCentrifugalFanTypes;
    const currentYear = new Date().getFullYear();

    const cardStyle = {
        bg: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        overflow: "hidden",
        role: "group",
        _hover: {
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            borderColor: "#e2e8f0",
        },
    };

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

            <Box flex={1} overflow="auto" px={6} py={2}>
                <Box maxW="1200px" w="100%" mx="auto">
                    {/* Header */}
                    <Box mb={3}>
                        <Heading size="md" color="#1e293b" mb={0} fontWeight="bold">
                            Select Centrifugal Fan Type
                        </Heading>
                        <Text fontSize="xs" color="#64748b">
                            Choose the fan type that best suits your application requirements.
                        </Text>
                    </Box>

                    {/* Tab Buttons */}
                    <Box display="flex" gap={2} mb={3}>
                        <Button
                            size="sm"
                            bg={activeTab === "normal" ? "#3b82f6" : "#f1f5f9"}
                            color={activeTab === "normal" ? "white" : "#64748b"}
                            onClick={() => setActiveTab("normal")}
                            _hover={{ bg: activeTab === "normal" ? "#2563eb" : "#e2e8f0" }}
                            borderRadius="md"
                            fontWeight="medium"
                            leftIcon={<Text>🌀</Text>}
                        >
                            Normal Fans ({normalCentrifugalFanTypes.length})
                        </Button>
                        <Button
                            size="sm"
                            bg={activeTab === "smoke" ? "#ef4444" : "#f1f5f9"}
                            color={activeTab === "smoke" ? "white" : "#64748b"}
                            onClick={() => setActiveTab("smoke")}
                            _hover={{ bg: activeTab === "smoke" ? "#dc2626" : "#e2e8f0" }}
                            borderRadius="md"
                            fontWeight="medium"
                            leftIcon={<Text>🔥</Text>}
                        >
                            Smoke Fans ({smokeCentrifugalFanTypes.length})
                        </Button>
                    </Box>

                    {/* Fan Type Grid */}
                    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={{ base: 3, md: 5 }}>
                        {currentFanTypes.map((fanType) => (
                            <Box
                                key={fanType.id}
                                {...cardStyle}
                                onClick={() => handleFanTypeSelect(fanType)}
                            >
                                {/* Image Container */}
                                <Box
                                    h="160px"
                                    bg="#f8fafc"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    p={4}
                                >
                                    <img
                                        src={fanType.image}
                                        alt={fanType.name}
                                        style={{ maxHeight: "140px", maxWidth: "100%", objectFit: "contain" }}
                                    />
                                </Box>
                                {/* Content Container */}
                                <Box p={4} bg="white">
                                    {/* Badge and Arrow Row */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Text
                                            fontSize="xs"
                                            color="#3b82f6"
                                            fontWeight="semibold"
                                            bg="#eff6ff"
                                            px={2}
                                            py={0.5}
                                            borderRadius="md"
                                        >
                                            {fanType.id}
                                        </Text>
                                        <Text
                                            color="#cbd5e1"
                                            fontSize="lg"
                                            transition="color 0.25s ease"
                                            _groupHover={{ color: "#3b82f6" }}
                                        >
                                            →
                                        </Text>
                                    </Box>
                                    {/* Fan Name */}
                                    <Text
                                        fontSize="md"
                                        color="#1e293b"
                                        fontWeight="semibold"
                                        lineHeight="1.3"
                                        mb={1}
                                        transition="color 0.25s ease"
                                        _groupHover={{ color: "#3b82f6" }}
                                    >
                                        {fanType.name}
                                    </Text>
                                    {/* Description */}
                                    <Text
                                        fontSize="xs"
                                        color="#94a3b8"
                                        lineHeight="1.5"
                                    >
                                        {fanType.description}
                                    </Text>
                                </Box>
                            </Box>
                        ))}
                    </Grid>

                    {/* Back Button */}
                    <Box mt={4} pt={3} borderTop="1px solid #e2e8f0">
                        <Button
                            variant="ghost"
                            color="#64748b"
                            size="sm"
                            onClick={() => navigate("/fan-categories")}
                            _hover={{ bg: "#f1f5f9" }}
                            leftIcon={<Text>←</Text>}
                        >
                            Back to Categories
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Box py={2} textAlign="center" color="#94a3b8" fontSize="xs" borderTop="1px solid #e2e8f0">
                <Text>© {currentYear} Mechatronics Engineering Systems. All rights reserved.</Text>
            </Box>
        </Box>
    );
}
