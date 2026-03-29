import React from "react";
import { Box, Text, Heading, Button, Grid } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu";

const dashboardCards = [
    {
        id: "fan-selection",
        title: "Fan Selection",
        badge: "Engineering",
        description: "Select and configure axial or centrifugal fans based on your system requirements.",
        path: "/fan-categories",
        color: "#137fec",
    },
    {
        id: "unit-converter",
        title: "Unit Converter",
        badge: "Tools",
        description: "Convert between different engineering units for pressure, airflow, power, and more.",
        path: "/unit-converter",
        color: "#10b981",
    },
    {
        id: "admin",
        title: "Admin",
        badge: "Management",
        description: "Manage axial fan data, motor specifications, centrifugal data, and pricing tables.",
        path: "/admin-dashboard",
        color: "#8b5cf6",
    },
];

function DashboardCard({ title, badge, description, path, color }) {
    const navigate = useNavigate();

    return (
        <Box
            role="group"
            position="relative"
            display="flex"
            flexDirection="column"
            bg="white"
            borderRadius="2xl"
            boxShadow="sm"
            border="1px solid"
            borderColor="#e2e8f0"
            overflow="hidden"
            h="100%"
            transition="all 0.3s ease"
            cursor="pointer"
            _hover={{
                borderColor: `${color}80`,
                boxShadow: `0 20px 25px -5px ${color}0d, 0 10px 10px -5px ${color}05`,
            }}
            onClick={() => navigate(path)}
        >
            {/* Color accent bar */}
            <Box h="4px" bg={color} />

            {/* Content */}
            <Box display="flex" flexDirection="column" flex={1} p={5}>
                {/* Badge */}
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Text
                        bg={`${color}15`}
                        color={color}
                        fontSize="xs"
                        fontWeight="bold"
                        px={2}
                        py={1}
                        borderRadius="md"
                        textTransform="uppercase"
                        letterSpacing="wider"
                    >
                        {badge}
                    </Text>
                </Box>

                {/* Title */}
                <Heading
                    as="h3"
                    fontSize="lg"
                    fontWeight="bold"
                    color="#0d141b"
                    mb={2}
                    transition="color 0.3s ease"
                    _groupHover={{ color: color }}
                >
                    {title}
                </Heading>

                {/* Description */}
                <Text
                    color="#4c739a"
                    fontSize="sm"
                    lineHeight="1.5"
                    mb={3}
                    noOfLines={2}
                >
                    {description}
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
                        _hover={{
                            bg: color,
                            color: "white",
                        }}
                        _groupHover={{
                            bg: color,
                            color: "white",
                        }}
                        _active={{ transform: "scale(0.98)" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(path);
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
    );
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    return (
        <Box
            bg="#f6f7f8"
            h="100vh"
            display="flex"
            flexDirection="column"
            overflow="hidden"
            position="relative"
        >
            <HamburgerMenu />

            {/* Back to Landing Page Button - Top Right */}
            <button
                onClick={() => navigate("/")}
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
                <span>←</span> Home
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
                <Box w="100%" maxW="960px" display="flex" flexDirection="column">
                    {/* Header Section */}
                    <Box mb={6} textAlign="center" maxW="2xl" mx="auto">
                        <Heading
                            as="h1"
                            color="#0d141b"
                            fontSize={{ base: "2xl", md: "3xl" }}
                            fontWeight="black"
                            lineHeight="tight"
                            letterSpacing="tight"
                            mb={2}
                        >
                            What would you like to do?
                        </Heading>
                        <Text
                            color="#4c739a"
                            fontSize={{ base: "sm", md: "md" }}
                            fontWeight="normal"
                            lineHeight="relaxed"
                        >
                            Choose an option to get started
                        </Text>
                    </Box>

                    {/* Cards Grid */}
                    <Grid
                        templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                        gap={5}
                        alignItems="stretch"
                    >
                        {dashboardCards.map((card) => (
                            <DashboardCard
                                key={card.id}
                                title={card.title}
                                badge={card.badge}
                                description={card.description}
                                path={card.path}
                                color={card.color}
                            />
                        ))}
                    </Grid>
                </Box>
            </Box>

            {/* Footer */}
            <Box py={3} textAlign="center" color="#94a3b8" fontSize="xs">
                <Text>© {currentYear} Mechtronics Fan Selection. All rights reserved.</Text>
            </Box>
        </Box>
    );
}
