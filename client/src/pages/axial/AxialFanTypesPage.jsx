import React, { useState } from "react";
import { Box, Text, Heading, Grid, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useFormData } from "../../context/FormContext";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";

// Import fan type images
import AFS_Image from "../../assets/AF-S.png";
import AFL_Image from "../../assets/AF-L.png";
import WF_Image from "../../assets/WF.png";
import ARTF_Image from "../../assets/ARTF.png";
import AJF_Image from "../../assets/AJF.png";
import SF_Image from "../../assets/SF.png";
import ABSFC_Image from "../../assets/ABSF-C.png";
import ABSFS_Image from "../../assets/ABSF-S.png";
import SARTF_Image from "../../assets/SARTF.png";
import SWF_Image from "../../assets/SWF.png";
import SABF_Image from "../../assets/SABF.png";

const normalAxialFanTypes = [
    { id: "AF-S", name: "Inline Fan - Short Casing", description: "Compact inline axial fan with short casing for space-constrained installations.", backendValue: "AF-S", image: AFS_Image },
    { id: "AF-L", name: "Inline Fan - Long Casing", description: "Extended casing design for improved airflow straightening and efficiency.", backendValue: "AF-L", image: AFL_Image },
    { id: "WF", name: "Wall Mounted", description: "Direct wall installation for exhaust and supply air applications.", backendValue: "WF", image: WF_Image },
    { id: "ARTF", name: "Roof Top", description: "Weather-resistant roof mounted fan for building ventilation systems.", backendValue: "ARTF", image: ARTF_Image },
    { id: "AJF", name: "Jet Fan", description: "High velocity jet fan for tunnel and car park ventilation.", backendValue: "AJF", image: AJF_Image },
];

const smokeAxialFanTypes = [
    { id: "SF", name: "Inline Fan Smoke", description: "High temperature rated inline fan for smoke extraction systems.", backendValue: "SF", image: SF_Image },
    { id: "ABSF-C", name: "Bifurcated Smoke Conical", description: "Conical bifurcated design for high temperature smoke control.", backendValue: "ABSF-C", image: ABSFC_Image },
    { id: "ABSF-S", name: "Bifurcated Smoke Straight", description: "Straight bifurcated fan for emergency smoke extraction.", backendValue: "ABSF-S", image: ABSFS_Image },
    { id: "SARTF", name: "Roof Top Smoke Fan", description: "Roof mounted smoke extraction fan for emergency ventilation.", backendValue: "SARTF", image: SARTF_Image },
    { id: "SWF", name: "Wall Mounted Smoke Fan", description: "Wall mounted high temperature smoke extraction fan.", backendValue: "SWF", image: SWF_Image },
    { id: "SABF", name: "Box Smoke Fan", description: "Enclosed box design smoke fan for industrial applications.", backendValue: "SABF", image: SABF_Image },
];

export default function AxialFanTypesPage() {
    const navigate = useNavigate();
    const { setUnits } = useFormData();
    const [activeTab, setActiveTab] = useState("normal");

    const handleFanTypeSelect = (fanType) => {
        setUnits((prev) => ({ ...prev, fanType: fanType.backendValue }));
        navigate("/axial/fan-selection");
    };

    const currentFanTypes = activeTab === "normal" ? normalAxialFanTypes : smokeAxialFanTypes;
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
                <Box maxW="950px" mx="auto">
                    {/* Header */}
                    <Box mb={3}>
                        <Heading size="md" color="#1e293b" mb={0} fontWeight="bold">
                            Select Axial Fan Type
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
                            leftIcon={<Text>💨</Text>}
                        >
                            Normal Fans ({normalAxialFanTypes.length})
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
                            Smoke Fans ({smokeAxialFanTypes.length})
                        </Button>
                    </Box>

                    {/* Fan Type Grid */}
                    <Grid templateColumns="repeat(3, 1fr)" gap={5}>
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
                <Text>© {currentYear} Mechtronics Fan Selection. All rights reserved.</Text>
            </Box>
        </Box>
    );
}
