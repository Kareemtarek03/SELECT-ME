# Build Instructions for Windows Distribution

## Overview

This document explains how to build the application with the database included in the installation package.

## Prerequisites

1. Ensure you have Node.js and npm installed
2. Run `npm install` to install all dependencies
3. Ensure the database is created and seeded before building

## Build Process

### Automatic Database Preparation

The build process now automatically:

1. **Creates the database** (`prisma/dev.db`) if it doesn't exist
2. **Runs migrations** to set up the schema
3. **Seeds the database** with all required data
4. **Includes the database** in the installation package

### Building for Distribution

To build the application for Windows:

```bash
npm run dist
```

This command will:
1. Build the React client
2. Generate Prisma client
3. **Create and seed the database** (via `prebuild:db` script)
4. Package everything with electron-builder

### What Gets Included

The following are included in the installation:

- **Database file**: `prisma/dev.db` (created and seeded during build)
- **Migrations**: All migration SQL files in `prisma/migrations/`
- **Schema**: `prisma/schema.prisma`
- **Server code**: All server files needed for runtime
- **Client build**: React app build files

### Database Location in Installation

When the application is installed:

- **Template database**: `resources/prisma/dev.db` (read-only, bundled with app)
- **User database**: `%APPDATA%\SELECT ME\database.db` (writable, created on first run)

On first launch:
1. The app copies the template database from `resources/prisma/dev.db` to user data directory
2. If the template doesn't exist, it creates a new database and runs migrations
3. The database is then seeded if empty

## Troubleshooting

### Database Not Included in Build

If the database is not being included:

1. **Check if database exists before build**:
   ```bash
   ls -lh prisma/dev.db
   ```

2. **Manually create and seed**:
   ```bash
   npm run db:setup
   ```

3. **Verify database size**:
   The database should be at least a few KB in size. If it's 0 bytes, seeding failed.

4. **Check build logs**:
   Look for the "Preparing database for build" messages in the build output.

### Database Not Found at Runtime

If the database is not found when running the `.exe`:

1. **Check installation location**:
   - Template should be at: `[InstallDir]/resources/prisma/dev.db`
   - User database at: `%APPDATA%\SELECT ME\database.db`

2. **Check console logs**:
   The app logs detailed information about database discovery. Look for:
   - "Database Discovery" section
   - Paths being checked
   - Whether template was found

3. **Verify extraResources**:
   Check `package.json` build configuration to ensure `prisma` folder is in `extraResources`

## Manual Database Setup

If you need to manually prepare the database:

```bash
# Create database and run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed the database
npm run prisma:seed
```

The database file will be at `prisma/dev.db` and will be included in the build.

## Windows-Specific Notes

- Paths are normalized for Windows (backslashes converted to forward slashes for Prisma)
- The database is stored in a user-writable location (not in Program Files)
- The installation includes the database in `resources/prisma/dev.db`
