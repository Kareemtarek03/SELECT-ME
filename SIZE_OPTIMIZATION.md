# Application Size Optimization Guide

## Current Analysis (Before Optimization)

| Component | Size | Issue |
|-----------|------|-------|
| `dist/` (packaged) | 1.6 GB | Final build with duplicates |
| `dist/win-unpacked/` | 758 MB | Unpacked installer |
| `dist/*.exe` installer | 423 MB | Compressed installer |
| `client/node_modules/` | 1.3 GB | Dev dependencies |
| `node_modules/` (root) | 875 MB | Includes Electron |
| `server/modules/PDF/assets/` | 317 MB | Unoptimized images |

### Major Size Contributors in Packaged App

1. **PDF Assets (317 MB)** - 314 unoptimized JPG/PNG images
2. **node_modules bundled (166 MB)** - Due to `asar: false`
3. **Electron runtime (169 MB)** - Required, cannot reduce
4. **Source maps (14 MB)** - Not needed in production

---

## Optimizations Applied

### 1. Electron Builder Config (`package.json`)

**Changes:**
- `asar: true` - Compresses app into single archive (~30-50% smaller)
- Excluded: `*.map`, `*.md`, `*.log`, test files
- Added `asarUnpack` for native modules that need file access

**Impact:** ~100-150 MB reduction

### 2. Source Maps Disabled

**File:** `client/.env.production.local`
```
GENERATE_SOURCEMAP=false
```

**Impact:** ~14 MB reduction

### 3. Duplicate Files Removed

- Removed duplicate `axialFan.json` from root (was in both root and server/)

**Impact:** ~2 MB reduction

---

## Manual Optimizations Required

### 1. Image Optimization (HIGHEST IMPACT)

The PDF assets folder contains 314 images totaling **317 MB**. Most are 500-800KB each.

**Run the optimization script:**
```bash
npm install  # Installs sharp
npm run optimize-images
```

**Expected savings:** 60-70% → **~190-220 MB reduction**

**Alternative manual methods:**
- Use [TinyPNG](https://tinypng.com/) or [Squoosh](https://squoosh.app/)
- ImageMagick: `magick mogrify -quality 75 -resize 1200x1200\> *.jpg`

### 2. Clean Rebuild

```bash
npm run clean          # Remove old builds
npm run dist:prod      # Build with optimizations
```

### 3. Remove Unused Dependencies (Optional)

Check if these are actually used:
- `@types/node` - Only needed for TypeScript (you use JS)
- `cubic-spline` - Implemented inline in electron-main.cjs

---

## Expected Results After Optimization

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| PDF Assets | 317 MB | ~100 MB | ~217 MB |
| Source Maps | 14 MB | 0 MB | 14 MB |
| asar compression | - | - | ~50 MB |
| Duplicates | 4 MB | 0 MB | 4 MB |
| **Installer Size** | **423 MB** | **~180-220 MB** | **~200 MB** |
| **Unpacked Size** | **758 MB** | **~400-450 MB** | **~300 MB** |

---

## Build Commands

```bash
# Development
npm run electron:dev

# Production build (optimized)
npm run dist:prod

# Clean all build artifacts
npm run clean

# Optimize images (run once)
npm run optimize-images
```

---

## Additional Recommendations

### For Further Size Reduction

1. **Consider WebP format** for images (50-80% smaller than JPEG)
2. **Lazy load PDF assets** - Load images on-demand instead of bundling all
3. **Use NSIS compression** - Already using NSIS, ensure `compression: "maximum"`
4. **Single architecture** - Building only x64 (already configured)

### What NOT to Remove

- `canvas` module - Required for chart generation
- `@prisma/client` - Required for database
- `pdfkit` - Required for PDF generation
- PDF assets in `server/modules/PDF/assets/` - Required for PDF output
