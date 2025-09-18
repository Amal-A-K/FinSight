import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface BudgetWithCategory {
  id: number;
  amount: number;
  month: string;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    name: string;
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ month: string }> }
) {
  try {
    const params = await context.params; 
    const { month } = params;


    const budgets: BudgetWithCategory[] = await prisma.budget.findMany({
      where: { month },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets by month:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch budgets by month' }), 
      { status: 500 }
    );
  }
}
