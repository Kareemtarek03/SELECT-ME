import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appPath = process.env.APP_PATH || path.join(__dirname, "..");

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:./')) {
    const relativePath = process.env.DATABASE_URL.replace('file:./', '');
    const prismaDir = path.join(appPath, 'prisma');
    const absolutePath = path.resolve(prismaDir, relativePath).replace(/\\/g, "/");
    process.env.DATABASE_URL = `file:${absolutePath}`;
    console.log("ESM Node initialized with absolute DATABASE_URL:", process.env.DATABASE_URL);
}
