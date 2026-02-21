import express from "express";
import { PricingItemsController } from "./pricingItems.controller.js";
import { authenticateToken } from "../../../../middleware/auth.js";

const router = express.Router();

// Middleware to check if user is admin or super_admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }
  next();
};

// ========================
// Category Routes
// ========================

router.get(
  "/categories",
  authenticateToken,
  isAdmin,
  PricingItemsController.getCategories,
);
router.get(
  "/categories/name/:name",
  authenticateToken,
  isAdmin,
  PricingItemsController.getCategoryByName,
);
router.get(
  "/categories/:id",
  authenticateToken,
  isAdmin,
  PricingItemsController.getCategoryById,
);
router.post(
  "/categories",
  authenticateToken,
  isAdmin,
  PricingItemsController.createCategory,
);
router.patch(
  "/categories/:id",
  authenticateToken,
  isAdmin,
  PricingItemsController.updateCategory,
);
router.delete(
  "/categories/:id",
  authenticateToken,
  isAdmin,
  PricingItemsController.deleteCategory,
);

// ========================
// Item Routes
// ========================

router.get(
  "/categories/:categoryId/items",
  authenticateToken,
  isAdmin,
  PricingItemsController.getItemsByCategory,
);
router.get(
  "/items/template/download",
  authenticateToken,
  isAdmin,
  PricingItemsController.exportTemplate,
);
router.post(
  "/items/import",
  authenticateToken,
  isAdmin,
  PricingItemsController.importTemplate,
);
router.get(
  "/items/:id",
  authenticateToken,
  isAdmin,
  PricingItemsController.getItemById,
);
router.post(
  "/items",
  authenticateToken,
  isAdmin,
  PricingItemsController.createItem,
);
router.patch(
  "/items/:id",
  authenticateToken,
  isAdmin,
  (req, res, next) => {
    console.log(`\n>>> ROUTE HIT: PATCH /items/${req.params.id}`);
    next();
  },
  PricingItemsController.updateItem,
);
router.delete(
  "/items/:id",
  authenticateToken,
  isAdmin,
  PricingItemsController.deleteItem,
);

// ========================
// Logs Route
// ========================

router.get("/logs", authenticateToken, isAdmin, PricingItemsController.getLogs);

// ========================
// Test Route (TEMPORARY - for debugging)
// ========================
router.post("/test-recalc", async (req, res) => {
  console.log("\n>>> TEST RECALC ENDPOINT HIT <<<");
  try {
    const { recalculateAllAccessoriesPrices } =
      await import("../shared/pricingUtils.js");
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    // Get Bolts & Nuts price
    const boltsItem = await prisma.pricingItem.findFirst({
      where: { description: "Bolts" },
    });
    console.log("Bolts item:", boltsItem);

    if (!boltsItem) {
      return res.status(404).json({ error: "Bolts & Nuts item not found" });
    }

    // Trigger recalculation
    const results = await recalculateAllAccessoriesPrices(
      boltsItem.priceWithVat,
    );

    await prisma.$disconnect();
    res.json({ message: "Recalculation complete", count: results.length });
  } catch (error) {
    console.error("Test recalc error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
