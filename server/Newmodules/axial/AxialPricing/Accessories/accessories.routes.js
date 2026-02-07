import express from "express";
import { AccessoriesController } from "./accessories.controller.js";
import { authenticateToken } from "../../../../middleware/auth.js";

const router = express.Router();

// Middleware to check if user is admin or super_admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
        return res.status(403).json({ error: "Access denied. Admin only." });
    }
    next();
};

// Public route (requires authentication only, not admin)
// GET /api/accessories-pricing/lookup/:fanModel/:size - Get accessory by fan model and size
// Used by Results Page for pricing display
router.get("/lookup/:fanModel/:size", authenticateToken, AccessoriesController.getByFanModelAndSize);

// All routes below require authentication and admin role
router.use(authenticateToken);
router.use(isAdmin);

// GET /api/accessories-pricing - Get all accessories
router.get("/", AccessoriesController.getAll);

// GET /api/accessories-pricing/bolts-price - Get Bolts & Nuts price
router.get("/bolts-price", AccessoriesController.getBoltsPrice);

// GET /api/accessories-pricing/fan-model/:fanModel - Get accessories by fan model
router.get("/fan-model/:fanModel", AccessoriesController.getByFanModel);

// GET /api/accessories-pricing/:id - Get accessory by ID
router.get("/:id", AccessoriesController.getById);

// POST /api/accessories-pricing - Create new accessory
router.post("/", AccessoriesController.create);

// PATCH /api/accessories-pricing/:id - Update accessory
router.patch("/:id", AccessoriesController.update);

// DELETE /api/accessories-pricing/:id - Delete accessory
router.delete("/:id", AccessoriesController.delete);

export default router;
