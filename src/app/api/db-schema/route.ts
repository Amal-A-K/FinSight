import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

interface TableInfo {
  table_name: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
}

interface DatabaseInfo {
  db_name: string;
}

// Create a new Prisma client instance with raw SQL access
const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test raw SQL query to list all tables
    const result = await prisma.$queryRaw<TableInfo[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

    // Get budget table columns if it exists
    let budgetColumns: ColumnInfo[] = [];
    try {
      const columns = await prisma.$queryRaw<ColumnInfo[]>`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Budget';
      `;
      budgetColumns = columns || [];
    } catch (e) {
      console.log('Budget table might not exist or error fetching columns:', e);
    }

    // Get current database name
    const dbResult = await prisma.$queryRaw<DatabaseInfo[]>`SELECT current_database() as db_name;`;
    const dbName = dbResult[0]?.db_name;

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
