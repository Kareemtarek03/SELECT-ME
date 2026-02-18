import React from "react";
import { Box, Button } from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";

export default function PricingTableWrapper({ title, onAdd, children }) {
  return (
    <Box>
      <Box mb={4}>
        <Button
          bg="#3b82f6"
          color="white"
          onClick={onAdd}
          leftIcon={<FaPlus />}
          _hover={{ bg: "#2563eb" }}
        >
          Add {title}
        </Button>
      </Box>

      <Box
        className="admin-table-container"
        borderWidth="1px"
        borderRadius="lg"
        borderColor="#e2e8f0"
        bg="#ffffff"
        overflow="auto"
        maxH="600px"
        boxShadow="0 1px 3px rgba(0,0,0,0.08)"
      >
        {children}
      </Box>
    </Box>
  );
}
