import { prisma } from "@/lib/server/prisma";
import { seedDatabaseFromMockData } from "@/lib/server/procurement";

async function main() {
  await seedDatabaseFromMockData();
}

main()
  .catch((error) => {
    console.error("Prisma seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
