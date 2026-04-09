/*
  Warnings:

  - You are about to drop the column `DOL` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `IE` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `NoPoles` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `Phase` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `brassBarUPWithoutVat` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `cableHeatShrinkUPWithoutVat` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `cableLugsUPWithoutVat` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `cablePriceWithoutVat` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `dolIaIn` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `dolLockedRotorCurrent` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `dolLockedRotorTorque` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `dolMaMn` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `effCurve` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `efficiency375Hz` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `electricalBoxUPWithoutVat` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `flexibleConnectorUPWithoutVat` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `frontBear` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `glandUPWithoutVat` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `noiseLvl` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `powerFactor` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `rated` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `rearBear` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `runCapacitor400V` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `shaftDia` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `shaftFeather` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `starDelta` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `starDeltaIaIn` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `starDeltaLockedRotorCurrent` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `starDeltaLockedRotorTorque` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `starDeltaMaMn` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `startCapacitor330V` on the `motor_data` table. All the data in the column will be lost.
  - You are about to drop the column `weightKg` on the `motor_data` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_motor_data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "material" TEXT,
    "model" TEXT,
    "powerKW" REAL,
    "speedRPM" REAL,
    "noOfPoles" INTEGER,
    "ratedCurrentIn" REAL,
    "ratedTorqueMn" REAL,
    "lockedRotorCurrentDOL" REAL,
    "iaPerInDOL" REAL,
    "lockedRotorTorqueDOL" REAL,
    "maPerMnDOL" REAL,
    "lockedRotorCurrentYD" REAL,
    "iaPerInYD" REAL,
    "lockedRotorTorqueYD" REAL,
    "maPerMnYD" REAL,
    "powerFactorCos" REAL,
    "phase" TEXT,
    "frameSize" TEXT,
    "shaftDiameter" REAL,
    "shaftLength" REAL,
    "shaftFeatherKeyLength" REAL,
    "ie" TEXT,
    "frontBearing" TEXT,
    "rearBearing" TEXT,
    "noiseLevel" REAL,
    "weight" REAL,
    "efficiency50Hz" REAL,
    "efficiency37_5Hz" REAL,
    "efficiency25Hz" REAL,
    "runCapacitor" REAL,
    "startCapacitor" REAL,
    "NoCapacitors" INTEGER,
    "NoPhases" INTEGER,
    "insClass" TEXT,
    "b3PriceWithoutVat" REAL,
    "b3PriceWithVat" REAL,
    "otherPriceWithoutVat" REAL,
    "otherPriceWithVat" REAL,
    "cableCurrent" REAL,
    "cableSize" TEXT,
    "cablePriceWithVat" REAL,
    "cableLugsNo" INTEGER,
    "cableLugsUPWithVat" REAL,
    "cableLugsTPWithVat" REAL,
    "cableHeatShrinkNo" REAL,
    "cableHeatShrinkUPWithVat" REAL,
    "cableHeatShrinkTPWithVat" REAL,
    "flexibleConnectorMeter" REAL,
    "flexibleConnectorSize" TEXT,
    "flexibleConnectorUPWithVat" REAL,
    "flexibleConnectorTPWithVat" REAL,
    "glandNo" REAL,
    "glandUPWithVat" REAL,
    "glandTPWithVat" REAL,
    "brassBarNo" REAL,
    "brassBarUPWithVat" REAL,
    "brassBarTPWithVat" REAL,
    "electricalBoxSize" TEXT,
    "electricalBoxUPWithVat" REAL,
    "totalPriceWithVat" REAL,
    "powerHorse" REAL,
    "netpower" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_motor_data" ("NoCapacitors", "NoPhases", "b3PriceWithVat", "b3PriceWithoutVat", "brassBarNo", "brassBarTPWithVat", "brassBarUPWithVat", "cableCurrent", "cableHeatShrinkNo", "cableHeatShrinkTPWithVat", "cableHeatShrinkUPWithVat", "cableLugsNo", "cableLugsTPWithVat", "cableLugsUPWithVat", "cablePriceWithVat", "cableSize", "createdAt", "efficiency25Hz", "efficiency50Hz", "electricalBoxSize", "electricalBoxUPWithVat", "flexibleConnectorMeter", "flexibleConnectorSize", "flexibleConnectorTPWithVat", "flexibleConnectorUPWithVat", "frameSize", "glandNo", "glandTPWithVat", "glandUPWithVat", "id", "insClass", "material", "model", "netpower", "otherPriceWithVat", "otherPriceWithoutVat", "powerHorse", "powerKW", "ratedCurrentIn", "ratedTorqueMn", "shaftLength", "speedRPM", "totalPriceWithVat", "updatedAt") SELECT "NoCapacitors", "NoPhases", "b3PriceWithVat", "b3PriceWithoutVat", "brassBarNo", "brassBarTPWithVat", "brassBarUPWithVat", "cableCurrent", "cableHeatShrinkNo", "cableHeatShrinkTPWithVat", "cableHeatShrinkUPWithVat", "cableLugsNo", "cableLugsTPWithVat", "cableLugsUPWithVat", "cablePriceWithVat", "cableSize", "createdAt", "efficiency25Hz", "efficiency50Hz", "electricalBoxSize", "electricalBoxUPWithVat", "flexibleConnectorMeter", "flexibleConnectorSize", "flexibleConnectorTPWithVat", "flexibleConnectorUPWithVat", "frameSize", "glandNo", "glandTPWithVat", "glandUPWithVat", "id", "insClass", "material", "model", "netpower", "otherPriceWithVat", "otherPriceWithoutVat", "powerHorse", "powerKW", "ratedCurrentIn", "ratedTorqueMn", "shaftLength", "speedRPM", "totalPriceWithVat", "updatedAt" FROM "motor_data";
DROP TABLE "motor_data";
ALTER TABLE "new_motor_data" RENAME TO "motor_data";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
