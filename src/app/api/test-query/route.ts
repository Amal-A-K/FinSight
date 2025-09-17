import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a new Prisma client with logging
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // 1. Test raw SQL query to check table names
    console.log('\n--- Testing raw SQL query ---');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    console.log('Tables in database:', tables);
    
    // 2. Try to query the Budget table directly
    console.log('\n--- Testing Budget table query ---');
    const budgetQuery = await prisma.$queryRaw`SELECT * FROM "Budget" LIMIT 1`;
    console.log('Budget query result:', budgetQuery);
    
    // 3. Try Prisma query
    console.log('\n--- Testing Prisma query ---');
    const prismaResult = await prisma.budget.findMany({
      take: 1,
      include: { category: true }
    });
    console.log('Prisma query result:', prismaResult);
    
    return NextResponse.json({
      success: true,
      tables,
      budgetQuery,
      prismaResult
    });
  } catch (error) {
    console.error('Test query failed:', error);
    
    // Try to get more detailed error information
    let errorDetails = {};
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        // @ts-ignore
        code: error.code,
        // @ts-ignore
        meta: error.meta
      };
    }
    
    return NextResponse.json({
      success: false,
      error: 'Test query failed',
      errorDetails
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
