'use client';

import { useState, useEffect, useRef } from 'react';
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
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);
  const containerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  
  // Remove unused state variables but keep the code functional
  const [, setMenuStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isMenuButton = target.closest('.menu-button') || target.closest('.budget-row-menu');
      if (!isMenuButton) {
        setOpenMenuId(null);
      }
    };

    const positionMenu = () => {
      if (openMenuId === null) return;
      
      const buttonEl = document.querySelector(`[data-menu-button="${openMenuId}"]`);
      const menuEl = document.querySelector(`[data-menu="${openMenuId}"]`);
      
      if (!buttonEl || !menuEl) return;
      
      const buttonRect = buttonEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const menuHeight = 96; // Approximate menu height
      const menuWidth = 144; // w-36
      
      // Calculate available space with more conservative margins
      const margin = 12; // Increased from 8px to 12px
      const spaceBelow = viewportHeight - buttonRect.bottom - margin;
      const spaceAbove = buttonRect.top - margin;
      const spaceRight = viewportWidth - buttonRect.right - margin;
      const spaceLeft = buttonRect.left - margin;
      
      // Determine position - prefer down if there's enough space, otherwise up
      const shouldOpenUp = spaceBelow < menuHeight && spaceAbove >= menuHeight;
      const shouldOpenDown = spaceBelow >= menuHeight || spaceBelow > spaceAbove;
      
      // Determine alignment - prefer left if there's enough space, otherwise right
      const shouldAlignRight = spaceRight < menuWidth && spaceLeft >= spaceRight;
      
      // Apply position with CSS classes
      menuEl.classList.remove('top-full', 'bottom-full', 'left-0', 'right-0');
      
      if (shouldOpenUp) {
        menuEl.classList.add('bottom-full', 'mb-1');
      } else {
        menuEl.classList.add('top-full', 'mt-1');
      }
      
      if (shouldAlignRight) {
        menuEl.classList.add('right-0');
      } else {
        menuEl.classList.add('left-0');
      }
      
      // Set data attributes for reference
      menuEl.setAttribute('data-position', shouldOpenUp ? 'top' : 'bottom');
      menuEl.setAttribute('data-align', shouldAlignRight ? 'right' : 'left');
    };
    
    document.addEventListener('click', onDocClick);
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    
    // Initial position
    positionMenu();
    
    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
    };
  }, [openMenuId]);
  
  // Toggle menu function
  const toggleMenu = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(prevId => {
      // If clicking the same button, close the menu
      if (prevId === id) return null;
      
      // Otherwise, open the new menu
      return id;
    });
  };

  const handleDeleteClick = (id: number) => {
    setBudgetToDelete(id);
    setShowDeleteModal(true);
    setOpenMenuId(null); // Close the menu when delete is clicked
  };

  const handleConfirmDelete = async () => {
    if (!budgetToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeletingId(budgetToDelete);
      await onDelete(budgetToDelete);
      toast.success('Budget deleted successfully');
    } catch (error) {
      toast.error('Failed to delete budget');
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
      setBudgetToDelete(null);
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
                <div 
                  className="md:hidden relative inline-block text-left budget-row-menu"
                  ref={el => { containerRefs.current[budget.id] = el; }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => toggleMenu(budget.id, e)}
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === budget.id}
                    className="menu-button relative z-10"
                    type="button"
                    data-menu-button={budget.id}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                  {openMenuId === budget.id && (
                    <div
                      data-menu={budget.id}
                      className="w-36 rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900 text-violet-900 dark:text-violet-100 shadow-lg focus:outline-none"
                      style={{
                        position: 'fixed',
                        zIndex: 50,
                        opacity: 0,
                        transform: 'scale(0.95)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        pointerEvents: 'none',
                      }}
                      ref={(el) => {
                        if (!el) return;
                        
                        // Position the menu
                        const buttonEl = el.previousElementSibling as HTMLElement;
                        if (!buttonEl) return;
                        
                        const buttonRect = buttonEl.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        const viewportWidth = window.innerWidth;
                        const menuHeight = 96; // Approximate menu height
                        const menuWidth = 144; // w-36
                        const menuMargin = 8; // 0.5rem margin
                        
                        // Calculate available space
                        const spaceBelow = viewportHeight - buttonRect.bottom - menuMargin;
                        const spaceAbove = buttonRect.top - menuMargin;
                        const spaceRight = viewportWidth - buttonRect.right - menuMargin;
                        
                        // Determine menu position
                        let topPosition: number;
                        let leftPosition: number;
                        
                        // Vertical positioning
                        if (spaceBelow >= menuHeight || (spaceBelow < menuHeight && spaceAbove < spaceBelow)) {
                          // Open below if there's enough space or if there's more space below than above
                          topPosition = buttonRect.bottom + menuMargin;
                        } else {
                          // Otherwise open above
                          topPosition = buttonRect.top - menuHeight - menuMargin;
                        }
                        
                        // Ensure menu stays within viewport vertically
                        topPosition = Math.max(menuMargin, Math.min(viewportHeight - menuHeight - menuMargin, topPosition));
                        
                        // Horizontal positioning
                        if (spaceRight >= menuWidth || (spaceRight < menuWidth && buttonRect.left < spaceRight)) {
                          // Open to the right if there's enough space or if there's more space on the right
                          leftPosition = buttonRect.left;
                        } else {
                          // Otherwise open to the left
                          leftPosition = buttonRect.right - menuWidth;
                        }
                        
                        // Ensure menu stays within viewport horizontally
                        leftPosition = Math.max(menuMargin, Math.min(viewportWidth - menuWidth - menuMargin, leftPosition));
                        
                        // Apply position
                        el.style.top = `${topPosition}px`;
                        el.style.left = `${leftPosition}px`;
                        
                        // Trigger animation
                        requestAnimationFrame(() => {
                          el.style.opacity = '1';
                          el.style.transform = 'scale(1)';
                          el.style.pointerEvents = 'auto';
                        });
                      }}
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
                            handleDeleteClick(budget.id);
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
    </>
  );
}
