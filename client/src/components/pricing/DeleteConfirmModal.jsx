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
        bg="#ffffff"
        p={6}
        borderRadius="lg"
        maxW="400px"
        borderWidth="1px"
        borderColor="#e2e8f0"
        boxShadow="0 4px 12px rgba(0,0,0,0.15)"
      >
        <Box fontSize="lg" fontWeight="bold" color="#1e293b" mb={4}>
          Confirm Delete
        </Box>
        <Box color="#64748b" mb={6}>
          Are you sure you want to delete this {itemName}? This action cannot be
          undone.
        </Box>
        <Box display="flex" gap={3} justifyContent="flex-end">
          <Button
            bg="#e2e8f0"
            color="#1e293b"
            onClick={onClose}
            _hover={{ bg: "#cbd5e1" }}
          >
            Cancel
          </Button>
          <Button
            bg="#dc2626"
            color="white"
            onClick={onConfirm}
            _hover={{ bg: "#b91c1c" }}
          >
            Delete
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
