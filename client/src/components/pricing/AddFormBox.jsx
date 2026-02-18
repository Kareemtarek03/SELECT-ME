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
      bg="var(--bg-card)"
      borderRadius="lg"
      border="1px solid var(--border-color)"
      p={6}
      mb={4}
    >
      <Heading as="h3" size="md" color="var(--text-primary)" mb={4}>
        {title}
      </Heading>
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))" gap={4}>
        {children}
      </Box>
      <Box display="flex" gap={3} mt={4}>
        <Button
          bg="var(--success)"
          color="white"
          _hover={{ bg: "var(--success-hover)" }}
          leftIcon={<FaSave />}
          onClick={onSave}
        >
          Save
        </Button>
        <Button
          bg="var(--text-muted-2)"
          color="var(--text-primary)"
          _hover={{ bg: "var(--border-color)" }}
          leftIcon={<FaTimes />}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
