import express from "express";
import * as axialCasingController from "./axialCasingPricing.controller.js";

const router = express.Router();

// CRUD routes for casing pricing
router.get("/casings", axialCasingController.getAllCasings);
router.get("/casings/:id", axialCasingController.getCasingById);
router.post("/casings", axialCasingController.createCasing);
router.put("/casings/:id", axialCasingController.updateCasing);
router.delete("/casings/:id", axialCasingController.deleteCasing);

// Calculation endpoint
router.post("/calculate-casing", axialCasingController.calculateCasingCost);

// Lookup endpoint by fan data
router.get(
  "/lookup-casing/:fanType/:impellerConf/:innerDiameter",
  axialCasingController.lookupCasingByFanData
);

// Lookup endpoint without impellerConf (optional)
router.get(
  "/lookup-casing/:fanType/:innerDiameter",
  (req, res, next) => {
    req.params.impellerConf = null;
    next();
  },
  axialCasingController.lookupCasingByFanData
);

export default router;
