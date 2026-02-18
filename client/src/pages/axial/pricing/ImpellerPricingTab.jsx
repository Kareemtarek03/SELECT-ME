import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  Alert,
  Heading,
  Spinner,
  Badge,
  Button,
} from "@chakra-ui/react";
import ImpellerBladesTable from "../../../components/ImpellerBladesTable";
import ImpellerHubsTable from "../../../components/ImpellerHubsTable";
import ImpellerFramesTable from "../../../components/ImpellerFramesTable";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

export default function ImpellerPricingTab() {
  const [activeSubTab, setActiveSubTab] = useState("blades");
  const [loading, setLoading] = useState(true);
  const [blades, setBlades] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [frames, setFrames] = useState([]);
  const [alert, setAlert] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch blades
      const bladesResp = await fetch(
        `${API_BASE_URL}/api/pricing/axial-impeller/blades`,
        { headers: getAuthHeaders() }
      );
      if (bladesResp.ok) {
        const bladesData = await bladesResp.json();
        setBlades(bladesData.data || bladesData || []);
      }

      // Fetch hubs
      const hubsResp = await fetch(
        `${API_BASE_URL}/api/pricing/axial-impeller/hubs`,
        { headers: getAuthHeaders() }
      );
      if (hubsResp.ok) {
        const hubsData = await hubsResp.json();
        setHubs(hubsData.data || hubsData || []);
      }

      // Fetch frames
      const framesResp = await fetch(
        `${API_BASE_URL}/api/pricing/axial-impeller/frames`,
        { headers: getAuthHeaders() }
      );
      if (framesResp.ok) {
        const framesData = await framesResp.json();
        setFrames(framesData.data || framesData || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setAlert({ type: "error", message: "Failed to connect to server" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box p={4} bg="var(--bg-page)" minH="100vh">
      <Box mb={6}>
        <Heading color="var(--text-primary)" mb={2}>
          Impeller Pricing
        </Heading>
        <Text color="var(--text-muted)">Manage pricing for blades, hubs, and frames</Text>
      </Box>

      {alert && (
        <Alert.Root
          status={alert.type}
          mb={4}
          borderRadius="md"
          bg={alert.type === "success" ? "var(--success)" : "var(--error)"}
          color="white"
        >
          <Alert.Indicator />
          <Box>
            <Alert.Title>{alert.message}</Alert.Title>
          </Box>
        </Alert.Root>
      )}

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minH="400px"
        >
          <Spinner size="xl" color="blue.500" />
        </Box>
      ) : (
        <>
          {/* Sub-Tabs Navigation */}
          <Box
            display="flex"
            gap={2}
            mb={4}
            borderBottom="1px solid #334155"
            pb={3}
          >
            <Button
              onClick={() => setActiveSubTab("blades")}
              bg={activeSubTab === "blades" ? "#3b82f6" : "transparent"}
              color={activeSubTab === "blades" ? "white" : "#94a3b8"}
              border={activeSubTab === "blades" ? "none" : "1px solid #334155"}
              _hover={{
                bg: activeSubTab === "blades" ? "#2563eb" : "#1e293b",
                color: "white",
              }}
              px={4}
              py={2}
              borderRadius="md"
              fontWeight={activeSubTab === "blades" ? "semibold" : "normal"}
            >
              <Badge colorPalette="blue" mr={2}>
                {blades.length}
              </Badge>
              Blades
            </Button>
            <Button
              onClick={() => setActiveSubTab("hubs")}
              bg={activeSubTab === "hubs" ? "#3b82f6" : "transparent"}
              color={activeSubTab === "hubs" ? "white" : "#94a3b8"}
              border={activeSubTab === "hubs" ? "none" : "1px solid #334155"}
              _hover={{
                bg: activeSubTab === "hubs" ? "#2563eb" : "#1e293b",
                color: "white",
              }}
              px={4}
              py={2}
              borderRadius="md"
              fontWeight={activeSubTab === "hubs" ? "semibold" : "normal"}
            >
              <Badge colorPalette="blue" mr={2}>
                {hubs.length}
              </Badge>
              Hubs
            </Button>
            <Button
              onClick={() => setActiveSubTab("frames")}
              bg={activeSubTab === "frames" ? "#3b82f6" : "transparent"}
              color={activeSubTab === "frames" ? "white" : "#94a3b8"}
              border={activeSubTab === "frames" ? "none" : "1px solid #334155"}
              _hover={{
                bg: activeSubTab === "frames" ? "#2563eb" : "#1e293b",
                color: "white",
              }}
              px={4}
              py={2}
              borderRadius="md"
              fontWeight={activeSubTab === "frames" ? "semibold" : "normal"}
            >
              <Badge colorPalette="blue" mr={2}>
                {frames.length}
              </Badge>
              Frames
            </Button>
          </Box>

          {/* Table Components */}
          {activeSubTab === "blades" && (
            <ImpellerBladesTable
              blades={blades}
              onUpdate={fetchData}
              getAuthHeaders={getAuthHeaders}
              setAlert={setAlert}
            />
          )}
          {activeSubTab === "hubs" && (
            <ImpellerHubsTable
              hubs={hubs}
              onUpdate={fetchData}
              getAuthHeaders={getAuthHeaders}
              setAlert={setAlert}
            />
          )}
          {activeSubTab === "frames" && (
            <ImpellerFramesTable
              frames={frames}
              onUpdate={fetchData}
              getAuthHeaders={getAuthHeaders}
              setAlert={setAlert}
            />
          )}
        </>
      )}
    </Box>
  );
}
