-- AlterTable: Replace pulley_data, belt_length_standard, pulley_standard with new column layout
-- (SQLite: drop and recreate; data will be repopulated by seed from JSON)

DROP TABLE IF EXISTS "pulley_data";
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

DROP TABLE IF EXISTS "belt_length_standard";
CREATE TABLE "belt_length_standard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spz" REAL,
    "spa" REAL,
    "spb" REAL,
    "spc" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

DROP TABLE IF EXISTS "pulley_standard";
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
