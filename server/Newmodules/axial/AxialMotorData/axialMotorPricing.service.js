import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =============================================
// CONSTANTS - Motor Pricing Configuration
// =============================================

// SR values for pricing items lookup
export const DOLLAR_RATE_SR = 26;
export const ELECTRICAL_MOTORS_SR = 23;
export const ELECTRICAL_CABLES_SR = 21;  // Electrical Cables (Sweedy Factor)
export const ELECTRICAL_COMPONENT_SR = 22;  // Electrical Component Factor

// VAT Rate constant
export const VAT_RATE = 1.14;

// Calculated field names (JSON format)
export const CALCULATED_FIELDS = [
    "B3 Price with VAT & Factor (L.E)",
    "Other Price with VAT & Factor (L.E)",
    "Price With VAT Per Meter (Cable)",
    "U.P Price with VAT (Cable Lugs)",
    "T.P Price with VAT (Cable Lugs)",
    "U.P Price with VAT (Cable Heat Shrink)",
    "T.P Price with VAT (Cable Heat Shrink)",
    "U.P Price with VAT (Flexible Connector)",
    "T.P Price with VAT (Flexible Connector)",
    "U.P Price with VAT (Gland)",
    "T.P Price with VAT (Gland)",
    "U.P Price with VAT (Brass Bar)",
    "T.P Price with VAT (Brass Bar)",
    "U.P Price with VAT(Electrical Box)",
    "Price With VAT Per Meter (Total)",
];

// Calculated field names (DB format)
export const CALCULATED_DB_FIELDS = [
    "b3PriceWithVat",
    "otherPriceWithVat",
    "cablePriceWithVat",
    "cableLugsUPWithVat",
    "cableLugsTPWithVat",
    "cableHeatShrinkUPWithVat",
    "cableHeatShrinkTPWithVat",
    "flexibleConnectorUPWithVat",
    "flexibleConnectorTPWithVat",
    "glandUPWithVat",
    "glandTPWithVat",
    "brassBarUPWithVat",
    "brassBarTPWithVat",
    "electricalBoxUPWithVat",
    "totalPriceWithVat",
];

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Parse a price value to a number
 * @param {any} value - The value to parse
 * @returns {number|null} - Parsed number or null
 */
