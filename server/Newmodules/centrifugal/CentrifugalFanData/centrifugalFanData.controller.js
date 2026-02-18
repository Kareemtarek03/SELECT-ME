import {
  processFanDataService,
  processPhase11,
  processPhase12,
  processPhase13,
  processPhase14,
  processPhase15,
  processPhase16,
  processPhase18,
  processPhase19,
  processPhase20,
} from "./centrifugalFanData.service.js";

// Initialize prisma as undefined to prevent ReferenceError
let prisma;
try {
  // Uncomment the lines below if you have Prisma installed and configured
  // const { PrismaClient } = await import("@prisma/client");
  // prisma = new PrismaClient();
} catch (e) {
  // Prisma not available - that's okay, we'll use file-based fallbacks
  prisma = undefined;
}

export async function renderFanDataForm(req, res) {
  try {
    res.render("index");
  } catch (error) {
    console.error("❌ Failed to render form:", error);
    res.status(500).send("Failed to render form");
  }
}

export async function processFanDataController(req, res) {
  try {
    const { units, input } = req.body;

    console.log(`\n=== Controller Debug ===`);
    console.log(`Full req.body:`, JSON.stringify(req.body, null, 2));
    console.log(`units received:`, JSON.stringify(units, null, 2));
    console.log(`units.fanType: ${units?.fanType}`);
    console.log(`units.centrifugalFanType: ${units?.centrifugalFanType}`);
    console.log(
      `Resolved selectedFanType: ${units?.centrifugalFanType || units?.fanType}`
    );

    // Validate required inputs
    if (!input) {
      return res.status(400).json({
        error: "Missing input data",
        details: "Request body must include 'input' object",
      });
    }

    if (input.TempC === undefined || input.TempC === null) {
      return res.status(400).json({
        error: "Missing required field",
        details: "input.TempC is required",
      });
    }

    // RPM is not required from user input - it is determined by Phase 5 matching

    // Use database for centrifugal fan data (fallback to JSON if DB unavailable)
    const result = await processFanDataService({
      filePath: "db",
      units: units || {},
      input,
      dataSource: "db",
      selectedFanType: units?.centrifugalFanType || units?.fanType, // Pass selected fan type for Phase 4
    });

    // Return phase-separated results with Phase 4 through Phase 10 data
    res.json({
      message: "✅ Fan data processed successfully!",
      phase3: result.results, // Phase 3 results (all fans)
      phase4: result.phase4, // Phase 4 results (selected fan only)
      phase5: result.phase5, // Phase 5 results (matching RPM for user operating point)
      phase6: result.phase6, // Phase 6 results (final performance at matching RPM)
      phase7: result.phase7, // Phase 7 results (polynomial prediction at user airflow)
      phase8: result.phase8, // Phase 8 results (Phase 6 + predicted point appended)
      phase9: result.phase9, // Phase 9 results (filtered by user airflow)
      phase10: result.phase10, // Phase 10 results (final table sorted by efficiency)
    });
  } catch (error) {
    console.error("❌ Fan data processing failed:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Request body:", req.body);

    // Send detailed error information
    const errorResponse = {
      error: "Failed to process fan data",
      details: error.message || "Unknown error",
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === "development") {
      errorResponse.stack = error.stack;
    }

    res.status(500).json(errorResponse);
  }
}
// List centrifugal fan data (for admin and processFanDataService)
export async function getOutputFile(req, res) {
  try {
    const { getPrismaClient } = await import("./centrifugalFanData.service.js");
    const prismaClient = await getPrismaClient();
    if (!prismaClient) {
      return res.status(503).json({ error: "Database not available" });
    }
    const rows = await prismaClient.centrifugalFanData.findMany({
      orderBy: { id: "asc" },
    });
    const data = rows.map((r) => ({
      id: r.id,
      bladesType: r.bladesType,
      bladesModel: r.bladesModel,
      minSpeedRPM: r.minSpeedRPM,
      highSpeedRPM: r.highSpeedRPM,
      impellerType: r.impellerType,
      fanShaftDiameter: r.fanShaftDiameter,
      innerDiameter: r.innerDiameter,
      desigDensity: r.desigDensity,
      RPM: r.RPM,
      airFlow: r.airFlow,
      totPressure: r.totPressure,
      velPressure: r.velPressure,
      staticPressure: r.staticPressure,
      fanInputPow: r.fanInputPow,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
    res.json({ message: "✅ Centrifugal fan data (from DB)", data });
  } catch (err) {
    console.error("Failed to read centrifugal fan data", err);
    res
      .status(500)
      .json({ error: "Failed to read fan data", details: err.message });
  }
}

// Create centrifugal fan (admin CRUD)
export async function createCentrifugalFanController(req, res) {
  try {
    const body = req.body || {};
    const { getPrismaClient } = await import("./centrifugalFanData.service.js");
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const airFlow = typeof body.airFlow === "string" ? body.airFlow : JSON.stringify(body.airFlow || []);
    const totPressure = typeof body.totPressure === "string" ? body.totPressure : JSON.stringify(body.totPressure || []);
    const velPressure = typeof body.velPressure === "string" ? body.velPressure : JSON.stringify(body.velPressure || []);
    const staticPressure = typeof body.staticPressure === "string" ? body.staticPressure : JSON.stringify(body.staticPressure || []);
    const fanInputPow = typeof body.fanInputPow === "string" ? body.fanInputPow : JSON.stringify(body.fanInputPow || []);
    const created = await prisma.centrifugalFanData.create({
      data: {
        bladesType: body.bladesType ?? null,
        bladesModel: body.bladesModel ?? null,
        minSpeedRPM: body.minSpeedRPM != null ? Number(body.minSpeedRPM) : null,
        highSpeedRPM: body.highSpeedRPM != null ? Number(body.highSpeedRPM) : null,
        impellerType: body.impellerType ?? null,
        fanShaftDiameter: body.fanShaftDiameter != null ? Number(body.fanShaftDiameter) : null,
        innerDiameter: body.innerDiameter != null ? Number(body.innerDiameter) : null,
        desigDensity: body.desigDensity != null ? Number(body.desigDensity) : null,
        RPM: body.RPM != null ? Number(body.RPM) : null,
        airFlow,
        totPressure,
        velPressure,
        staticPressure,
        fanInputPow,
      },
    });
    return res.status(201).json(created);
  } catch (e) {
    console.error("createCentrifugalFanController", e);
    return res.status(500).json({ error: e.message || "Create failed" });
  }
}

// Update centrifugal fan (admin CRUD)
export async function updateCentrifugalFanController(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const body = req.body || {};
    const { getPrismaClient } = await import("./centrifugalFanData.service.js");
    const prisma = await getPrismaClient();
    if (!prisma) return res.status(503).json({ error: "Database not available" });
    const data = {};
    if (body.bladesType !== undefined) data.bladesType = body.bladesType;
    if (body.bladesModel !== undefined) data.bladesModel = body.bladesModel;
    if (body.minSpeedRPM !== undefined) data.minSpeedRPM = body.minSpeedRPM == null ? null : Number(body.minSpeedRPM);
    if (body.highSpeedRPM !== undefined) data.highSpeedRPM = body.highSpeedRPM == null ? null : Number(body.highSpeedRPM);
    if (body.impellerType !== undefined) data.impellerType = body.impellerType;
    if (body.fanShaftDiameter !== undefined) data.fanShaftDiameter = body.fanShaftDiameter == null ? null : Number(body.fanShaftDiameter);
    if (body.innerDiameter !== undefined) data.innerDiameter = body.innerDiameter == null ? null : Number(body.innerDiameter);
    if (body.desigDensity !== undefined) data.desigDensity = body.desigDensity == null ? null : Number(body.desigDensity);
    if (body.RPM !== undefined) data.RPM = body.RPM == null ? null : Number(body.RPM);
    if (body.airFlow !== undefined) data.airFlow = typeof body.airFlow === "string" ? body.airFlow : JSON.stringify(body.airFlow);
    if (body.totPressure !== undefined) data.totPressure = typeof body.totPressure === "string" ? body.totPressure : JSON.stringify(body.totPressure);
    if (body.velPressure !== undefined) data.velPressure = typeof body.velPressure === "string" ? body.velPressure : JSON.stringify(body.velPressure);
    if (body.staticPressure !== undefined) data.staticPressure = typeof body.staticPressure === "string" ? body.staticPressure : JSON.stringify(body.staticPressure);
    if (body.fanInputPow !== undefined) data.fanInputPow = typeof body.fanInputPow === "string" ? body.fanInputPow : JSON.stringify(body.fanInputPow);
    const updated = await prisma.centrifugalFanData.update({ where: { id }, data });
    return res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("updateCentrifugalFanController", e);
    return res.status(500).json({ error: e.message || "Update failed" });
  }
}

// Legacy export/import functions removed - exportFanData and importFanDataFromExcel no longer exported from service

export async function processPhase11Controller(req, res) {
  try {
    const { selectedFan, beltType, motorPoles, fanRPM } = req.body;

    // Validate required inputs
    if (!selectedFan) {
      return res.status(400).json({
        error: "Missing required field",
        details: "selectedFan is required",
      });
    }

    if (!beltType) {
      return res.status(400).json({
        error: "Missing required field",
        details: "beltType is required (SPA, SPB, SPC, or SPZ)",
      });
    }

    if (!motorPoles) {
      return res.status(400).json({
        error: "Missing required field",
        details: "motorPoles is required (2, 4, 6, or 8)",
      });
    }

    if (!fanRPM) {
      return res.status(400).json({
        error: "Missing required field",
        details: "fanRPM is required (matching RPM from Phase 5)",
      });
    }

    // Validate belt type
    const validBeltTypes = ["SPA", "SPB", "SPC", "SPZ"];
    if (!validBeltTypes.includes(beltType)) {
      return res.status(400).json({
        error: "Invalid belt type",
        details: `beltType must be one of: ${validBeltTypes.join(", ")}`,
      });
    }

    // Validate motor poles
    const validMotorPoles = [2, 4, 6, 8];
    const motorPolesNum = parseInt(motorPoles);
    if (!validMotorPoles.includes(motorPolesNum)) {
      return res.status(400).json({
        error: "Invalid motor poles",
        details: `motorPoles must be one of: ${validMotorPoles.join(", ")}`,
      });
    }

    // Process Phase 11
    const result = await processPhase11({
      selectedFan,
      beltType,
      motorPoles: motorPolesNum,
      fanRPM: parseFloat(fanRPM),
    });

    if (!result) {
      return res.status(400).json({
        error: "Phase 11 calculation failed",
        details:
          "Could not calculate belt selection arrays. Check inputs and pulley database.",
      });
    }
    if (result.error) {
      return res.status(400).json({
        error: result.error,
        details: result.details || "Check inputs and pulley database.",
      });
    }

    res.json({
      message: "✅ Phase 11 calculated successfully!",
      phase11: result,
    });
  } catch (error) {
    console.error("❌ Phase 11 processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 11",
      details: error.message || "Unknown error",
    });
  }
}

export async function processPhase12Controller(req, res) {
  try {
    const { phase11Result, selectedFan, frictionLossesPercent, spfPercent } =
      req.body;

    // Validate required inputs
    if (!phase11Result) {
      return res.status(400).json({
        error: "Missing required field",
        details: "phase11Result is required (output from Phase 11)",
      });
    }

    if (!selectedFan) {
      return res.status(400).json({
        error: "Missing required field",
        details: "selectedFan is required (selected fan from Phase 10)",
      });
    }

    // Validate selectedFan has required fields
    if (!selectedFan.model || !selectedFan.rpm || !selectedFan.fanInputPower) {
      return res.status(400).json({
        error: "Invalid selectedFan",
        details: "selectedFan must include model, rpm, and fanInputPower",
      });
    }

    // Process Phase 12
    const result = await processPhase12({
      phase11Result,
      selectedFan,
      frictionLossesPercent: parseFloat(frictionLossesPercent) || 0,
      spfPercent: parseFloat(spfPercent) || 0,
    });

    if (!result) {
      return res.status(400).json({
        error: "Phase 12 calculation failed",
        details:
          "Could not validate pulley diameter or calculate power. Check inputs and fan data.",
      });
    }

    res.json({
      message: "✅ Phase 12 calculated successfully!",
      phase12: result,
    });
  } catch (error) {
    console.error("❌ Phase 12 processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 12",
      details: error.message || "Unknown error",
    });
  }
}

