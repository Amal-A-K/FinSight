'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { 
  fetchBudgets, 
  saveBudget, 
  selectBudgetsByMonth,
  selectBudgetByCategoryAndMonth,
  selectBudgetLoading,
  selectBudgetError,
  resetBudgets
} from '@/features/budget/budgetSlice';
import { selectAllCategories } from '@/features/categories/categorySlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// Simple toast implementation
const toast = {
  success: (title: string, description: string) => {
    console.log(`Success: ${title} - ${description}`);
  },
  error: (title: string, description: string) => {
    console.error(`Error: ${title} - ${description}`);
  }
};

// Date formatter function
const formatDate = (date: Date, formatStr: string) => {
  if (formatStr === 'yyyy-MM') {
    return format(date, 'yyyy-MM');
  }
  return format(date, 'yyyy-MM-dd');
};

interface BudgetInputs {
  [key: string]: string;
}

export default function BudgetSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector(selectAllCategories);
  const loading = useSelector(selectBudgetLoading);
  const error = useSelector(selectBudgetError);
  
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [budgetInputs, setBudgetInputs] = useState<BudgetInputs>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Get budgets for the selected month
  const budgets = useSelector((state: RootState) => 
    selectBudgetsByMonth(state, selectedMonth)
  );

  // Fetch budgets when month changes
  useEffect(() => {
    dispatch(fetchBudgets(selectedMonth));
    
    // Cleanup function to reset budgets when component unmounts
    return () => {
      dispatch(resetBudgets());
    };
  }, [dispatch, selectedMonth]);

  // Initialize budget inputs when categories or budgets change
  useEffect(() => {
    if (categories.length === 0) return;
    
    const initialInputs: BudgetInputs = {};
    
    categories.forEach(category => {
      const budget = selectBudgetByCategoryAndMonth(
        { budgets: { items: budgets } } as RootState,
        category.id,
        selectedMonth
      );
      
      initialInputs[category.id] = budget ? budget.amount.toString() : '';
    });
    
    setBudgetInputs(initialInputs);
  }, [categories, selectedMonth, budgets]);

  const handleBudgetChange = useCallback((categoryId: string | number, value: string) => {
    const id = typeof categoryId === 'number' ? categoryId.toString() : categoryId;
    setBudgetInputs(prev => ({
      ...prev,
      [id]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Save each budget
      for (const [categoryId, amount] of Object.entries(budgetInputs)) {
        const categoryIdNum = parseInt(categoryId, 10);
        if (isNaN(categoryIdNum)) continue;
        
        if (amount) {
          await dispatch(saveBudget({
            categoryId: categoryIdNum,
            amount: parseFloat(amount) || 0,
            month: selectedMonth,
          })).unwrap();
        } else {
          // Handle zero or empty amount (you might want to delete the budget)
          // await dispatch(deleteBudget({ categoryId: categoryIdNum, month: selectedMonth }));
        }
      }
      
      toast.success('Success', 'Budgets saved successfully');
    } catch (error) {
      console.error('Failed to save budgets:', error);
      toast.error('Error', error instanceof Error ? error.message : 'Failed to save budgets');
    } finally {
      setIsSaving(false);
    }
  }, [budgetInputs, dispatch, selectedMonth]);

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  }, []);

  // Generate month options for the next 12 months
  const monthOptions = useCallback(() => {
    const options: { value: string; label: string }[] = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const value = formatDate(date, 'yyyy-MM');
      const label = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    return options;
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Budget Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <select
              id="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              disabled={loading}
            >
              {monthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {loading && !isSaving ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading budgets...</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-4">
                    <div className="w-1/3">
                      <label 
                        htmlFor={`budget-${category.id}`} 
                        className="block text-sm font-medium text-gray-700"
                      >
                        {category.name}
                      </label>
                    </div>
                    <div className="flex-1">
                      <Input
                        id={`budget-${category.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={budgetInputs[category.id] || ''}
                        onChange={(e) => handleBudgetChange(category.id, e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2 border rounded"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-between items-center">
                {error && (
                  <div className="text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <div className="ml-auto">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : 'Save Budgets'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
