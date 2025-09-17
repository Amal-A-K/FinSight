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

// Helper function to validate budget input
function validateBudgetInput(data: any): BudgetInput | { error: string } {
  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    return { error: 'Amount must be a positive number' };
  }

  if (!data.month || !/^\d{4}-\d{2}$/.test(data.month)) {
    return { error: 'Invalid month format. Use YYYY-MM' };
  }

  if (!data.categoryId || isNaN(Number(data.categoryId))) {
    return { error: 'Category ID is required' };
  }

  return {
    amount: Number(data.amount),
    month: data.month,
    categoryId: Number(data.categoryId)
  };
}

// Helper function to create error responses
function createErrorResponse(message: string, status: number, details?: any) {
  return new NextResponse(
    JSON.stringify({
      error: message,
      ...(details && { details })
    }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

// Helper function to handle Prisma errors
function handlePrismaError(error: unknown) {
  console.error('Prisma error:', error);
  
  if (error instanceof Error) {
    if (error.message.includes('Unique constraint')) {
      return createErrorResponse('A budget for this category and month already exists', 400);
    }
    return createErrorResponse(error.message, 500);
  }
  
  return createErrorResponse('An unknown database error occurred', 500);
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
    } catch (dbError) {
      return handlePrismaError(dbError);
    }
  } catch (error) {
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/budgets
export async function POST(request: Request) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      return createErrorResponse('Invalid JSON payload', 400);
    }

    const validation = validateBudgetInput(data);
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
      
    } catch (dbError) {
      if (dbError instanceof Error && 'code' in dbError && dbError.code === '23505') {
        return createErrorResponse('A budget for this category and month already exists', 409);
      }
      
      return createErrorResponse('Failed to save budget: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'), 500);
    }
  } catch (error) {
    return createErrorResponse('Internal server error', 500);
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

    const data = await request.json();
    const validation = validateBudgetInput(data);
    
    if ('error' in validation) {
      return createErrorResponse(validation.error, 400);
    }

    const { amount, month, categoryId } = validation;
    const budgetId = Number(id);

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

    // Update the budget
    const updatedBudget = await prisma.budget.update({
      where: { id: budgetId },
      data: {
        amount,
        month,
        categoryId
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
  } catch (error) {
    return handlePrismaError(error);
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

    try {
      // Check if budget exists using raw query
      const existingBudgetResult = await prisma.$queryRaw`
        SELECT "id" FROM "Budget" WHERE "id" = ${Number(id)} LIMIT 1
      `;
      
      const existingBudget = Array.isArray(existingBudgetResult) ? existingBudgetResult[0] : null;

      if (!existingBudget) {
        return createErrorResponse('Budget not found', 404);
      }

      // Delete the budget using raw query
      await prisma.$executeRaw`
        DELETE FROM "Budget" WHERE "id" = ${Number(id)}
      `;

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return handlePrismaError(error);
    }
  } catch (error) {
    return createErrorResponse('Internal server error', 500);
  }
}
