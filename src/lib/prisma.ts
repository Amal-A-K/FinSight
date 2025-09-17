import { PrismaClient } from '@prisma/client';

// Extend the NodeJS global type to include prisma
declare global {
  // eslint-disable-next-line no-var
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

  // Store in global in development to prevent multiple instances
  if (process.env.NODE_ENV === 'development') {
    global.prisma = client;
  }
  
  return client;
})();

// Export the Prisma client instance
export { prisma };

export default prisma;