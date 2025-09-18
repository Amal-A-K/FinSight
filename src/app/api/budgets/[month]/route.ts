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

// import { NextRequest } from 'next/server';

export async function GET(
  // request: NextRequest,
  request: Request,
  { params }: { params: { month: string } } 
) {
  try {
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
