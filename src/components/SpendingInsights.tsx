'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/lib/hooks';
import { selectAllCategories } from '@/features/categories/categorySlice';
import { selectBudgets } from '@/features/budget/budgetSlice';
import { Transaction } from '@/types/transaction';

// Simple date formatter
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

interface SpendingInsightsProps {
  month: string;
}

export default function SpendingInsights({ month }: SpendingInsightsProps) {
  const { theme } = useTheme();
  const categories = useAppSelector(selectAllCategories);
  const allTransactions = useAppSelector((state: any) => state.transactions.transactions);
  const budgets = useAppSelector(selectBudgets);
  
  // Filter transactions by month
  const transactions = useMemo<Transaction[]>(() => {
    const [year, monthNum] = month.split('-').map(Number);
    return allTransactions.filter((transaction: Transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getFullYear() === year && 
        (transactionDate.getMonth() + 1) === monthNum
      );
    });
  }, [allTransactions, month]);

  // Calculate spending metrics
  const { totalSpent, spendingByCategory, overBudgetCategories, topSpendingCategory } = useMemo(() => {
    const spendingByCategory: Record<string, number> = {};
    let totalSpent = 0;
    const overBudgetCategories: Array<{ name: string; spent: number; budget: number }> = [];

    // Calculate spending by category
    transactions.forEach((transaction: Transaction) => {
      if (transaction.type === 'expense') {
        const amount = Math.abs(transaction.amount);
        const categoryId = transaction.categoryId?.toString() || 'uncategorized';
        spendingByCategory[categoryId] = (spendingByCategory[categoryId] || 0) + amount;
        totalSpent += amount;
      }
    });

    // Find over-budget categories and top spending category
    let maxSpent = 0;
    let topCategory = { name: 'No spending yet', amount: 0 };

    Object.entries(spendingByCategory).forEach(([categoryId, spent]) => {
      // Handle both string and number category IDs
      const category = categories.find(c => c.id.toString() === categoryId);
      if (!category) return;

      const budget = budgets.find((b: any) => {
        const budgetCategoryId = typeof b.categoryId === 'number' ? b.categoryId.toString() : b.categoryId;
        return budgetCategoryId === categoryId && b.month === month;
      });

      // Track top spending category
      if (spent > maxSpent) {
        maxSpent = spent;
        topCategory = { name: category.name, amount: spent };
      }

      // Track over-budget categories
      if (budget && spent > budget.amount) {
        overBudgetCategories.push({
          name: category.name,
          spent,
          budget: budget.amount
        });
      }
    });

    return {
      totalSpent,
      spendingByCategory,
      overBudgetCategories,
      topSpendingCategory: topCategory,
    };
  }, [transactions, categories, budgets, month]);

  // Calculate month-over-month change (simplified)
  const previousMonth = new Date(month + '-01');
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthStr = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
  
  const previousMonthSpent = useMemo(() => {
    const [year, monthNum] = previousMonthStr.split('-').map(Number);
    return allTransactions
      .filter((t: Transaction) => {
        if (t.type !== 'expense') return false;
        const date = new Date(t.date);
        return date.getFullYear() === year && (date.getMonth() + 1) === monthNum;
      })
      .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);
  }, [allTransactions, previousMonthStr]);

  const spendingChange = previousMonthSpent > 0 
    ? ((totalSpent - previousMonthSpent) / previousMonthSpent) * 100 
    : totalSpent > 0 ? 100 : 0;

  // Calculate total budget
  const totalBudget = useMemo(() => {
    if (!budgets || !Array.isArray(budgets)) return 0;
    return budgets
      .filter((b: any) => b.month === month)
      .reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
  }, [budgets, month]);

  // Calculate budget utilization
  const budgetUtilization = totalBudget > 0 
    ? Math.min(100, (totalSpent / totalBudget) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Over-budget Alerts */}
      {overBudgetCategories.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Over Budget Alerts
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {overBudgetCategories.map(({ name, spent, budget }) => (
              <div key={name} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  Over Budget: {name}
                </h4>
                <p className="text-sm text-red-600 dark:text-red-300">
                  You've spent ₹{spent.toFixed(2)} out of ₹{budget.toFixed(2)} budget 
                  (₹{(spent - budget).toFixed(2)} over)
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <span className="text-muted-foreground text-xs">
              {formatDate(new Date(month + '-01'))}
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {spendingChange >= 0 ? (
                <span className="text-red-500 mr-1">↑</span>
              ) : (
                <span className="text-green-500 mr-1">↓</span>
              )}
              {Math.abs(spendingChange).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <span className="text-muted-foreground text-xs">
              {totalBudget > 0 ? `${budgetUtilization.toFixed(0)}%` : 'No budget set'}
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalSpent.toFixed(2)} / ₹{totalBudget.toFixed(2)}
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  budgetUtilization > 100 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Spending Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topSpendingCategory.name}</div>
            <p className="text-xs text-muted-foreground">
              ₹{topSpendingCategory.amount.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              overBudgetCategories.length > 0 ? 'text-red-600 dark:text-red-400' : ''
            }`}>
              {overBudgetCategories.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {overBudgetCategories.length === 0 
                ? 'No categories over budget' 
                : `${overBudgetCategories.length} categor${overBudgetCategories.length === 1 ? 'y' : 'ies'} over budget`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(spendingByCategory).length > 0 ? (
              Object.entries(spendingByCategory)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([categoryId, amount]) => {
                  // Handle both string and number category IDs
                  const category = categories.find(c => c.id.toString() === categoryId) || { name: 'Uncategorized' };
                  const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                  
                  return (
                    <div key={categoryId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{category.name}</span>
                        <span className="font-medium">₹{amount.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-muted-foreground text-sm">
                No spending data available for {formatDate(new Date(month + '-01'))}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