export const parsePrice = (value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const cleaned = String(value).replace(/[\s,]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
};

/**
 * Get the Dollar Rate (sr=26) price with VAT from pricing_items table
 * @returns {Promise<number>} - The price with VAT or 0 if not found
 */
export const getDollarRate = async () => {
    const item = await prisma.pricingItem.findFirst({
        where: { sr: DOLLAR_RATE_SR },
    });
    return item?.priceWithVat || 0;
};

/**
 * Get the Electrical Motors (sr=23) price with VAT from pricing_items table
 * @returns {Promise<number>} - The price with VAT or 0 if not found
 */
export const getElectricalMotorsFactor = async () => {
    const item = await prisma.pricingItem.findFirst({
        where: { sr: ELECTRICAL_MOTORS_SR },
    });
    return item?.priceWithVat || 0;
};

/**
 * Get the Electrical Cables (Sweedy Factor) (sr=21) price with VAT
 * @returns {Promise<number>} - The price with VAT or 0 if not found
 */
export const getElectricalCablesFactor = async () => {
    const item = await prisma.pricingItem.findFirst({
        where: { sr: ELECTRICAL_CABLES_SR },
    });
    return item?.priceWithVat || 0;
};

/**
 * Get the Electrical Component Factor (sr=22) price with VAT
 * @returns {Promise<number>} - The price with VAT or 0 if not found
 */
export const getElectricalComponentFactor = async () => {
    const item = await prisma.pricingItem.findFirst({
        where: { sr: ELECTRICAL_COMPONENT_SR },
    });
    return item?.priceWithVat || 0;
};

/**
 * Get all pricing factors needed for motor price calculations
 * @returns {Promise<{dollarRate: number, electricalMotorsFactor: number, electricalCablesFactor: number, electricalComponentFactor: number}>}
 */
export const getPricingFactors = async () => {
    const [dollarRateItem, electricalMotorsItem, electricalCablesItem, electricalComponentItem] = await Promise.all([
        prisma.pricingItem.findFirst({ where: { sr: DOLLAR_RATE_SR } }),
        prisma.pricingItem.findFirst({ where: { sr: ELECTRICAL_MOTORS_SR } }),
        prisma.pricingItem.findFirst({ where: { sr: ELECTRICAL_CABLES_SR } }),
        prisma.pricingItem.findFirst({ where: { sr: ELECTRICAL_COMPONENT_SR } }),
    ]);

    return {
        dollarRate: dollarRateItem?.priceWithVat || 0,
        electricalMotorsFactor: electricalMotorsItem?.priceWithVat || 0,
        electricalCablesFactor: electricalCablesItem?.priceWithVat || 0,
        electricalComponentFactor: electricalComponentItem?.priceWithVat || 0,
    };
};

// =============================================
// CALCULATION FUNCTIONS
// =============================================

/**
 * Calculate B3 Price with VAT & Factor (L.E)
 * Formula: B3_Price_USD_Without_VAT × Dollar_Rate × Electrical_Motors_Factor × VAT_RATE
 * 
 * @param {number|null} b3PriceWithoutVat - B3 Price ($) w/o VAT
 * @param {number} dollarRate - Dollar Rate (sr=26) price with VAT
 * @param {number} electricalMotorsFactor - Electrical Motors (sr=23) price with VAT
 * @returns {number|null} - Calculated price or null if input is null
 */
export const calculateB3PriceWithVat = (b3PriceWithoutVat, dollarRate, electricalMotorsFactor) => {
    const basePrice = parsePrice(b3PriceWithoutVat);
    if (basePrice === null || basePrice === 0) return null;
    if (!dollarRate || !electricalMotorsFactor) return null;

    const calculated = basePrice * dollarRate * electricalMotorsFactor * VAT_RATE;
    return Math.round(calculated * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate Other Price with VAT & Factor (L.E)
 * Formula: Other_Price_USD_Without_VAT × Dollar_Rate × Electrical_Motors_Factor × VAT_RATE
 * 
 * @param {number|null} otherPriceWithoutVat - Other Price ($) w/o VAT
 * @param {number} dollarRate - Dollar Rate (sr=26) price with VAT
 * @param {number} electricalMotorsFactor - Electrical Motors (sr=23) price with VAT
 * @returns {number|null} - Calculated price or null if input is null
 */
export const calculateOtherPriceWithVat = (otherPriceWithoutVat, dollarRate, electricalMotorsFactor) => {
    const basePrice = parsePrice(otherPriceWithoutVat);
    if (basePrice === null || basePrice === 0) return null;
    if (!dollarRate || !electricalMotorsFactor) return null;

    const calculated = basePrice * dollarRate * electricalMotorsFactor * VAT_RATE;
    return Math.round(calculated * 100) / 100; // Round to 2 decimal places
};

// =============================================
// CABLE, CABLE LUGS, HEAT SHRINK CALCULATIONS
// =============================================

/**
 * Calculate Price With VAT Per Meter (Cable)
 * Formula: Price w/o VAT Per Meter (Cable) × Electrical Cables Factor (sr=21) × VAT_RATE
 */
export const calculateCablePriceWithVat = (cablePriceWithoutVat, electricalCablesFactor) => {
    const basePrice = parsePrice(cablePriceWithoutVat);
    if (basePrice === null) return null;
    if (!electricalCablesFactor) return null;

    const calculated = basePrice * electricalCablesFactor * VAT_RATE;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate U.P Price with VAT (Cable Lugs)
 * Formula: U.P Price w/o VAT (Cable Lugs) × Electrical Component Factor (sr=22) × VAT_RATE
 */
export const calculateCableLugsUPWithVat = (cableLugsUPWithoutVat, electricalComponentFactor) => {
    const basePrice = parsePrice(cableLugsUPWithoutVat);
    if (basePrice === null) return null;
    if (!electricalComponentFactor) return null;

    const calculated = basePrice * electricalComponentFactor * VAT_RATE;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate T.P Price with VAT (Cable Lugs)
 * Formula: U.P Price with VAT (Cable Lugs) × No. (Cable Lugs)
 */
export const calculateCableLugsTPWithVat = (cableLugsUPWithVat, cableLugsNo) => {
    const unitPrice = parsePrice(cableLugsUPWithVat);
    const quantity = parsePrice(cableLugsNo);
    if (unitPrice === null || quantity === null) return null;

    const calculated = unitPrice * quantity;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate U.P Price with VAT (Cable Heat Shrink)
 * Formula: U.P Price w/o VAT (Cable Heat Shrink) × Electrical Component Factor (sr=22) × VAT_RATE
 */
export const calculateCableHeatShrinkUPWithVat = (cableHeatShrinkUPWithoutVat, electricalComponentFactor) => {
    const basePrice = parsePrice(cableHeatShrinkUPWithoutVat);
    if (basePrice === null) return null;
    if (!electricalComponentFactor) return null;

    const calculated = basePrice * electricalComponentFactor * VAT_RATE;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate T.P Price with VAT (Cable Heat Shrink)
 * Formula: U.P Price with VAT (Cable Heat Shrink) × No. (Cable Heat Shrink)
 */
export const calculateCableHeatShrinkTPWithVat = (cableHeatShrinkUPWithVat, cableHeatShrinkNo) => {
    const unitPrice = parsePrice(cableHeatShrinkUPWithVat);
    const quantity = parsePrice(cableHeatShrinkNo);
    if (unitPrice === null || quantity === null) return null;

    const calculated = unitPrice * quantity;
    return Math.round(calculated * 100) / 100;
};

// =============================================
// FLEXIBLE CONNECTOR, GLAND, BRASS BAR, ELECTRICAL BOX CALCULATIONS
// =============================================

/**
 * Calculate U.P Price with VAT (Flexible Connector)
 * Formula: U.P Price w/o VAT (Flexible Connector) × Electrical Component Factor (sr=22) × VAT_RATE
 */
export const calculateFlexibleConnectorUPWithVat = (flexibleConnectorUPWithoutVat, electricalComponentFactor) => {
    const basePrice = parsePrice(flexibleConnectorUPWithoutVat);
    if (basePrice === null) return null;
    if (!electricalComponentFactor) return null;

    const calculated = basePrice * electricalComponentFactor * VAT_RATE;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate T.P Price with VAT (Flexible Connector)
 * Formula: U.P Price with VAT (Flexible Connector) × Meter (Flexible Connector)
 */
export const calculateFlexibleConnectorTPWithVat = (flexibleConnectorUPWithVat, flexibleConnectorMeter) => {
    const unitPrice = parsePrice(flexibleConnectorUPWithVat);
    const meter = parsePrice(flexibleConnectorMeter);
    if (unitPrice === null || meter === null) return null;

    const calculated = unitPrice * meter;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate U.P Price with VAT (Gland)
 * Formula: U.P Price w/o VAT (Gland) × Electrical Component Factor (sr=22) × VAT_RATE
 */
export const calculateGlandUPWithVat = (glandUPWithoutVat, electricalComponentFactor) => {
    const basePrice = parsePrice(glandUPWithoutVat);
    if (basePrice === null) return null;
    if (!electricalComponentFactor) return null;

    const calculated = basePrice * electricalComponentFactor * VAT_RATE;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate T.P Price with VAT (Gland)
 * Formula: U.P Price with VAT (Gland) × No. (Gland)
 */
export const calculateGlandTPWithVat = (glandUPWithVat, glandNo) => {
    const unitPrice = parsePrice(glandUPWithVat);
    const quantity = parsePrice(glandNo);
    if (unitPrice === null || quantity === null) return null;

    const calculated = unitPrice * quantity;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate U.P Price with VAT (Brass Bar)
 * Formula: U.P Price w/o VAT (Brass Bar) × Electrical Cables Factor (sr=21) × VAT_RATE
 */
export const calculateBrassBarUPWithVat = (brassBarUPWithoutVat, electricalCablesFactor) => {
    const basePrice = parsePrice(brassBarUPWithoutVat);
    if (basePrice === null) return null;
    if (!electricalCablesFactor) return null;

    const calculated = basePrice * electricalCablesFactor * VAT_RATE;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate T.P Price with VAT (Brass Bar)
 * Formula: U.P Price with VAT (Brass Bar) × No. (Brass Bar)
 */
export const calculateBrassBarTPWithVat = (brassBarUPWithVat, brassBarNo) => {
    const unitPrice = parsePrice(brassBarUPWithVat);
    const quantity = parsePrice(brassBarNo);
    if (unitPrice === null || quantity === null) return null;

    const calculated = unitPrice * quantity;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate U.P Price with VAT (Electrical Box)
 * Formula: U.P Price w/o VAT (Electrical Box) × Electrical Component Factor (sr=22) × VAT_RATE
 */
export const calculateElectricalBoxUPWithVat = (electricalBoxUPWithoutVat, electricalComponentFactor) => {
    const basePrice = parsePrice(electricalBoxUPWithoutVat);
    if (basePrice === null) return null;
    if (!electricalComponentFactor) return null;

    const calculated = basePrice * electricalComponentFactor * VAT_RATE;
    return Math.round(calculated * 100) / 100;
};

/**
 * Calculate Price With VAT Per Meter (Total)
 * Formula: Sum of all T.P prices + Electrical Box U.P
 */
export const calculateTotalPriceWithVat = (
    cablePriceWithVat,
    cableLugsTPWithVat,
    cableHeatShrinkTPWithVat,
    flexibleConnectorTPWithVat,
    glandTPWithVat,
    brassBarTPWithVat,
    electricalBoxUPWithVat
) => {
    // Sum all values, treating null as 0
    const values = [
        parsePrice(cablePriceWithVat) || 0,
        parsePrice(cableLugsTPWithVat) || 0,
        parsePrice(cableHeatShrinkTPWithVat) || 0,
        parsePrice(flexibleConnectorTPWithVat) || 0,
        parsePrice(glandTPWithVat) || 0,
        parsePrice(brassBarTPWithVat) || 0,
        parsePrice(electricalBoxUPWithVat) || 0,
    ];

    const total = values.reduce((sum, val) => sum + val, 0);
    // Return null if all values are 0/null
    if (total === 0) return null;
    return Math.round(total * 100) / 100;
};

/**
 * Calculate all motor prices with VAT for a motor data record
 * @param {Object} motorData - Motor data object
 * @param {Object} factors - Optional pre-fetched pricing factors
 * @returns {Promise<Object>} - All calculated prices
 */
export const calculateMotorPrices = async (motorData, factors = null) => {
    // Get pricing factors if not provided
    const allFactors = factors || await getPricingFactors();
    const { dollarRate, electricalMotorsFactor, electricalCablesFactor, electricalComponentFactor } = allFactors;

    // B3 and Other prices
    const b3PriceWithVat = calculateB3PriceWithVat(
        motorData.b3PriceWithoutVat ?? motorData["B3 Price ($) w/o VAT"],
        dollarRate,
        electricalMotorsFactor
    );

    const otherPriceWithVat = calculateOtherPriceWithVat(
        motorData.otherPriceWithoutVat ?? motorData["Other Price ($) w/o VAT"],
        dollarRate,
        electricalMotorsFactor
    );

    // Cable price
    const cablePriceWithVat = calculateCablePriceWithVat(
        motorData.cablePriceWithoutVat ?? motorData["Price w/o VAT Per Meter (Cable)"],
        electricalCablesFactor
    );

    // Cable Lugs prices
    const cableLugsUPWithVat = calculateCableLugsUPWithVat(
        motorData.cableLugsUPWithoutVat ?? motorData["U.P Price w/o VAT (Cable Lugs)"],
        electricalComponentFactor
    );
    const cableLugsTPWithVat = calculateCableLugsTPWithVat(
        cableLugsUPWithVat,
        motorData.cableLugsNo ?? motorData["No.(Cable Lugs)"]
    );

    // Cable Heat Shrink prices
    const cableHeatShrinkUPWithVat = calculateCableHeatShrinkUPWithVat(
        motorData.cableHeatShrinkUPWithoutVat ?? motorData["U.P Price w/o VAT (Cable Heat Shrink)"],
        electricalComponentFactor
    );
    const cableHeatShrinkTPWithVat = calculateCableHeatShrinkTPWithVat(
        cableHeatShrinkUPWithVat,
        motorData.cableHeatShrinkNo ?? motorData["No.(Cable Heat Shrink)"]
    );

    // Flexible Connector prices
    const flexibleConnectorUPWithVat = calculateFlexibleConnectorUPWithVat(
        motorData.flexibleConnectorUPWithoutVat ?? motorData["U.P Price w/o VAT (Flexible Connector)"],
        electricalComponentFactor
    );
    const flexibleConnectorTPWithVat = calculateFlexibleConnectorTPWithVat(
        flexibleConnectorUPWithVat,
        motorData.flexibleConnectorMeter ?? motorData["Meter (Flexible Connector)"]
    );

    // Gland prices
    const glandUPWithVat = calculateGlandUPWithVat(
        motorData.glandUPWithoutVat ?? motorData["U.P Price w/o VAT (Gland)"],
        electricalComponentFactor
    );
    const glandTPWithVat = calculateGlandTPWithVat(
        glandUPWithVat,
        motorData.glandNo ?? motorData["No. (Gland)"]
    );

    // Brass Bar prices (uses electricalCablesFactor sr=21)
    const brassBarUPWithVat = calculateBrassBarUPWithVat(
        motorData.brassBarUPWithoutVat ?? motorData["U.P Price w/o VAT (Brass Bar)"],
        electricalCablesFactor
    );
    const brassBarTPWithVat = calculateBrassBarTPWithVat(
        brassBarUPWithVat,
        motorData.brassBarNo ?? motorData["No. (Brass Bar)"]
    );

    // Electrical Box price
    const electricalBoxUPWithVat = calculateElectricalBoxUPWithVat(
        motorData.electricalBoxUPWithoutVat ?? motorData["U.P Price w/o VAT (Electrical Box)"],
        electricalComponentFactor
    );

    // Total price
    const totalPriceWithVat = calculateTotalPriceWithVat(
        cablePriceWithVat,
        cableLugsTPWithVat,
        cableHeatShrinkTPWithVat,
        flexibleConnectorTPWithVat,
        glandTPWithVat,
        brassBarTPWithVat,
        electricalBoxUPWithVat
    );

    return {
        b3PriceWithVat,
        otherPriceWithVat,
        cablePriceWithVat,
        cableLugsUPWithVat,
        cableLugsTPWithVat,
        cableHeatShrinkUPWithVat,
        cableHeatShrinkTPWithVat,
        flexibleConnectorUPWithVat,
        flexibleConnectorTPWithVat,
        glandUPWithVat,
        glandTPWithVat,
        brassBarUPWithVat,
        brassBarTPWithVat,
        electricalBoxUPWithVat,
        totalPriceWithVat,
    };
};

/**
 * Strip calculated fields from input data to prevent frontend injection
 * @param {Object} data - Input data (JSON or DB format)
 * @returns {Object} - Data with calculated fields removed
 */
export const stripCalculatedFields = (data) => {
    const stripped = { ...data };

    // Remove JSON format fields
    delete stripped["B3 Price with VAT & Factor (L.E)"];
    delete stripped["Other Price with VAT & Factor (L.E)"];
    delete stripped["Price With VAT Per Meter (Cable)"];
    delete stripped["U.P Price with VAT (Cable Lugs)"];
    delete stripped["T.P Price with VAT (Cable Lugs)"];
    delete stripped["U.P Price with VAT (Cable Heat Shrink)"];
    delete stripped["T.P Price with VAT (Cable Heat Shrink)"];
    delete stripped["U.P Price with VAT (Flexible Connector)"];
    delete stripped["T.P Price with VAT (Flexible Connector)"];
    delete stripped["U.P Price with VAT (Gland)"];
    delete stripped["T.P Price with VAT (Gland)"];
    delete stripped["U.P Price with VAT (Brass Bar)"];
    delete stripped["T.P Price with VAT (Brass Bar)"];
    delete stripped["U.P Price with VAT(Electrical Box)"];
    delete stripped["Price With VAT Per Meter (Total)"];

    // Remove DB format fields
    delete stripped.b3PriceWithVat;
    delete stripped.otherPriceWithVat;
    delete stripped.cablePriceWithVat;
    delete stripped.cableLugsUPWithVat;
    delete stripped.cableLugsTPWithVat;
    delete stripped.cableHeatShrinkUPWithVat;
    delete stripped.cableHeatShrinkTPWithVat;
    delete stripped.flexibleConnectorUPWithVat;
    delete stripped.flexibleConnectorTPWithVat;
    delete stripped.glandUPWithVat;
    delete stripped.glandTPWithVat;
    delete stripped.brassBarUPWithVat;
    delete stripped.brassBarTPWithVat;
    delete stripped.electricalBoxUPWithVat;
    delete stripped.totalPriceWithVat;

    return stripped;
};

// =============================================
// RECALCULATION FUNCTIONS
// =============================================

/**
 * Recalculate all motor prices (B3 and Other prices)
 * Used when Dollar Rate (sr=26) or Electrical Motors (sr=23) pricing changes
 * 
 * @param {Object} newFactors - Optional new factors to use
 * @returns {Promise<Array>} - Updated motor records
 */
export const recalculateAllMotorPrices = async (newFactors = null) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔄 RECALCULATING ALL MOTOR PRICES (B3 & Other)`);
    console.log(`${"=".repeat(60)}`);

    // Get the current pricing factors from DB (fresh query)
    const factors = newFactors || await getPricingFactors();
    console.log(`📊 Using Dollar Rate (Sr=${DOLLAR_RATE_SR}): ${factors.dollarRate}`);
    console.log(`📊 Using Electrical Motors Factor (Sr=${ELECTRICAL_MOTORS_SR}): ${factors.electricalMotorsFactor}`);
    console.log(`📊 VAT Rate: ${VAT_RATE}`);

    // Get all motors that have base prices set
    const motors = await prisma.motorData.findMany({
        where: {
            OR: [
                { b3PriceWithoutVat: { not: null } },
                { otherPriceWithoutVat: { not: null } },
            ],
        },
    });

    if (motors.length === 0) {
        console.log(`⚠️ No motors with base prices found in database to recalculate`);
        return [];
    }

    console.log(`📊 Found ${motors.length} motors to recalculate...`);

    const results = [];

    for (const motor of motors) {
        const oldB3Price = motor.b3PriceWithVat;
        const oldOtherPrice = motor.otherPriceWithVat;

        // Calculate new prices
        const newB3Price = calculateB3PriceWithVat(
            motor.b3PriceWithoutVat,
            factors.dollarRate,
            factors.electricalMotorsFactor
        );

        const newOtherPrice = calculateOtherPriceWithVat(
            motor.otherPriceWithoutVat,
            factors.dollarRate,
            factors.electricalMotorsFactor
        );

        // Update the motor record
        const updated = await prisma.motorData.update({
            where: { id: motor.id },
            data: {
                b3PriceWithVat: newB3Price,
                otherPriceWithVat: newOtherPrice,
            },
        });

        console.log(`   ✓ Motor ID ${motor.id} (${motor.model || 'N/A'}): B3: ${oldB3Price} → ${newB3Price}, Other: ${oldOtherPrice} → ${newOtherPrice}`);
        results.push(updated);
    }

    console.log(`${"=".repeat(60)}`);
    console.log(`✅ Successfully recalculated ${results.length} motor prices`);
    console.log(`${"=".repeat(60)}\n`);

    return results;
};

/**
 * Recalculate all cable prices
 * Used when Electrical Cables (Sweedy Factor) (sr=21) pricing changes
 * 
 * @returns {Promise<Array>} - Updated motor records
 */
export const recalculateAllCablePrices = async () => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔄 RECALCULATING ALL CABLE PRICES`);
    console.log(`${"=".repeat(60)}`);

    const factors = await getPricingFactors();
    console.log(`📊 Using Electrical Cables Factor (Sr=${ELECTRICAL_CABLES_SR}): ${factors.electricalCablesFactor}`);
    console.log(`📊 VAT Rate: ${VAT_RATE}`);

    const motors = await prisma.motorData.findMany({
        where: { cablePriceWithoutVat: { not: null } },
    });

    if (motors.length === 0) {
        console.log(`⚠️ No motors with cable prices found`);
        return [];
    }

    console.log(`📊 Found ${motors.length} motors to recalculate cable prices...`);

    const results = [];
    for (const motor of motors) {
        const oldPrice = motor.cablePriceWithVat;
        const newPrice = calculateCablePriceWithVat(motor.cablePriceWithoutVat, factors.electricalCablesFactor);

        const updated = await prisma.motorData.update({
            where: { id: motor.id },
            data: { cablePriceWithVat: newPrice },
        });

        console.log(`   ✓ Motor ID ${motor.id}: Cable: ${oldPrice} → ${newPrice}`);
        results.push(updated);
    }

    console.log(`✅ Successfully recalculated ${results.length} cable prices\n`);
    return results;
};

/**
 * Recalculate all cable lugs and heat shrink prices
 * Used when Electrical Component Factor (sr=22) pricing changes
 * 
 * @returns {Promise<Array>} - Updated motor records
 */
export const recalculateAllCableLugsAndHeatShrinkPrices = async () => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔄 RECALCULATING ALL CABLE LUGS & HEAT SHRINK PRICES`);
    console.log(`${"=".repeat(60)}`);

    const factors = await getPricingFactors();
    console.log(`📊 Using Electrical Component Factor (Sr=${ELECTRICAL_COMPONENT_SR}): ${factors.electricalComponentFactor}`);
    console.log(`📊 VAT Rate: ${VAT_RATE}`);

    const motors = await prisma.motorData.findMany({
        where: {
            OR: [
                { cableLugsUPWithoutVat: { not: null } },
                { cableHeatShrinkUPWithoutVat: { not: null } },
            ],
        },
    });

    if (motors.length === 0) {
        console.log(`⚠️ No motors with cable lugs or heat shrink prices found`);
        return [];
    }

    console.log(`📊 Found ${motors.length} motors to recalculate...`);

    const results = [];
    for (const motor of motors) {
        // Cable Lugs
        const newCableLugsUP = calculateCableLugsUPWithVat(motor.cableLugsUPWithoutVat, factors.electricalComponentFactor);
        const newCableLugsTP = calculateCableLugsTPWithVat(newCableLugsUP, motor.cableLugsNo);

        // Heat Shrink
        const newHeatShrinkUP = calculateCableHeatShrinkUPWithVat(motor.cableHeatShrinkUPWithoutVat, factors.electricalComponentFactor);
        const newHeatShrinkTP = calculateCableHeatShrinkTPWithVat(newHeatShrinkUP, motor.cableHeatShrinkNo);

        const updated = await prisma.motorData.update({
            where: { id: motor.id },
            data: {
                cableLugsUPWithVat: newCableLugsUP,
                cableLugsTPWithVat: newCableLugsTP,
                cableHeatShrinkUPWithVat: newHeatShrinkUP,
                cableHeatShrinkTPWithVat: newHeatShrinkTP,
            },
        });

        console.log(`   ✓ Motor ID ${motor.id}: Lugs UP: ${newCableLugsUP}, Lugs TP: ${newCableLugsTP}, HeatShrink UP: ${newHeatShrinkUP}, HeatShrink TP: ${newHeatShrinkTP}`);
        results.push(updated);
    }

    console.log(`✅ Successfully recalculated ${results.length} cable lugs & heat shrink prices\n`);
    return results;
};

/**
 * Recalculate all electrical prices (Flexible Connector, Gland, Brass Bar, Electrical Box, Total)
 * Used when sr=21 or sr=22 pricing changes - this handles all the new calculated fields
 * 
 * @returns {Promise<Array>} - Updated motor records
 */
export const recalculateAllElectricalPrices = async () => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔄 RECALCULATING ALL ELECTRICAL PRICES (Flex Connector, Gland, Brass Bar, Elec Box, Total)`);
    console.log(`${"=".repeat(60)}`);

    const factors = await getPricingFactors();
    console.log(`📊 Using Electrical Cables Factor (Sr=${ELECTRICAL_CABLES_SR}): ${factors.electricalCablesFactor}`);
    console.log(`📊 Using Electrical Component Factor (Sr=${ELECTRICAL_COMPONENT_SR}): ${factors.electricalComponentFactor}`);
    console.log(`📊 VAT Rate: ${VAT_RATE}`);

    // Get all motors - we need to recalculate totals for all
    const motors = await prisma.motorData.findMany();

    if (motors.length === 0) {
        console.log(`⚠️ No motors found in database`);
        return [];
    }

    console.log(`📊 Found ${motors.length} motors to recalculate...`);

    const results = [];
    for (const motor of motors) {
        // Flexible Connector (uses sr=22)
        const flexibleConnectorUPWithVat = calculateFlexibleConnectorUPWithVat(
            motor.flexibleConnectorUPWithoutVat,
            factors.electricalComponentFactor
        );
        const flexibleConnectorTPWithVat = calculateFlexibleConnectorTPWithVat(
            flexibleConnectorUPWithVat,
            motor.flexibleConnectorMeter
        );

        // Gland (uses sr=22)
        const glandUPWithVat = calculateGlandUPWithVat(
            motor.glandUPWithoutVat,
            factors.electricalComponentFactor
        );
        const glandTPWithVat = calculateGlandTPWithVat(
            glandUPWithVat,
            motor.glandNo
        );

        // Brass Bar (uses sr=21)
        const brassBarUPWithVat = calculateBrassBarUPWithVat(
            motor.brassBarUPWithoutVat,
            factors.electricalCablesFactor
        );
        const brassBarTPWithVat = calculateBrassBarTPWithVat(
            brassBarUPWithVat,
            motor.brassBarNo
        );

        // Electrical Box (uses sr=22)
        const electricalBoxUPWithVat = calculateElectricalBoxUPWithVat(
            motor.electricalBoxUPWithoutVat,
            factors.electricalComponentFactor
        );

        // Total price - sum of all components
        const totalPriceWithVat = calculateTotalPriceWithVat(
            motor.cablePriceWithVat,
            motor.cableLugsTPWithVat,
            motor.cableHeatShrinkTPWithVat,
            flexibleConnectorTPWithVat,
            glandTPWithVat,
            brassBarTPWithVat,
            electricalBoxUPWithVat
        );

        const updated = await prisma.motorData.update({
            where: { id: motor.id },
            data: {
                flexibleConnectorUPWithVat,
                flexibleConnectorTPWithVat,
                glandUPWithVat,
                glandTPWithVat,
                brassBarUPWithVat,
                brassBarTPWithVat,
                electricalBoxUPWithVat,
                totalPriceWithVat,
            },
        });

        console.log(`   ✓ Motor ID ${motor.id}: FlexConn: ${flexibleConnectorTPWithVat}, Gland: ${glandTPWithVat}, BrassBar: ${brassBarTPWithVat}, ElecBox: ${electricalBoxUPWithVat}, Total: ${totalPriceWithVat}`);
        results.push(updated);
    }

    console.log(`✅ Successfully recalculated ${results.length} electrical prices\n`);
    return results;
};

/**
 * Recalculate all prices for all motors - comprehensive recalculation
 * This recalculates ALL calculated fields for all motors
 * 
 * @returns {Promise<Array>} - Updated motor records
 */
export const recalculateAllPrices = async () => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔄 RECALCULATING ALL PRICES FOR ALL MOTORS`);
    console.log(`${"=".repeat(60)}`);

    const factors = await getPricingFactors();
    const motors = await prisma.motorData.findMany();

    if (motors.length === 0) {
        console.log(`⚠️ No motors found`);
        return [];
    }

    console.log(`📊 Found ${motors.length} motors to recalculate all prices...`);

    const results = [];
    for (const motor of motors) {
        const calculatedPrices = await calculateMotorPrices(motor, factors);

        const updated = await prisma.motorData.update({
            where: { id: motor.id },
            data: calculatedPrices,
        });

        results.push(updated);
    }

    console.log(`✅ Successfully recalculated all prices for ${results.length} motors\n`);
    return results;
};

/**
 * Check if a pricing item SR triggers motor price recalculation (B3/Other)
 * @param {number} sr - The SR value of the pricing item
 * @returns {boolean} - True if this SR triggers motor recalculation
 */
export const isMotorPricingTrigger = (sr) => {
    const srNum = parseInt(sr);
    return srNum === DOLLAR_RATE_SR || srNum === ELECTRICAL_MOTORS_SR;
};

/**
 * Check if a pricing item SR triggers cable price recalculation
 * @param {number} sr - The SR value of the pricing item
 * @returns {boolean} - True if this SR triggers cable recalculation
 */
export const isCablePricingTrigger = (sr) => {
    return parseInt(sr) === ELECTRICAL_CABLES_SR;
};

/**
 * Check if a pricing item SR triggers cable lugs/heat shrink recalculation
 * @param {number} sr - The SR value of the pricing item
 * @returns {boolean} - True if this SR triggers cable lugs/heat shrink recalculation
 */
export const isCableLugsHeatShrinkTrigger = (sr) => {
    return parseInt(sr) === ELECTRICAL_COMPONENT_SR;
};

export default {
    // Constants
    DOLLAR_RATE_SR,
    ELECTRICAL_MOTORS_SR,
    ELECTRICAL_CABLES_SR,
    ELECTRICAL_COMPONENT_SR,
    VAT_RATE,
    CALCULATED_FIELDS,
    CALCULATED_DB_FIELDS,
    // Helper functions
    parsePrice,
    getDollarRate,
    getElectricalMotorsFactor,
    getElectricalCablesFactor,
    getElectricalComponentFactor,
    getPricingFactors,
    // Calculation functions
    calculateB3PriceWithVat,
    calculateOtherPriceWithVat,
    calculateCablePriceWithVat,
    calculateCableLugsUPWithVat,
    calculateCableLugsTPWithVat,
    calculateCableHeatShrinkUPWithVat,
    calculateCableHeatShrinkTPWithVat,
    calculateFlexibleConnectorUPWithVat,
    calculateFlexibleConnectorTPWithVat,
    calculateGlandUPWithVat,
    calculateGlandTPWithVat,
    calculateBrassBarUPWithVat,
    calculateBrassBarTPWithVat,
    calculateElectricalBoxUPWithVat,
    calculateTotalPriceWithVat,
    calculateMotorPrices,
    stripCalculatedFields,
    // Recalculation functions
    recalculateAllMotorPrices,
    recalculateAllCablePrices,
    recalculateAllCableLugsAndHeatShrinkPrices,
    recalculateAllElectricalPrices,
    recalculateAllPrices,
    isMotorPricingTrigger,
    isCablePricingTrigger,
    isCableLugsHeatShrinkTrigger,
};
