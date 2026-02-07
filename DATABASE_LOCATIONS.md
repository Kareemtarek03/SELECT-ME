# Database File Locations After Installation

## Expected Database Files

After installing the application, you should see **TWO** database files:

### 1. Template Database (Bundled with Installation)
**Location**: `[Installation Directory]/resources/prisma/dev.db`

- **Purpose**: Read-only template database bundled with the app
- **Size**: Should be several KB (contains all seeded data)
- **When**: Created during build process (`npm run dist`)
- **Status**: This file is included in the installation package

**Windows Example Path**:
```
C:\Program Files\SELECT ME\resources\prisma\dev.db
```

**Or if installed to custom location**:
```
C:\Users\YourName\AppData\Local\Programs\SELECT ME\resources\prisma\dev.db
```

### 2. User Database (Created on First Run)
**Location**: `%APPDATA%\SELECT ME\database.db`

- **Purpose**: Writable database for the user (copied from template on first run)
- **Size**: Should match template database size after copy
- **When**: Created when you first launch the application
- **Status**: This is the database the app actually uses

**Windows Example Path**:
```
C:\Users\YourName\AppData\Roaming\SELECT ME\database.db
```

## How to Verify

### Check Template Database (Bundled)
1. Navigate to your installation directory
2. Go to `resources/prisma/`
3. You should see `dev.db` file
4. Right-click → Properties to check file size (should be > 1 KB)

### Check User Database (Runtime)
1. Press `Win + R`
2. Type: `%APPDATA%\SELECT ME`
3. Press Enter
4. You should see `database.db` file
5. This file is created on first launch

## Troubleshooting

### Template Database Not Found
If you don't see `dev.db` in `resources/prisma/`:

1. **Check build process**: Run `npm run dist` and check for errors
2. **Verify database exists before build**: Check `prisma/dev.db` exists in source
3. **Check package.json**: Ensure `prisma` folder is in `extraResources`

### User Database Not Created
If `database.db` doesn't exist in `%APPDATA%\SELECT ME\`:

1. **Check console logs**: Look for "Database Discovery" messages
2. **Check permissions**: Ensure you have write access to `%APPDATA%`
3. **Check if template was found**: Look for "Found template database" message

### Database Empty or Not Working
If the database exists but has no data:

1. **Check file size**: Should be > 1 KB
2. **Check console logs**: Look for migration/seed errors
3. **Verify template database**: Check if template has data before copying

## Console Log Messages to Look For

When the app starts, you should see:

```
=== Database Discovery ===
Resources path: [path]
App path: [path]
Checking: [path] - Exists: true
  Size: [X] KB
✅ Found template database at: [path]
✅ Successfully copied database to: [path]
   Original size: [X] KB
   Copied size: [X] KB
✅ DATABASE_URL set to: file:///[path]
```

Or if database already exists:

```
✅ Database already exists at: [path]
   Size: [X] KB
```

## File Sizes

- **Empty database**: 0 bytes or very small (< 1 KB)
- **Database with schema only**: ~1-5 KB
- **Database with schema + data**: > 10 KB (depends on data amount)

If your `dev.db` in `resources/prisma/` is very small, the database wasn't seeded during build.
