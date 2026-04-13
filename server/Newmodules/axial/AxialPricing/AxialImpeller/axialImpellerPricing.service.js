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
 * Helper function to get pricing item by description.
 * Tries exact match first, then contains match for common variations.
 */
async function getPricingItemByDescription(
  description,
  fallbackContains = null,
) {
  let item = await getPrisma().pricingItem.findFirst({
    where: { description: { contains: description } },
  });
  if (!item && fallbackContains) {
    item = await getPrisma().pricingItem.findFirst({
      where: { description: { contains: fallbackContains } },
    });
  }
  return item?.priceWithVat != null ? Number(item.priceWithVat) : 0;
}

/**
 * Load and display all pricing items on startup
 */
async function logAllPricingItems() {
  try {
    const allItems = await getPrisma().pricingItem.findMany({
      include: {
        category: true,
      },
    });

    console.log("\n=== PRICING ITEMS (SR Order) ===");
    console.log(`Total items found: ${allItems.length}`);

    if (allItems.length === 0) {
      console.log("⚠️  No pricing items found in database!");
    } else {
      const impellerCritical = [
        "Mold Currency change Factor",
        "Mold Life time",
        "336 Aluminum Raw Material (Injection)",
        "PAG 30% Raw Material",
        "Axial Impeller Maching Factor",
        "Aluminum injection Small machine cost",
        "Aluminum injection machine cost (AM)",
        "Aluminum injection machine cost (Hub 6)",
        "PAG injection Small machine cost",
      ];
      const missing = impellerCritical.filter(
        (d) =>
          !allItems.some(
            (i) =>
              i.description === d && (i.priceWithVat ?? i.priceWithoutVat) > 0,
          ),
      );
      if (missing.length > 0) {
        console.warn(
          "[AxialImpeller] Pricing items missing or zero - impeller totalCost may be 0:",
          missing.join(", "),
        );
      }
      allItems.forEach((item) => {
        console.log(
          `SR# ${item.sr
            .toString()
            .padStart(
              3,
              " ",
            )} | ${item.category?.name?.padEnd(20, " ") || "N/A"} | ${item.description.padEnd(50, " ")} | ${item.priceWithVat ?? item.priceWithoutVat ?? 0}`,
        );
      });
    }
    console.log("=================================\n");
  } catch (error) {
    console.error("❌ Error loading pricing items:", error.message);
    console.error(error);
  }
}

// Log all pricing items on module load
logAllPricingItems();

/**
 * Axial Impeller Pricing Service
 * Handles CRUD operations for axial impeller pricing tables:
 * - AxialImpellerBlade
 * - AxialImpellerHub
 * - AxialImpellerFrame
 *
 * Also provides calculation methods for total impeller cost
 */