export async function processPhase13Controller(req, res) {
  try {
    const { netFanPowerKW, userPoles, userPhases, userInsulationClass } =
      req.body;

    // Validate required inputs
    if (!netFanPowerKW || netFanPowerKW <= 0) {
      return res.status(400).json({
        error: "Missing required field",
        details: "netFanPowerKW is required and must be a positive number",
      });
    }

    if (!userPoles) {
      return res.status(400).json({
        error: "Missing required field",
        details: "userPoles is required (2, 4, 6, or 8)",
      });
    }

    if (!userPhases) {
      return res.status(400).json({
        error: "Missing required field",
        details: "userPhases is required (1 or 3)",
      });
    }

    if (!userInsulationClass) {
      return res.status(400).json({
        error: "Missing required field",
        details:
          "userInsulationClass is required (F, F(Atex), H (F300), or H(F400))",
      });
    }

    // Process Phase 13
    const result = await processPhase13({
      netFanPowerKW: parseFloat(netFanPowerKW),
      userPoles: parseInt(userPoles),
      userPhases: parseInt(userPhases),
      userInsulationClass,
    });

    // Check if result contains an error
    if (result.error) {
      return res.status(400).json({
        error: result.error,
        details: result.details,
      });
    }

    res.json({
      message: "✅ Phase 13 calculated successfully!",
      phase13: result,
    });
  } catch (error) {
    console.error("❌ Phase 13 processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 13",
      details: error.message || "Unknown error",
    });
  }
}

