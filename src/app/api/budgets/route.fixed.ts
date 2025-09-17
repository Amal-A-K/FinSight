import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { format } from 'date-fns';

// Type for budget data
type Budget = {
  id: number;
  amount: number;
  month: string;
  categoryId: number;
  category: {
    id: number;
    name: string;
    color?: string;
  };
};

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
    const session = await getServerSession();
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM');

    const budgets = await prisma.budget.findMany({
      where: { month },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: [
        { month: 'asc' },
        { category: { name: 'asc' } }
      ]
    });

    return NextResponse.json(budgets);
  } catch (error) {
    return handlePrismaError(error);
  }
}

// POST /api/budgets
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    const data = await request.json();
    const validation = validateBudgetInput(data);
    
    if ('error' in validation) {
      return createErrorResponse(validation.error, 400);
    }

    const { amount, month, categoryId } = validation;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return createErrorResponse('Category not found', 404);
    }

    // Create or update budget
    const budget = await prisma.budget.upsert({
      where: {
        categoryId_month: {
          categoryId,
          month
        }
      },
      update: {
        amount
      },
      create: {
        amount,
        month,
        categoryId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}

// PUT /api/budgets/:id
export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

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
            name: true,
            color: true
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
    const session = await getServerSession();
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || isNaN(Number(id))) {
      return createErrorResponse('Invalid budget ID', 400);
    }

    const budgetId = Number(id);

    // Check if budget exists
    const existingBudget = await prisma.budget.findUnique({
      where: { id: budgetId }
    });

    if (!existingBudget) {
      return createErrorResponse('Budget not found', 404);
    }

    // Delete the budget
    await prisma.budget.delete({
      where: { id: budgetId }
    });

    return new NextResponse(
      JSON.stringify({ message: 'Budget deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return handlePrismaError(error);
  }
}
