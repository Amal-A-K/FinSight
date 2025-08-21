import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma: PrismaClient = global.prisma || (() => {
  // Create new instance with logging in development
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']
      : ['error']
  });

  // Ensure proper disconnection on process exit
  if (process.env.NODE_ENV !== 'production') {
    process.on('beforeExit', async () => {
      await client.$disconnect();
    });
    
    // Also handle SIGINT and SIGTERM for better cleanup
    process.on('SIGINT', async () => {
      await client.$disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await client.$disconnect();
      process.exit(0);
    });
  }

  return client;
})();

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma };