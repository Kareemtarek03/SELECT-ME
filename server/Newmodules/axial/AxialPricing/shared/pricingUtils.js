import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const unpackedRoot = process.env.RESOURCES_PATH
  ? path.join(process.env.RESOURCES_PATH, "app.asar.unpacked")
  : path.join(__dirname, "..", "..", "..", "..", "..");
const require = createRequire(path.join(unpackedRoot, "package.json"));
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Constants for Bolts & Nuts pricing lookup
// IMPORTANT: sr = 24 is the correct row for "Bolts & Nuts" price per KG with VAT
export const BOLTS_AND_NUTS_SR = 24;
export const BOLTS_AND_NUTS_DESCRIPTION = "Bolts & Nuts";

/**
 * Helper function to parse price strings (e.g., " 3,127 " -> 3127)
 * @param {any} value - The value to parse
 * @returns {number|null} - Parsed number or null
 */
export const parsePrice = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/[\s,]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Get Bolts & Nuts price with VAT from pricing_items table
 * @returns {Promise<number>} - The price with VAT or 0 if not found
 */
export const getBoltsAndNutsPrice = async () => {
  // Must match BOTH sr = 24 AND description = 'Bolts & Nuts'
  const item = await prisma.pricingItem.findFirst({
    where: {
      description: BOLTS_AND_NUTS_DESCRIPTION,
    },
  });
  return item?.priceWithVat || 0;
};

/**
 * Calculate price with VAT for an accessory item
 * @param {Object} data - Accessory data with cost fields
 * @returns {Promise<number>} - Calculated price with VAT
 */
export const calculateAccessoryPriceWithVat = async (data) => {
  const boltsAndNutsPrice = await getBoltsAndNutsPrice();

  const vinylStickers = parsePrice(data.vinylStickersLe) || 0;
  const namePlate = parsePrice(data.namePlateLe) || 0;
  const packing = parsePrice(data.packingLe) || 0;
  const labourCost = parsePrice(data.labourCostLe) || 0;
  const internalTransportation = parsePrice(data.internalTransportationLe) || 0;
  const boltsAndNutsKg = parsePrice(data.boltsAndNutsKg) || 0;

  // Formula: sum of costs + (bolts_kg * bolts_price_with_vat)
  const priceWithVat =
    vinylStickers +
    namePlate +
    packing +
    labourCost +
    internalTransportation +
    boltsAndNutsKg * boltsAndNutsPrice;

  return Math.round(priceWithVat * 100) / 100;
};

/**
 * Check if a pricing item is the Bolts & Nuts item (Sr = 21)
 * @param {Object} item - Pricing item to check
 * @returns {boolean} - True if it's the Bolts & Nuts item
 */
export const isBoltsAndNutsItem = (item) => {
  return item.sr === BOLTS_AND_NUTS_SR;
};

/**
 * Recalculate all accessories prices
 * Used when Bolts & Nuts price changes
 * @param {number} newBoltsPrice - The new Bolts & Nuts price to use for calculation
 * @returns {Promise<Array>} - Updated accessories
 */
export const recalculateAllAccessoriesPrices = async (newBoltsPrice = null) => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔄 RECALCULATING ALL ACCESSORY PRICES`);
  console.log(`${"=".repeat(60)}`);

  // Get the current Bolts & Nuts price from DB (fresh query)
  const boltsPrice =
    newBoltsPrice !== null ? newBoltsPrice : await getBoltsAndNutsPrice();
  console.log(`📊 Using Bolts & Nuts price (Sr=24): ${boltsPrice}`);

  const accessories = await prisma.accessoryPricing.findMany();

  if (accessories.length === 0) {
    console.log(`⚠️ No accessories found in database to recalculate`);
    return [];
  }

  console.log(`📊 Found ${accessories.length} accessories to recalculate...`);

  const results = [];

  for (const accessory of accessories) {
    const oldPrice = accessory.priceWithVatLe;

    // Calculate new price using the bolts price
    const vinylStickers = parsePrice(accessory.vinylStickersLe) || 0;
    const namePlate = parsePrice(accessory.namePlateLe) || 0;
    const packing = parsePrice(accessory.packingLe) || 0;
    const labourCost = parsePrice(accessory.labourCostLe) || 0;
    const internalTransportation =
      parsePrice(accessory.internalTransportationLe) || 0;
    const boltsAndNutsKg = parsePrice(accessory.boltsAndNutsKg) || 0;

    const newPrice =
      Math.round(
        (vinylStickers +
          namePlate +
          packing +
          labourCost +
          internalTransportation +
          boltsAndNutsKg * boltsPrice) *
          100,
      ) / 100;

    const updated = await prisma.accessoryPricing.update({
      where: { id: accessory.id },
      data: { priceWithVatLe: newPrice },
    });

    console.log(
      `   ✓ ${accessory.fanModel} ${accessory.fanSizeMm}mm: ${oldPrice} → ${newPrice} (boltsKg=${boltsAndNutsKg})`,
    );
    results.push(updated);
  }

  console.log(`${"=".repeat(60)}`);
  console.log(
    `✅ Successfully recalculated ${results.length} accessory prices`,
  );
  console.log(`${"=".repeat(60)}\n`);
  return results;
};

export default {
  BOLTS_AND_NUTS_SR,
  BOLTS_AND_NUTS_DESCRIPTION,
  parsePrice,
  getBoltsAndNutsPrice,
  calculateAccessoryPriceWithVat,
  isBoltsAndNutsItem,
  recalculateAllAccessoriesPrices,
};
