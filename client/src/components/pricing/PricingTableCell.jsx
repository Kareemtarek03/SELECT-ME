import React from "react";
import { Table, Input } from "@chakra-ui/react";

export function TableCell({
  children,
  isLast = false,
  textAlign = "center",
  ...props
}) {
  return (
    <Table.Cell
      borderColor="#e2e8f0"
      borderRight={isLast ? "none" : "1px solid #e2e8f0"}
      borderBottom="1px solid #e2e8f0"
      color="#1e293b"
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
      borderColor="#e2e8f0"
      borderRight={isLast ? "none" : "1px solid #e2e8f0"}
      borderBottom="1px solid #e2e8f0"
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
        bg="#f8fafc"
        color="#1e293b"
        border="1px solid #e2e8f0"
      />
    </Table.Cell>
  );
}

export function HeaderCell({ children, isLast = false }) {
  return (
    <Table.ColumnHeader
      bg="#f1f5f9"
      color="#1e293b"
      fontWeight="600"
      borderRight={isLast ? "none" : "1px solid #e2e8f0"}
      borderBottom="2px solid #cbd5e1"
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
