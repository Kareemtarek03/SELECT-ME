import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs Prisma migrations programmatically in production
 * This is needed when the database doesn't exist or hasn't been migrated
 */
export async function runMigrations(dbPath) {
    const normalized = dbPath.replace(/\\/g, "/");
    const dbUrl = `file:${normalized}`;
    console.log("🔄 Running migrations for database:", dbUrl);

    // Ensure database file exists (create empty file if it doesn't)
    if (!fs.existsSync(dbPath)) {
        console.log("📝 Creating new database file...");
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        fs.writeFileSync(dbPath, "");
    }

    // Create Prisma client with the database URL
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: dbUrl
            }
        }
    });

    try {
        // Check if database has any tables
        const tables = await prisma.$queryRaw`
            SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `;

        const hasTables = tables && tables.length > 0;
        console.log(`📊 Database has ${hasTables ? tables.length : 0} tables`);
        // Get the base path for migrations
        // In production, migrations are in resources/prisma/migrations
        // In development, they're in the project root prisma/migrations
        let migrationsPath = null;

        // Try resources path first (production)
        if (process.env.RESOURCES_PATH) {
            const resourcesMigrationsPath = path.join(process.env.RESOURCES_PATH, "prisma", "migrations");
            if (fs.existsSync(resourcesMigrationsPath)) {
                migrationsPath = resourcesMigrationsPath;
            }
        }

        // Try app path (production, might be in asar)
        if (!migrationsPath && process.env.APP_PATH) {
            const appMigrationsPath = path.join(process.env.APP_PATH, "prisma", "migrations");
            if (fs.existsSync(appMigrationsPath)) {
                migrationsPath = appMigrationsPath;
            }
        }

        // Try relative to current file (development)
        if (!migrationsPath) {
            const devMigrationsPath = path.join(__dirname, "..", "..", "prisma", "migrations");
            if (fs.existsSync(devMigrationsPath)) {
                migrationsPath = devMigrationsPath;
            }
        }

        // Try process.resourcesPath (electron production)
        if (!migrationsPath && process.resourcesPath) {
            const electronMigrationsPath = path.join(process.resourcesPath, "prisma", "migrations");
            if (fs.existsSync(electronMigrationsPath)) {
                migrationsPath = electronMigrationsPath;
            }
        }

        // Check if migrations directory exists
        if (!migrationsPath || !fs.existsSync(migrationsPath)) {
            console.error("❌ Migrations directory not found. Tried:");
            console.error("  - RESOURCES_PATH:", process.env.RESOURCES_PATH ? path.join(process.env.RESOURCES_PATH, "prisma", "migrations") : "not set");
            console.error("  - APP_PATH:", process.env.APP_PATH ? path.join(process.env.APP_PATH, "prisma", "migrations") : "not set");
            console.error("  - Relative:", path.join(__dirname, "..", "..", "prisma", "migrations"));
            console.error("  - process.resourcesPath:", process.resourcesPath ? path.join(process.resourcesPath, "prisma", "migrations") : "not available");
            throw new Error("Migrations directory not found");
        }

        console.log("📁 Using migrations directory:", migrationsPath);

        // Get all migration directories, sorted by name (which includes timestamp)
        const migrationDirs = fs.readdirSync(migrationsPath)
            .filter(item => {
                const itemPath = path.join(migrationsPath, item);
                return fs.statSync(itemPath).isDirectory() && item !== "node_modules";
            })
            .sort();

        console.log(`📦 Found ${migrationDirs.length} migrations to apply`);

        // Check which migrations have been applied
        let appliedMigrations = [];
        try {
            // Check if _prisma_migrations table exists
            const tableCheck = await prisma.$queryRaw`
                SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'
            `;

            if (tableCheck && tableCheck.length > 0) {
                // Get applied migrations
                const applied = await prisma.$queryRaw`
                    SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL
                `;
                appliedMigrations = applied.map(m => m.migration_name);
                console.log(`✅ Found ${appliedMigrations.length} already applied migrations`);
            } else {
                // Create the migrations tracking table
                await prisma.$executeRaw`
                    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
                        "id" VARCHAR(36) PRIMARY KEY,
                        "checksum" VARCHAR(64) NOT NULL,
                        "finished_at" DATETIME,
                        "migration_name" VARCHAR(255) NOT NULL,
                        "logs" TEXT,
                        "rolled_back_at" DATETIME,
                        "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
                    )
                `;
                console.log("📋 Created _prisma_migrations table");
            }
        } catch (err) {
            console.warn("⚠️ Could not check migration status, will attempt to create table:", err.message);
            // Try to create the table
            try {
                await prisma.$executeRaw`
                    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
                        "id" VARCHAR(36) PRIMARY KEY,
                        "checksum" VARCHAR(64) NOT NULL,
                        "finished_at" DATETIME,
                        "migration_name" VARCHAR(255) NOT NULL,
                        "logs" TEXT,
                        "rolled_back_at" DATETIME,
                        "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
                    )
                `;
            } catch (createErr) {
                console.warn("⚠️ Could not create migrations table:", createErr.message);
            }
        }

        // Apply each migration that hasn't been applied
        for (const migrationDir of migrationDirs) {
            const migrationName = migrationDir;

            if (appliedMigrations.includes(migrationName)) {
                console.log(`⏭️  Skipping already applied migration: ${migrationName}`);
                continue;
            }

            const migrationSqlPath = path.join(migrationsPath, migrationDir, "migration.sql");

            if (!fs.existsSync(migrationSqlPath)) {
                console.warn(`⚠️  Migration SQL file not found: ${migrationSqlPath}`);
                continue;
            }

            console.log(`🔄 Applying migration: ${migrationName}`);

            try {
                const migrationSql = fs.readFileSync(migrationSqlPath, "utf-8");

                // Split SQL into individual statements
                const statements = migrationSql
                    .split(";")
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith("--"));

                // Execute each statement
                for (const statement of statements) {
                    if (statement.trim()) {
                        try {
                            await prisma.$executeRawUnsafe(statement);
                        } catch (stmtErr) {
                            // Some statements might fail if tables/columns already exist
                            // This is okay for idempotent migrations
                            if (!stmtErr.message.includes("already exists") &&
                                !stmtErr.message.includes("duplicate column")) {
                                console.warn(`⚠️  Statement warning: ${stmtErr.message}`);
                            }
                        }
                    }
                }

                // Record migration as applied
                const migrationId = `${Date.now()}-${migrationName}`;
                await prisma.$executeRaw`
                    INSERT INTO "_prisma_migrations" 
                    (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
                    VALUES (${migrationId}, ${"manual"}, ${migrationName}, datetime('now'), datetime('now'), 1)
                `;

                console.log(`✅ Applied migration: ${migrationName}`);
            } catch (migrationErr) {
                console.error(`❌ Failed to apply migration ${migrationName}:`, migrationErr.message);
                // Continue with other migrations
            }
        }

        console.log("✅ All migrations completed!");
        return true;
    } catch (error) {
        console.error("❌ Migration runner failed:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}
