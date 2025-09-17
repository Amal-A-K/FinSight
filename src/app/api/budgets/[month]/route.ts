import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { month: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

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
