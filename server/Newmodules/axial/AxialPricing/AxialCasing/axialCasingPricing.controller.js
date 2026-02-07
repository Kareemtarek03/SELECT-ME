import { AxialCasingPricingService } from "./axialCasingPricing.service.js";

/**
 * Get all casing pricing records
 */
export const getAllCasings = async (req, res) => {
  try {
    const casings = await AxialCasingPricingService.getAllCasings();
    res.json(casings);
  } catch (error) {
    console.error("Error fetching casings:", error);
    res.status(500).json({ error: "Failed to fetch casing pricing data" });
  }
};

/**
 * Get casing by ID
 */
export const getCasingById = async (req, res) => {
  try {
    const { id } = req.params;
    const casing = await AxialCasingPricingService.getCasingById(id);

    if (!casing) {
      return res.status(404).json({ error: "Casing not found" });
    }

    res.json(casing);
  } catch (error) {
    console.error("Error fetching casing:", error);
    res.status(500).json({ error: "Failed to fetch casing" });
  }
};

/**
 * Create a new casing pricing record
 */
export const createCasing = async (req, res) => {
  try {
    const casing = await AxialCasingPricingService.createCasing(req.body);
    res.status(201).json(casing);
  } catch (error) {
    console.error("Error creating casing:", error);

    // Check for unique constraint violation
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "A casing with this model and size already exists",
      });
    }

    res.status(500).json({ error: "Failed to create casing" });
  }
};

/**
 * Update a casing pricing record
 */
export const updateCasing = async (req, res) => {
  try {
    const { id } = req.params;
    const casing = await AxialCasingPricingService.updateCasing(id, req.body);
    res.json(casing);
  } catch (error) {
    console.error("Error updating casing:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Casing not found" });
    }

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "A casing with this model and size already exists",
      });
    }

    res.status(500).json({ error: "Failed to update casing" });
  }
};

/**
 * Delete a casing pricing record
 */
export const deleteCasing = async (req, res) => {
  try {
    const { id } = req.params;
    await AxialCasingPricingService.deleteCasing(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting casing:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Casing not found" });
    }

    res.status(500).json({ error: "Failed to delete casing" });
  }
};

/**
 * Calculate casing cost
 */
export const calculateCasingCost = async (req, res) => {
  try {
    const { model, sizeMm } = req.body;

    if (!model || !sizeMm) {
      return res.status(400).json({
        error: "Missing required parameters: model and sizeMm",
      });
    }

    const result = await AxialCasingPricingService.calculateCasingCost({
      model,
      sizeMm,
    });

    res.json(result);
  } catch (error) {
    console.error("Error calculating casing cost:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to calculate casing cost" });
  }
};

/**
 * Lookup casing by fan data
 */
export const lookupCasingByFanData = async (req, res) => {
  try {
    const { fanType, impellerConf, innerDiameter } = req.params;

    if (!fanType || !innerDiameter) {
      return res.status(400).json({
        error: "Missing required parameters: fanType and innerDiameter",
      });
    }

    const casing = await AxialCasingPricingService.lookupCasingByFanData(
      fanType,
      impellerConf,
      parseFloat(innerDiameter)
    );

    if (!casing) {
      return res.status(404).json({
        error: "No casing found for the specified fan configuration",
      });
    }

    // Calculate weight with scrap
    const weightWithScrap =
      AxialCasingPricingService.calculateCasingWeightWithScrap(
        casing.casingWeightKgWithoutScrap,
        casing.scrapPercentage
      );

    res.json({
      ...casing,
      casingWeightKgWithScrap: weightWithScrap,
    });
  } catch (error) {
    console.error("Error looking up casing:", error);
    res.status(500).json({ error: "Failed to lookup casing" });
  }
};
