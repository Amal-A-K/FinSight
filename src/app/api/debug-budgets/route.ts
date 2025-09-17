import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Starting debug-budgets endpoint');
    
    // 1. Check if we can connect to the database
    await prisma.$connect();
    console.log('Successfully connected to database');
    
    // 2. Try to query the Budget model directly
    console.log('Attempting to query Budget model...');
    try {
      const budgets = await prisma.budget.findMany({
        take: 1
      });
      console.log('Successfully queried Budget model');
      return NextResponse.json({
        success: true,
        message: 'Successfully queried Budget model',
        budgets
      });
    } catch (queryError) {
      console.error('Error querying Budget model:', queryError);
      
      // 3. If that fails, try with raw SQL
      try {
        console.log('Trying raw SQL query...');
        const result = await prisma.$queryRaw`SELECT * FROM "Budget" LIMIT 1`;
        return NextResponse.json({
          success: true,
          message: 'Successfully queried Budget table with raw SQL',
          result
        });
      } catch (rawError) {
        console.error('Raw SQL query failed:', rawError);
        throw rawError;
      }
    }
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug endpoint failed',
        details: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : 'Unknown error',
        prismaError: JSON.stringify(error, null, 2)
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
