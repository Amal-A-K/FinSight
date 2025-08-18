import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to handle Prisma errors
function handlePrismaError(error: unknown) {
  console.error('Database error:', error);
  
  if (typeof error === 'object' && error !== null) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
  }
  
  return NextResponse.json(
    { error: "An error occurred while accessing the database" },
    { status: 500 }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.$connect();
    const { amount, description, date } = await request.json();
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) })
      }
    });
    
    return NextResponse.json(updated);
  } catch (error: unknown) {
    return handlePrismaError(error);
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
//   { params }: { params: { id: string } }
) {
  try {
    const { params } = context;
    await prisma.$connect();
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    await prisma.transaction.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handlePrismaError(error);
  } finally {
    await prisma.$disconnect();
  }
}
