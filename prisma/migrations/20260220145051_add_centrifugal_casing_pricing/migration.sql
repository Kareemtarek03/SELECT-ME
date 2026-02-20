-- CreateTable
CREATE TABLE "centrifugal_casing_pricing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "sizeMm" REAL NOT NULL,
    "modelAndSize" TEXT NOT NULL,
    "totalFanPriceWithVat" REAL,
    "totalFanPriceWithVatScrapRecycle" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "centrifugal_casing_volute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "weightKgWithoutScrap" REAL,
    "scrapPct" REAL,
    "weightKgWithScrap" REAL,
    "sheetMetalDimensionsMm" TEXT,
    "laserTimeMin" REAL,
    "rolling" REAL,
    "sheetMetalOverlapping" REAL,
    "totalPriceWithVat" REAL,
    "totalPriceWithVatScrapRecycle" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_volute_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_frame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "weightKgWithoutScrap" REAL,
    "scrapPct" REAL,
    "weightKgWithScrap" REAL,
    "dimensionsMm" TEXT,
    "laserTimeMin" REAL,
    "casingCircumferenceM" REAL,
    "paintingLe" REAL,
    "totalPriceWithVat" REAL,
    "totalPriceWithVatScrapRecycle" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_frame_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_impeller" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "weightKgWithoutScrap" REAL,
    "scrapPct" REAL,
    "weightKgWithScrap" REAL,
    "sheetMetalDimensionsMm" TEXT,
    "centrifugalImpellerRigCostPcs" REAL,
    "laserTimeMin" REAL,
    "casingCircumferenceM" REAL,
    "paintingLe" REAL,
    "totalPriceWithVat" REAL,
    "totalPriceWithVatScrapRecycle" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_impeller_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_funnels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "weightKgWithoutScrap" REAL,
    "scrapPct" REAL,
    "weightKgWithScrap" REAL,
    "sheetMetalDimensionsMm" TEXT,
    "dieCastingLePc" REAL,
    "funnelMachiningLe" REAL,
    "galvanizeLe" REAL,
    "paintingLe" REAL,
    "totalPriceWithVat" REAL,
    "totalPriceWithVatScrapRecycle" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_funnels_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_sleeve_shaft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "weightKgWithoutScrap" REAL,
    "scrapPct" REAL,
    "weightKgWithScrap" REAL,
    "sheetMetalDimensionsMm" TEXT,
    "sleeveManufacturingLePc" REAL,
    "shaftManufacturingLePc" REAL,
    "totalPriceWithVat" REAL,
    "totalPriceWithVatScrapRecycle" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_sleeve_shaft_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_matching_flange" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "weightKgWithoutScrap" REAL,
    "scrapPct" REAL,
    "weightKgWithScrap" REAL,
    "sheetMetalDimensionsMm" TEXT,
    "laserTimeMin" REAL,
    "rolling" REAL,
    "casingCircumferenceM" REAL,
    "totalPriceWithVat" REAL,
    "totalPriceWithVatScrapRecycle" REAL,
    "selfAligningBearingHousingLe" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_matching_flange_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_bearing_assembly" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "bearingHousingTotalPriceWithVat" REAL,
    "boltsNutsKg" REAL,
    "assemblyLaboursPerShaft" REAL,
    "boltsNutsInstallationTotalPriceWithVat" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_bearing_assembly_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_fan_base" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "weightKgWithoutScrap" REAL,
    "scrapPct" REAL,
    "weightKgWithScrap" REAL,
    "sheetMetalDimensionsMm" TEXT,
    "laserTimeMin" REAL,
    "bendingLine" REAL,
    "paintingLe" REAL,
    "totalPriceWithVat" REAL,
    "totalPriceWithVatScrapRecycle" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_fan_base_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_belt_cover" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "weightKgWithoutScrap" REAL,
    "scrapPct" REAL,
    "weightKgWithScrap" REAL,
    "sheetMetalDimensionsMm" TEXT,
    "laserTimeMin" REAL,
    "casingCircumferenceM" REAL,
    "paintingLe" REAL,
    "totalPriceWithVat" REAL,
    "totalPriceWithVatScrapRecycle" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_belt_cover_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_motor_base" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "weightKgWithoutScrap" REAL,
    "scrapPct" REAL,
    "weightKgWithScrap" REAL,
    "sheetMetalDimensionsMm" TEXT,
    "laserTimeMin" REAL,
    "bendingLine" REAL,
    "studNutPriceLe" REAL,
    "paintingLe" REAL,
    "totalPriceWithVat" REAL,
    "totalPriceWithVatScrapRecycle" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_motor_base_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_accessories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "vibrationIsolatorsLe" REAL,
    "vibrationIsolatorsTotalPriceWithVat" REAL,
    "vinylStickersLe" REAL,
    "namePlateLe" REAL,
    "packingLe" REAL,
    "labourCostLe" REAL,
    "internalTransportationLe" REAL,
    "totalAccessoriesPriceWithVat" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_accessories_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_pricing_modelAndSize_key" ON "centrifugal_casing_pricing"("modelAndSize");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_volute_casingId_kind_key" ON "centrifugal_casing_volute"("casingId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_frame_casingId_kind_key" ON "centrifugal_casing_frame"("casingId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_impeller_casingId_kind_key" ON "centrifugal_casing_impeller"("casingId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_funnels_casingId_kind_key" ON "centrifugal_casing_funnels"("casingId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_sleeve_shaft_casingId_kind_key" ON "centrifugal_casing_sleeve_shaft"("casingId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_matching_flange_casingId_kind_key" ON "centrifugal_casing_matching_flange"("casingId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_bearing_assembly_casingId_key" ON "centrifugal_casing_bearing_assembly"("casingId");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_fan_base_casingId_key" ON "centrifugal_casing_fan_base"("casingId");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_belt_cover_casingId_key" ON "centrifugal_casing_belt_cover"("casingId");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_motor_base_casingId_key" ON "centrifugal_casing_motor_base"("casingId");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_accessories_casingId_key" ON "centrifugal_casing_accessories"("casingId");