export async function processPhase14Controller(req, res) {
  try {
    const { phase11Arrays, phase13Motors, beltType } = req.body;

    // Validate required inputs
    if (!phase11Arrays) {
      return res.status(400).json({
        error: "Missing required field",
        details: "phase11Arrays is required",
      });
    }

    if (!phase13Motors) {
      return res.status(400).json({
        error: "Missing required field",
        details: "phase13Motors is required",
      });
    }

    if (!beltType) {
      return res.status(400).json({
        error: "Missing required field",
        details: "beltType is required (SPZ, SPA, SPB, or SPC)",
      });
    }

    // Process Phase 14
    const result = await processPhase14({
      phase11Arrays,
      phase13Motors,
      beltType,
    });

    // Check if result contains an error
    if (result.error) {
      return res.status(400).json({
        error: result.error,
        details: result.details,
      });
    }

    res.json({
      message: "✅ Phase 14 calculated successfully!",
      phase14: result,
    });
  } catch (error) {
    console.error("❌ Phase 14 processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 14",
      details: error.message || "Unknown error",
    });
  }
}

export async function processPhase15Controller(req, res) {
  try {
    const { phase12Arrays, phase14Arrays, innerDiameter, beltSection } =
      req.body;

    // Validate required inputs
    if (!phase12Arrays) {
      return res.status(400).json({
        error: "Missing required field",
        details: "phase12Arrays is required",
      });
    }

    if (!phase14Arrays) {
      return res.status(400).json({
        error: "Missing required field",
        details: "phase14Arrays is required",
      });
    }

    if (!innerDiameter) {
      return res.status(400).json({
        error: "Missing required field",
        details: "innerDiameter is required",
      });
    }

    if (!beltSection) {
      return res.status(400).json({
        error: "Missing required field",
        details: "beltSection is required (SPZ, SPA, SPB, or SPC)",
      });
    }

    // Process Phase 15
    const result = await processPhase15({
      phase12Arrays,
      phase14Arrays,
      innerDiameter,
      beltSection,
    });

    // Check if result contains an error
    if (result.error) {
      return res.status(400).json({
        error: result.error,
        details: result.details,
      });
    }

    res.json({
      message: "✅ Phase 15 calculated successfully!",
      phase15: result,
    });
  } catch (error) {
    console.error("❌ Phase 15 processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 15",
      details: error.message || "Unknown error",
    });
  }
}

