import pkg from "@prisma/client";
const { PrismaClient } = pkg;

let prisma = null;

function getPrisma() {
  if (!prisma) {
    const dbUrl = process.env.DATABASE_URL;
    prisma = new PrismaClient({
      datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    });
  }
  return prisma;
}

/**
 * Descriptions for casing SR pricing (must match PriceList.json / DB exactly)
 * SR1=Raw Material, SR2=Welding, SR3=Rolling, SR4=Bending, SR5=Laser, SR6=Painting
 */
const CASING_PRICING_DESCRIPTIONS = [
  "Black Steel Raw Material",
  "Black Steel Welding", // was "Black Steel Welding " (typo) - DB has no trailing space
  "Black Steel Rolling",
  "Black Steel Bending Line",
  "Black Steel Laser",
  "Black Steel Painting/Diameter",
];

/**
 * Fetch SR pricing values from pricing items
 */
async function getPricingItems() {
  const items = await getPrisma().pricingItem.findMany({
    where: {
      description: { in: CASING_PRICING_DESCRIPTIONS },
    },
  });

  const pricingItems = {};
  items.forEach((item) => {
    const price = item.priceWithVat != null ? Number(item.priceWithVat) : 0;
    pricingItems[`SR${item.sr}`] = price;
  });

  // Debug: warn when SR values are missing or zero (casing total cost will be 0)
  const srKeys = ["SR1", "SR2", "SR3", "SR4", "SR5", "SR6"];
  const missingOrZero = srKeys.filter(
    (k) => !pricingItems[k] || pricingItems[k] === 0,
  );
  if (missingOrZero.length > 0) {
    console.warn(
      "[AxialCasing] Pricing items missing or zero for:",
      missingOrZero.join(", "),
      "- Total cost will be 0. Populate Pricing Items (Axial Pricing tab) with prices.",
    );
  }

  return pricingItems;
}

/**
 * Calculate weight with scrap percentage
 */
function calculateCasingWeightWithScrap(weightWithoutScrap, scrapPercentage) {
  return weightWithoutScrap * (1 + scrapPercentage / 100);
}

/**
 * Calculate total casing cost
 * Formula: (weightWithScrap * (SR1/1000) + SR2 * casingWelding + laserTime * SR5 + Bending * SR4 + Rolling * SR3 + Diameter * SR6) / (100 - Profit)
 *
 * @param {Object} casing - Casing data
 * @param {Object} pricingItems - SR values from pricing items
 * @returns {number} - Total cost
 */
function calculateTotalCost(casing, pricingItems) {
  const weightWithScrap = calculateCasingWeightWithScrap(
    casing.casingWeightKgWithoutScrap,
    casing.scrapPercentage,
  );

  const SR1 = pricingItems.SR1 || 0;
  const SR2 = pricingItems.SR2 || 0;
  const SR3 = pricingItems.SR3 || 0;
  const SR4 = pricingItems.SR4 || 0;
  const SR5 = pricingItems.SR5 || 0;
  const SR6 = pricingItems.SR6 || 0;

  const profit = parseFloat(casing.profitPercentage) || 0;

  if (profit >= 100) {
    throw new Error("Profit percentage must be less than 100");
  }

  const totalCost =
    ((weightWithScrap * (SR1 / 1000) +
      SR2 * parseFloat(casing.casingCircumferenceMeter) +
      parseFloat(casing.laserTimeMinutes) * SR5 +
      parseFloat(casing.bendingLine) * SR4 +
      parseFloat(casing.rolling) * SR3 +
      parseFloat(casing.paintingDiameter) * SR6) /
      (100 - profit)) *
    100;

  return totalCost;
}

/**
 * Axial Casing Pricing Service
 * Handles CRUD operations and cost calculations for axial casing pricing
 */
