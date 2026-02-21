import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// SR# Constants for pricing items
const PRICING_SR = {
  MOLD_FACTOR: 13,
  MOLD_LIFETIME: 15,
  RAW_MATERIAL_INJ: 9, // Used for both AL and PAG
  MACHINE_FACTOR: 14,
  INJ_MACHINE_COST_AL: 17, // For Aluminum (Blade)
  INJ_MACHINE_COST_PAG: 20, // For PAG/Plastic (Blade)
  BLADE_FACTOR: 26, // Only for Aluminum
  INJ_MACHINE_COST_HUB_FIXED: 19, // For Fixed Hub
};

/**
 * Helper function to get pricing item by SR number
 */
async function getPricingItemByDescription(description) {
  const item = await prisma.pricingItem.findFirst({
    where: { description: description },
  });
  return item ? item.priceWithVat || 0 : 0;
}

/**
 * Load and display all pricing items on startup
 */
async function logAllPricingItems() {
  try {
    const allItems = await prisma.pricingItem.findMany({
      orderBy: { sr: "asc" },
      include: {
        category: true,
      },
    });

    console.log("\n=== PRICING ITEMS (SR Order) ===");
    console.log(`Total items found: ${allItems.length}`);

    if (allItems.length === 0) {
      console.log("⚠️  No pricing items found in database!");
    } else {
      allItems.forEach((item) => {
        console.log(
          `SR# ${item.sr
            .toString()
            .padStart(3, " ")} | ${item.category.name.padEnd(
            20,
            " ",
          )} | ${item.description.padEnd(50, " ")} | ${item.priceWithVat || 0}`,
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
   * Get all blade pricing records
   */
  async getAllBlades() {
    return await prisma.axialImpellerBlade.findMany({
      orderBy: [{ symbol: "asc" }, { material: "asc" }],
    });
  },

  /**
   * Get blade by ID
   */
  async getBladeById(id) {
    return await prisma.axialImpellerBlade.findUnique({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Get blade by symbol and material
   */
  async getBladeBySymbolAndMaterial(symbol, material) {
    console.log("Fetching blade with:", { symbol, material });
    return await prisma.axialImpellerBlade.findFirst({
      where: {
        symbol: `${material}${symbol}`,
      },
    });
  },

  /**
   * Create a new blade pricing record
   */
  async createBlade(data) {
    return await prisma.axialImpellerBlade.create({
      data: {
        symbol: data.symbol,
        material: data.material,
        bladeType: data.bladeType,
        lengthMm: parseFloat(data.lengthMm),
        bladeWeightKg: parseFloat(data.bladeWeightKg),
        moldCostWithVat: parseFloat(data.moldCostWithVat),
        machiningCostWithVat: parseFloat(data.machiningCostWithVat),
        transportationCost: parseFloat(data.transportationCost),
        packingCost: parseFloat(data.packingCost),
        steelBallsCost: parseFloat(data.steelBallsCost),
      },
    });
  },

  /**
   * Update blade pricing record
   */
  async updateBlade(id, data) {
    const updateData = {};

    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.material !== undefined) updateData.material = data.material;
    if (data.bladeType !== undefined) updateData.bladeType = data.bladeType;
    if (data.lengthMm !== undefined)
      updateData.lengthMm = parseFloat(data.lengthMm);
    if (data.bladeWeightKg !== undefined)
      updateData.bladeWeightKg = parseFloat(data.bladeWeightKg);
    if (data.moldCostWithVat !== undefined)
      updateData.moldCostWithVat = parseFloat(data.moldCostWithVat);
    if (data.machiningCostWithVat !== undefined)
      updateData.machiningCostWithVat = parseFloat(data.machiningCostWithVat);
    if (data.transportationCost !== undefined)
      updateData.transportationCost = parseFloat(data.transportationCost);
    if (data.packingCost !== undefined)
      updateData.packingCost = parseFloat(data.packingCost);
    if (data.steelBallsCost !== undefined)
      updateData.steelBallsCost = parseFloat(data.steelBallsCost);

    return await prisma.axialImpellerBlade.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
  },

  /**
   * Delete blade pricing record
   */
  async deleteBlade(id) {
    return await prisma.axialImpellerBlade.delete({
      where: { id: parseInt(id) },
    });
  },

  // ========================
  // HUB OPERATIONS
  // ========================

  /**
   * Get all hub pricing records
   */
  async getAllHubs() {
    return await prisma.axialImpellerHub.findMany({
      orderBy: [{ symbol: "asc" }, { material: "asc" }],
    });
  },

  /**
   * Get hub by ID
   */
  async getHubById(id) {
    return await prisma.axialImpellerHub.findUnique({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Get hub by symbol
   */
  async getHubBySymbol(symbol) {
    return await prisma.axialImpellerHub.findFirst({
      where: {
        symbol: symbol,
      },
    });
  },

  /**
   * Create a new hub pricing record
   */
  async createHub(data) {
    return await prisma.axialImpellerHub.create({
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

    return await prisma.axialImpellerHub.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
  },

  /**
   * Delete hub pricing record
   */
  async deleteHub(id) {
    return await prisma.axialImpellerHub.delete({
      where: { id: parseInt(id) },
    });
  },

  // ========================
  // FRAME OPERATIONS
  // ========================

  /**
   * Get all frame pricing records
   */
  async getAllFrames() {
    return await prisma.axialImpellerFrame.findMany({
      orderBy: [{ material: "asc" }, { frameSizeMm: "asc" }],
    });
  },

  /**
   * Get frame by ID
   */
  async getFrameById(id) {
    return await prisma.axialImpellerFrame.findUnique({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Get frame by frame size
   */
  async getFrameBySize(frameSizeMm) {
    return await prisma.axialImpellerFrame.findFirst({
      where: {
        frameSizeMm: parseFloat(frameSizeMm),
      },
    });
  },

  /**
   * Create a new frame pricing record
   */
  async createFrame(data) {
    return await prisma.axialImpellerFrame.create({
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

    return await prisma.axialImpellerFrame.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
  },

  /**
   * Delete frame pricing record
   */
  async deleteFrame(id) {
    return await prisma.axialImpellerFrame.delete({
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
  async calculateBladeCost(blade, numberOfBlades) {
    // Fetch pricing items
    const moldFactor = await getPricingItemByDescription(
      "Mold Currency change Factor",
    );
    const moldLifetime = await getPricingItemByDescription("Mold Life time");
    const rawMaterialInj =
      blade.material === "A"
        ? await getPricingItemByDescription(
            "336 Aluminum Raw Material (Injection)",
          )
        : await getPricingItemByDescription("PAG 30% Raw Material");
    const machineFactor = await getPricingItemByDescription(
      "Axial Impeller Maching Factor",
    );

    // Determine InjMachineCost based on material (A or P)
    const injMachineCostSr =
      blade.material === "A"
        ? "Aluminum injection machine cost"
        : "PAG injection Small machine cost";
    const injMachineCost = await getPricingItemByDescription(injMachineCostSr);

    // BladeFactor only applies to Aluminum (A), otherwise 0
    const bladeFactor =
      blade.material === "A"
        ? await getPricingItemByDescription("Blade Cutting")
        : 0;

    // Calculate components
    const moldCostComponent =
      moldLifetime !== 0
        ? (blade.moldCostWithVat * moldFactor) / moldLifetime
        : 0;

    const rawMaterialComponent =
      (blade.bladeWeightKg * 1.1 * rawMaterialInj) / 1000;

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
        bladeFactor) *
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
   * Calculate hub cost using the formula:
   * If hubType === "Fixed":
   *   (moldCostWithVat * moldFactor) / (moldLifetime * 2) +
   *   (hubWeight * 1.1 * RawMaterialInj) / 1000 +
   *   machiningCostWithVat * MachineFactor +
   *   transportation + Packing +
   *   SR#19 * 1.1
   * Else:
   *   ((moldCostWithVat * moldFactor) / (moldLifetime / 2)) * 2 +
   *   (hubWeight * 1.1 * RawMaterialInj) / 1000 +
   *   machiningCostWithVat * MachineFactor +
   *   transportation + Packing +
   *   hubWeight * 45 * 1.14 * 1.1
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
    const rawMaterialInj = isFixed
      ? await getPricingItemByDescription(
          "336 Aluminum Raw Material (Injection)",
        )
      : await getPricingItemByDescription("PAG 30% Raw Material");
    const machineFactor = await getPricingItemByDescription(
      "Axial Impeller Maching Factor",
    );

    // Calculate mold cost based on hub type
    let moldCostComponent = 0;
    if (moldLifetime !== 0) {
      if (isFixed) {
        moldCostComponent =
          (hub.moldCostWithVat * moldFactor) / (moldLifetime * 2);
      } else {
        moldCostComponent =
          ((hub.moldCostWithVat * moldFactor) / (moldLifetime / 2)) * 2;
      }
    }

    // Raw material component (same as blade formula but no numberOfBlades)
    const rawMaterialComponent =
      (hub.hubWeightKg * 1.1 * rawMaterialInj) / 1000;

    // Machining component
    const machiningComponent = hub.machiningCostWithVat * machineFactor;

    // Injection machine cost based on hub type
    let injMachineComponent = 0;
    if (isFixed) {
      const injMachineCostFixed = await getPricingItemByDescription(
        "Aluminum injection machine cost (Hub 6)",
      );
      injMachineComponent = injMachineCostFixed * 1.1;
    } else {
      injMachineComponent = hub.hubWeightKg * 45 * 1.14 * 1.1;
    }

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
      "Aluminum injection machine cost (AM)",
    );

    // Mold cost component (same as non-fixed hub)
    let moldCostComponent = 0;
    if (moldLifetime !== 0) {
      moldCostComponent =
        ((frame.moldCostWithVat * moldFactor) / (moldLifetime / 2)) * 2;
    }

    // Raw material component
    const rawMaterialComponent = (frame.weightKg * 1.1 * rawMaterialInj) / 1000;

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
