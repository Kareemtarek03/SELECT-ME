# Quick Fix Guide - Database Not Working After Build

## Step 1: Verify Database Was Seeded

After running `npm run dist`, check if the database in `resources/prisma/dev.db` has data:

```bash
# Run the diagnostic
npm run diagnose:db
```

This will tell you:

- If the source database exists
- If it has data (fan counts, motor counts)
- If it's configured to be included in the build

## Step 2: Check Database File Size

After building, check the size of the database file:

**Windows:**

```cmd
dir "dist\win-unpacked\resources\prisma\dev.db"
```

**Or manually:**

1. Navigate to `dist/win-unpacked/resources/prisma/`
2. Right-click `dev.db` → Properties
3. Check file size:
   - **Empty/not seeded**: < 1 KB
   - **Seeded properly**: > 10 KB (usually 50-200 KB depending on data)

## Step 3: If Database is Empty or Too Small

If the database file is very small (< 1 KB), it wasn't seeded during build:

```bash
# 1. Make sure source database exists and is seeded
npm run prebuild:db

# 2. Verify it worked
npm run diagnose:db

# 3. Rebuild
npm run dist
```

## Step 4: Check Console Logs When App Runs

When you launch the installed app, look for these messages in the console:

```
=== Database Discovery ===
Resources path: [path]
App path: [path]
Checking: [path] - Exists: true
  Size: [X] KB
✅ Found template database at: [path]
✅ Successfully copied database to: [path]
```

If you see:

- **"Template database not found"** → Database wasn't included in build
- **"Copied database is empty"** → Source database wasn't seeded
- **"Database already has data"** → Everything is working!

## Step 5: Manual Verification

To manually verify the database has data:

1. **Before building**, check source database:

   ```bash
   npm run diagnose:db
   ```

2. **After building**, check built database:

   - Go to `dist/win-unpacked/resources/prisma/dev.db`
   - Check file size (should be > 10 KB)

3. **After installing**, check user database:
   - Press `Win + R`, type `%APPDATA%\SELECT ME`
   - Check if `database.db` exists
   - Check its size (should match template size)

## Common Issues

### Issue: Database file exists but is empty

**Solution**: Run `npm run prebuild:db` before `npm run dist`

### Issue: Database not found in resources

**Solution**: Check `package.json` - `prisma` folder should be in `extraResources`

### Issue: Database copied but app still doesn't work

**Solution**: Check console logs for Prisma errors or migration issues
