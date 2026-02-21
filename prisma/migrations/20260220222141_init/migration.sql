-- CreateTable
CREATE TABLE "fan_data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "No" INTEGER,
    "Model" TEXT,
    "AF-S" INTEGER,
    "AF-L" INTEGER,
    "WF" INTEGER,
    "ARTF" INTEGER,
    "SF" INTEGER,
    "ABSF-C" INTEGER,
    "ABSF-S" INTEGER,
    "SABF" INTEGER,
    "SARTF" INTEGER,
    "AJF" INTEGER,
    "bladesSymbol" TEXT NOT NULL,
    "bladesMaterial" TEXT NOT NULL,
    "noBlades" INTEGER NOT NULL,
    "bladesAngle" REAL NOT NULL,
    "hubType" INTEGER NOT NULL,
    "impellerConf" TEXT NOT NULL,
    "impellerInnerDia" REAL NOT NULL,
    "desigDensity" REAL NOT NULL,
    "RPM" REAL NOT NULL,
    "airFlow" TEXT NOT NULL,
    "totPressure" TEXT NOT NULL,
    "velPressure" TEXT NOT NULL,
    "staticPressure" TEXT NOT NULL,
    "fanInputPow" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "motor_data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "material" TEXT,
    "model" TEXT,
    "powerKW" REAL,
    "speedRPM" REAL,
    "NoPoles" INTEGER,
    "rated" TEXT,
    "DOL" TEXT,
    "starDelta" TEXT,
    "effCurve" TEXT,
    "ratedCurrentIn" REAL,
    "ratedTorqueMn" REAL,
    "dolLockedRotorCurrent" REAL,
    "dolIaIn" REAL,
    "dolLockedRotorTorque" REAL,
    "dolMaMn" REAL,
    "starDeltaLockedRotorCurrent" REAL,
    "starDeltaIaIn" REAL,
    "starDeltaLockedRotorTorque" REAL,
    "starDeltaMaMn" REAL,
    "powerFactor" REAL,
    "Phase" INTEGER,
    "frameSize" INTEGER,
    "shaftDia" REAL,
    "shaftLength" REAL,
    "shaftFeather" REAL,
    "IE" INTEGER,
    "frontBear" TEXT,
    "rearBear" TEXT,
    "noiseLvl" INTEGER,
    "weightKg" REAL,
    "efficiency50Hz" REAL,
    "efficiency375Hz" REAL,
    "efficiency25Hz" REAL,
    "runCapacitor400V" REAL,
    "startCapacitor330V" REAL,
    "NoCapacitors" INTEGER,
    "NoPhases" INTEGER,
    "insClass" TEXT,
    "b3PriceWithoutVat" REAL,
    "b3PriceWithVat" REAL,
    "otherPriceWithoutVat" REAL,
    "otherPriceWithVat" REAL,
    "cableCurrent" REAL,
    "cableSize" TEXT,
    "cablePriceWithoutVat" REAL,
    "cablePriceWithVat" REAL,
    "cableLugsNo" INTEGER,
    "cableLugsUPWithoutVat" REAL,
    "cableLugsUPWithVat" REAL,
    "cableLugsTPWithVat" REAL,
    "cableHeatShrinkNo" REAL,
    "cableHeatShrinkUPWithoutVat" REAL,
    "cableHeatShrinkUPWithVat" REAL,
    "cableHeatShrinkTPWithVat" REAL,
    "flexibleConnectorMeter" REAL,
    "flexibleConnectorSize" TEXT,
    "flexibleConnectorUPWithoutVat" REAL,
    "flexibleConnectorUPWithVat" REAL,
    "flexibleConnectorTPWithVat" REAL,
    "glandNo" REAL,
    "glandUPWithoutVat" REAL,
    "glandUPWithVat" REAL,
    "glandTPWithVat" REAL,
    "brassBarNo" REAL,
    "brassBarUPWithoutVat" REAL,
    "brassBarUPWithVat" REAL,
    "brassBarTPWithVat" REAL,
    "electricalBoxSize" TEXT,
    "electricalBoxUPWithoutVat" REAL,
    "electricalBoxUPWithVat" REAL,
    "totalPriceWithVat" REAL,
    "powerHorse" REAL,
    "netpower" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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

