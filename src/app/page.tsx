'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchTransactions, selectTransactionsByYear, selectSelectedYear, setSelectedYear, selectTransactionStatus } from "@/features/transactions/transactionSlice";
import { fetchCategories } from "@/features/categories/categorySlice";
import { fetchBudgets, selectBudgets } from "@/features/budget/budgetSlice";
import { useCallback, useEffect, useMemo, useState } from 'react';
import Loading from './loading';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { MonthlyExpenseChart } from '@/components/MonthlyExpenseChart';
import RecentTransactions from '@/components/RecentTransactions';

interface DashboardStatsProps {
  totalExpenses: number;
  topCategory: string;
  totalBudget?: number;
  avgMonthly?: number;
  percentageChange?: number;
  isLoading?: boolean;
}

interface CategoryPieChartProps {
  data: Array<{
    name: string;
    value: number;
    percent?: number;
  }>;
}

// Dynamically import components with SSR disabled to avoid window is not defined errors
const CategoryPieChart = dynamic<CategoryPieChartProps>(
  () => import('@/components/CategoryPieChart'),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[300px] w-full" /> 
  }
);

const BudgetVsActualChart = dynamic<{ month: string }>(
  () => import('@/components/BudgetVsActualChart').then(mod => mod.default || mod),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[400px] w-full" /> 
  }
);

const DashboardStats = dynamic<DashboardStatsProps>(
  () => import('@/components/DashboardStats').then(mod => mod.default || mod),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[300px] w-full" /> 
  }
);

// Separate component for loading state
const DashboardLoading = () => (
  <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
    <Loading />
  </div>
);

// Separate component for error state
const DashboardError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
    <Card className="p-6 text-center">
      <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
      <p className="text-muted-foreground mb-4">There was an error loading your dashboard data.</p>
      <Button onClick={onRetry}>
        Retry
      </Button>
    </Card>
  </div>
);

// Separate component for empty state
const DashboardEmpty = () => (
  <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
    <Card className="p-6 text-center">
      <p className="text-muted-foreground mb-4">No transactions found</p>
      <Button asChild>
        <Link href="/add-transaction">Add Your First Transaction</Link>
      </Button>
    </Card>
  </div>
);

// Move hooks to the top level of the component
const DashboardContent = () => {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector(selectTransactionsByYear);
  const budgets = useAppSelector(selectBudgets);
  const yearFilter = useAppSelector(selectSelectedYear);
  const status = useAppSelector(selectTransactionStatus);
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Calculate total budget for the current month
  const totalBudget = useMemo(() => {
    if (!Array.isArray(budgets)) {
      return 0;
    }
    
    const currentMonthBudgets = budgets.filter(budget => 
      budget?.month?.startsWith(currentMonth)
    );
    
    return currentMonthBudgets.reduce((sum, budget) => {
      return sum + (budget?.amount || 0);
    }, 0);
  }, [budgets, currentMonth]);

  // Load transactions and categories on initial load
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        await Promise.all([
          dispatch(fetchTransactions(yearFilter)),
          dispatch(fetchCategories())
        ]);
      } catch (error) {
        // Error loading initial data
      } finally {
        if (isMounted) {
          setIsInitialLoad(false);
        }
      }
    };

    if (isInitialLoad) {
      loadInitialData();
    }

    return () => {
      isMounted = false;
    };
  }, [dispatch, yearFilter]);

  // Load budgets whenever the month changes
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        await dispatch(fetchBudgets(currentMonth));
      } catch (error) {
        console.error('Error loading budgets:', error);
      }
    };
    
    loadBudgets();
  }, [dispatch, currentMonth]);

  const dashboardData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        categoryData: [],
        nonZeroCategoryData: [],
        totalExpenses: 0,
        topCategory: 'No categories',
        recentTransactions: [],
        avgMonthly: 0,
        percentageChange: 0
      };
    }

    // Calculate category data - include all transactions since there's no type field
    const categoryMap = transactions
      .filter(t => t && t.amount && t.category) // Only include transactions with amount and category
      .reduce<Record<string, { name: string; value: number }>>((acc, transaction) => {
        const categoryId = transaction.category?.id?.toString() || 'uncategorized';
        if (!acc[categoryId]) {
          acc[categoryId] = {
            name: transaction.category?.name || 'Uncategorized',
            value: 0
          };
        }
        acc[categoryId].value += Math.abs(Number(transaction.amount));
        return acc;
      }, {});

    const categoryData = Object.values(categoryMap);
    const nonZeroCategoryData = categoryData.filter(item => item.value > 0);
    
    // Calculate total expenses based on category
    const totalExpenses = transactions.reduce((sum, t) => {
      if (!t || t.amount === undefined || t.amount === null) return sum;
      const amount = Math.abs(Number(t.amount));
      return isNaN(amount) ? sum : sum + amount;
    }, 0);
    
    // Calculate average monthly expenses (simple average over 12 months)
    const avgMonthly = totalExpenses / 12;

    // Find top category
    const topCategory = nonZeroCategoryData.length > 0 
      ? nonZeroCategoryData.reduce((a, b) => a.value > b.value ? a : b).name
      : categoryData.length > 0
        ? categoryData[0].name
        : 'No categories';

    // Get recent transactions
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      categoryData,
      nonZeroCategoryData,
      totalExpenses,
      topCategory: nonZeroCategoryData[0]?.name || 'No categories',
      recentTransactions,
      avgMonthly,
    };
  }, [transactions]);

  // Generate years from 2020 to current year + 5 for the dropdown
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = 2020; y <= currentYear + 5; y++) {
      years.push(y);
    }
    return years;
  }, []);

  const handleYearSelect = useCallback((value: string) => {
    dispatch(setSelectedYear(parseInt(value, 10)));
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    dispatch(fetchTransactions(yearFilter));
    dispatch(fetchCategories());
  }, [dispatch, yearFilter]);

  // Render the appropriate state based on the status
  const renderContent = () => {
    if (isInitialLoad) {
      return <DashboardLoading />;
    }

    if (status === 'failed') {
      return <DashboardError onRetry={handleRetry} />;
    }
    
    if (status !== 'succeeded') {
      return <DashboardLoading />;
    }

    if (!transactions || transactions.length === 0) {
      return <DashboardEmpty />;
    }

    const { nonZeroCategoryData, recentTransactions } = dashboardData;

    return (
      <>
          <DashboardStats 
            totalExpenses={dashboardData.totalExpenses}
            topCategory={dashboardData.topCategory}
            totalBudget={totalBudget}
            avgMonthly={dashboardData.avgMonthly}
            isLoading={status !== 'succeeded' || isInitialLoad}
          />
        
        {/* Monthly Expense Chart */}
        <MonthlyExpenseChart 
          transactions={transactions}
          year={yearFilter}
          isLoading={isInitialLoad}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
            <div className="h-[300px]">
              <CategoryPieChart data={nonZeroCategoryData} />
            </div>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Budget vs Actual</h3>
            <div className="h-[300px]">
              <BudgetVsActualChart month={currentMonth} />
            </div>
          </Card>
        </div>

        <div className="w-full">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <RecentTransactions transactions={recentTransactions} />
          </Card>
        </div>
      </>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-violet-900 dark:text-violet-100">Dashboard Overview</h2>
          <p className="text-sm text-violet-700 dark:text-violet-300">
            Financial summary for {yearFilter}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={yearFilter.toString()}
            onValueChange={handleYearSelect}
            disabled={isInitialLoad}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

// Wrap the DashboardContent with a default export
const Dashboard = () => <DashboardContent />;

export default Dashboard;