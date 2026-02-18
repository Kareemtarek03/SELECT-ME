import React from "react";
import { Box, Button } from "@chakra-ui/react";

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName = "item",
}) {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0,0,0,0.7)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="1000"
    >
      <Box
        bg="var(--bg-card)"
        p={6}
        borderRadius="lg"
        maxW="400px"
        borderWidth="1px"
        borderColor="var(--border-color)"
      >
        <Box fontSize="lg" fontWeight="bold" color="var(--text-primary)" mb={4}>
          Confirm Delete
        </Box>
        <Box color="var(--text-muted)" mb={6}>
          Are you sure you want to delete this {itemName}? This action cannot be
          undone.
        </Box>
        <Box display="flex" gap={3} justifyContent="flex-end">
          <Button
            bg="var(--text-muted-2)"
            color="var(--text-primary)"
            onClick={onClose}
            _hover={{ bg: "var(--border-color)" }}
          >
            Cancel
          </Button>
          <Button
            bg="var(--error)"
            color="white"
            onClick={onConfirm}
            _hover={{ bg: "var(--error)" }}
          >
            Delete
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
