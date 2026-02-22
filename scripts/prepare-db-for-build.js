import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const dbPath = path.join(rootDir, "prisma", "dev.db");

console.log("🔧 Preparing database for build (this creates the TEMPLATE for packaging)...");
console.log("Template path:", dbPath);
console.log("(The packaged app will create its own database.db when run - not use this file directly)");

// Ensure prisma directory exists
const prismaDir = path.dirname(dbPath);
if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
    console.log("✅ Created prisma directory");
}

// Create empty database file if it doesn't exist (SQLite will initialize it)
if (!fs.existsSync(dbPath)) {
    console.log("📝 Creating database file...");
    fs.writeFileSync(dbPath, "");
    console.log("✅ Database file created");
} else {
    console.log("✅ Database file already exists");
}

try {
    // Run migrations to ensure schema is up to date
    console.log("🔄 Running migrations...");
    execSync("npx prisma migrate deploy", {
        cwd: rootDir,
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: `file:${dbPath.replace(/\\/g, "/")}` }
    });
    console.log("✅ Migrations completed");

    // Generate Prisma client
    console.log("🔨 Generating Prisma client...");
    execSync("npx prisma generate", {
        cwd: rootDir,
        stdio: "inherit"
    });
    console.log("✅ Prisma client generated");

    // Seed the database
    console.log("🌱 Seeding database...");
    execSync("node prisma/seed.js", {
        cwd: rootDir,
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: `file:${dbPath.replace(/\\/g, "/")}` }
    });
    console.log("✅ Database seeded");

    // Verify database exists and has data
    if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        console.log(`✅ Database file size: ${(stats.size / 1024).toFixed(2)} KB`);
        if (stats.size > 0) {
            console.log("✅ Database is ready for build!");
            console.log(`📦 Database will be included in: ${dbPath}`);
            console.log("   This file will be packaged with the application.");
        } else {
            console.warn("⚠️  Database file is empty - seeding may have failed");
            process.exit(1);
        }
    } else {
        console.error("❌ Database file was not created");
        console.error(`   Expected at: ${dbPath}`);
        process.exit(1);
    }
} catch (error) {
    console.error("❌ Failed to prepare database:", error.message);
    process.exit(1);
}
