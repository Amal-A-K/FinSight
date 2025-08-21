'use client';

import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { 
  fetchTransactions, 
  selectTransactionsByYear, 
  selectSelectedYear, 
  setSelectedYear, 
  selectTransactionStatus 
} from "@/features/transactions/transactionSlice";
import { fetchCategories } from "@/features/categories/categorySlice";
import { RecentTransactions } from '@/components/RecentTransactions';
import { Skeleton } from '@/components/ui/skeleton';
// import { Loading as LoadingContainer } from './loading';
import Loading from './loading';
import Link from 'next/link';
import { DashboardStats } from '@/components/DashboardStats';
export default function Dashboard() {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector(selectTransactionsByYear);
  const yearFilter = useAppSelector(selectSelectedYear);
  const status = useAppSelector(selectTransactionStatus);

  // Fetch transactions and categories on component mount and when year changes
  useEffect(() => {
    const loadData = async () => {
      try {
        if (status === 'idle' || status === 'succeeded' || status === 'failed') {
          await Promise.all([
            dispatch(fetchTransactions(yearFilter)),
            dispatch(fetchCategories())
          ]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [dispatch, yearFilter]);

  const handleYearChange = (increment: number) => {
    dispatch(setSelectedYear(yearFilter + increment));
  };

  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <Loading />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
          <p className="text-muted-foreground mb-4">There was an error loading your dashboard data.</p>
          <Button 
            onClick={() => {
              dispatch(fetchTransactions(yearFilter));
              dispatch(fetchCategories());
            }}
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!transactions) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No data available</p>
          <Button asChild>
            <Link href="/add-transaction">Add Transaction</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate category totals using ALL transactions
  const categoryData = Object.values(
    transactions
      .filter((transaction): transaction is Transaction & { category: NonNullable<Transaction['category']> } => 
        Boolean(transaction.category)
      )
      .reduce<Record<string, { name: string; value: number }>>((acc, transaction) => {
        const categoryId = transaction.category.id;
        if (!acc[categoryId]) {
          acc[categoryId] = {
            name: transaction.category.name,
            value: 0
          };
        }
        acc[categoryId].value += transaction.amount;
        return acc;
      }, {})
  );

  // Filter out zero values
  const nonZeroCategoryData = categoryData.filter(item => item.value > 0);

  // Calculate metrics
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
  const topCategory = nonZeroCategoryData.length > 0 
    ? nonZeroCategoryData.reduce((a, b) => 
        a.value > b.value ? a : b
      ).name
    : 'No categories';

  // Prepare dashboard data
  const dashboardData = {
    totalExpenses,
    topCategory,
    categoryData,
    recentTransactions: transactions.slice(0, 5) // Show last 5 transactions
  };

  const refreshData = () => {
    dispatch(fetchTransactions(yearFilter));
    dispatch(fetchCategories());
  };

  // Process ALL transactions for monthly bar chart
  // Custom Tooltip component for BarChart
  const BarChartTooltip = ({
    active,
    payload,
    label
  }: {
    active?: boolean;
    payload?: Array<{ value?: number | string }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className={cn(
        // Base styles
        "rounded-lg border p-3 shadow-lg text-sm",
        // Light mode
        "border-violet-200 bg-violet-50 text-violet-900",
        // Dark mode
        "dark:border-violet-900/50 dark:bg-violet-900/90 dark:text-violet-50"
      )}>
        <p className="font-semibold text-violet-700 dark:text-violet-200">Month: {label}</p>
        <p className="mt-1 font-medium">
          <span className="text-violet-600 dark:text-violet-300">
            {formatCurrency(Number(payload[0]?.value) || 0)}
          </span>
        </p>
      </div>
    );
  };

  const getMonthlyData = () => {
    if (!transactions) return [];
    
    // Create array for all 12 months
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // Initialize all months with 0
    const monthlyData = months.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {} as Record<string, number>);
    
    // Add transaction amounts to respective months
    transactions.forEach(transaction => {
      const month = new Date(transaction.date).toLocaleString('default', { month: 'short' });
      monthlyData[month] += transaction.amount;
    });

    // Convert to array format for chart
    return months.map(month => ({
      name: month,
      amount: monthlyData[month]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header with Year Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-violet-900 dark:text-violet-300">
            FinSight Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Insights into your spending patterns for {yearFilter}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={yearFilter.toString()}
            onValueChange={(value) => handleYearChange(parseInt(value) - yearFilter)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2022, 2023, 2024, 2025].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshData}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats 
        totalExpenses={dashboardData.totalExpenses} 
        topCategory={dashboardData.topCategory} 
      />

      {/* Monthly Spending Bar Chart */}
      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Monthly Spending - {yearFilter}</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={getMonthlyData()}
              barGap={0}
              barCategoryGap="10%"
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e9d5ff" 
                vertical={false}
                className="dark:stroke-violet-900/50"
              />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b21a8' }}
                tickLine={{ stroke: '#8b5cf6' }}
                axisLine={{ stroke: '#8b5cf6' }}
                className="dark:text-violet-300"
              />
              <YAxis 
                tickFormatter={(value: number) => formatCurrency(value)}
                tick={{ fill: '#6b21a8' }}
                tickLine={{ stroke: '#8b5cf6' }}
                axisLine={{ stroke: '#8b5cf6' }}
                className="dark:text-violet-300"
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                width={100}
                tickCount={6}
              />
              <RechartsTooltip 
                content={<BarChartTooltip />}
                cursor={{ 
                  fill: 'rgba(196, 181, 253, 0.2)',
                  radius: 4,
                  stroke: '#8b5cf6',
                  strokeWidth: 1
                }}
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Bar 
                dataKey="amount" 
                fill="url(#barGradient)"
                radius={4}
                activeBar={{
                  fill: '#7c3aed',
                  stroke: '#6d28d9',
                  strokeWidth: 1,
                  radius: 4
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category Breakdown and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Spending by Category - {yearFilter}</h2>
          <div className="h-[300px]">
            <CategoryPieChart data={dashboardData.categoryData} />
          </div>
        </Card>
        
        <Card className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <RecentTransactions transactions={dashboardData.recentTransactions} />
        </Card>
      </div>
    </div>
  );
}