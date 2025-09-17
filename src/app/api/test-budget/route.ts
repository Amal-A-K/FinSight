import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection and check if budget table exists
    await prisma.$connect();
    
    // Try to query the budget table
    const budgetCount = await prisma.budget.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tables: {
        budget: `Found ${budgetCount} budget records`,
      },
      prismaModels: Object.keys(prisma).filter(key => key[0] !== '_' && key[0] === key[0].toLowerCase())
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        prismaError: error
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
