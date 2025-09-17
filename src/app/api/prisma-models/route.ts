import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a new Prisma client instance for testing
const testPrisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});

export async function GET() {
  try {
    // Get all model names from the Prisma client
    const modelNames = Object.keys(testPrisma).filter(
      key => !key.startsWith('_') && !key.startsWith('$')
    );
    
    // Define the shape of our test results
    interface ModelTestResult {
      success: boolean;
      count?: number;
      error?: string;
    }

    // Test a simple query on each model
    const modelTests: Record<string, ModelTestResult> = {};
    
    for (const model of modelNames) {
      try {
        // Use type assertion to handle dynamic model access
        const prismaModel = testPrisma[model as keyof typeof testPrisma] as 
          { count: () => Promise<number> } | undefined;
        
        if (prismaModel && typeof prismaModel.count === 'function') {
          const count = await prismaModel.count();
          modelTests[model] = { success: true, count };
        } else {
          modelTests[model] = { 
            success: false, 
            error: 'Model does not support count operation'
          };
        }
      } catch (error) {
        modelTests[model] = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      models: modelNames,
      tests: modelTests
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test Prisma models',
        details: error instanceof Error ? error.message : 'Unknown error',
        prismaError: error
      },
      { status: 500 }
    );
  } finally {
    await testPrisma.$disconnect();
  }
}
