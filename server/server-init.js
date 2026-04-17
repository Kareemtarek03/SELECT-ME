import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appPath = process.env.APP_PATH || path.join(__dirname, "..");

function resolveDevDatabasePath(relativePath) {
    const normalized = String(relativePath || "").replace(/\\/g, "/");
    if (normalized.startsWith("prisma/")) {
        return path.resolve(appPath, normalized);
    }
    return path.resolve(appPath, "prisma", normalized);
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:./')) {
    const relativePath = process.env.DATABASE_URL.replace('file:./', '');
    const absolutePath = resolveDevDatabasePath(relativePath).replace(/\\/g, "/");
    process.env.DATABASE_URL = `file:${absolutePath}`;
    console.log("ESM Node initialized with absolute DATABASE_URL:", process.env.DATABASE_URL);
}
