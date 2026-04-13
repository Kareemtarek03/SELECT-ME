-- AlterTable: add missing columns that the schema expects but the previous migration dropped
ALTER TABLE "motor_data" ADD COLUMN "cableLugsUPWithoutVat" REAL;
ALTER TABLE "motor_data" ADD COLUMN "cableHeatShrinkUPWithoutVat" REAL;
