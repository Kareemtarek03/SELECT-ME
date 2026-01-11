import express from "express";
import {
  getMotorDataController,
  exportMotorDataController,
  uploadMotorDataController,
  deleteMotorDataController,
  createMotorController,
  updateMotorController,
} from "./axialMotorData.controller.js";

const router = express.Router();

// GET /api/motor-data/
router.get("/", getMotorDataController);

// GET /api/motor-data/export
router.get("/export", exportMotorDataController);

// POST /api/motor-data/upload
// body: { fileBase64: string, filename?: string }
router.post("/upload", uploadMotorDataController);

// POST /api/motor-data/
// Create a new motor record
router.post("/", createMotorController);

// PUT /api/motor-data/:id
// Update an existing motor record by ID
router.put("/:id", updateMotorController);

// DELETE /api/motor-data/:id
// delete a motor by numeric id
router.delete("/:id", deleteMotorDataController);

export default router;
