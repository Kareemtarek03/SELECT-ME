import React from "react";
import { Box, Button } from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";

export default function PricingTableWrapper({ title, onAdd, children }) {
  return (
    <Box>
      <Box mb={4}>
        <Button
          bg="var(--btn-secondary)"
          color="white"
          onClick={onAdd}
          leftIcon={<FaPlus />}
          _hover={{ bg: "var(--btn-secondary-hover)" }}
        >
          Add {title}
        </Button>
      </Box>

      <Box
        className="admin-table-container"
        borderWidth="1px"
        borderRadius="lg"
        borderColor="var(--border-color)"
        bg="var(--bg-card)"
        overflow="auto"
        maxH="600px"
        boxShadow="0 1px 3px rgba(0,0,0,0.08)"
      >
        {children}
      </Box>
    </Box>
  );
}
