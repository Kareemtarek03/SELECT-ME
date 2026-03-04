import React from "react";
import { Box, Text, Heading } from "@chakra-ui/react";
import HamburgerMenu from "../../components/HamburgerMenu";
import FanData from "./FanData";

export default function AxialFanDataPage() {
  return (
    <Box minH="100vh" bg="var(--bg-page)" display="flex" flexDirection="column">
      <HamburgerMenu />
      <Box pt={{ base: "80px", md: "100px" }} pb={8} px={{ base: 4, md: 6, lg: 8 }}>
        <Box w="100%" mx="auto">
          <Box mb={6}>
            <Heading as="h1" size="xl" color="var(--text-primary)" fontWeight="bold" mb={2}>
              Axial Fan Data
            </Heading>
            <Text color="var(--text-muted)" fontSize="md">
              Manage axial fan data. Import/export Excel, add or delete records.
            </Text>
          </Box>
          <FanData />
        </Box>
      </Box>
    </Box>
  );
}
