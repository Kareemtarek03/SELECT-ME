import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  Alert,
  Heading,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import CasingPricingTable from "../../../components/CasingPricingTable";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

export default function CasingPricingTab() {
  const [loading, setLoading] = useState(true);
  const [casings, setCasings] = useState([]);
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
      const response = await fetch(
        `${API_BASE_URL}/api/pricing/axial-casing/casings`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        setCasings(data || []);
      } else {
        setAlert({ type: "error", message: "Failed to fetch casing data" });
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
          Casing Pricing
        </Heading>
        <Box display="flex" alignItems="center" gap={3}>
          <Text color="var(--text-muted)">Manage pricing for axial fan casings</Text>
          <Badge colorPalette="blue">{casings.length} items</Badge>
        </Box>
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
        <CasingPricingTable
          casings={casings}
          onUpdate={fetchData}
          getAuthHeaders={getAuthHeaders}
          setAlert={setAlert}
        />
      )}
    </Box>
  );
}
