# Database Setup for Production Distribution

## Overview

This document explains how the database is created and seeded when running the distributed `.exe` file on Windows (or any platform).

## How It Works

### 1. Database Creation on First Run

When the application starts in production mode:

1. **Database Path Configuration** (`electron-main.cjs`):

   - The database is stored in the user's data directory: `%APPDATA%\SELECT ME\database.db` (Windows)
   - The path is normalized for Windows (backslashes converted to forward slashes for Prisma)

2. **Database File Creation**:

   - If the database file doesn't exist, the app tries to copy a template database from `resources/prisma/dev.db`
   - If no template exists, an empty database file is created
   - The database file is created in a writable location (user data directory)

3. **Schema Migration** (`server/services/migrationRunner.service.js`):

   - The app checks if the database has the required schema (tables)
   - If not, it runs all Prisma migrations from `prisma/migrations/`
   - Migrations are applied in order (sorted by timestamp in directory name)
   - Applied migrations are tracked in the `_prisma_migrations` table

4. **Database Seeding** (`server/services/databaseInit.service.js`):
   - After migrations, the app checks if the database is empty
   - If empty (no fan data or centrifugal data), it automatically seeds the database
   - Seeding loads data from JSON files in the `server/Newmodules/` directory

## Build Configuration

### Included Files

The `package.json` build configuration includes:

- **Prisma folder** (`extraResources`): Includes the entire `prisma` folder, including:

  - `schema.prisma` - Database schema definition
  - `migrations/` - All migration SQL files
  - `dev.db` (if exists) - Template database with seeded data

- **Server folder** (`files` and `asarUnpack`): Includes all server code needed for:
  - Migration runner service
  - Database initialization service
  - Data seeding services

## Migration Process

The migration runner (`server/services/migrationRunner.service.js`):

1. **Finds Migration Files**: Looks for migrations in multiple locations:

   - `resources/prisma/migrations/` (production, from extraResources)
   - `app.asar/prisma/migrations/` (fallback)
   - Relative path from service file (development)

2. **Checks Applied Migrations**:

   - Queries the `_prisma_migrations` table to see which migrations have been applied
   - Skips already-applied migrations

3. **Applies Migrations**:

   - Reads each migration SQL file
   - Executes SQL statements
   - Records the migration as applied

4. **Error Handling**:
   - Continues with other migrations if one fails
   - Logs warnings for non-critical errors (e.g., "table already exists")

## Seeding Process

The database initialization service (`server/services/databaseInit.service.js`):

1. **Checks Database Status**:

   - Counts records in `fan_data` and `centrifugal_fan_data` tables
   - If either is empty, triggers seeding

2. **Seeds Data**:
   - Axial fan data from JSON files
   - Motor data from JSON files
   - Centrifugal fan data from JSON files
   - Pricing data
   - Accessory pricing
   - Axial casing pricing

## Troubleshooting

### Database Not Created

If the database is not created:

1. **Check Logs**: Look for error messages in the console output
2. **Check Permissions**: Ensure the user has write permissions to `%APPDATA%\SELECT ME\`
3. **Check Migration Files**: Verify that `prisma/migrations/` is included in the build

### Migrations Not Running

If migrations don't run:

1. **Check Migration Path**: The app logs the migration directory it's using
2. **Verify Migrations Included**: Check that migrations are in `extraResources` in `package.json`
3. **Check Database File**: Ensure the database file exists and is writable

### Seeding Not Working

If seeding doesn't work:

1. **Check Data Files**: Verify JSON data files are in the correct locations
2. **Check Logs**: Look for errors during seeding
3. **Check Database**: Ensure migrations ran successfully and tables exist

## Manual Database Setup

If you need to manually create and seed the database:

1. **Create Database**:

   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Database**:

   ```bash
   npm run prisma:seed
   ```

3. **Copy to Resources**:
   - Copy `prisma/dev.db` to ensure it's included in the build as a template

## Windows-Specific Notes

- Paths are normalized to use forward slashes for Prisma/SQLite compatibility
- The database is stored in a user-writable location (not in Program Files)
- The app handles Windows path separators correctly
