import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Try to query a category to verify the connection works
    const categories = await prisma.category.findMany({
      take: 1
    });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      categories: categories.length > 0 ? 'Categories exist' : 'No categories found'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
