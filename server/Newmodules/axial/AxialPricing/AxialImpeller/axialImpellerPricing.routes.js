import express from "express";
import { AxialImpellerPricingController } from "./axialImpellerPricing.controller.js";

const router = express.Router();

// ========================
// BLADE ROUTES
// ========================

/**
 * @route   GET /api/pricing/axial-impeller/blades
 * @desc    Get all blade pricing records
 * @access  Private (Admin)
 */
router.get("/blades", AxialImpellerPricingController.getAllBlades);

/**
 * @route   GET /api/pricing/axial-impeller/blades/:id
 * @desc    Get blade pricing record by ID
 * @access  Private (Admin)
 */
router.get("/blades/:id", AxialImpellerPricingController.getBladeById);

/**
 * @route   POST /api/pricing/axial-impeller/blades
 * @desc    Create new blade pricing record
 * @access  Private (Admin)
 */
router.post("/blades", AxialImpellerPricingController.createBlade);

/**
 * @route   PUT /api/pricing/axial-impeller/blades/:id
 * @desc    Update blade pricing record
 * @access  Private (Admin)
 */
router.put("/blades/:id", AxialImpellerPricingController.updateBlade);

/**
 * @route   DELETE /api/pricing/axial-impeller/blades/:id
 * @desc    Delete blade pricing record
 * @access  Private (Admin)
 */
router.delete("/blades/:id", AxialImpellerPricingController.deleteBlade);

// ========================
// HUB ROUTES
// ========================

/**
 * @route   GET /api/pricing/axial-impeller/hubs
 * @desc    Get all hub pricing records
 * @access  Private (Admin)
 */
router.get("/hubs", AxialImpellerPricingController.getAllHubs);

/**
 * @route   GET /api/pricing/axial-impeller/hubs/:id
 * @desc    Get hub pricing record by ID
 * @access  Private (Admin)
 */
router.get("/hubs/:id", AxialImpellerPricingController.getHubById);

/**
 * @route   POST /api/pricing/axial-impeller/hubs
 * @desc    Create new hub pricing record
 * @access  Private (Admin)
 */
router.post("/hubs", AxialImpellerPricingController.createHub);

/**
 * @route   PUT /api/pricing/axial-impeller/hubs/:id
 * @desc    Update hub pricing record
 * @access  Private (Admin)
 */
router.put("/hubs/:id", AxialImpellerPricingController.updateHub);

/**
 * @route   DELETE /api/pricing/axial-impeller/hubs/:id
 * @desc    Delete hub pricing record
 * @access  Private (Admin)
 */
router.delete("/hubs/:id", AxialImpellerPricingController.deleteHub);

// ========================
// FRAME ROUTES
// ========================

/**
 * @route   GET /api/pricing/axial-impeller/frames
 * @desc    Get all frame pricing records
 * @access  Private (Admin)
 */
router.get("/frames", AxialImpellerPricingController.getAllFrames);

/**
 * @route   GET /api/pricing/axial-impeller/frames/:id
 * @desc    Get frame pricing record by ID
 * @access  Private (Admin)
 */
router.get("/frames/:id", AxialImpellerPricingController.getFrameById);

/**
 * @route   POST /api/pricing/axial-impeller/frames
 * @desc    Create new frame pricing record
 * @access  Private (Admin)
 */
router.post("/frames", AxialImpellerPricingController.createFrame);

/**
 * @route   PUT /api/pricing/axial-impeller/frames/:id
 * @desc    Update frame pricing record
 * @access  Private (Admin)
 */
router.put("/frames/:id", AxialImpellerPricingController.updateFrame);

/**
 * @route   DELETE /api/pricing/axial-impeller/frames/:id
 * @desc    Delete frame pricing record
 * @access  Private (Admin)
 */
router.delete("/frames/:id", AxialImpellerPricingController.deleteFrame);

// ========================
// CALCULATION ROUTE
// ========================

/**
 * @route   POST /api/pricing/axial-impeller/calculate
 * @desc    Calculate total impeller cost
 * @access  Private (Admin)
 */
router.post("/calculate", AxialImpellerPricingController.calculateImpellerCost);

export default router;