export async function processPhase16Controller(req, res) {
  try {
    const {
      phase11Data,
      phase12Arrays,
      phase14Arrays,
      phase15Arrays,
      userRPM,
      maxRpmChange,
    } = req.body;

    // Validate required inputs
    if (!phase11Data) {
      return res.status(400).json({
        error: "Missing required field",
        details: "phase11Data is required",
      });
    }

    // Process Phase 16
    const result = processPhase16({
      phase11Data,
      phase12Arrays,
      phase14Arrays,
      phase15Arrays,
      userRPM,
      maxRpmChange,
    });

    // Check if result contains an error
    if (result.error) {
      return res.status(400).json({
        error: result.error,
        details: result.details,
      });
    }

    res.json({
      message: "✅ Phase 16 calculated successfully!",
      phase16: result,
    });
  } catch (error) {
    console.error("❌ Phase 16 processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 16",
      details: error.message || "Unknown error",
    });
  }
}

export async function deleteFanDataController(req, res) {
  try {
    const idRaw = req.params.id;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const { getPrismaClient } = await import("./centrifugalFanData.service.js");
    const prismaClient = await getPrismaClient();
    if (!prismaClient) {
      return res.status(503).json({ error: "Database not available" });
    }
    await prismaClient.centrifugalFanData.delete({ where: { id } });
    return res.json({ message: `Deleted centrifugal fan data with id=${id}` });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Not found", details: "No centrifugal fan data with that id" });
    }
    console.error("Error in deleteFanDataController:", err);
    res
      .status(500)
      .json({ error: "Failed to delete fan data", details: err?.message });
  }
}

