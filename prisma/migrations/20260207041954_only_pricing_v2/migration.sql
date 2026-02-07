-- AlterTable
ALTER TABLE "motor_data" ADD COLUMN "b3PriceWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "b3PriceWithoutVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "brassBarNo" REAL;
ALTER TABLE "motor_data" ADD COLUMN "brassBarTPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "brassBarUPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "brassBarUPWithoutVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cableCurrent" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cableHeatShrinkNo" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cableHeatShrinkTPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cableHeatShrinkUPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cableHeatShrinkUPWithoutVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cableLugsNo" INTEGER;
ALTER TABLE "motor_data" ADD COLUMN "cableLugsTPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cableLugsUPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cableLugsUPWithoutVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cablePriceWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cablePriceWithoutVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cableSize" TEXT;
ALTER TABLE "motor_data" ADD COLUMN "dolIaIn" REAL;
ALTER TABLE "motor_data" ADD COLUMN "dolLockedRotorCurrent" REAL;
ALTER TABLE "motor_data" ADD COLUMN "dolLockedRotorTorque" REAL;
ALTER TABLE "motor_data" ADD COLUMN "dolMaMn" REAL;
ALTER TABLE "motor_data" ADD COLUMN "efficiency25Hz" REAL;
ALTER TABLE "motor_data" ADD COLUMN "efficiency375Hz" REAL;
ALTER TABLE "motor_data" ADD COLUMN "efficiency50Hz" REAL;
ALTER TABLE "motor_data" ADD COLUMN "electricalBoxSize" TEXT;
ALTER TABLE "motor_data" ADD COLUMN "electricalBoxUPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "electricalBoxUPWithoutVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "flexibleConnectorMeter" REAL;
ALTER TABLE "motor_data" ADD COLUMN "flexibleConnectorSize" TEXT;
ALTER TABLE "motor_data" ADD COLUMN "flexibleConnectorTPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "flexibleConnectorUPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "flexibleConnectorUPWithoutVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "glandNo" REAL;
ALTER TABLE "motor_data" ADD COLUMN "glandTPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "glandUPWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "glandUPWithoutVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "otherPriceWithVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "otherPriceWithoutVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "ratedCurrentIn" REAL;
ALTER TABLE "motor_data" ADD COLUMN "ratedTorqueMn" REAL;
ALTER TABLE "motor_data" ADD COLUMN "runCapacitor400V" REAL;
ALTER TABLE "motor_data" ADD COLUMN "starDeltaIaIn" REAL;
ALTER TABLE "motor_data" ADD COLUMN "starDeltaLockedRotorCurrent" REAL;
ALTER TABLE "motor_data" ADD COLUMN "starDeltaLockedRotorTorque" REAL;
ALTER TABLE "motor_data" ADD COLUMN "starDeltaMaMn" REAL;
ALTER TABLE "motor_data" ADD COLUMN "startCapacitor330V" REAL;
ALTER TABLE "motor_data" ADD COLUMN "totalPriceWithVat" REAL;

-- CreateTable
CREATE TABLE "pricing_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pricing_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "sr" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "updatedDate" TEXT,
    "priceWithoutVat" REAL,
    "priceWithVat" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pricing_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "pricing_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pricing_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adminId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "categoryId" INTEGER,
    "itemId" INTEGER,
    "details" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "accessory_pricing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sr" INTEGER NOT NULL,
    "fanModel" TEXT NOT NULL,
    "fanSizeMm" INTEGER NOT NULL,
    "vinylStickersLe" REAL,
    "namePlateLe" REAL,
    "packingLe" REAL,
    "labourCostLe" REAL,
    "internalTransportationLe" REAL,
    "boltsAndNutsKg" REAL,
    "priceWithVatLe" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "axial_impeller_blades" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "bladeType" TEXT NOT NULL,
    "lengthMm" REAL NOT NULL,
    "bladeWeightKg" REAL NOT NULL,
    "moldCostWithVat" REAL NOT NULL,
    "machiningCostWithVat" REAL NOT NULL,
    "transportationCost" REAL NOT NULL,
    "packingCost" REAL NOT NULL,
    "steelBallsCost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "axial_impeller_hubs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "hubType" TEXT NOT NULL,
    "sizeMm" REAL NOT NULL,
    "hubWeightKg" REAL NOT NULL,
    "moldCostWithVat" REAL NOT NULL,
    "machiningCostWithVat" REAL NOT NULL,
    "transportationCost" REAL NOT NULL,
    "packingCost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "axial_impeller_frames" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "material" TEXT NOT NULL,
    "frameSizeMm" REAL NOT NULL,
    "sizeMm" REAL NOT NULL,
    "weightKg" REAL NOT NULL,
    "moldCostWithVat" REAL NOT NULL,
    "machiningCostWithVat" REAL NOT NULL,
    "transportationCost" REAL NOT NULL,
    "packingCost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "axial_casing_pricing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "model" TEXT NOT NULL,
    "sizeMm" REAL NOT NULL,
    "casingWeightKgWithoutScrap" REAL NOT NULL,
    "scrapPercentage" REAL NOT NULL,
    "casingCircumferenceMeter" REAL,
    "laserTimeMinutes" REAL,
    "bendingLine" REAL,
    "rolling" REAL,
    "paintingDiameter" REAL,
    "profitPercentage" REAL,
    "accessory1Description" TEXT,
    "accessory1PriceWithoutVat" REAL,
    "accessory2Description" TEXT,
    "accessory2PriceWithoutVat" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "pricing_categories_name_key" ON "pricing_categories"("name");

-- CreateIndex
CREATE INDEX "pricing_items_categoryId_idx" ON "pricing_items"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "axial_casing_pricing_model_sizeMm_key" ON "axial_casing_pricing"("model", "sizeMm");
