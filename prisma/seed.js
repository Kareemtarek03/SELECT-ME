import { DatabaseInitService } from "../server/services/databaseInit.service.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await DatabaseInitService.seedAll();
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
