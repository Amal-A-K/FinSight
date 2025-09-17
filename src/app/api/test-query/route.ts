import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

interface TableInfo {
  table_name: string;
}

interface BudgetRecord {
  id: number;
  amount: number;
  month: string;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: number;
    name: string;
  };
}

interface PrismaError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}

// Create a new Prisma client with logging
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // 1. Test raw SQL query to check table names
    console.log('\n--- Testing raw SQL query ---');
    const tables = await prisma.$queryRaw<TableInfo[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    console.log('Tables in database:', tables);
    
    // 2. Try to query the Budget table directly
    console.log('\n--- Testing Budget table query ---');
    const budgetQuery = await prisma.$queryRaw<BudgetRecord[]>`SELECT * FROM "Budget" LIMIT 1`;
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
    
    // Type assertion for the error
    const prismaError = error as PrismaError;

    // Get more detailed error information
    const errorDetails = {
      name: prismaError.name,
      message: prismaError.message,
      stack: process.env.NODE_ENV === 'development' ? prismaError.stack : undefined,
      ...(prismaError.code && { code: prismaError.code }),
      ...(prismaError.meta && { meta: prismaError.meta })
    };
    
    return NextResponse.json({
      success: false,
      error: 'Test query failed',
      errorDetails
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
