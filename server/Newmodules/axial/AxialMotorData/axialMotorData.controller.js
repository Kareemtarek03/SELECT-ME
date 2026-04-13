import {
  getMotorData,
  exportMotorData,
  updateMotorDataFromExcel,
  deleteMotorById,
  createMotor,
  updateMotorById,
} from "./axialMotorData.service.js";

export async function getMotorDataController(req, res) {
  try {
    const data = await getMotorData();
    res.json({ message: "✅ Motor data", data });
  } catch (err) {
    console.error("[MotorData Controller] getMotorData error:", err);
    res.status(500).json({ error: "Failed to read motor data", details: err.message || String(err) });
  }
}

export async function exportMotorDataController(req, res) {
  try {
    return await exportMotorData(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export motor data" });
  }
}

export async function uploadMotorDataController(req, res) {
  try {
    // Expect JSON body with fileBase64 string
    const { fileBase64, filename } = req.body;
    const json = await updateMotorDataFromExcel(fileBase64, filename);
    res.json({ message: "✅ Motor data updated", importedRows: json.length });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to update motor data", details: err.message });
  }
}

export async function deleteMotorDataController(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const numId = Number(id);
    if (!Number.isFinite(numId)) return res.status(400).json({ error: "Invalid id" });

    const result = await deleteMotorById(numId);
    res.json({ message: "✅ Motor deleted", id: result.id });
  } catch (err) {
    console.error(err);
    if (err && err.code === "NOT_FOUND") return res.status(404).json({ error: "Motor not found" });
    res.status(500).json({ error: "Failed to delete motor", details: err.message });
  }
}

// Create a new motor record
export async function createMotorController(req, res) {
  try {
    const motorData = req.body;
    if (!motorData || Object.keys(motorData).length === 0) {
      return res.status(400).json({ error: "Missing motor data" });
    }
    const created = await createMotor(motorData);
    res.status(201).json({ message: "✅ Motor created", data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create motor", details: err.message });
  }
}

// Update an existing motor record by ID
export async function updateMotorController(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const numId = Number(id);
    if (!Number.isFinite(numId)) return res.status(400).json({ error: "Invalid id" });

    const motorData = req.body;
    if (!motorData || Object.keys(motorData).length === 0) {
      return res.status(400).json({ error: "Missing motor data" });
    }

    const updated = await updateMotorById(numId, motorData);
    res.json({ message: "✅ Motor updated", data: updated });
  } catch (err) {
    console.error(err);
    if (err && err.code === "NOT_FOUND") return res.status(404).json({ error: "Motor not found" });
    res.status(500).json({ error: "Failed to update motor", details: err.message });
  }
}
