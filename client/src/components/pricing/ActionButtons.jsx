import React from "react";
import { Box, Button } from "@chakra-ui/react";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

export function EditModeButtons({ onSave, onCancel }) {
  return (
    <Box display="flex" gap={2}>
      <Button
        size="xs"
        bg="#059669"
        color="white"
        onClick={onSave}
        _hover={{ bg: "#047857" }}
      >
        <FaSave />
      </Button>
      <Button
        size="xs"
        bg="#e2e8f0"
        color="#1e293b"
        onClick={onCancel}
        _hover={{ bg: "#cbd5e1" }}
      >
        <FaTimes />
      </Button>
    </Box>
  );
}

export function ViewModeButtons({ onEdit, onDelete }) {
  return (
    <Box display="flex" gap={2}>
      <Button
        size="xs"
        bg="#3b82f6"
        color="white"
        onClick={onEdit}
        _hover={{ bg: "#2563eb" }}
      >
        <FaEdit />
      </Button>
      <Button
        size="xs"
        bg="#dc2626"
        color="white"
        onClick={onDelete}
        _hover={{ bg: "#b91c1c" }}
      >
        <FaTrash />
      </Button>
    </Box>
  );
}
