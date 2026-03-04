import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Text, Heading, Button } from "@chakra-ui/react";
import { FaFan, FaCog, FaList } from "react-icons/fa";
import HamburgerMenu from "../../components/HamburgerMenu";
import AxialPricingTabsPage from "../axial/pricing/AxialPricingTabsPage";
import PricingItemsTab from "../axial/pricing/PricingItemsTab";
import CentrifugalCasingPricingSection from "./CentrifugalCasingPricingSection";

const TABS = [
  { id: "axial", name: "Axial", icon: FaFan },
  { id: "centrifugal", name: "Centrifugal", icon: FaCog },
  { id: "pricing-items", name: "Pricing Items", icon: FaList },
];

const VALID_TABS = new Set(TABS.map((t) => t.id));

export default function AdminPricingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && VALID_TABS.has(tabFromUrl) ? tabFromUrl : "axial"
  );

  React.useEffect(() => {
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
      <Box pt={{ base: "80px", md: "100px" }} pb={8} px={{ base: 4, md: 6, lg: 8 }}>
        <Box w="100%" mx="auto">
          <Box mb={6}>
            <Heading as="h1" size="xl" color="var(--text-primary)" fontWeight="bold" mb={2}>
              Pricing
            </Heading>
            <Text color="var(--text-muted)" fontSize="md">
              Axial pricing (accessories, impeller, casing), centrifugal casing pricing, and pricing items.
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
                  bg={isActive ? "#1e293b" : "#ffffff"}
                  color={isActive ? "white" : "#1e293b"}
                  border="1px solid"
                  borderColor={isActive ? "#1e293b" : "#e2e8f0"}
                  _hover={{
                    bg: isActive ? "#0f172a" : "#f1f5f9",
                    color: isActive ? "white" : "#1e293b",
                    borderColor: isActive ? "#0f172a" : "#cbd5e1",
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
          <Box mt={6}>
            {activeTab === "axial" && (
              <AxialPricingTabsPage hidePricingItemsTab />
            )}
            {activeTab === "centrifugal" && <CentrifugalCasingPricingSection />}
            {activeTab === "pricing-items" && <PricingItemsTab />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
