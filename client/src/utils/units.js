import { createListCollection } from "@chakra-ui/react";

export const airFlowUnits = createListCollection({
  items: [
    { label: "m³/s", value: "m^3/s" },
    { label: "m³/min", value: "m^3/min" },
    { label: "m³/hr", value: "m^3/hr" },
    { label: "L/s", value: "L/s" },
    { label: "L/min", value: "L/min" },
    { label: "L/hr", value: "L/hr" },
    { label: "CFM", value: "CFM" },
  ],
});
export const InsulationClassUnits = createListCollection({
  items: [
    { label: "F", value: "F" },
    { label: "F (Atex)", value: "F (Atex)" },
    { label: "H (F300)", value: "H (F300)" },
    { label: "H (F400)", value: "H (F400)" },
  ],
});

export const pressureUnits = createListCollection({
  items: [
    { label: "Pa", value: "Pa" },
    { label: "kPa", value: "kPa" },
    { label: "Psi", value: "Psi" },
    { label: "Bar", value: "bar" },
    { label: "in.wg", value: "in.wg" },
  ],
});

export const powerUnits = createListCollection({
  items: [
    { label: "W", value: "W" },
    { label: "kW", value: "kW" },
    { label: "HP", value: "HP" },
  ],
});

export const fanTypeUnits = createListCollection({
  items: [
    { label: "AF-S", value: "AF-S" },
    { label: "AF-L", value: "AF-L" },
    { label: "WF", value: "WF" },
    { label: "ARTF", value: "ARTF" },
    { label: "SF", value: "SF" },
    { label: "ABSF-C", value: "ABSF-C" },
    { label: "ABSF-S", value: "ABSF-S" },
    { label: "SABF", value: "SABF" },
    { label: "SARTF", value: "SARTF" },
    { label: "AJF", value: "AJF" },
  ],
});
export const NoPhases = createListCollection({
  items: [
    { label: "1", value: "1" },

    { label: "3", value: "3" },
  ],
});
