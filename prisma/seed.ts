import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.createMany({
    data: [
      { name: 'Food' },
      { name: 'Transport' },
      { name: 'Housing' },
      { name: 'Entertainment' },
      { name: 'Utilities' },
    ],
    skipDuplicates: true,
  });
  console.log(`Created ${categories.count} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });