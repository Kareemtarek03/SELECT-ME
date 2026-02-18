import React from "react";
import { Box, Heading, Button } from "@chakra-ui/react";
import { FaSave, FaTimes } from "react-icons/fa";

/**
 * Consistent "hidden box" add form for all pricing tables.
 * Renders above the table (not as a row) when adding a new item.
 */
export default function AddFormBox({
  title,
  open,
  onSave,
  onCancel,
  children,
}) {
  if (!open) return null;

  return (
    <Box
      bg="#ffffff"
      borderRadius="lg"
      border="1px solid #e2e8f0"
      p={6}
      mb={4}
      boxShadow="0 1px 3px rgba(0,0,0,0.08)"
    >
      <Heading as="h3" size="md" color="#1e293b" mb={4}>
        {title}
      </Heading>
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap={4}>
        {children}
      </Box>
      <Box display="flex" gap={3} mt={4}>
        <Button
          bg="#059669"
          color="white"
          _hover={{ bg: "#047857" }}
          leftIcon={<FaSave />}
          onClick={onSave}
        >
          Save
        </Button>
        <Button
          bg="#e2e8f0"
          color="#1e293b"
          _hover={{ bg: "#cbd5e1" }}
          leftIcon={<FaTimes />}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
