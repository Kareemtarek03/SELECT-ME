import React from "react";
import { Table, Input } from "@chakra-ui/react";

export function TableCell({
  children,
  isLast = false,
  textAlign = "center",
  isCalculated = false,
  ...props
}) {
  return (
    <Table.Cell
      borderColor="var(--border-color)"
      borderRight={isLast ? "none" : "1px solid var(--border-color)"}
      borderBottom="1px solid var(--border-color)"
      color={isCalculated ? "var(--success)" : "var(--text-primary)"}
      fontWeight={isCalculated ? "bold" : "normal"}
      py={3}
      px={4}
      textAlign={textAlign}
      whiteSpace="nowrap"
      minW="100px"
      maxW="250px"
      overflow="hidden"
      textOverflow="ellipsis"
      {...props}
    >
      {children}
    </Table.Cell>
  );
}

export function EditableCell({
  value,
  onChange,
  type = "text",
  isLast = false,
}) {
  return (
    <Table.Cell
      borderColor="var(--border-color)"
      borderRight={isLast ? "none" : "1px solid var(--border-color)"}
      borderBottom="1px solid var(--border-color)"
      py={3}
      px={4}
      minW="100px"
      maxW="250px"
    >
      <Input
        size="sm"
        type={type}
        value={value}
        onChange={onChange}
        bg="var(--bg-page)"
        color="var(--text-primary)"
        border="1px solid var(--border-color)"
      />
    </Table.Cell>
  );
}

export function HeaderCell({ children, isLast = false }) {
  return (
    <Table.ColumnHeader
      bg="var(--table-header-bg)"
      color="var(--text-primary)"
      fontWeight="600"
      borderRight={isLast ? "none" : "1px solid var(--border-color)"}
      borderBottom="2px solid var(--table-header-border)"
      py={3}
      whiteSpace="nowrap"
      minW="100px"
      maxW="250px"
      overflow="hidden"
      textOverflow="ellipsis"
      px={4}
      textAlign="center"
    >
      {children}
    </Table.ColumnHeader>
  );
}
