import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { month: string } }
) {
  try {
    const { month } = params;

    const budgets = await prisma.budget.findMany({
      where: { month },
      include: {
        category: true,
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
