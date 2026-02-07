import express from "express";
import { pricingItemsRoutes } from "./Pricing_Items/index.js";
import { accessoriesRoutes } from "./Accessories/index.js";
import { axialImpellerRoutes } from "./AxialImpeller/index.js";
import { axialCasingRoutes } from "./AxialCasing/index.js";

const router = express.Router();

// Mount sub-routers
router.use("/items", pricingItemsRoutes);
router.use("/accessories", accessoriesRoutes);
router.use("/impeller", axialImpellerRoutes);
router.use("/casing", axialCasingRoutes);

export default router;
