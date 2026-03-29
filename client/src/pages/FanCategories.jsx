import React from "react";
import {
    Box,
    Text,
    Heading,
    Grid,
    Button,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import HamburgerMenu from "../components/HamburgerMenu";
import axialFanImage from "../assets/axial-fan.png";
import centrifugalFanImage from "../assets/centrifugal-fan.png";

// Fan category data
const fanCategories = [
    {
        id: "axial",
        title: "Axial Fans",
        badge: "High Volume",
        description: "Ideal for low pressure, high volume airflow applications. Commonly used for general ventilation and cooling.",
        image: axialFanImage,
        path: "/axial/fan-types",
        color: "#137fec",
    },
    {
        id: "centrifugal",
        title: "Centrifugal Fans",
        badge: "High Pressure",
        description: "Best for high pressure systems and ducted applications. Perfect for moving air through filters or dampers.",
        image: centrifugalFanImage,
        path: "/centrifugal/fan-types",
        color: "#137fec",
    },
];

// Category Card Component - Matching code.html design
function CategoryCard({ title, badge, description, image, path, color }) {
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
                borderColor: "rgba(19, 127, 236, 0.5)",
                boxShadow: "0 20px 25px -5px rgba(19, 127, 236, 0.05), 0 10px 10px -5px rgba(19, 127, 236, 0.02)",
            }}
            onClick={() => navigate(path)}
        >
            {/* Image Container */}
            <Box
                position="relative"
                overflow="hidden"
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={4}
                bg="#f8fafc"
                h="160px"
                transition="background-color 0.3s ease"
                _groupHover={{ bg: "#f1f5f9" }}
            >
                {/* Decorative gradient overlay */}
                <Box
                    position="absolute"
                    inset={0}
                    bgGradient="linear(to-tr, rgba(19, 127, 236, 0.05), transparent)"
                    opacity={0}
                    transition="opacity 0.5s ease"
                    _groupHover={{ opacity: 1 }}
                />
                <Box
                    as="img"
                    src={image}
                    alt={title}
                    w="100%"
                    h="100%"
                    objectFit="contain"
                    transition="transform 0.5s ease"
                    _groupHover={{ transform: "scale(1.05)" }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`;
                        e.target.parentElement.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;">🌀</div>`;
                    }}
                />
            </Box>

            {/* Content */}
            <Box display="flex" flexDirection="column" flex={1} p={4}>
                {/* Badge */}
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Text
                        bg="#eff6ff"
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
                    lineHeight="1.4"
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
                            bg: "#137fec",
                            color: "white",
                        }}
                        _groupHover={{
                            bg: "#137fec",
                            color: "white",
                        }}
                        _active={{ transform: "scale(0.98)" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(path);
                        }}
                    >
                        <Text>Select Category</Text>
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

// Main Fan Categories Component - Fit to viewport, no scrolling
export default function FanCategories() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    return (
        <Box
            bg="#f6f7f8"
            h="100vh"
            display="flex"
            flexDirection="column"
            overflow="hidden"
        >
            <HamburgerMenu />

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
                <Box w="100%" maxW="800px" display="flex" flexDirection="column">
                    {/* Back Button */}
                    <Box mb={3}>
                        <Button
                            variant="ghost"
                            display="flex"
                            alignItems="center"
                            gap={2}
                            color="#64748b"
                            fontSize="sm"
                            fontWeight="bold"
                            p={0}
                            h="auto"
                            transition="color 0.3s ease"
                            _hover={{ color: "#137fec", bg: "transparent" }}
                            onClick={() => navigate("/dashboard")}
                            sx={{
                                "& > span:first-of-type": {
                                    transition: "transform 0.3s ease",
                                },
                                "&:hover > span:first-of-type": {
                                    transform: "translateX(-4px)",
                                },
                            }}
                        >
                            <Text as="span" fontSize="lg">←</Text>
                            <Text as="span">Back to Dashboard</Text>
                        </Button>
                    </Box>

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
                            Select Fan Category
                        </Heading>
                        <Text
                            color="#4c739a"
                            fontSize={{ base: "sm", md: "md" }}
                            fontWeight="normal"
                            lineHeight="relaxed"
                        >
                            Choose a fan type to begin your selection process.
                        </Text>
                    </Box>

                    {/* Cards Grid */}
                    <Grid
                        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                        gap={4}
                        alignItems="stretch"
                    >
                        {fanCategories.map((category) => (
                            <CategoryCard
                                key={category.id}
                                title={category.title}
                                badge={category.badge}
                                description={category.description}
                                image={category.image}
                                path={category.path}
                                color={category.color}
                            />
                        ))}
                    </Grid>
                </Box>
            </Box>

            {/* Footer */}
            <Box py={3} textAlign="center" color="#94a3b8" fontSize="xs">
                <Text>© {currentYear}Mechtronics Fan Selection. All rights reserved.</Text>
            </Box>
        </Box>
    );
}
