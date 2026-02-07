# Troubleshooting Build Issues

## Windows Build Error: "Access is denied" or "d3dcompiler_47.dll" locked

### Problem

When running `npm run dist` on Windows, you may encounter:

```
⨯ remove D:\Coding\SELECT-ME\dist\win-unpacked\d3dcompiler_47.dll: Access is denied.
```

### Solution

This happens when files in the `dist` directory are locked by another process. Follow these steps:

1. **Close all Electron instances**:

   - Close any running instances of your app
   - Open Task Manager (Ctrl+Shift+Esc)
   - Look for "SELECT ME" or "electron" processes
   - End any related processes

2. **Close development servers**:

   - Stop any `npm run dev` or `npm run electron:dev` processes
   - Close any terminals running the app

3. **Clean the dist directory**:

   ```bash
   npm run clean
   ```

   Or manually delete the `dist` folder:

   ```bash
   rmdir /s /q dist
   ```

4. **Try building again**:
   ```bash
   npm run dist
   ```

### Alternative: Force Clean Before Build

The build script now automatically cleans before building. If you still have issues:

1. **Manually delete dist folder**:

   - Close all Electron processes
   - Delete the `dist` folder completely
   - Run `npm run dist` again

2. **Use PowerShell as Administrator**:

   - Right-click PowerShell → "Run as Administrator"
   - Navigate to project directory
   - Run `npm run clean` then `npm run dist`

3. **Check for file locks**:
   - Use Process Explorer (Sysinternals) to find what's locking the file
   - Or use `handle.exe` from Sysinternals:
     ```bash
     handle.exe d3dcompiler_47.dll
     ```

### Prevention

- Always stop development servers before building
- Close any running instances of the app before building
- The `prebuild` script now automatically cleans the dist directory
