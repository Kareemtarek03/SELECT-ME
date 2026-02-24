import "./server-init.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appPath = process.env.APP_PATH || path.join(__dirname, "..");
const resourcesPath = process.env.RESOURCES_PATH || appPath;

// Axial fan modules
import axialFanDataRoutes from "./Newmodules/axial/AxialFanData/axialFanData.route.js";
import axialMotorDataRoutes from "./Newmodules/axial/AxialMotorData/axialMotorData.route.js";
import axialPdfRoutes from "./Newmodules/axial/AxialPDF/axialPdf.route.js";
import axialPricingRoutes from "./Newmodules/axial/AxialPricing/axialPricing.routes.js";
// Pricing routes for client path compatibility (/api/pricing/... and /api/accessories-pricing)
import { axialImpellerRoutes } from "./Newmodules/axial/AxialPricing/AxialImpeller/index.js";
import { axialCasingRoutes } from "./Newmodules/axial/AxialPricing/AxialCasing/index.js";
import { pricingItemsRoutes } from "./Newmodules/axial/AxialPricing/Pricing_Items/index.js";
import { accessoriesRoutes } from "./Newmodules/axial/AxialPricing/index.js";

// Centrifugal fan modules
import centrifugalFanDataRoutes from "./Newmodules/centrifugal/CentrifugalFanData/centrifugalFanData.route.js";
import centrifugalDataAdminRoutes from "./Newmodules/centrifugal/CentrifugalDataAdmin/centrifugalDataAdmin.router.js";
import centrifugalPdfRoutes from "./Newmodules/centrifugal/CentrifugalPDF/centrifugalPdf.route.js";

// Database Initialization
import { DatabaseInitService } from "./services/databaseInit.service.js";

const app = express();

// CORS configuration - must be before other middleware
app.use(cors());

// Handle preflight requests for all routes
app.options('*', cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

// Register API routes - Axial fan routes
app.use("/api/axial/fan-data", axialFanDataRoutes);
// Admin page expects /api/fan-data/... (same axial fan-data handlers)
app.use("/api/fan-data", axialFanDataRoutes);
app.use("/api/motor-data", axialMotorDataRoutes);
app.use("/api/axial/pdf", axialPdfRoutes);
app.use("/api/axial/pricing", axialPricingRoutes);

// Client path compatibility: admin/frontend expects /api/pricing/... and /api/accessories-pricing
const { Router } = express;
const pricingCompatRouter = Router();
pricingCompatRouter.use("/axial-impeller", axialImpellerRoutes);
pricingCompatRouter.use("/axial-casing", axialCasingRoutes);
pricingCompatRouter.use("/", pricingItemsRoutes); // /api/pricing/categories, /api/pricing/items
app.use("/api/pricing", pricingCompatRouter);
app.use("/api/accessories-pricing", accessoriesRoutes);

// Register API routes - Centrifugal fan routes
app.use("/api/centrifugal/fan-data", centrifugalFanDataRoutes);
app.use("/api/centrifugal/data", centrifugalDataAdminRoutes);
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

// SPA catchall: serve index.html for non-API GET requests (e.g. /admin, /axial/results)
// so client-side routing works when the app is served from the backend.
app.get("*", (req, res, next) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(clientBuildPath, "index.html"), (err) => {
      if (err) next(err);
    });
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
