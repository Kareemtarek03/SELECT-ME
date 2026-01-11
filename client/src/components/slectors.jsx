// components/UnitSelect.jsx
import {
  Box,
  Text,
  Portal,
  Select,
} from "@chakra-ui/react";

export default function UnitSelect({
  label,
  name,
  collection,
  value,
  onChange,
  placeholder,
  defaultValue,
}) {
  return (
    <Box flex={1}>
      {label && (
        <Text fontWeight={"semibold"} mb={2} color="#e2e8f0">
          {label}
        </Text>
      )}

      {defaultValue && (
        <Text fontSize="xs" color="#94a3b8" mt={1}>
          Default: {defaultValue}
        </Text>
      )}

      <Select.Root
        name={name}
        collection={collection}
        value={value ? [value] : []}
        onValueChange={(details) => onChange(details.value[0])}
      >
        <Select.HiddenSelect />
        <Select.Control bg="white" borderColor="#e2e8f0">
          <Select.Trigger>
            <Select.ValueText placeholder={placeholder} color="#1e293b" />
          </Select.Trigger>
        </Select.Control>

        <Portal>
          <Select.Positioner>
            <Select.Content bg="white" borderColor="#e2e8f0" boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)">
              {collection.items.map((item) => (
                <Select.Item
                  item={item}
                  key={item.value}
                  color="#1e293b"
                  _hover={{ bg: "#f1f5f9" }}
                  _selected={{ bg: "#3b82f6", color: "white" }}
                >
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </Box>
  );
}
