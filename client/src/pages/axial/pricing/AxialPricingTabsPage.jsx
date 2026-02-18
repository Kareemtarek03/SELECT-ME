import React, { useState } from "react";
import { Box, Text, Heading, Button } from "@chakra-ui/react";
import { FaList, FaTools, FaCog, FaCube } from "react-icons/fa";

// Import the existing table components
import PricingItemsTab from "./PricingItemsTab";
import AccessoriesTab from "./AccessoriesTab";
import ImpellerPricingTab from "./ImpellerPricingTab";
import CasingPricingTab from "./CasingPricingTab";

export default function AxialPricingTabsPage() {
  const [activeTab, setActiveTab] = useState("pricing-items");

  const tabs = [
    { id: "pricing-items", name: "Pricing Items", icon: FaList },
    { id: "accessories", name: "Accessories", icon: FaTools },
    { id: "impeller", name: "Impeller Pricing", icon: FaCog },
    { id: "casing", name: "Casing Pricing", icon: FaCube },
  ];

  return (
    <Box
      bg="var(--bg-page)"
      minH="100vh"
      py={{ base: 4, md: 6 }}
    >
      <Box w="100%" mx="auto">
        {/* Header */}
        <Box mb={6}>
          <Heading as="h1" size="xl" color="var(--text-primary)" fontWeight="bold" mb={2}>
            Axial Pricing
          </Heading>
          <Text color="var(--text-muted)" fontSize="md">
            Manage pricing items and accessories for axial fans
          </Text>
        </Box>

        {/* Tab Navigation */}
        <Box
          display="flex"
          gap={2}
          mb={6}
          borderBottom="1px solid var(--border-color)"
          pb={4}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                bg={isActive ? "#3b82f6" : "#ffffff"}
                color={isActive ? "white" : "#475569"}
                border="1px solid"
                borderColor={isActive ? "#3b82f6" : "#e2e8f0"}
                _hover={{
                  bg: isActive ? "#2563eb" : "#f1f5f9",
                  color: isActive ? "white" : "#1e293b",
                  borderColor: isActive ? "#2563eb" : "#cbd5e1",
                }}
                px={6}
                py={5}
                borderRadius="lg"
                fontWeight={isActive ? "600" : "normal"}
                display="flex"
                alignItems="center"
                gap={2}
                boxShadow={isActive ? "sm" : "none"}
              >
                <Icon />
                {tab.name}
              </Button>
            );
          })}
        </Box>

        {/* Tab Content */}
        <Box>
          {activeTab === "pricing-items" && <PricingItemsTab />}
          {activeTab === "accessories" && <AccessoriesTab />}
          {activeTab === "impeller" && <ImpellerPricingTab />}
          {activeTab === "casing" && <CasingPricingTab />}
        </Box>
      </Box>
    </Box>
  );
}
