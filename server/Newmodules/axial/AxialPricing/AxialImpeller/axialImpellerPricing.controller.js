import { AxialImpellerPricingService } from "./axialImpellerPricing.service.js";

/**
 * Axial Impeller Pricing Controller
 * Handles HTTP requests for axial impeller pricing endpoints
 */
export const AxialImpellerPricingController = {
  // ========================
  // BLADE CONTROLLERS
  // ========================

  /**
   * Get all blade pricing records
   */
  async getAllBlades(req, res) {
    try {
      const blades = await AxialImpellerPricingService.getAllBlades();
      res.json({
        success: true,
        data: blades,
      });
    } catch (error) {
      console.error("Error fetching blades:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch blade pricing data",
        error: error.message,
      });
    }
  },

  /**
   * Get blade by ID
   */
  async getBladeById(req, res) {
    try {
      const blade = await AxialImpellerPricingService.getBladeById(
        req.params.id
      );

      if (!blade) {
        return res.status(404).json({
          success: false,
          message: "Blade not found",
        });
      }

      res.json({
        success: true,
        data: blade,
      });
    } catch (error) {
      console.error("Error fetching blade:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch blade pricing data",
        error: error.message,
      });
    }
  },

  /**
   * Create new blade pricing record
   */
  async createBlade(req, res) {
    try {
      const blade = await AxialImpellerPricingService.createBlade(req.body);
      res.status(201).json({
        success: true,
        data: blade,
        message: "Blade pricing record created successfully",
      });
    } catch (error) {
      console.error("Error creating blade:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create blade pricing record",
        error: error.message,
      });
    }
  },

  /**
   * Update blade pricing record
   */
  async updateBlade(req, res) {
    try {
      const blade = await AxialImpellerPricingService.updateBlade(
        req.params.id,
        req.body
      );
      res.json({
        success: true,
        data: blade,
        message: "Blade pricing record updated successfully",
      });
    } catch (error) {
      console.error("Error updating blade:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update blade pricing record",
        error: error.message,
      });
    }
  },

  /**
   * Delete blade pricing record
   */
  async deleteBlade(req, res) {
    try {
      await AxialImpellerPricingService.deleteBlade(req.params.id);
      res.json({
        success: true,
        message: "Blade pricing record deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting blade:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete blade pricing record",
        error: error.message,
      });
    }
  },

  // ========================
  // HUB CONTROLLERS
  // ========================

  /**
   * Get all hub pricing records
   */
  async getAllHubs(req, res) {
    try {
      const hubs = await AxialImpellerPricingService.getAllHubs();
      res.json({
        success: true,
        data: hubs,
      });
    } catch (error) {
      console.error("Error fetching hubs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch hub pricing data",
        error: error.message,
      });
    }
  },

  /**
   * Get hub by ID
   */
  async getHubById(req, res) {
    try {
      const hub = await AxialImpellerPricingService.getHubById(req.params.id);

      if (!hub) {
        return res.status(404).json({
          success: false,
          message: "Hub not found",
        });
      }

      res.json({
        success: true,
        data: hub,
      });
    } catch (error) {
      console.error("Error fetching hub:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch hub pricing data",
        error: error.message,
      });
    }
  },

  /**
   * Create new hub pricing record
   */
  async createHub(req, res) {
    try {
      const hub = await AxialImpellerPricingService.createHub(req.body);
      res.status(201).json({
        success: true,
        data: hub,
        message: "Hub pricing record created successfully",
      });
    } catch (error) {
      console.error("Error creating hub:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create hub pricing record",
        error: error.message,
      });
    }
  },

  /**
   * Update hub pricing record
   */
  async updateHub(req, res) {
    try {
      const hub = await AxialImpellerPricingService.updateHub(
        req.params.id,
        req.body
      );
      res.json({
        success: true,
        data: hub,
        message: "Hub pricing record updated successfully",
      });
    } catch (error) {
      console.error("Error updating hub:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update hub pricing record",
        error: error.message,
      });
    }
  },

  /**
   * Delete hub pricing record
   */
  async deleteHub(req, res) {
    try {
      await AxialImpellerPricingService.deleteHub(req.params.id);
      res.json({
        success: true,
        message: "Hub pricing record deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting hub:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete hub pricing record",
        error: error.message,
      });
    }
  },

  // ========================
  // FRAME CONTROLLERS
  // ========================

  /**
   * Get all frame pricing records
   */
  async getAllFrames(req, res) {
    try {
      const frames = await AxialImpellerPricingService.getAllFrames();
      res.json({
        success: true,
        data: frames,
      });
    } catch (error) {
      console.error("Error fetching frames:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch frame pricing data",
        error: error.message,
      });
    }
  },

  /**
   * Get frame by ID
   */
  async getFrameById(req, res) {
    try {
      const frame = await AxialImpellerPricingService.getFrameById(
        req.params.id
      );

      if (!frame) {
        return res.status(404).json({
          success: false,
          message: "Frame not found",
        });
      }

      res.json({
        success: true,
        data: frame,
      });
    } catch (error) {
      console.error("Error fetching frame:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch frame pricing data",
        error: error.message,
      });
    }
  },

  /**
   * Create new frame pricing record
   */
  async createFrame(req, res) {
    try {
      const frame = await AxialImpellerPricingService.createFrame(req.body);
      res.status(201).json({
        success: true,
        data: frame,
        message: "Frame pricing record created successfully",
      });
    } catch (error) {
      console.error("Error creating frame:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create frame pricing record",
        error: error.message,
      });
    }
  },

  /**
   * Update frame pricing record
   */
  async updateFrame(req, res) {
    try {
      const frame = await AxialImpellerPricingService.updateFrame(
        req.params.id,
        req.body
      );
      res.json({
        success: true,
        data: frame,
        message: "Frame pricing record updated successfully",
      });
    } catch (error) {
      console.error("Error updating frame:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update frame pricing record",
        error: error.message,
      });
    }
  },

  /**
   * Delete frame pricing record
   */
  async deleteFrame(req, res) {
    try {
      await AxialImpellerPricingService.deleteFrame(req.params.id);
      res.json({
        success: true,
        message: "Frame pricing record deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting frame:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete frame pricing record",
        error: error.message,
      });
    }
  },

  // ========================
  // CALCULATION CONTROLLER
  // ========================

  /**
   * Calculate total impeller cost
   */
  async calculateImpellerCost(req, res) {
    try {
      const calculation =
        await AxialImpellerPricingService.calculateImpellerCost(req.body);
      res.json({
        success: true,
        data: calculation,
      });
    } catch (error) {
      console.error("Error calculating impeller cost:", error);
      res.status(500).json({
        success: false,
        message: "Failed to calculate impeller cost",
        error: error.message,
      });
    }
  },
};
