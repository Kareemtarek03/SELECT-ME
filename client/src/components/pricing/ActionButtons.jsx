import React from "react";
import { Box, Button } from "@chakra-ui/react";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

export function EditModeButtons({ onSave, onCancel }) {
  return (
    <Box display="flex" gap={2}>
      <Button
        size="xs"
        bg="var(--success)"
        color="white"
        onClick={onSave}
        _hover={{ bg: "var(--success-hover)" }}
      >
        <FaSave />
      </Button>
      <Button
        size="xs"
        bg="var(--text-muted-2)"
        color="var(--text-primary)"
        onClick={onCancel}
        _hover={{ bg: "var(--border-color)" }}
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
        bg="var(--accent)"
        color="white"
        onClick={onEdit}
        _hover={{ bg: "var(--accent-hover)" }}
      >
        <FaEdit />
      </Button>
      <Button
        size="xs"
        bg="var(--error)"
        color="white"
        onClick={onDelete}
        _hover={{ bg: "var(--error)" }}
      >
        <FaTrash />
      </Button>
    </Box>
  );
}