-- CreateTable
CREATE TABLE "centrifugal_fan_data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bladesType" TEXT,
    "bladesModel" TEXT,
    "minSpeedRPM" INTEGER,
    "highSpeedRPM" INTEGER,
    "impellerType" TEXT,
    "fanShaftDiameter" REAL,
    "innerDiameter" REAL,
    "desigDensity" REAL,
    "RPM" REAL,
    "airFlow" TEXT NOT NULL,
    "totPressure" TEXT NOT NULL,
    "velPressure" TEXT NOT NULL,
    "staticPressure" TEXT NOT NULL,
    "fanInputPow" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "centrifugal_motor_data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "material" TEXT,
    "model" TEXT,
    "powerKW" REAL,
    "speedRPM" REAL,
    "NoPoles" INTEGER,
    "rated" TEXT,
    "DOL" TEXT,
    "starDelta" TEXT,
    "powerFactor" REAL,
    "Phase" INTEGER,
    "frameSize" INTEGER,
    "shaftDia" REAL,
    "shaftLength" REAL,
    "shaftFeather" REAL,
    "IE" INTEGER,
    "frontBear" TEXT,
    "rearBear" TEXT,
    "noiseLvl" INTEGER,
    "weightKg" REAL,
    "effCurve" TEXT,
    "NoCapacitors" INTEGER,
    "NoPhases" INTEGER,
    "insClass" TEXT,
    "powerHorse" REAL,
    "netpower" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "centrifugal_casing_pricing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "sizeMm" REAL NOT NULL,
    "modelAndSize" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "centrifugal_casing_volute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "volute2mmWeightKgWithoutScrap" REAL,
    "volute2mmScrapPct" REAL,
    "volute2mmWeightKgWithScrap" REAL,
    "volute2mmSheetMetalDimensionsMm" TEXT,
    "volute1mmWeightKgWithoutScrap" REAL,
    "volute1mmScrapPct" REAL,
    "volute1mmWeightKgWithScrap" REAL,
    "volute1mmSheetMetalDimensionsMm" TEXT,
    "volute1mmLaserTimeMin" REAL,
    "volute1mmRolling" REAL,
    "volute1mmSheetMetalOverlapping" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_volute_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_frame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "angleBarWeightKgWithoutScrap" REAL,
    "angleBarScrapPct" REAL,
    "angleBarWeightKgWithScrap" REAL,
    "angleBarDimensionsMm" TEXT,
    "supportWeightKgWithoutScrap" REAL,
    "supportScrapPct" REAL,
    "supportWeightKgWithScrap" REAL,
    "supportSheetMetalDimensionsMm" TEXT,
    "supportLaserTimeMin" REAL,
    "supportCasingCircumferenceM" REAL,
    "supportPaintingLe" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_frame_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_impeller" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "bladesWeightKgWithoutScrap" REAL,
    "bladesScrapPct" REAL,
    "bladesWeightKgWithScrap" REAL,
    "bladesSheetMetalDimensionsMm" TEXT,
    "plateWeightKgWithoutScrap" REAL,
    "plateScrapPct" REAL,
    "plateWeightKgWithScrap" REAL,
    "plateSheetMetalDimensionsMm" TEXT,
    "plateCentrifugalImpellerRigCostPcs" REAL,
    "plateLaserTimeMin" REAL,
    "plateCasingCircumferenceM" REAL,
    "platePaintingLe" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_impeller_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_funnels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "funnel15mmWeightKgWithoutScrap" REAL,
    "funnel15mmScrapPct" REAL,
    "funnel15mmWeightKgWithScrap" REAL,
    "funnel15mmSheetMetalDimensionsMm" TEXT,
    "funnel15mmDieCastingLePc" REAL,
    "funnel15mmFunnelMachiningLe" REAL,
    "funnel15mmGalvanizeLe" REAL,
    "funnel3mmWeightKgWithoutScrap" REAL,
    "funnel3mmScrapPct" REAL,
    "funnel3mmWeightKgWithScrap" REAL,
    "funnel3mmSheetMetalDimensionsMm" TEXT,
    "funnel3mmDieCastingLePc" REAL,
    "funnel3mmFunnelMachiningLe" REAL,
    "funnel3mmPaintingLe" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_funnels_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_sleeve_shaft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "sleeveWeightKgWithoutScrap" REAL,
    "sleeveScrapPct" REAL,
    "sleeveWeightKgWithScrap" REAL,
    "sleeveSheetMetalDimensionsMm" TEXT,
    "sleeveManufacturingLePc" REAL,
    "shaftWeightKgWithoutScrap" REAL,
    "shaftScrapPct" REAL,
    "shaftWeightKgWithScrap" REAL,
    "shaftSheetMetalDimensionsMm" TEXT,
    "shaftManufacturingLePc" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_sleeve_shaft_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_matching_flange" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "flange3mmWeightKgWithoutScrap" REAL,
    "flange3mmScrapPct" REAL,
    "flange3mmWeightKgWithScrap" REAL,
    "flange3mmSheetMetalDimensionsMm" TEXT,
    "flange3mmLaserTimeMin" REAL,
    "flange3mmRolling" REAL,
    "flange3mmCasingCircumferenceM" REAL,
    "selfAligningBearingHousingLe" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_matching_flange_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_bearing_assembly" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "boltsNutsKg" REAL,
    "assemblyLaboursPerShaft" REAL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_motor_base_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centrifugal_casing_accessories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "casingId" INTEGER NOT NULL,
    "vibrationIsolatorsLe" REAL,
    "vinylStickersLe" REAL,
    "namePlateLe" REAL,
    "packingLe" REAL,
    "labourCostLe" REAL,
    "internalTransportationLe" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "centrifugal_casing_accessories_casingId_fkey" FOREIGN KEY ("casingId") REFERENCES "centrifugal_casing_pricing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pulley_data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "no" INTEGER,
    "beltType" TEXT,
    "grooves" INTEGER,
    "pitchDiameter" REAL,
    "bushNo" TEXT,
    "minBore" INTEGER,
    "maxBore" INTEGER,
    "widthF" REAL,
    "condition" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "belt_length_standard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spz" REAL,
    "spa" REAL,
    "spb" REAL,
    "spc" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pulley_standard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "no" INTEGER,
    "spz" REAL,
    "spa" REAL,
    "spb" REAL,
    "spc" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "pricing_categories_name_key" ON "pricing_categories"("name");

-- CreateIndex
CREATE INDEX "pricing_items_categoryId_idx" ON "pricing_items"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "axial_casing_pricing_model_sizeMm_key" ON "axial_casing_pricing"("model", "sizeMm");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_pricing_modelAndSize_key" ON "centrifugal_casing_pricing"("modelAndSize");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_volute_casingId_key" ON "centrifugal_casing_volute"("casingId");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_frame_casingId_key" ON "centrifugal_casing_frame"("casingId");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_impeller_casingId_key" ON "centrifugal_casing_impeller"("casingId");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_funnels_casingId_key" ON "centrifugal_casing_funnels"("casingId");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_sleeve_shaft_casingId_key" ON "centrifugal_casing_sleeve_shaft"("casingId");

-- CreateIndex
CREATE UNIQUE INDEX "centrifugal_casing_matching_flange_casingId_key" ON "centrifugal_casing_matching_flange"("casingId");

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
