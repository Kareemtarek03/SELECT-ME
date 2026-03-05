import React, { useState } from "react";
import { Box, Text, Button, Stack } from "@chakra-ui/react";
import ExportImportButtons from "../../components/ExportImportButtons";
import GenericCrudTab from "../../components/GenericCrudTab";
import { CASING_TAB_CONFIG } from "../../utils/casingTabConfig";

const CASING_SUB_TABS = [
  { id: "casing-pricing", name: "Casing (Parent)", path: "casing-pricing" },
  { id: "volutes", name: "Volute", path: "casing-volutes" },
  { id: "frames", name: "Frame", path: "casing-frames" },
  { id: "impellers", name: "Impeller", path: "casing-impellers" },
  { id: "funnels", name: "Funnels", path: "casing-funnels" },
  { id: "sleeve-shafts", name: "Sleeve+Shaft", path: "casing-sleeve-shafts" },
  { id: "matching-flanges", name: "Matching Flange", path: "casing-matching-flanges" },
  { id: "bearing-assemblies", name: "Bearing Assembly", path: "casing-bearing-assemblies" },
  { id: "fan-bases", name: "Fan Base", path: "casing-fan-bases" },
  { id: "belt-covers", name: "Belt Cover", path: "casing-belt-covers" },
  { id: "motor-bases", name: "Motor Base", path: "casing-motor-bases" },
  { id: "accessories", name: "Accessories", path: "casing-accessories" },
];

export default function CentrifugalCasingPricingSection() {
  const [casingSubTab, setCasingSubTab] = useState("casing-pricing");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Box>
      <Stack direction="row" mb={4} gap={2} flexWrap="wrap" alignItems="center">
        <ExportImportButtons
          exportPath="/api/centrifugal/data/export/casing-all"
          importPath="/api/centrifugal/data/import/casing-all"
          onImportDone={() => setRefreshKey((k) => k + 1)}
        />
        <Text fontSize="xs" color="var(--text-muted)">
          Export/Import all casing tables at once (multi-sheet Excel)
        </Text>
      </Stack>
      <Box
        display="flex"
        gap={2}
        flexWrap="wrap"
        mb={4}
        borderBottom="1px solid var(--border-color)"
        pb={3}
      >
        {CASING_SUB_TABS.map((st) => {
          const isActive = casingSubTab === st.id;
          return (
            <Button
              key={st.id}
              size="sm"
              onClick={() => setCasingSubTab(st.id)}
              bg={isActive ? "#1e293b" : "#ffffff"}
              color={isActive ? "white" : "#1e293b"}
              border="1px solid"
              borderColor={isActive ? "#1e293b" : "#e2e8f0"}
              _hover={{ bg: isActive ? "#0f172a" : "#f1f5f9" }}
            >
              {st.name}
            </Button>
          );
        })}
      </Box>
      {CASING_SUB_TABS.map((st) => {
        if (casingSubTab !== st.id) return null;
        const cfg = CASING_TAB_CONFIG[st.path];
        if (!cfg) return null;
        return (
          <GenericCrudTab
            key={`${st.id}-${refreshKey}`}
            listPath={`/api/centrifugal/data/${st.path}`}
            createPath={`/api/centrifugal/data/${st.path}`}
            updatePath={`/api/centrifugal/data/${st.path}/:id`}
            deletePath={`/api/centrifugal/data/${st.path}/:id`}
            getRowId={(r) => r.id}
            columns={cfg.columns}
            formFields={cfg.formFields}
          />
        );
      })}
    </Box>
  );
}