// ============================================================================
// Phase 18 Controller - Final Output Table
// ============================================================================
export async function processPhase18Controller(req, res) {
  try {
    const {
      selectedFan,
      phase16Row,
      phase17Motor,
      userPoles,
      userPhases,
      innerDiameter,
    } = req.body;

    // Validate required inputs
    if (!selectedFan) {
      return res.status(400).json({
        error: "Missing required field",
        details: "selectedFan is required (original fan data from Phase 10)",
      });
    }

    if (!phase16Row) {
      return res.status(400).json({
        error: "Missing required field",
        details: "phase16Row is required (selected row from Phase 16 table)",
      });
    }

    if (!phase17Motor) {
      return res.status(400).json({
        error: "Missing required field",
        details: "phase17Motor is required (motor data from Phase 17)",
      });
    }

    // Process Phase 18
    const result = processPhase18({
      selectedFan,
      phase16Row,
      phase17Motor,
      userPoles: userPoles ? parseInt(userPoles) : null,
      userPhases: userPhases ? parseInt(userPhases) : null,
      innerDiameter: innerDiameter ? parseFloat(innerDiameter) : null,
    });

    // Check if result contains an error
    if (result.error) {
      return res.status(400).json({
        error: result.error,
        details: result.details,
      });
    }

    res.json({
      message: "✅ Phase 18 calculated successfully!",
      phase18: result,
    });
  } catch (error) {
    console.error("❌ Phase 18 processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 18",
      details: error.message || "Unknown error",
    });
  }
}

// ============================================================================
// Phase 19 Controller - Fan Curve Data Generation (7 Arrays)
// ============================================================================
// Uses Phase 9 sorted arrays and applies fan affinity laws with N2/OriginalRPM ratio
// Returns: airFlow, totalPressure, velocityPressure, staticPressure, fanInputPower, totalEfficiency, staticEfficiency
export async function processPhase19Controller(req, res) {
  try {
    const { selectedFan, phase18Result, phase9Data } = req.body;

    // Validate required inputs
    if (!selectedFan) {
      return res.status(400).json({
        error: "Missing required field",
        details: "selectedFan is required (contains curveArrays from Phase 9)",
      });
    }

    if (!phase18Result) {
      return res.status(400).json({
        error: "Missing required field",
        details:
          "phase18Result is required (contains fanSpeedN2 for curve scaling)",
      });
    }

    // Process Phase 19
    const result = processPhase19({
      selectedFan,
      phase18Result,
      phase9Data: phase9Data || null,
    });

    // Check if result contains an error
    if (result.error) {
      return res.status(400).json({
        error: result.error,
        details: result.details,
      });
    }

    res.json({
      message: "✅ Phase 19 calculated successfully!",
      phase19: result,
    });
  } catch (error) {
    console.error("❌ Phase 19 processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 19",
      details: error.message || "Unknown error",
    });
  }
}

// ============================================================================
// Phase 20 Controller - Noise Data Calculation (LW(A) and LP(A))
// ============================================================================
// Calculates octave band noise levels for 8 frequency bands (62Hz to 8000Hz)
// Returns: LW (Sound Power Level), LP (Sound Pressure Level), arrays for plotting
export async function processPhase20Controller(req, res) {
  try {
    const { phase18Result, distance, directivityQ, safetyFactor } = req.body;

    // Validate required inputs
    if (!phase18Result) {
      return res.status(400).json({
        error: "Missing required field",
        details:
          "phase18Result is required (contains airFlow and fanInputPower)",
      });
    }

    // Process Phase 20
    const result = processPhase20({
      phase18Result,
      distance: distance ? parseFloat(distance) : 3,
      directivityQ: directivityQ ? parseFloat(directivityQ) : 1,
      safetyFactor: safetyFactor ? parseFloat(safetyFactor) : 0.1,
    });

    // Check if result contains an error
    if (result.error) {
      return res.status(400).json({
        error: result.error,
        details: result.details,
      });
    }

    res.json({
      message: "✅ Phase 20 noise data calculated successfully!",
      phase20: result,
    });
  } catch (error) {
    console.error("❌ Phase 20 processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 20",
      details: error.message || "Unknown error",
    });
  }
}

