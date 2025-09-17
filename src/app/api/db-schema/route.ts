import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a new Prisma client instance with raw SQL access
const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test raw SQL query to list all tables
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

    // Get budget table columns if it exists
    let budgetColumns = [];
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Budget';
      `;
      budgetColumns = columns || [];
    } catch (e) {
      console.log('Budget table might not exist or error fetching columns:', e);
    }

    // Get current database name
    const dbName = await prisma.$queryRaw`SELECT current_database() as db_name;`;

    return NextResponse.json({
      success: true,
      database: dbName,
      tables: result,
      budgetTable: {
        exists: budgetColumns.length > 0,
        columns: budgetColumns
      }
    });
  } catch (error) {
    console.error('Database schema check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check database schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
