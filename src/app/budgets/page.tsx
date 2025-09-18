'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
// Removed unused useRouter import
import { format, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MonthPicker } from '@/components/ui/month-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BudgetList } from '@/components/BudgetList';
import { toast } from 'react-toastify';
import { Category } from '@prisma/client';
import { AddBudgetModal } from '@/components/ui/add-budget-modal';
import { Prisma } from '@prisma/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingContainer } from '@/components/ui/loading-container';

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

// Stats component to show loading and error states
const BudgetStats = ({ 
  totalBudget, 
  budgetCount, 
  categoryCount,
  selectedMonth,
  isLoading 
}: { 
  totalBudget: number; 
  budgetCount: number; 
  categoryCount: number;
  selectedMonth: string;
  isLoading: boolean;
}) => (
  <div className="grid gap-4 md:grid-cols-3">
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">₹{totalBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              For {format(new Date(`${selectedMonth}-01`), 'MMMM yyyy')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Categories Budgeted</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{budgetCount}</div>
            <p className="text-xs text-muted-foreground">
              out of {categoryCount} categories
            </p>
          </>
        )}
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Average Budget</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">
              ₹{budgetCount > 0 ? (totalBudget / budgetCount).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">per category</p>
          </>
        )}
      </CardContent>
    </Card>
  </div>
);

// Main component with error boundary
export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM')
  );

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsCategoriesLoading(true);
      setError(null);
      const response = await fetch('/api/categories');
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      const message = err instanceof Error ? err.message : 'Failed to load categories';
      setError(message);
      toast.error(message);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch budgets
  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/budgets?month=${selectedMonth}`);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch budgets');
      }
      const data = await response.json();
      setBudgets(data);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      const message = err instanceof Error ? err.message : 'Failed to load budgets';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, fetchBudgets]);

  const handleEdit = (budget: BudgetWithCategory) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined) {
      toast.error('Invalid budget ID');
      return false;
    }

    try {
      const response = await fetch(`/api/budgets?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete budget');
      }

      setBudgets(prevBudgets => prevBudgets.filter((budget) => budget.id !== id));
      toast.success('Budget deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting budget:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete budget';
      toast.error(message);
      return false;
    }
  };

  const totalBudget = useMemo(() => 
    budgets.reduce((sum, budget) => sum + budget.amount, 0),
    [budgets]
  );

  // Show loading state while categories are loading
  if (isCategoriesLoading) {
    return <LoadingContainer className="min-h-[50vh]" />;
  }

  // Show error state if categories failed to load
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setError(null);
              fetchCategories();
              fetchBudgets();
            }}
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-violet-900 dark:text-violet-100">Budget Management</h1>
        {/* Controls on desktop/tablet */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          </div>
          <Button onClick={() => setIsFormOpen(true)}>Add Budget</Button>
        </div>
      </div>

      {/* Controls Row (mobile only) */}
      <div className="flex md:hidden items-center justify-between gap-3">
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} className="relative flex-1" />
        <Button onClick={() => setIsFormOpen(true)} className="shrink-0">Add Budget</Button>
      </div>

      {isLoading ? (
        <LoadingContainer message="Loading budget data..." className="min-h-[300px]" />
      ) : (
        <BudgetStats 
          totalBudget={totalBudget}
          budgetCount={budgets.length}
          categoryCount={categories.length}
          selectedMonth={selectedMonth}
          isLoading={false}
        />
      )}

      <Card aria-live="polite" aria-busy={isLoading}>
        <CardHeader>
          <CardTitle>
            Budgets for {format(new Date(`${selectedMonth}-01`), 'MMMM yyyy')}
            {isLoading && (
              <span className="sr-only">Loading...</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary
            fallback={
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load budgets. Please try again.
                </AlertDescription>
              </Alert>
            }
          >
            <BudgetList 
              budgets={budgets} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
              isLoading={isLoading} 
            />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Add/Edit Budget Modal */}
      <AddBudgetModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBudget(null);
        }}
        onBudgetAdded={() => {
          fetchBudgets();
          setIsFormOpen(false);
          setEditingBudget(null);
        }}
        initialMonth={selectedMonth}
        initialData={editingBudget ? {
          id: editingBudget.id,
          categoryId: editingBudget.category.id.toString(),
          amount: editingBudget.amount.toString(),
          month: editingBudget.month
        } : undefined}
      />
    </div>
  );
}
