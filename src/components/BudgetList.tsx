'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, MoreVertical } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Prisma } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type BudgetWithCategory = Prisma.BudgetGetPayload<{
  include: {
    category: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

interface BudgetListProps {
  budgets: BudgetWithCategory[];
  onEdit: (budget: BudgetWithCategory) => void;
  onDelete: (id: number) => Promise<boolean>;
  isLoading?: boolean;
}

export function BudgetList({ budgets, onEdit, onDelete, isLoading }: BudgetListProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);

  const handleDeleteClick = (id: number) => {
    setBudgetToDelete(id);
    setShowDeleteModal(true);
    // The dropdown will close automatically when the modal opens
  };

  const handleConfirmDelete = async () => {
    if (budgetToDelete === null) return;
    
    try {
      setIsDeleting(true);
      setDeletingId(budgetToDelete);
      await onDelete(budgetToDelete);
    } catch (error) {
      console.error('Error deleting budget:', error);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setBudgetToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No budgets found for this period
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Budget"
        description="Are you sure you want to delete this budget? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        isDeleting={isDeleting}
      />
      <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell className="font-medium">
                {budget.category.name}
              </TableCell>
              <TableCell className="text-right">
                ₹{budget.amount.toFixed(2)}
              </TableCell>
              <TableCell>
                {format(new Date(`${budget.month}-01`), 'MMM yyyy')}
              </TableCell>
              <TableCell className="text-right">
                {/* Desktop/Tablet actions */}
                <div className="hidden md:flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(budget)}
                    disabled={deletingId === budget.id}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(budget.id)}
                    disabled={deletingId === budget.id}
                  >
                    {deletingId === budget.id ? (
                      <div className="h-4 w-4 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>

                {/* Mobile kebab menu */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-violet-950 border-violet-200 dark:border-violet-800">
                      <DropdownMenuItem 
                        onClick={() => onEdit(budget)}
                        className="cursor-pointer"
                        disabled={deletingId === budget.id}
                      >
                        <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(budget.id)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                        disabled={deletingId === budget.id}
                      >
                        {deletingId === budget.id ? (
                          <div className="mr-2 h-4 w-4 border-2 border-current rounded-full border-t-transparent animate-spin"></div>
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </>
  );
}
