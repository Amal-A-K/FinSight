import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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

// Export the Budget type for use in other files
export type BudgetWithCategory = Budget;

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
  return NextResponse.json(
    {
      error: message,
      ...(details && { details })
    },
    { status }
  );
}

// Helper function to handle Prisma errors
function handlePrismaError(error: unknown) {
  console.error('Prisma error:', error);
  
  if (error instanceof Error) {
    if (error.message.includes('Unique constraint')) {
      return { error: 'A budget for this category and month already exists' };
    }
    return { error: error.message };
  }
  
  return { error: 'An unknown database error occurred' };
}

// GET /api/budgets
// Get all budgets, optionally filtered by month
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
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
    const { error: errorMessage } = handlePrismaError(error);
    return createErrorResponse(errorMessage, 500);
  }
}

// POST /api/budgets
// Create or update a budget
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
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

    return NextResponse.json(budget);
  } catch (error) {
    const { error: errorMessage } = handlePrismaError(error);
    return createErrorResponse(errorMessage, 500);
  }
}

// PUT /api/budgets/:id
// Update a budget
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
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

    // Check if budget exists
    const existingBudget = await prisma.budget.findUnique({
      where: { id: Number(id) }
    });

    if (!existingBudget) {
      return createErrorResponse('Budget not found', 404);
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return createErrorResponse('Category not found', 404);
    }

    // Update budget
    const budget = await prisma.budget.update({
      where: { id: Number(id) },
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

    return NextResponse.json(budget);
  } catch (error) {
    const { error: errorMessage } = handlePrismaError(error);
    return createErrorResponse(errorMessage, 500);
  }
}

// DELETE /api/budgets/:id
// Delete a budget
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || isNaN(Number(id))) {
      return createErrorResponse('Invalid budget ID', 400);
    }

    // Check if budget exists
    const existingBudget = await prisma.budget.findUnique({
      where: { id: Number(id) }
    });

    if (!existingBudget) {
      return createErrorResponse('Budget not found', 404);
    }

    // Delete budget
    await prisma.budget.delete({
      where: { id: Number(id) }
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    const { error: errorMessage } = handlePrismaError(error);
    return createErrorResponse(errorMessage, 500);
  }
}
