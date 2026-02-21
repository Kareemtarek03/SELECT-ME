import { AccessoriesService } from "./accessories.service.js";

/**
 * Accessories Controller
 * Handles HTTP request/response logic for accessories pricing
 */
export const AccessoriesController = {
    /**
     * Get all accessories
     */
    async getAll(req, res) {
        try {
            const accessories = await AccessoriesService.getAll();
            res.json(accessories);
        } catch (error) {
            console.error("Get accessories error:", error);
            res.status(500).json({ error: "Failed to fetch accessories" });
        }
    },

    /**
     * Get Bolts & Nuts price
     */
    async getBoltsPrice(req, res) {
        try {
            const price = await AccessoriesService.getBoltsAndNutsPrice();
            console.log("Bolts & Nuts price:", price);
            res.json({ price, description: "Bolts & Nuts" });
        } catch (error) {
            console.error("Get bolts price error:", error);
            res.status(500).json({ error: "Failed to fetch Bolts & Nuts price" });
        }
    },

    /**
     * Get accessories by fan model
     */
    async getByFanModel(req, res) {
        try {
            const accessories = await AccessoriesService.getByFanModel(req.params.fanModel);
            res.json(accessories);
        } catch (error) {
            console.error("Get accessories by fan model error:", error);
            res.status(500).json({ error: "Failed to fetch accessories" });
        }
    },

    /**
     * Get accessory by fan model and size
     * Used for fetching pricing in Results Page
     */
    async getByFanModelAndSize(req, res) {
        try {
            const { fanModel, size } = req.params;
            const accessory = await AccessoriesService.getByFanModelAndSize(fanModel, size);
            if (!accessory) {
                return res.status(404).json({ error: "Accessory not found for this fan model and size" });
            }
            res.json(accessory);
        } catch (error) {
            console.error("Get accessory by fan model and size error:", error);
            res.status(500).json({ error: "Failed to fetch accessory" });
        }
    },

    /**
     * Get accessory by ID
     */
    async getById(req, res) {
        try {
            const accessory = await AccessoriesService.getById(req.params.id);
            if (!accessory) {
                return res.status(404).json({ error: "Accessory not found" });
            }
            res.json(accessory);
        } catch (error) {
            console.error("Get accessory error:", error);
            res.status(500).json({ error: "Failed to fetch accessory" });
        }
    },

    /**
     * Create a new accessory
     */
    async create(req, res) {
        try {
            const { sr, fanModel, fanSizeMm } = req.body;

            if (!sr || !fanModel || !fanSizeMm) {
                return res.status(400).json({ error: "Sr, Fan Model, and Fan Size are required" });
            }

            const accessory = await AccessoriesService.create(req.body);
            res.status(201).json(accessory);
        } catch (error) {
            console.error("Create accessory error:", error);
            res.status(500).json({ error: "Failed to create accessory" });
        }
    },

    /**
     * Update an accessory
     */
    async update(req, res) {
        try {
            const accessory = await AccessoriesService.update(req.params.id, req.body);
            res.json(accessory);
        } catch (error) {
            console.error("Update accessory error:", error);
            if (error.message === "Accessory not found") {
                return res.status(404).json({ error: "Accessory not found" });
            }
            res.status(500).json({ error: "Failed to update accessory" });
        }
    },

    /**
     * Delete an accessory
     */
    async delete(req, res) {
        try {
            const accessory = await AccessoriesService.getById(req.params.id);
            if (!accessory) {
                return res.status(404).json({ error: "Accessory not found" });
            }

            await AccessoriesService.delete(req.params.id);
            res.json({ message: "Accessory deleted successfully" });
        } catch (error) {
            console.error("Delete accessory error:", error);
            res.status(500).json({ error: "Failed to delete accessory" });
        }
    },
};

export default AccessoriesController;
