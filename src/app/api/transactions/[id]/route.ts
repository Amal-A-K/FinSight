import { NextResponse } from "next/server";
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
    { error: "Database operation failed" },
    { status: 500 }
  );
}

interface RouteParams {
  params: { id: string };
}

export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
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
  }
}

export async function DELETE(
  request: Request,
   { params }: { params: { id: string } }
) {
  try {
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
    
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handlePrismaError(error);
  }
}