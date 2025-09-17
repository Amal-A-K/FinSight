'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { toast } from 'react-toastify';
import { Prisma } from '@prisma/client';

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
  onDelete: (id: number) => Promise<void>;
  isLoading?: boolean;
}

export function BudgetList({ budgets, onEdit, onDelete, isLoading }: BudgetListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openUp, setOpenUp] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const containerRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.budget-row-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Recompute dropdown position when menu opens or on resize
  useEffect(() => {
    const computePosition = () => {
      if (openMenuId == null) return;
      const el = containerRefs.current[openMenuId];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const viewportW = window.innerWidth;
      const menuWidth = 144; // w-36
      const menuHeight = 96; // approx for two items
      const spaceBelow = viewportH - rect.bottom;
      const spaceRight = viewportW - rect.right;
      const shouldOpenUp = spaceBelow < menuHeight + 8;
      const shouldAlignLeft = spaceRight < menuWidth + 8;
      setOpenUp(shouldOpenUp);
      setAlignLeft(shouldAlignLeft);
      // Compute fixed coordinates
      const top = shouldOpenUp ? Math.max(8, rect.top - menuHeight - 8) : Math.min(viewportH - menuHeight - 8, rect.bottom + 8);
      let left = shouldAlignLeft ? Math.max(8, rect.left) : rect.right - menuWidth;
      left = Math.min(left, viewportW - menuWidth - 8);
      setMenuStyle({ top, left, width: menuWidth, position: 'fixed' });
    };

    computePosition();
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);
    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [openMenuId]);

  const handleDelete = useCallback(async (id: number) => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      setDeletingId(id);
      await onDelete(id);
      toast.success('Budget deleted successfully');
    } catch (error) {
      toast.error('Failed to delete budget');
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
    }
  }, [isDeleting, onDelete]);

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
                    onClick={() => handleDelete(budget.id)}
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
                <div
                  className="md:hidden relative inline-block text-left budget-row-menu"
                  ref={(el) => { containerRefs.current[budget.id] = el; }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((curr) => (curr === budget.id ? null : budget.id));
                    }}
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === budget.id}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                  {openMenuId === budget.id && (
                    <div
                      style={menuStyle ?? undefined}
                      className={`rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900 text-violet-900 dark:text-violet-100 shadow-lg focus:outline-none z-50`}
                    >
                      <div className="py-1">
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-900 dark:text-violet-100 hover:bg-violet-100 dark:hover:bg-violet-800"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEdit(budget);
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-violet-800/40"
                          onClick={() => {
                            setOpenMenuId(null);
                            handleDelete(budget.id);
                          }}
                          disabled={deletingId === budget.id}
                        >
                          {deletingId === budget.id ? (
                            <div className="h-4 w-4 border-2 border-red-500 rounded-full border-t-transparent animate-spin"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
