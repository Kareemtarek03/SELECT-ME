import React from "react";
import { Box, Text, Button, VStack, Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/ME Logo.svg";

export default function LandingPage() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    const handleExit = () => {
        // For Electron app, close the window
        if (window.electron) {
            window.electron.close();
        } else {
            // For web, just go back or close tab
            window.close();
        }
    };

    return (
        <Box
            h="100vh"
            bg="white"
            display="flex"
            flexDirection="column"
            position="relative"
            overflow="hidden"
        >
            {/* <Box w='100vw'
                display='flex'
                justifyContent='flex-end' >
                <Button
                    margin={2}
                    backgroundColor='transparent'
                    color='black'
                    textDecoration='underline'
                    onClick={() => navigate("/admin")}
                >
                    Admin
                </Button>
            </Box> */}
            {/* Main Content */}
            <Box flex={1} display="flex" alignItems="center" justifyContent="center">
                <VStack spacing={6} align="center">
                    {/* Logo Icon */}
                    <Box
                        w="140px"
                        h="140px"
                        borderRadius="full"
                        bg="white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="0 8px 32px rgba(0, 0, 0, 0.1)"
                        p={4}
                    >
                        {/* ME Logo */}
                        <Image
                            src={logo}
                            alt="Mechatronics Engineering Logo"
                            w="90px"
                            h="90px"
                            objectFit="contain"
                        />
                    </Box>

                    {/* Title */}
                    <Text
                        fontSize={{ base: "xl", md: "2xl" }}
                        fontWeight="bold"
                        color="#333"
                        textAlign="center"
                    >
                        Mechatronics Engineering
                    </Text>

                    {/* Fan Selection Button */}
                    <Button
                        onClick={() => navigate("/fan-categories")}
                        bg="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                        color="white"
                        size="lg"
                        px={12}
                        py={6}
                        fontSize="lg"
                        fontWeight="bold"
                        borderRadius="xl"
                        boxShadow="0 4px 20px rgba(59, 130, 246, 0.4)"
                        border="none"
                        _hover={{
                            bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 30px rgba(59, 130, 246, 0.5)",
                        }}
                        _active={{
                            transform: "translateY(0)",
                        }}
                        transition="all 0.3s ease"
                    >
                        SELECT ME
                    </Button>

                    {/* Info Text */}
                    <Text
                        fontSize="sm"
                        color="#888"
                        textAlign="center"
                        mt={4}
                    >
                        Developed by Mechatronics Engineering
                    </Text>
                    <Text
                        fontSize="sm"
                        color="#888"
                        textAlign="center"
                    >
                        Version 2.1.0
                    </Text>
                </VStack>
            </Box>

            {/* Footer */}
            <Box
                py={3}
                textAlign="center"
                borderTop="1px solid #e2e8f0"
            >
                <Text fontSize="xs" color="#94a3b8">
                    © {currentYear} Mechtronics Fan Selection. All rights reserved.
                </Text>
            </Box>


        </Box>
    );
}
