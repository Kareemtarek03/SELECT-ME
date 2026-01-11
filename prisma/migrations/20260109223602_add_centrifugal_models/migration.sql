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
CREATE TABLE "pulley_data" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beltSection" TEXT,
    "minPD" REAL,
    "maxPD" REAL,
    "grooves" INTEGER,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "belt_length_standard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beltSection" TEXT,
    "lengths" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pulley_standard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beltSection" TEXT,
    "minPD" REAL,
    "maxPD" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
