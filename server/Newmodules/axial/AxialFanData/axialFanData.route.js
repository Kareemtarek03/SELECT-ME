import express from "express";
import {
  filter,
  processFanDataController,
  NumericalEq,
  getOutputFile,
  exportFanDataController,
  uploadFanDataController,
  uploadFanDataBinaryController,
  deleteFanDataController,
} from "./axialFanData.controller.js";

const router = express.Router();

// POST /api/fan-data/process
router.post("/process", processFanDataController);
router.post("/numerical", NumericalEq);
router.post("/filter", filter);
router.get("/fan-data", getOutputFile);
// export xlsx
router.get("/export", exportFanDataController);
// upload xlsx via JSON { fileBase64, filename }
router.post("/upload", uploadFanDataController);
// upload raw binary (application/octet-stream) - use express.raw middleware when mounting
router.post(
  "/upload-file",
  // parse raw body as Buffer for octet-stream; limit can be adjusted
  express.raw({ type: "application/octet-stream", limit: "50mb" }),
  uploadFanDataBinaryController
);

// DELETE /api/fan-data/:id
router.delete("/:id", deleteFanDataController);

export default router;
