import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

// Axial fan modules
import axialFanDataRoutes from "./Newmodules/axial/AxialFanData/axialFanData.route.js";
import axialMotorDataRoutes from "./Newmodules/axial/AxialMotorData/axialMotorData.route.js";
import axialPdfRoutes from "./Newmodules/axial/AxialPDF/axialPdf.route.js";
import axialPricingRoutes from "./Newmodules/axial/AxialPricing/axialPricing.routes.js";

// Centrifugal fan modules
import centrifugalFanDataRoutes from "./Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.route.js";
import centrifugalPdfRoutes from "./Newmodules/centrifugal/CentrifugalPDF/centrifugalPdf.route.js";

// Database Initialization
import { DatabaseInitService } from "./services/databaseInit.service.js";

// Catalog module - commented out as module doesn't exist yet
// import catalogRoutes from "./modules/Catalog/catalog.route.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the app path (for packaged Electron app)
const appPath = process.env.APP_PATH || path.join(__dirname, "..");
const resourcesPath = process.env.RESOURCES_PATH || appPath;

const app = express();

// CORS configuration - must be before other middleware
app.use(cors());

// Handle preflight requests for all routes
app.options('*', cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Register API routes - Axial fan routes
app.use("/api/axial/fan-data", axialFanDataRoutes);
app.use("/api/axial/motor-data", axialMotorDataRoutes);
app.use("/api/axial/pdf", axialPdfRoutes);
app.use("/api/axial/pricing", axialPricingRoutes);

// Register API routes - Centrifugal fan routes
app.use("/api/centrifugal/fan-data", centrifugalFanDataRoutes);
app.use("/api/centrifugal/pdf", centrifugalPdfRoutes);

// Catalog routes - commented out as module doesn't exist yet
// app.use("/api/catalogs", catalogRoutes);

// Serve static files from the React app build directory
// In packaged app, client/build is in resources folder
const clientBuildPath = path.join(resourcesPath, "client", "build");
console.log("App path:", appPath);
console.log("Resources path:", resourcesPath);
console.log("Serving static files from:", clientBuildPath);
app.use(express.static(clientBuildPath));

// The "catchall" handler: for any request that doesn't match API routes,
// send back the React app's index.html file.
app.use((req, res, next) => {
  // Only serve index.html for GET requests that don't start with /api
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  } else {
    next();
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Initialize database if empty
  await DatabaseInitService.initializeDatabase();
});
