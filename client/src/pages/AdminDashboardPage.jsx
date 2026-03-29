import React from "react";
import { Box, Text, Heading, Button, Grid } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu";

const adminSections = [
    {
        title: "Axial Fan Data",
        description: "View and manage axial fan performance data, specifications, and curves.",
        icon: "📊",
        path: "/admin/axial-fan-data",
        color: "#3b82f6",
    },
    {
        title: "Motor Data",
        description: "Manage motor specifications, efficiency curves, and power ratings.",
        icon: "⚡",
        path: "/admin/motor",
        color: "#f59e0b",
    },
    {
        title: "Centrifugal Data",
        description: "View and manage centrifugal fan performance data and specifications.",
        icon: "🔧",
        path: "/admin/centrifugal",
        color: "#10b981",
    },
    {
        title: "Pricing",
        description: "Manage pricing tables for fans, motors, and accessories.",
        icon: "💰",
        path: "/admin/pricing",
        color: "#8b5cf6",
    },
];

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    return (
        <Box
            h="100vh"
            bg="#f6f7f8"
            display="flex"
            flexDirection="column"
            overflow="hidden"
            position="relative"
        >
            <HamburgerMenu />

            {/* Back Button - Top Right */}
            <button
                onClick={() => navigate("/dashboard")}
                style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    zIndex: 1000,
                    padding: "0.5rem 1rem",
                    background: "white",
                    color: "#1e293b",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                }}
            >
                <span>←</span> Back
            </button>

            {/* Main Content */}
            <Box
                flex={1}
                px={{ base: 4, sm: 6, lg: 20 }}
                py={4}
                display="flex"
                justifyContent="center"
                alignItems="center"
                overflow="hidden"
            >
                <Box w="100%" maxW="900px" display="flex" flexDirection="column">
                    {/* Header Section */}
                    <Box mb={4} textAlign="center" maxW="2xl" mx="auto">
                        <Heading
                            as="h1"
                            color="#0d141b"
                            fontSize={{ base: "2xl", md: "3xl" }}
                            fontWeight="black"
                            lineHeight="tight"
                            letterSpacing="tight"
                            mb={2}
                        >
                            Admin Panel
                        </Heading>
                        <Text
                            color="#4c739a"
                            fontSize={{ base: "sm", md: "md" }}
                            fontWeight="normal"
                            lineHeight="relaxed"
                        >
                            Manage your data tables and configurations
                        </Text>
                    </Box>

                    {/* Cards Grid */}
                    <Grid
                        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                        gap={4}
                        alignItems="stretch"
                    >
                        {adminSections.map((section) => (
                            <Box
                                key={section.title}
                                role="group"
                                bg="white"
                                borderRadius="2xl"
                                overflow="hidden"
                                cursor="pointer"
                                transition="all 0.3s ease"
                                border="1px solid"
                                borderColor="#e2e8f0"
                                boxShadow="sm"
                                _hover={{
                                    borderColor: `${section.color}80`,
                                    boxShadow: `0 20px 25px -5px ${section.color}0d, 0 10px 10px -5px ${section.color}05`,
                                }}
                                onClick={() => navigate(section.path)}
                            >
                                {/* Color accent bar */}
                                <Box h="4px" bg={section.color} />

                                {/* Content */}
                                <Box display="flex" flexDirection="column" p={5}>
                                    {/* Badge */}
                                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                                        <Text fontSize="2xl">{section.icon}</Text>
                                    </Box>

                                    {/* Title */}
                                    <Heading
                                        as="h3"
                                        fontSize="lg"
                                        fontWeight="bold"
                                        color="#0d141b"
                                        mb={2}
                                        transition="color 0.3s ease"
                                        _groupHover={{ color: section.color }}
                                    >
                                        {section.title}
                                    </Heading>

                                    {/* Description */}
                                    <Text
                                        color="#4c739a"
                                        fontSize="sm"
                                        lineHeight="1.5"
                                        mb={3}
                                    >
                                        {section.description}
                                    </Text>

                                    {/* Button */}
                                    <Box mt="auto" pt={3} borderTop="1px solid" borderColor="#f1f5f9">
                                        <Button
                                            w="100%"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            h="40px"
                                            px={4}
                                            borderRadius="lg"
                                            bg="#f8fafc"
                                            color="#0d141b"
                                            fontWeight="bold"
                                            fontSize="sm"
                                            transition="all 0.3s ease"
                                            _hover={{ bg: section.color, color: "white" }}
                                            _groupHover={{ bg: section.color, color: "white" }}
                                            _active={{ transform: "scale(0.98)" }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(section.path);
                                            }}
                                        >
                                            <Text>Open</Text>
                                            <Text
                                                fontSize="md"
                                                transition="transform 0.3s ease"
                                                _groupHover={{ transform: "translateX(4px)" }}
                                            >
                                                →
                                            </Text>
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Grid>
                </Box>
            </Box>

            {/* Footer */}
            <Box py={3} textAlign="center" borderTop="1px solid #e2e8f0">
                <Text fontSize="xs" color="#94a3b8">
                    © {currentYear} Mechtronics Fan Selection. All rights reserved.
                </Text>
            </Box>
        </Box>
    );
}
