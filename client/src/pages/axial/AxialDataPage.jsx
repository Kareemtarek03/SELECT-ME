import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Text, Heading, Button } from "@chakra-ui/react";
import { FaDatabase, FaCog, FaList } from "react-icons/fa";
import HamburgerMenu from "../../components/HamburgerMenu.jsx";
import FanData from "../admin/FanData";
import MotorData from "../admin/Motor";
import AxialPricingTabsPage from "./pricing/AxialPricingTabsPage";

const TABS = [
  { id: "fans", name: "Fans", icon: FaDatabase },
  { id: "motor", name: "Motor", icon: FaCog },
  { id: "pricing", name: "Pricing", icon: FaList },
];

const VALID_TABS = new Set(TABS.map((t) => t.id));

export default function AxialDataPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && VALID_TABS.has(tabFromUrl) ? tabFromUrl : "fans"
  );

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.has(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const setActiveTabAndUrl = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
  };

  return (
    <Box minH="100vh" bg="var(--bg-page)" display="flex" flexDirection="column">
      <HamburgerMenu />
      <Box
        pt={{ base: "80px", md: "100px" }}
        pb={8}
        px={{ base: 4, md: 6, lg: 8 }}
      >
      <Box w="100%" mx="auto">
        <Box mb={6}>
          <Heading as="h1" size="xl" color="var(--text-primary)" fontWeight="bold" mb={2}>
            Axial Data
          </Heading>
          <Text color="var(--text-muted)" fontSize="md">
            Manage fan data, motor data, and pricing
          </Text>
        </Box>

        <Box
          display="flex"
          gap={2}
          borderBottom="1px solid var(--border-color)"
          pb={4}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTabAndUrl(tab.id)}
                bg={isActive ? "#3b82f6" : "#ffffff"}
                color={isActive ? "white" : "#1e293b"}
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

        <Box>
          {activeTab === "fans" && <FanData />}
          {activeTab === "motor" && <MotorData />}
          {activeTab === "pricing" && (
          
              <AxialPricingTabsPage />
          
          )}
        </Box>
      </Box>
      </Box>
    </Box>
  );
}
