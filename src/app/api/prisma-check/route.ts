import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a new Prisma client with explicit configuration
const testPrisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export async function GET() {
  try {
    // 1. Test basic connection
    await testPrisma.$connect();
    
    // 2. Get database version
    const dbVersion = await testPrisma.$queryRaw`SELECT version()`;
    
    // 3. List all models available in the Prisma client
    const models = Object.keys(testPrisma).filter(
      key => !key.startsWith('_') && !key.startsWith('$')
    );
    
    // 4. Try to query the Budget model if it exists
    let budgetResult = 'Budget model not found';
    const budgetModel = testPrisma.budget as { count: () => Promise<number> } | undefined;
    
    if (budgetModel && typeof budgetModel.count === 'function') {
      try {
        const count = await budgetModel.count();
        budgetResult = `Found ${count} budget records`;
      } catch (error) {
        budgetResult = `Error querying budget: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
    
    // 5. List all tables in the database
    type TableInfo = { table_name: string }[];
    let tables: TableInfo | string = [];
    try {
      // Use type-safe raw query with proper type annotation
      const result = await testPrisma.$queryRaw<TableInfo>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `;
      tables = result;
    } catch (e) {
      console.error('Error listing tables:', e);
      tables = `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }
    
    return NextResponse.json({
      success: true,
      connection: 'Connected to database',
      databaseVersion: dbVersion,
      models,
      budgetCheck: budgetResult,
      tables,
      env: {
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Prisma check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await testPrisma.$disconnect();
  }
}
