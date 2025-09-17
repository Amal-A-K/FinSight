'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MonthPicker } from '@/components/ui/month-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BudgetList } from '@/components/BudgetList';
import { toast } from 'react-toastify';
import { Category } from '@prisma/client';
import { AddBudgetModal } from '@/components/ui/add-budget-modal';
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

export default function BudgetsPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM')
  );

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, [toast]);

  // Fetch budgets
  const fetchBudgets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/budgets?month=${selectedMonth}`);
      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth]);

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingBudget(null);
    fetchBudgets();
  };

  const handleEdit = (budget: BudgetWithCategory) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/budgets?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }

      setBudgets(budgets.filter((budget) => budget.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  };

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);

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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              For {format(new Date(`${selectedMonth}-01`), 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories Budgeted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.length}</div>
            <p className="text-xs text-muted-foreground">
              out of {categories.length} categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{budgets.length > 0 ? (totalBudget / budgets.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">per category</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budgets for {format(new Date(`${selectedMonth}-01`), 'MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetList 
            budgets={budgets} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            isLoading={isLoading} 
          />
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