// ============================================================================
// Phase 17 Controller - Sound Data (wrapper for Phase 20 noise calculation)
// ============================================================================
// This is called by the client as "phase17" but uses the Phase 20 logic
export async function processPhase17Controller(req, res) {
  try {
    const { selectedFan, distance, directivityQ } = req.body;

    if (!selectedFan) {
      return res.status(400).json({
        error: "Missing required field",
        details: "selectedFan is required",
      });
    }

    // Create a phase18-like result structure from selectedFan for Phase 20
    const phase18Result = {
      fanModel: selectedFan.fanModel || selectedFan.model,
      rpm: selectedFan.rpm,
      fanInputPower: selectedFan.fanInputPower,
      airFlow: selectedFan.airFlow,
      staticPressure: selectedFan.staticPressure,
    };

    // Use Phase 20 logic for noise calculation
    const result = processPhase20({
      phase18Result,
      distance: distance ? parseFloat(distance) : 3,
      directivityQ: directivityQ ? parseFloat(directivityQ) : 1,
      safetyFactor: 0,
    });

    if (result.error) {
      return res.status(400).json({
        error: "Phase 17 calculation failed",
        details: result.error,
      });
    }

    res.json({
      message: "✅ Phase 17 sound data calculated successfully!",
      phase17: result,
    });
  } catch (error) {
    console.error("❌ Phase 17 processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 17",
      details: error.message || "Unknown error",
    });
  }
}

// ============================================================================
// Phase 18-All Controller - Consolidated output for all motor/belt combinations
// ============================================================================
export async function processPhase18AllController(req, res) {
  try {
    const { phase16Data, phase13Motors, phase17Data, selectedFan } = req.body;

    if (!phase16Data) {
      return res.status(400).json({
        error: "Missing required field",
        details: "phase16Data is required",
      });
    }

    if (!selectedFan) {
      return res.status(400).json({
        error: "Missing required field",
        details: "selectedFan is required",
      });
    }

    // Build consolidated results array
    const results = [];
    const rows = phase16Data.rows || phase16Data;

    if (Array.isArray(rows)) {
      rows.forEach((row, idx) => {
        const motor = phase13Motors?.[idx] || null;

        results.push({
          index: idx,
          // Fan data
          fanModel: selectedFan.fanModel || selectedFan.model,
          innerDiameter: selectedFan.innerDiameter,
          rpm: row.N2 || selectedFan.rpm,

          // Performance data from Phase 16
          airFlow: row.airFlow || selectedFan.airFlow,
          staticPressure: row.staticPressure || selectedFan.staticPressure,
          fanInputPower: row.fanInputPower_new || row.fanInputPower,
          totalEfficiency: row.totalEfficiency,
          staticEfficiency: row.staticEfficiency,

          // Belt/pulley data
          D1: row.D1,
          D2: row.D2,
          beltLength: row.beltLength || row.Lp,
          numberOfBelts: row.numberOfBelts,
          centerDistance: row.centerDistance,

          // Motor data
          motor: motor
            ? {
              powerKW: motor.powerKW || motor["Power (kW)"],
              powerHP: motor.powerHP || motor["Power (HP)"],
              noOfPoles: motor.noOfPoles || motor["No of Poles"],
              frame: motor.frame || motor["Frame"],
              shaftDiameter: motor.shaftDiameter || motor["Shaft Diameter"],
            }
            : null,

          // Sound data
          soundData: phase17Data || null,

          // Validity flag
          isValid: row.isValid !== false,
        });
      });
    }

    res.json({
      message: "✅ Phase 18 All models calculated successfully!",
      phase18All: {
        selectedFan,
        results,
        totalCount: results.length,
        validCount: results.filter((r) => r.isValid).length,
      },
    });
  } catch (error) {
    console.error("❌ Phase 18 All processing failed:", error);
    res.status(500).json({
      error: "Failed to process Phase 18 All",
      details: error.message || "Unknown error",
    });
  }
}
