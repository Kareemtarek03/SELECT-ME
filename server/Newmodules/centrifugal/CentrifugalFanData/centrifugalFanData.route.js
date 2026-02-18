import express from "express";
import {
  processFanDataController,
  getOutputFile,
  deleteFanDataController,
  createCentrifugalFanController,
  updateCentrifugalFanController,
  renderFanDataForm,
  processPhase11Controller,
  processPhase12Controller,
  processPhase13Controller,
  processPhase14Controller,
  processPhase15Controller,
  processPhase16Controller,
  processPhase17Controller,
  processPhase18Controller,
  processPhase18AllController,
  processPhase19Controller,
  processPhase20Controller,
} from "./centrifugalFanData.controller.js";

const router = express.Router();

// GET /api/fan-data/form - Render the EJS form page
router.get("/form", renderFanDataForm);

// POST /api/fan-data/process - Main endpoint for Phase 1-6 calculations
router.post("/process", processFanDataController);

// GET /api/fan-data - List centrifugal fan data (admin)
router.get("/fan-data", getOutputFile);

// POST /fan-data - Create centrifugal fan (admin CRUD)
router.post("/fan-data", createCentrifugalFanController);

// PUT /:id - Update centrifugal fan (admin CRUD)
router.put("/:id", updateCentrifugalFanController);

// DELETE /:id - Delete fan data by ID
router.delete("/:id", deleteFanDataController);

// POST /api/fan-data/phase11 - Phase 11 belt selection calculations
router.post("/phase11", processPhase11Controller);

// POST /api/fan-data/phase12 - Phase 12 pulley validation and power recalculation
router.post("/phase12", processPhase12Controller);

// POST /api/fan-data/phase13 - Phase 13 motor selection
router.post("/phase13", processPhase13Controller);

// POST /api/fan-data/phase14 - Phase 14 motor pulley D1 validation
router.post("/phase14", processPhase14Controller);

// POST /api/fan-data/phase15 - Phase 15 belt geometry & standardization
router.post("/phase15", processPhase15Controller);

// POST /api/fan-data/phase16 - Phase 16 consolidated filter table
router.post("/phase16", processPhase16Controller);

// POST /api/fan-data/phase17 - Phase 17 sound data calculation
router.post("/phase17", processPhase17Controller);

// POST /api/fan-data/phase18 - Phase 18 final output table
router.post("/phase18", processPhase18Controller);

// POST /api/fan-data/phase18-all - Phase 18 All models consolidated output
router.post("/phase18-all", processPhase18AllController);

// POST /api/fan-data/phase19 - Phase 19 fan curve data generation
router.post("/phase19", processPhase19Controller);

// POST /api/fan-data/phase20 - Phase 20 noise data calculation (LW(A) and LP(A))
router.post("/phase20", processPhase20Controller);

export default router;
