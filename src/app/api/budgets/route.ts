import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { Prisma } from '@prisma/client';

// Type for budget with category
type BudgetWithCategory = Prisma.BudgetGetPayload<{
  include: {
    category: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

// Type for budget input validation
interface BudgetInput {
  amount: number;
  month: string;
  categoryId: number;
}

// Type for raw budget input from request
interface RawBudgetInput {
  amount?: unknown;
  month?: unknown;
  categoryId?: unknown;
}

// Helper function to validate budget input
function validateBudgetInput(data: RawBudgetInput): BudgetInput | { error: string } {
  // Validate amount
  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number' };
  }

  // Validate month format
  const month = String(data.month || '');
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return { error: 'Invalid month format. Use YYYY-MM' };
  }

  // Validate category ID
  const categoryId = Number(data.categoryId);
  if (isNaN(categoryId)) {
    return { error: 'Category ID is required and must be a number' };
  }

  return {
    amount,
    month,
    categoryId
  };
}

// Type for error details
interface ErrorDetails {
  [key: string]: unknown;
}

// Helper function to create error responses
function createErrorResponse(message: string, status: number, details?: ErrorDetails) {
  return new NextResponse(
    JSON.stringify({
      error: message,
      ...(details && { details })
    }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

// Type for Prisma error with code
interface PrismaErrorWithCode extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

// Helper function to handle Prisma errors
function handlePrismaError(error: unknown) {
  const prismaError = error as PrismaErrorWithCode;
  
  if (prismaError.code === 'P2002') {
    return createErrorResponse('A budget with this category already exists for the specified month', 409);
  }
  if (prismaError.code === 'P2025') {
    return createErrorResponse('Category not found', 404);
  }
  
  console.error('Prisma error:', error);
  return createErrorResponse('Database error', 500, { 
    error: 'An unexpected database error occurred',
    code: prismaError.code || 'UNKNOWN_ERROR'
  });
}

// GET /api/budgets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM');

    try {
      // Use raw query to handle case sensitivity
      const budgets = await prisma.$queryRaw<BudgetWithCategory[]>`
        SELECT 
          b."id" as id,
          b."amount" as amount,
          b."month" as month,
          b."categoryId" as categoryId,
          b."createdAt" as "createdAt",
          b."updatedAt" as "updatedAt",
          json_build_object(
            'id', c."id",
            'name', c."name"
          ) as category
        FROM "Budget" b
        JOIN "Category" c ON b."categoryId" = c."id"
        WHERE b."month" = ${month}
        ORDER BY c."name" ASC
      `;

      return NextResponse.json(budgets);
    } catch (dbError: unknown) {
      return handlePrismaError(dbError);
    }
  } catch (error: unknown) {
    console.error('Error in GET /api/budgets:', error);
    return createErrorResponse('Internal server error', 500, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// POST /api/budgets
export async function POST(request: Request) {
  try {
    let data: unknown;
    try {
      data = await request.json();
    } catch (parseError: unknown) {
      console.error('JSON parse error in POST /api/budgets:', parseError);
      return createErrorResponse('Invalid JSON payload', 400, {
        error: parseError instanceof Error ? parseError.message : 'Invalid JSON'
      });
    }

    // Ensure data is in the correct format for validation
    const budgetData: RawBudgetInput = {
      amount: (data as { amount?: unknown }).amount,
      month: (data as { month?: unknown }).month,
      categoryId: (data as { categoryId?: unknown }).categoryId
    };

    const validation = validateBudgetInput(budgetData);
    if ('error' in validation) {
      return createErrorResponse(validation.error, 400);
    }

    const { amount, month, categoryId } = validation;

    try {
      // Check if category exists using raw query
      const categoryResult = await prisma.$queryRaw`
        SELECT "id", "name"
        FROM "Category" 
        WHERE "id" = ${categoryId} 
        LIMIT 1
      `;
      
      const category = Array.isArray(categoryResult) ? categoryResult[0] : null;

      if (!category) {
        return createErrorResponse('Category not found', 404);
      }

      console.log('POST /api/budgets - Creating/updating budget');
      
      // First try to update existing budget
      const updateResult = await prisma.$executeRaw`
        UPDATE "Budget" 
        SET "amount" = ${amount}, "updatedAt" = NOW()
        WHERE "categoryId" = ${categoryId} AND "month" = ${month}
        RETURNING *
      `;
      
      let budget;
      
      // If no rows were updated, insert a new budget
      if (updateResult === 0) {
        const insertResult = await prisma.$queryRaw`
          INSERT INTO "Budget" ("amount", "month", "categoryId", "createdAt", "updatedAt")
          VALUES (${amount}, ${month}, ${categoryId}, NOW(), NOW())
          RETURNING *
        `;
        
        budget = Array.isArray(insertResult) ? insertResult[0] : insertResult;
      } else {
        // Get the updated budget
        const updatedBudget = await prisma.$queryRaw`
          SELECT 
            b.*,
            json_build_object(
              'id', c."id",
              'name', c."name"
            ) as "category"
          FROM "Budget" b
          JOIN "Category" c ON b."categoryId" = c."id"
          WHERE b."categoryId" = ${categoryId} AND b."month" = ${month}
          LIMIT 1
        `;
        
        budget = Array.isArray(updatedBudget) ? updatedBudget[0] : updatedBudget;
      }

      return NextResponse.json(budget, { status: 201 });
      
    } catch (dbError: unknown) {
      console.error('Database error in POST /api/budgets:', dbError);
      
      if (dbError && typeof dbError === 'object' && 'code' in dbError && dbError.code === '23505') {
        return createErrorResponse('A budget for this category and month already exists', 409);
      }
      
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      return createErrorResponse(`Failed to save budget: ${errorMessage}`, 500, {
        error: 'Database operation failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      });
    }
  } catch (error: unknown) {
    console.error('Unexpected error in POST /api/budgets:', error);
    return createErrorResponse('Internal server error', 500, {
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
}

// PUT /api/budgets/:id
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || isNaN(Number(id))) {
      return createErrorResponse('Invalid budget ID', 400);
    }

    let data: unknown;
    try {
      data = await request.json();
    } catch (parseError: unknown) {
      console.error('JSON parse error in PUT /api/budgets:', parseError);
      return createErrorResponse('Invalid JSON payload', 400, {
        error: parseError instanceof Error ? parseError.message : 'Invalid JSON'
      });
    }

    // Ensure data is in the correct format for validation
    const budgetData: RawBudgetInput = {
      amount: (data as { amount?: unknown }).amount,
      month: (data as { month?: unknown }).month,
      categoryId: (data as { categoryId?: unknown }).categoryId
    };

    const validation = validateBudgetInput(budgetData);
    if ('error' in validation) {
      return createErrorResponse(validation.error, 400);
    }

    const { amount, month, categoryId } = validation;
    const budgetId = Number(id);

    try {
      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return createErrorResponse('Category not found', 404);
      }

      // Check if budget exists
      const existingBudget = await prisma.budget.findUnique({
        where: { id: budgetId }
      });

      if (!existingBudget) {
        return createErrorResponse('Budget not found', 404);
      }

      // Check for duplicate budget for the same category and month
      if (existingBudget.categoryId !== categoryId || existingBudget.month !== month) {
        const duplicateBudget = await prisma.budget.findFirst({
          where: {
            categoryId,
            month,
            id: { not: budgetId }
          }
        });

        if (duplicateBudget) {
          return createErrorResponse('A budget for this category and month already exists', 409);
        }
      }

      // Update the budget
      const updatedBudget = await prisma.budget.update({
        where: { id: budgetId },
        data: {
          amount,
          month,
          categoryId,
          updatedAt: new Date()
        },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return NextResponse.json(updatedBudget);
    } catch (error: unknown) {
      console.error('Error in PUT /api/budgets:', error);
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return createErrorResponse('A budget for this category and month already exists', 409);
      }
      return handlePrismaError(error);
    }
  } catch (error: unknown) {
    console.error('Unexpected error in PUT /api/budgets:', error);
    return createErrorResponse('Internal server error', 500, {
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
}

// DELETE /api/budgets/:id
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || isNaN(Number(id))) {
      return createErrorResponse('Invalid budget ID', 400);
    }

    const budgetId = Number(id);
    
    try {
      // Check if budget exists using raw query
      const existingBudgetResult = await prisma.$queryRaw<{id: number}[]>`
        SELECT "id" FROM "Budget" WHERE "id" = ${budgetId} LIMIT 1
      `;
      
      const existingBudget = Array.isArray(existingBudgetResult) ? existingBudgetResult[0] : null;

      if (!existingBudget) {
        return createErrorResponse('Budget not found', 404);
      }

      // Delete the budget using raw query
      await prisma.$executeRaw`
        DELETE FROM "Budget" WHERE "id" = ${budgetId}
      `;

      return new NextResponse(null, { status: 204 });
    } catch (error: unknown) {
      console.error(`Error deleting budget ${budgetId}:`, error);
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'P2025') {
          return createErrorResponse('Budget not found', 404);
        }
        if (error.code === 'P2003') {
          return createErrorResponse('Cannot delete budget due to existing references', 409);
        }
      }
      return handlePrismaError(error);
    }
  } catch (error: unknown) {
    console.error('Unexpected error in DELETE /api/budgets:', error);
    return createErrorResponse('Internal server error', 500, {
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
}
