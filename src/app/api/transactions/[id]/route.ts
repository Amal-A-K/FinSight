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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    const { amount, description, date, categoryId } = await request.json();

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        // Handle category update - connect, disconnect, or leave unchanged
        ...(categoryId !== undefined && (
          categoryId === '' || categoryId === null 
            ? { category: { disconnect: true } }
            : { category: { connect: { id: parseInt(categoryId) } } }
        ))
      },
      include: {
        category: true  // Include category data in response
      }
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    return handlePrismaError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { error: "Invalid transaction ID" },
        { status: 400 }
      );
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handlePrismaError(error);
  }
}