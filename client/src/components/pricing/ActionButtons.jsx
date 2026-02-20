import React from "react";
import { Box, Button } from "@chakra-ui/react";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

export function EditModeButtons({ onSave, onCancel }) {
  return (
    <Box display="flex" gap={2}>
      <Button
        size="xs"
        bg="var(--btn-primary)"
        color="white"
        onClick={onSave}
        _hover={{ bg: "var(--btn-primary-hover)" }}
      >
        <FaSave />
      </Button>
      <Button
        size="xs"
        variant="outline"
        borderColor="var(--border-color)"
        color="var(--text-primary)"
        onClick={onCancel}
        _hover={{ bg: "var(--bg-elevated)" }}
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
        bg="var(--btn-secondary)"
        color="white"
        onClick={onEdit}
        _hover={{ bg: "var(--btn-secondary-hover)" }}
      >
        <FaEdit />
      </Button>
      <Button
        size="xs"
        bg="var(--btn-danger)"
        color="white"
        onClick={onDelete}
        _hover={{ bg: "var(--btn-danger-hover)" }}
      >
        <FaTrash />
      </Button>
    </Box>
  );
}
