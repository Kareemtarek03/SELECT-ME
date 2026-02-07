import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function diagnose() {
  console.log("🔍 Database Diagnostic Tool\n");

  // Check source database
  const sourceDbPath = path.join(__dirname, "..", "prisma", "dev.db");
  console.log("1. Checking source database...");
  console.log(`   Path: ${sourceDbPath}`);
  console.log(`   Exists: ${fs.existsSync(sourceDbPath)}`);

  if (fs.existsSync(sourceDbPath)) {
    const stats = fs.statSync(sourceDbPath);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);

    if (stats.size > 0) {
      try {
        const prisma = new PrismaClient({
          datasources: {
            db: { url: `file:${sourceDbPath.replace(/\\/g, "/")}` },
          },
        });

        const fanCount = await prisma.fanData.count();
        const centrifugalCount = await prisma.centrifugalFanData.count();
        const motorCount = await prisma.motorData.count();

        console.log(`   ✅ Database has data:`);
        console.log(`      - Axial fans: ${fanCount}`);
        console.log(`      - Centrifugal fans: ${centrifugalCount}`);
        console.log(`      - Motors: ${motorCount}`);

        if (fanCount === 0 && centrifugalCount === 0) {
          console.log(`   ⚠️  WARNING: Database exists but has no fan data!`);
        }

        await prisma.$disconnect();
      } catch (err) {
        console.log(`   ❌ Error reading database: ${err.message}`);
        console.log(
          `   This might mean the schema doesn't exist or is corrupted.`
        );
      }
    } else {
      console.log(`   ❌ Database file is empty!`);
    }
  } else {
    console.log(`   ❌ Source database does not exist!`);
    console.log(`   Run: npm run prebuild:db`);
  }

  console.log("\n2. Checking if database will be included in build...");
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const extraResources = packageJson.build?.extraResources || [];

  const prismaInResources = extraResources.find(
    (resource) =>
      (typeof resource === "object" && resource.from === "prisma") ||
      (typeof resource === "string" && resource.includes("prisma"))
  );

  if (prismaInResources) {
    console.log("   ✅ Prisma folder is configured in extraResources");
  } else {
    console.log("   ❌ Prisma folder NOT found in extraResources!");
    console.log("   This means the database won't be included in the build.");
  }

  console.log("\n3. Recommendations:");
  if (!fs.existsSync(sourceDbPath)) {
    console.log("   - Run: npm run prebuild:db");
    console.log("   - This will create and seed the database");
  } else {
    const stats = fs.existsSync(sourceDbPath)
      ? fs.statSync(sourceDbPath)
      : null;
    if (stats && stats.size < 1024) {
      console.log("   - Database file is too small - it may not be seeded");
      console.log("   - Run: npm run prebuild:db");
    } else if (stats && stats.size > 1024) {
      console.log("   - Database looks good!");
      console.log("   - Make sure to run: npm run dist");
    }
  }
}

diagnose().catch((err) => {
  console.error("Diagnostic failed:", err);
  process.exit(1);
});