export const AxialImpellerPricingService = {
  // ========================
  // BLADE OPERATIONS
  // ========================

  /**
   * Get all blade pricing records with calculated totalCost (per 1 blade)
   */
  async getAllBlades() {
    const blades = await getPrisma().axialImpellerBlade.findMany({
      orderBy: [{ symbol: "asc" }, { material: "asc" }],
    });
    const enriched = [];
    for (const blade of blades) {
      try {
        const calc = await this.calculateBladeCost(blade, 1);
        enriched.push({ ...blade, totalCost: calc.totalCost });
      } catch (err) {
        console.warn(
          `[AxialImpeller] Blade ${blade.id} (${blade.symbol}) totalCost calc failed:`,
          err.message,
        );
        enriched.push({ ...blade, totalCost: 0 });
      }
    }
    return enriched;
  },

  /**
   * Get blade by ID
   */
  async getBladeById(id) {
    return await getPrisma().axialImpellerBlade.findUnique({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Get blade by symbol and material
   */
  async getBladeBySymbolAndMaterial(symbol, material) {
    console.log("Fetching blade with:", { symbol, material });
    return await getPrisma().axialImpellerBlade.findFirst({
      where: {
        symbol: `${material}${symbol}`,
      },
    });
  },

  /**
   * Create a new blade pricing record
   */
  async createBlade(data) {
    return await getPrisma().axialImpellerBlade.create({
      data: {
        symbol: data.symbol,
        material: data.material,
        bladeType: data.bladeType,
        lengthMm: parseFloat(data.lengthMm),
        bladeWeightKg: parseFloat(data.bladeWeightKg),
        // Support both old field names (bladeMoldCost) and new names (moldCostWithVat)
        moldCostWithVat: parseFloat(data.moldCostWithVat || data.bladeMoldCost),
        machiningCostWithVat: parseFloat(
          data.machiningCostWithVat || data.bladeMachiningCost,
        ),
        transportationCost: parseFloat(
          data.transportationCost || data.bladeTransportCost,
        ),
        packingCost: parseFloat(data.packingCost || data.bladePackingCost),
        steelBallsCost: parseFloat(data.steelBallsCost),
        bladeFactor:
          data.bladeFactor !== undefined ? parseFloat(data.bladeFactor) : null,
      },
    });
  },

  /**
   * Update blade pricing record
   */
  async updateBlade(id, data) {
    const updateData = {};

    // Helper to safely parse float, handling 0 values correctly
    const safeParseFloat = (val) => {
      if (val === undefined || val === null || val === "") return undefined;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? undefined : parsed;
    };

    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.material !== undefined) updateData.material = data.material;
    if (data.bladeType !== undefined) updateData.bladeType = data.bladeType;
    
    // Numeric fields - use nullish coalescing (??) instead of || to handle 0 values
    if (data.lengthMm !== undefined) {
      const val = safeParseFloat(data.lengthMm);
      if (val !== undefined) updateData.lengthMm = val;
    }
    if (data.bladeWeightKg !== undefined) {
      const val = safeParseFloat(data.bladeWeightKg);
      if (val !== undefined) updateData.bladeWeightKg = val;
    }
    if (data.moldCostWithVat !== undefined || data.bladeMoldCost !== undefined) {
      const val = safeParseFloat(data.moldCostWithVat ?? data.bladeMoldCost);
      if (val !== undefined) updateData.moldCostWithVat = val;
    }
    if (data.machiningCostWithVat !== undefined || data.bladeMachiningCost !== undefined) {
      const val = safeParseFloat(data.machiningCostWithVat ?? data.bladeMachiningCost);
      if (val !== undefined) updateData.machiningCostWithVat = val;
    }
    if (data.transportationCost !== undefined || data.bladeTransportCost !== undefined) {
      const val = safeParseFloat(data.transportationCost ?? data.bladeTransportCost);
      if (val !== undefined) updateData.transportationCost = val;
    }
    if (data.packingCost !== undefined || data.bladePackingCost !== undefined) {
      const val = safeParseFloat(data.packingCost ?? data.bladePackingCost);
      if (val !== undefined) updateData.packingCost = val;
    }
    if (data.steelBallsCost !== undefined) {
      const val = safeParseFloat(data.steelBallsCost);
      if (val !== undefined) updateData.steelBallsCost = val;
    }
    if (data.bladeFactor !== undefined) {
      const parsed = parseFloat(data.bladeFactor);
      updateData.bladeFactor = (data.bladeFactor === null || data.bladeFactor === "" || isNaN(parsed)) ? null : parsed;
    }

    return await getPrisma().axialImpellerBlade.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
  },

  /**
   * Delete blade pricing record
   */
  async deleteBlade(id) {
    return await getPrisma().axialImpellerBlade.delete({
      where: { id: parseInt(id) },
    });
  },

  // ========================
  // HUB OPERATIONS
  // ========================

  /**
   * Get all hub pricing records with calculated totalCost
   */
  async getAllHubs() {
    const hubs = await getPrisma().axialImpellerHub.findMany({
      orderBy: [{ symbol: "asc" }, { material: "asc" }],
    });
    const enriched = [];
    for (const hub of hubs) {
      try {
        const calc = await this.calculateHubCost(hub);
        enriched.push({ ...hub, totalCost: calc.totalCost });
      } catch (err) {
        console.warn(
          `[AxialImpeller] Hub ${hub.id} (${hub.symbol}) totalCost calc failed:`,
          err.message,
        );
        enriched.push({ ...hub, totalCost: 0 });
      }
    }
    return enriched;
  },

  /**
   * Get hub by ID
   */
  async getHubById(id) {
    return await getPrisma().axialImpellerHub.findUnique({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Get hub by symbol
   */
  async getHubBySymbol(symbol) {
    return await getPrisma().axialImpellerHub.findFirst({
      where: {
        symbol: symbol,
      },
    });
  },

  /**
   * Create a new hub pricing record
   */
  async createHub(data) {
    return await getPrisma().axialImpellerHub.create({
      data: {
        symbol: data.symbol,
        material: data.material,
        hubType: data.hubType,
        sizeMm: parseFloat(data.sizeMm),
        hubWeightKg: parseFloat(data.hubWeightKg),
        moldCostWithVat: parseFloat(data.moldCostWithVat),
        machiningCostWithVat: parseFloat(data.machiningCostWithVat),
        transportationCost: parseFloat(data.transportationCost),
        packingCost: parseFloat(data.packingCost),
      },
    });
  },

  /**
   * Update hub pricing record
   */
  async updateHub(id, data) {
    const updateData = {};

    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.material !== undefined) updateData.material = data.material;
    if (data.hubType !== undefined) updateData.hubType = data.hubType;
    if (data.sizeMm !== undefined) updateData.sizeMm = parseFloat(data.sizeMm);
    if (data.hubWeightKg !== undefined)
      updateData.hubWeightKg = parseFloat(data.hubWeightKg);
    if (data.moldCostWithVat !== undefined)
      updateData.moldCostWithVat = parseFloat(data.moldCostWithVat);
    if (data.machiningCostWithVat !== undefined)
      updateData.machiningCostWithVat = parseFloat(data.machiningCostWithVat);
    if (data.transportationCost !== undefined)
      updateData.transportationCost = parseFloat(data.transportationCost);
    if (data.packingCost !== undefined)
      updateData.packingCost = parseFloat(data.packingCost);

    return await getPrisma().axialImpellerHub.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
  },

  /**
   * Delete hub pricing record
   */
  async deleteHub(id) {
    return await getPrisma().axialImpellerHub.delete({
      where: { id: parseInt(id) },
    });
  },

  // ========================
  // FRAME OPERATIONS
  // ========================

  /**
   * Get all frame pricing records with calculated totalCost
   */
  async getAllFrames() {
    const frames = await getPrisma().axialImpellerFrame.findMany({
      orderBy: [{ material: "asc" }, { frameSizeMm: "asc" }],
    });
    const enriched = [];
    for (const frame of frames) {
      try {
        const calc = await this.calculateFrameCost(frame);
        enriched.push({ ...frame, totalCost: calc.totalCost });
      } catch (err) {
        console.warn(
          `[AxialImpeller] Frame ${frame.id} (${frame.frameSizeMm}mm) totalCost calc failed:`,
          err.message,
        );
        enriched.push({ ...frame, totalCost: 0 });
      }
    }
    return enriched;
  },

  /**
   * Get frame by ID
   */
  async getFrameById(id) {
    return await getPrisma().axialImpellerFrame.findUnique({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Get frame by frame size
   */
  async getFrameBySize(frameSizeMm) {
    return await getPrisma().axialImpellerFrame.findFirst({
      where: {
        frameSizeMm: parseFloat(frameSizeMm),
      },
    });
  },

  /**
   * Create a new frame pricing record
   */
  async createFrame(data) {
    return await getPrisma().axialImpellerFrame.create({
      data: {
        material: data.material,
        frameSizeMm: parseFloat(data.frameSizeMm),
        sizeMm: parseFloat(data.sizeMm),
        weightKg: parseFloat(data.weightKg),
        moldCostWithVat: parseFloat(data.moldCostWithVat),
        machiningCostWithVat: parseFloat(data.machiningCostWithVat),
        transportationCost: parseFloat(data.transportationCost),
        packingCost: parseFloat(data.packingCost),
      },
    });
  },

  /**
   * Update frame pricing record
   */
  async updateFrame(id, data) {
    const updateData = {};

    if (data.material !== undefined) updateData.material = data.material;
    if (data.frameSizeMm !== undefined)
      updateData.frameSizeMm = parseFloat(data.frameSizeMm);
    if (data.sizeMm !== undefined) updateData.sizeMm = parseFloat(data.sizeMm);
    if (data.weightKg !== undefined)
      updateData.weightKg = parseFloat(data.weightKg);
    if (data.moldCostWithVat !== undefined)
      updateData.moldCostWithVat = parseFloat(data.moldCostWithVat);
    if (data.machiningCostWithVat !== undefined)
      updateData.machiningCostWithVat = parseFloat(data.machiningCostWithVat);
    if (data.transportationCost !== undefined)
      updateData.transportationCost = parseFloat(data.transportationCost);
    if (data.packingCost !== undefined)
      updateData.packingCost = parseFloat(data.packingCost);

    return await getPrisma().axialImpellerFrame.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
  },

  /**
   * Delete frame pricing record
   */
  async deleteFrame(id) {
    return await getPrisma().axialImpellerFrame.delete({
      where: { id: parseInt(id) },
    });
  },

  // ========================
  // CALCULATION METHODS
  // ========================

  /**
   * Calculate blade cost using the formula:
   * (moldCostWithVat * moldFactor) / moldLifetime +
   * (weight * 1.1 * NoBlades * RawMaterialInj) / 1000 +
   * machiningCostWithVat * MachineFactor +
   * transportation + Packing + SteelBalls +
   * InjMachineCost * 1.1 + BladeFactor
   *
   * @param {Object} blade - Blade pricing record
   * @param {number} numberOfBlades - Number of blades
   * @returns {Object} - Calculated cost breakdown
   */
  async calculateBladeCost(blade, numberOfBlades = 1) {
    // Fetch pricing items
    const moldFactor = await getPricingItemByDescription(
      "Mold Currency change Factor",
    );
    const moldLifetime = await getPricingItemByDescription("Mold Life time");
    const rawMaterialInj =
      blade.material === "Aluminum"
        ? await getPricingItemByDescription(
            "336 Aluminum Raw Material (Injection)",
          )
        : await getPricingItemByDescription("PAG 30% Raw Material");
    const machineFactor = await getPricingItemByDescription(
      "Axial Impeller Maching Factor",
    );

    // Determine InjMachineCost based on material (A or P)
    // Aluminum: "Aluminum injection Small machine cost" or "Aluminum injection machine cost (AM)"
    const injMachineCost =
      blade.symbol === "AM"
        ? await getPricingItemByDescription(
            "Aluminum injection machine cost (AM)",
          )
        : blade.symbol === "AV" || blade.symbol === "AG"
          ? await getPricingItemByDescription(
              "Aluminum injection machine cost (AV & AG)",
            )
          : await getPricingItemByDescription(
              "PAG injection Small machine cost",
            );
    console.log(
      `InjMachineCost for blade ${blade.symbol} (${blade.material}):`,
      injMachineCost,
    );

    // BladeFactor only applies to Aluminum (A), otherwise 0
    // Use bladeFactor from database if set, otherwise default to 0
    let bladeFactor = blade.bladeFactor ?? 0;

    // Calculate components
    const moldCostComponent =
      moldLifetime !== 0
        ? (blade.moldCostWithVat * moldFactor) / moldLifetime
        : 0;

    const rawMaterialComponent =
      blade.bladeWeightKg * 1.1 * (rawMaterialInj / 1000);

    const machiningComponent = blade.machiningCostWithVat * machineFactor;

    const injMachineComponent = injMachineCost * 1.1;

    // Total blade cost
    const totalBladeCost =
      (moldCostComponent +
        rawMaterialComponent +
        machiningComponent +
        blade.transportationCost +
        blade.packingCost +
        blade.steelBallsCost +
        injMachineComponent +
        bladeFactor * 1.14) *
      numberOfBlades;

    return {
      totalCost: Math.round(totalBladeCost * 100) / 100,
      breakdown: {
        moldCostComponent: Math.round(moldCostComponent * 100) / 100,
        rawMaterialComponent: Math.round(rawMaterialComponent * 100) / 100,
        machiningComponent: Math.round(machiningComponent * 100) / 100,
        transportationCost: blade.transportationCost,
        packingCost: blade.packingCost,
        steelBallsCost: blade.steelBallsCost,
        injMachineComponent: Math.round(injMachineComponent * 100) / 100,
        bladeFactor: bladeFactor,
      },
      pricingFactors: {
        moldFactor,
        moldLifetime,
        rawMaterialInj,
        machineFactor,
        injMachineCost,
        bladeFactor,
      },
    };
  },

  /**
   * Calculate hub cost using the formula (same for Fixed and Variable):
   *   (moldCostWithVat * moldFactor) / (moldLifetime * 2) +
   *   (hubWeight * 1.1 * RawMaterialInj) / 1000 +
   *   machiningCostWithVat * MachineFactor +
   *   transportation + Packing +
   *   InjMachineCost * 1.1
   *
   * InjMachineCost varies by hub symbol (Hub 5, Hub 6, Hub 9, Hub 12, Hub 14, Hub 16)
   *
   * @param {Object} hub - Hub pricing record
   * @returns {Object} - Calculated cost breakdown
   */
  async calculateHubCost(hub) {
    const isFixed = hub.hubType === "Fixed";

    // Fetch pricing items
    const moldFactor = await getPricingItemByDescription(
      "Mold Currency change Factor",
    );
    const moldLifetime = await getPricingItemByDescription("Mold Life time");
    const rawMaterialInj = await getPricingItemByDescription(
      "336 Aluminum Raw Material (Injection)",
    );

    const machineFactor = await getPricingItemByDescription(
      "Axial Impeller Maching Factor",
    );

    // Calculate mold cost - same formula for both Fixed and Variable hubs:
    // (moldCostWithVat * moldFactor) / (moldLifetime * 2)
    const moldCostComponent = moldLifetime !== 0
      ? (hub.moldCostWithVat * moldFactor) / (moldLifetime * 2)
      : 0;
    console.log(
      `MoldCostComponent for hub ${hub.symbol} (${hub.hubType}):`,
      moldCostComponent,
      hub.moldCostWithVat,
      moldFactor,
      moldLifetime,
    );
    // Raw material component (same as blade formula but no numberOfBlades)
    const rawMaterialComponent =
      hub.hubWeightKg * 1.1 * (rawMaterialInj / 1000);
    console.log(
      `RawMaterialComponent for hub ${hub.symbol} (${hub.hubType}):`,
      rawMaterialComponent,
      hub.hubWeightKg,
      rawMaterialInj,
    );
    // Machining component
    const machiningComponent = hub.machiningCostWithVat * machineFactor;
    console.log(
      `MachiningComponent for hub ${hub.symbol} (${hub.hubType}):`,
      machiningComponent,
      hub.machiningCostWithVat,
      machineFactor,
    );

    // Injection machine cost based on hub type
    let injMachineComponent = 0;
    const injMachineCost =
      hub.symbol === "6" || hub.symbol === "14"
        ? await getPricingItemByDescription(
            "Aluminum injection machine cost (Hub 6)",
          )
        : hub.symbol === "5"
          ? await getPricingItemByDescription(
              "Aluminum injection machine cost (Hub 5)",
            )
          : hub.symbol === "9"
            ? await getPricingItemByDescription(
                "Aluminum injection machine cost (Hub 9)",
              )
            : hub.symbol === "12"
              ? await getPricingItemByDescription(
                  "Aluminum injection machine cost (Hub 12)",
                )
              : await getPricingItemByDescription(
                  "Aluminum injection machine cost (Hub 16)",
                );
    injMachineComponent = injMachineCost * 1.1;
    console.log(
      `InjMachineComponent for hub ${hub.symbol} (${hub.hubType}):`,
      injMachineComponent,
    );

    // Total hub cost
    const totalHubCost =
      moldCostComponent +
      rawMaterialComponent +
      machiningComponent +
      hub.transportationCost +
      hub.packingCost +
      injMachineComponent;

    return {
      totalCost: Math.round(totalHubCost * 100) / 100,
      breakdown: {
        moldCostComponent: Math.round(moldCostComponent * 100) / 100,
        rawMaterialComponent: Math.round(rawMaterialComponent * 100) / 100,
        machiningComponent: Math.round(machiningComponent * 100) / 100,
        transportationCost: hub.transportationCost,
        packingCost: hub.packingCost,
        injMachineComponent: Math.round(injMachineComponent * 100) / 100,
      },
      pricingFactors: {
        isFixed,
        moldFactor,
        moldLifetime,
        rawMaterialInj,
        machineFactor,
      },
    };
  },

  /**
   * Calculate frame cost using the formula:
   * ((moldCostWithVat * moldFactor) / (moldLifetime / 2)) * 2 +
   * (frameWeight * 1.1 * RawMaterialInj) / 1000 +
   * machiningCostWithVat * MachineFactor +
   * transportationCost + packingCost +
   * SR#16 * 1.1
   *
   * @param {Object} frame - Frame pricing record
   * @returns {Object} - Calculated cost breakdown
   */
  async calculateFrameCost(frame) {
    // Fetch pricing items
    const moldFactor = await getPricingItemByDescription(
      "Mold Currency change Factor",
    );
    const moldLifetime = await getPricingItemByDescription("Mold Life time");
    const rawMaterialInj = await getPricingItemByDescription(
      "336 Aluminum Raw Material (Injection)",
    );
    const machineFactor = await getPricingItemByDescription(
      "Axial Impeller Maching Factor",
    );
    const injMachineCost = await getPricingItemByDescription(
      "Aluminum injection Small machine cost",
    );

    // Mold cost component (same as non-fixed hub)
    let moldCostComponent = 0;
    if (moldLifetime !== 0) {
      moldCostComponent =
        ((frame.moldCostWithVat * moldFactor) / (moldLifetime / 2)) * 2;
    }

    // Raw material component
    const rawMaterialComponent = frame.weightKg * 1.1 * (rawMaterialInj / 1000);

    // Machining component
    const machiningComponent = frame.machiningCostWithVat * machineFactor;

    // Injection machine component (SR#16 * 1.1)
    const injMachineComponent = injMachineCost * 1.1;

    // Total frame cost
    const totalFrameCost =
      moldCostComponent +
      rawMaterialComponent +
      machiningComponent +
      frame.transportationCost +
      frame.packingCost +
      injMachineComponent;

    return {
      totalCost: Math.round(totalFrameCost * 100) / 100,
      breakdown: {
        moldCostComponent: Math.round(moldCostComponent * 100) / 100,
        rawMaterialComponent: Math.round(rawMaterialComponent * 100) / 100,
        machiningComponent: Math.round(machiningComponent * 100) / 100,
        transportationCost: frame.transportationCost,
        packingCost: frame.packingCost,
        injMachineComponent: Math.round(injMachineComponent * 100) / 100,
      },
      pricingFactors: {
        moldFactor,
        moldLifetime,
        rawMaterialInj,
        machineFactor,
        injMachineCost,
      },
    };
  },

  /**
   * Calculate total impeller cost based on blade, hub, and frame
   *
   * @param {Object} params - Calculation parameters
   * @param {string} params.bladeSymbol - Symbol of the blade
   * @param {string} params.bladeMaterial - Material of the blade (A or P)
   * @param {string} params.hubType - Type of hub (e.g., "Fixed")
   * @param {number} params.frameSizeMm - Frame size in mm
   * @param {number} params.numberOfBlades - Number of blades
   * @returns {Object} - Calculated cost breakdown
   */
  async calculateImpellerCost(params) {
    const {
      bladeSymbol,
      bladeMaterial,
      hubSymbol,
      frameSizeMm,
      numberOfBlades,
    } = params;

    // Fetch the pricing records by their respective search criteria
    const blade = await this.getBladeBySymbolAndMaterial(
      bladeSymbol,
      bladeMaterial,
    );
    const hub = await this.getHubBySymbol(hubSymbol.toString());
    const frame = await this.getFrameBySize(frameSizeMm);

    if (!blade) {
      throw new Error(
        `Blade not found with symbol: ${bladeSymbol} and material: ${bladeMaterial}`,
      );
    }
    if (!hub) {
      throw new Error(`Hub not found with symbol: ${hubSymbol}`);
    }
    if (!frame) {
      throw new Error(`Frame not found with size: ${frameSizeMm}mm`);
    }

    // Calculate blade cost
    const bladeCalculation = await this.calculateBladeCost(
      blade,
      numberOfBlades,
    );

    // Calculate hub cost
    const hubCalculation = await this.calculateHubCost(hub);

    // Calculate frame cost
    const frameCalculation = await this.calculateFrameCost(frame);

    const totalImpellerCost =
      bladeCalculation.totalCost +
      hubCalculation.totalCost +
      frameCalculation.totalCost;

    return {
      blade: {
        ...blade,
        numberOfBlades,
        ...bladeCalculation,
      },
      hub: {
        ...hub,
        ...hubCalculation,
      },
      frame: {
        ...frame,
        ...frameCalculation,
      },
      totalCost: Math.round(totalImpellerCost * 100) / 100,
      summary: {
        bladeCost: bladeCalculation.totalCost,
        hubCost: hubCalculation.totalCost,
        frameCost: frameCalculation.totalCost,
      },
    };
  },
};
