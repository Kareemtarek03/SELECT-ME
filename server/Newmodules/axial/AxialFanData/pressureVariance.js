// Pressure (Pa) → Percentage (%) lookup table
const PRESSURE_PERCENTAGE_TABLE = [
  { pa: 25, pct: 50 },
  { pa: 50, pct: 35 },
  { pa: 100, pct: 25 },
  { pa: 150, pct: 20 },
  { pa: 200, pct: 17.5 },
  { pa: 250, pct: 15 },
  { pa: 300, pct: 12.5 },
  { pa: 350, pct: 10 },
  { pa: 400, pct: 10 },
  { pa: 450, pct: 7.5 },
  { pa: 500, pct: 7.5 },
  { pa: 550, pct: 7.5 },
  { pa: 600, pct: 5 },
  { pa: 650, pct: 5 },
  { pa: 700, pct: 5 },
  { pa: 750, pct: 5 },
  { pa: 800, pct: 5 },
  { pa: 850, pct: 5 },
  { pa: 900, pct: 5 },
  { pa: 950, pct: 5 },
  { pa: 1000, pct: 5 },
  { pa: 1050, pct: 5 },
  { pa: 1100, pct: 5 },
  { pa: 1150, pct: 5 },
  { pa: 1200, pct: 5 },
  { pa: 1250, pct: 5 },
  { pa: 1300, pct: 5 },
  { pa: 1350, pct: 5 },
  { pa: 1400, pct: 5 },
  { pa: 1450, pct: 5 },
  { pa: 1500, pct: 5 },
];

// Unit → Pascal conversion factors
const UNIT_TO_PA = {
  Pa: 1,
  "in.wg": 249.0889,
  kPa: 1000,
  psi: 6894.76,
  bar: 100000,
};

/**
 * Convert a pressure value from a given unit to Pascal.
 * @param {number} value - The pressure value.
 * @param {string} unit - The unit of the pressure value (Pa, in.wg, kPa, psi, bar).
 * @returns {number} The pressure in Pascal.
 */
export function convertToPascal(value, unit = "Pa") {
  const factor = UNIT_TO_PA[unit];
  if (factor === undefined) {
    throw new Error(`Unknown pressure unit: "${unit}". Supported: ${Object.keys(UNIT_TO_PA).join(", ")}`);
  }
  return value * factor;
}

/**
 * Find the percentage corresponding to the closest pressure value in the lookup table.
 * Uses binary search for O(log n) performance.
 * @param {number} pressurePa - The pressure in Pascal.
 * @returns {number} The corresponding percentage (e.g. 5, 7.5, 10).
 */
export function lookupPercentage(pressurePa) {
  const table = PRESSURE_PERCENTAGE_TABLE;

  // Edge cases
  if (pressurePa < table[0].pa) return table[0].pct;           // < 25 Pa → 50%
  if (pressurePa > table[table.length - 1].pa) return table[table.length - 1].pct; // > 1500 Pa → 5%

  // Binary search for closest value
  let lo = 0;
  let hi = table.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (table[mid].pa === pressurePa) return table[mid].pct; // exact match
    if (table[mid].pa < pressurePa) lo = mid + 1;
    else hi = mid - 1;
  }

  // lo is the index of the first element > pressurePa, hi = lo - 1
  // Compare distances to determine closest
  const diffLo = lo < table.length ? Math.abs(table[lo].pa - pressurePa) : Infinity;
  const diffHi = hi >= 0 ? Math.abs(table[hi].pa - pressurePa) : Infinity;

  return diffHi <= diffLo ? table[hi].pct : table[lo].pct;
}

/**
 * Get the static pressure variance percentage for a given pressure value and unit.
 * Converts to Pascal, then looks up the closest match in the reference table.
 * @param {number} value - The pressure value.
 * @param {string} unit - The unit (Pa, in.wg, kPa, psi, bar). Defaults to "Pa".
 * @returns {number} The percentage as a number (e.g. 5, 7.5, 10).
 */
export function getPressurePercentage(value, unit = "Pa") {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid pressure value: ${value}`);
  }
  const pressurePa = convertToPascal(value, unit);
  return lookupPercentage(pressurePa);
}
