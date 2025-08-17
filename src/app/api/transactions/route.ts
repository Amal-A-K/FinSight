import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface PrismaError {
  code: string;
  message: string;
  meta?: {
    target?: string[];
  };
}

// Type guard to check if an error is a Prisma error
function isPrismaError(error: unknown): error is PrismaError {
  if (typeof error !== 'object' || error === null) return false;
  
  const maybeError = error as { code?: unknown };
  return typeof maybeError.code === 'string';
}

// Helper function to handle Prisma errors
function handlePrismaError(error: unknown) {
  console.error('Database error:', error);
  
  if (isPrismaError(error)) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A record with this identifier already exists" },
        { status: 409 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }
  }
  
  // For unknown errors, return a generic 500 error
  return NextResponse.json(
    { error: "An error occurred while accessing the database" },
    { status: 500 }
  );
}

export async function GET() {
  try {
    await prisma.$connect();
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(transactions);
  } catch (error: unknown) {
    return handlePrismaError(error);
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    await prisma.$connect();
    const { amount, description, date } = await request.json();
    
    if (!amount || !description || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        date: new Date(date)
      }
    });
    return NextResponse.json(transaction);
  } catch (error: unknown) {
    return handlePrismaError(error);
  } finally {
    await prisma.$disconnect();
  }
}


