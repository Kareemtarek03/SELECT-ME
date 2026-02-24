import express from "express";
import * as ctrl from "./centrifugalDataAdmin.controller.js";
import * as excel from "./centrifugalExcel.controller.js";

const router = express.Router();

// ---------- Excel Export/Import (all tables) ----------
router.get("/export/centrifugal-fans", excel.exportCentrifugalFanData);
router.post("/import/centrifugal-fans", excel.importCentrifugalFanData);
router.get("/export/pulleys", excel.exportPulleys);
router.post("/import/pulleys", excel.importPulleys);
router.get("/export/belt-standards", excel.exportBeltStandards);
router.post("/import/belt-standards", excel.importBeltStandards);
router.get("/export/pulley-standards", excel.exportPulleyStandards);
router.post("/import/pulley-standards", excel.importPulleyStandards);
router.get("/export/casing-all", excel.exportCasingPricingAll);
router.post("/import/casing-all", excel.importCasingPricingAll);
router.get("/export/accessory-pricing", excel.exportAccessoryPricing);
router.post("/import/accessory-pricing", excel.importAccessoryPricing);
router.get("/export/impeller-blades", excel.exportAxialImpellerBlades);
router.post("/import/impeller-blades", excel.importAxialImpellerBlades);
router.get("/export/impeller-hubs", excel.exportAxialImpellerHubs);
router.post("/import/impeller-hubs", excel.importAxialImpellerHubs);
router.get("/export/impeller-frames", excel.exportAxialImpellerFrames);
router.post("/import/impeller-frames", excel.importAxialImpellerFrames);
router.get("/export/axial-casing", excel.exportAxialCasingPricing);
router.post("/import/axial-casing", excel.importAxialCasingPricing);

// ---------- Pulley Data ----------
router.get("/pulleys", ctrl.getPulleys);
router.post("/pulleys", ctrl.createPulley);
router.put("/pulleys/:id", ctrl.updatePulley);
router.delete("/pulleys/:id", ctrl.deletePulley);

// ---------- Belt Length Standard ----------
router.get("/belt-standards", ctrl.getBeltStandards);
router.post("/belt-standards", ctrl.createBeltStandard);
router.put("/belt-standards/:id", ctrl.updateBeltStandard);
router.delete("/belt-standards/:id", ctrl.deleteBeltStandard);

// ---------- Pulley Standard ----------
router.get("/pulley-standards", ctrl.getPulleyStandards);
router.post("/pulley-standards", ctrl.createPulleyStandard);
router.put("/pulley-standards/:id", ctrl.updatePulleyStandard);
router.delete("/pulley-standards/:id", ctrl.deletePulleyStandard);

// ---------- Centrifugal Casing Pricing ----------
router.get("/casing-pricing", ctrl.getCasingPricing);
router.post("/casing-pricing", ctrl.createCasingPricing);
router.put("/casing-pricing/:id", ctrl.updateCasingPricing);
router.delete("/casing-pricing/:id", ctrl.deleteCasingPricing);

// ---------- Calculate Pricing (POST body: { type, size, ... }) ----------
router.post("/calculate-pricing", ctrl.calculatePricing);

// ---------- Casing Volutes ----------
router.get("/casing-volutes", ctrl.getCasingVolutes);
router.post("/casing-volutes", ctrl.createCasingVolute);
router.put("/casing-volutes/:id", ctrl.updateCasingVolute);
router.delete("/casing-volutes/:id", ctrl.deleteCasingVolute);

// ---------- Casing Frames ----------
router.get("/casing-frames", ctrl.getCasingFrames);
router.post("/casing-frames", ctrl.createCasingFrame);
router.put("/casing-frames/:id", ctrl.updateCasingFrame);
router.delete("/casing-frames/:id", ctrl.deleteCasingFrame);

// ---------- Casing Impellers ----------
router.get("/casing-impellers", ctrl.getCasingImpellers);
router.post("/casing-impellers", ctrl.createCasingImpeller);
router.put("/casing-impellers/:id", ctrl.updateCasingImpeller);
router.delete("/casing-impellers/:id", ctrl.deleteCasingImpeller);

// ---------- Casing Funnels ----------
router.get("/casing-funnels", ctrl.getCasingFunnels);
router.post("/casing-funnels", ctrl.createCasingFunnels);
router.put("/casing-funnels/:id", ctrl.updateCasingFunnels);
router.delete("/casing-funnels/:id", ctrl.deleteCasingFunnels);

// ---------- Casing Sleeve Shafts ----------
router.get("/casing-sleeve-shafts", ctrl.getCasingSleeveShafts);
router.post("/casing-sleeve-shafts", ctrl.createCasingSleeveShaft);
router.put("/casing-sleeve-shafts/:id", ctrl.updateCasingSleeveShaft);
router.delete("/casing-sleeve-shafts/:id", ctrl.deleteCasingSleeveShaft);

// ---------- Casing Matching Flanges ----------
router.get("/casing-matching-flanges", ctrl.getCasingMatchingFlanges);
router.post("/casing-matching-flanges", ctrl.createCasingMatchingFlange);
router.put("/casing-matching-flanges/:id", ctrl.updateCasingMatchingFlange);
router.delete("/casing-matching-flanges/:id", ctrl.deleteCasingMatchingFlange);

// ---------- Casing Bearing Assemblies ----------
router.get("/casing-bearing-assemblies", ctrl.getCasingBearingAssemblies);
router.post("/casing-bearing-assemblies", ctrl.createCasingBearingAssembly);
router.put("/casing-bearing-assemblies/:id", ctrl.updateCasingBearingAssembly);
router.delete("/casing-bearing-assemblies/:id", ctrl.deleteCasingBearingAssembly);

// ---------- Casing Fan Bases ----------
router.get("/casing-fan-bases", ctrl.getCasingFanBases);
router.post("/casing-fan-bases", ctrl.createCasingFanBase);
router.put("/casing-fan-bases/:id", ctrl.updateCasingFanBase);
router.delete("/casing-fan-bases/:id", ctrl.deleteCasingFanBase);

// ---------- Casing Belt Covers ----------
router.get("/casing-belt-covers", ctrl.getCasingBeltCovers);
router.post("/casing-belt-covers", ctrl.createCasingBeltCover);
router.put("/casing-belt-covers/:id", ctrl.updateCasingBeltCover);
router.delete("/casing-belt-covers/:id", ctrl.deleteCasingBeltCover);

// ---------- Casing Motor Bases ----------
router.get("/casing-motor-bases", ctrl.getCasingMotorBases);
router.post("/casing-motor-bases", ctrl.createCasingMotorBase);
router.put("/casing-motor-bases/:id", ctrl.updateCasingMotorBase);
router.delete("/casing-motor-bases/:id", ctrl.deleteCasingMotorBase);

// ---------- Casing Accessories ----------
router.get("/casing-accessories", ctrl.getCasingAccessories);
router.post("/casing-accessories", ctrl.createCasingAccessories);
router.put("/casing-accessories/:id", ctrl.updateCasingAccessories);
router.delete("/casing-accessories/:id", ctrl.deleteCasingAccessories);

// ---------- Casing Price Calculation ----------
router.post("/casing-price", ctrl.casingPriceCalculation);

export default router;