export const AxialCasingPricingService = {
  // ========================
  // CASING OPERATIONS
  // ========================

  /**
   * Get all casing pricing records with calculated values
   */
  async getAllCasings() {
    const casings = await getPrisma().axialCasingPricing.findMany({
      orderBy: [{ model: "asc" }, { sizeMm: "asc" }],
    });

    // Fetch SR values
    const pricingItems = await getPricingItems();

    // Calculate total cost for each casing
    return casings.map((casing) => {
      const weightWithScrap = calculateCasingWeightWithScrap(
        casing.casingWeightKgWithoutScrap,
        casing.scrapPercentage,
      );

      let totalCost = 0;
      try {
        totalCost = calculateTotalCost(casing, pricingItems);

        // Add accessories to total cost
        if (casing.accessory1PriceWithoutVat) {
          totalCost += parseFloat(casing.accessory1PriceWithoutVat);
        }
        if (casing.accessory2PriceWithoutVat) {
          totalCost += parseFloat(casing.accessory2PriceWithoutVat);
        }
      } catch (error) {
        console.error("Error calculating total cost:", error);
      }

      const totalCostWithVat = totalCost;
      // Return plain object with numbers so JSON serialization is reliable
      const row = { ...casing };
      row.weightWithScrap = Number(weightWithScrap);
      row.totalCost = Number(totalCost);
      row.totalCostWithVat = Number(totalCostWithVat);
      row.totalCostWoScrap = Number(
        totalCost -
          (weightWithScrap - casing.casingWeightKgWithoutScrap) *
            (pricingItems.SR1 / 1000 / 2),
      );
      return row;
    });
  },

  /**
   * Get casing by ID
   */
  async getCasingById(id) {
    return await getPrisma().axialCasingPricing.findUnique({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Get casing by model and size
   */
  async getCasingByModelAndSize(model, sizeMm) {
    return await getPrisma().axialCasingPricing.findFirst({
      where: {
        model: model,
        sizeMm: parseFloat(sizeMm),
      },
    });
  },

  /**
   * Create a new casing pricing record
   */
  async createCasing(data) {
    return await getPrisma().axialCasingPricing.create({
      data: {
        model: data.model,
        sizeMm: parseFloat(data.sizeMm),
        casingWeightKgWithoutScrap: parseFloat(data.casingWeightKgWithoutScrap),
        scrapPercentage: parseFloat(data.scrapPercentage),
        casingCircumferenceMeter: parseFloat(data.casingCircumferenceMeter),
        laserTimeMinutes: parseFloat(data.laserTimeMinutes),
        bendingLine: parseFloat(data.bendingLine),
        rolling: parseFloat(data.rolling),
        paintingDiameter: parseFloat(data.paintingDiameter),
        profitPercentage: parseFloat(data.profitPercentage),
        accessory1Description: data.accessory1Description || null,
        accessory1PriceWithoutVat: data.accessory1PriceWithoutVat
          ? parseFloat(data.accessory1PriceWithoutVat)
          : null,
        accessory2Description: data.accessory2Description || null,
        accessory2PriceWithoutVat: data.accessory2PriceWithoutVat
          ? parseFloat(data.accessory2PriceWithoutVat)
          : null,
      },
    });
  },

  /**
   * Update a casing pricing record
   */
  async updateCasing(id, data) {
    return await getPrisma().axialCasingPricing.update({
      where: { id: parseInt(id) },
      data: {
        model: data.model,
        sizeMm: parseFloat(data.sizeMm),
        casingWeightKgWithoutScrap: parseFloat(data.casingWeightKgWithoutScrap),
        scrapPercentage: parseFloat(data.scrapPercentage),
        casingCircumferenceMeter: parseFloat(data.casingCircumferenceMeter),
        laserTimeMinutes: parseFloat(data.laserTimeMinutes),
        bendingLine: parseFloat(data.bendingLine),
        rolling: parseFloat(data.rolling),
        paintingDiameter: parseFloat(data.paintingDiameter),
        profitPercentage: parseFloat(data.profitPercentage),
        accessory1Description: data.accessory1Description || null,
        accessory1PriceWithoutVat: data.accessory1PriceWithoutVat
          ? parseFloat(data.accessory1PriceWithoutVat)
          : null,
        accessory2Description: data.accessory2Description || null,
        accessory2PriceWithoutVat: data.accessory2PriceWithoutVat
          ? parseFloat(data.accessory2PriceWithoutVat)
          : null,
      },
    });
  },

  /**
   * Delete a casing pricing record
   */
  async deleteCasing(id) {
    return await getPrisma().axialCasingPricing.delete({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Lookup casing by fan type, configuration, and inner diameter
   * This maps fan data to casing model and size
   *
   * @param {string} fanType - Fan type (e.g., "WF", "ARTF")
   * @param {string} impellerConf - Impeller configuration (e.g., "9-9")
   * @param {number} innerDiameter - Inner diameter in mm
   * @returns {Object} - Casing pricing record or null
   */
  async lookupCasingByFanData(fanType, impellerConf, innerDiameter) {
    // Map fan data to casing model and size
    // The model could be fanType or a combination of fanType + impellerConf
    // The size would be innerDiameter

    // Try exact match with fanType as model
    let casing = await this.getCasingByModelAndSize(fanType, innerDiameter);

    if (!casing && impellerConf) {
      // Try with combined model name if needed
      const combinedModel = `${fanType}-${impellerConf}`;
      casing = await this.getCasingByModelAndSize(combinedModel, innerDiameter);
    }

    return casing;
  },

  /**
   * Calculate casing cost for a given model and size
   */
  async calculateCasingCost({ model, sizeMm }) {
    const casing = await this.getCasingByModelAndSize(model, sizeMm);

    if (!casing) {
      throw new Error(
        `Casing not found for model: ${model} and size: ${sizeMm}`,
      );
    }

    const pricingItems = await getPricingItems();
    const weightWithScrap = calculateCasingWeightWithScrap(
      casing.casingWeightKgWithoutScrap,
      casing.scrapPercentage,
    );

    let totalCost = 0;
    try {
      totalCost = calculateTotalCost(casing, pricingItems);

      if (casing.accessory1PriceWithoutVat) {
        totalCost += parseFloat(casing.accessory1PriceWithoutVat);
      }
      if (casing.accessory2PriceWithoutVat) {
        totalCost += parseFloat(casing.accessory2PriceWithoutVat);
      }
    } catch (error) {
      console.error("Error calculating casing total cost:", error);
      throw error;
    }

    let totalCostWoScrap =
      totalCost -
      (weightWithScrap - casing.casingWeightKgWithoutScrap) *
        (pricingItems.SR1 / 1000 / 2);
    return {
      ...casing,
      weightWithScrap,
      totalCost: totalCost,
      totalCostWoScrap: totalCostWoScrap,
    };
  },
};
