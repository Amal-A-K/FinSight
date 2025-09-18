'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Cell,
} from 'recharts';
import { useAppSelector } from '@/lib/hooks';
import { selectAllTransactions } from '@/features/transactions/transactionSlice';
import { selectAllCategories } from '@/features/categories/categorySlice';
import { selectBudgets } from '@/features/budget/budgetSlice';
import { Category } from '@/types/category';
import { BudgetItem } from '@/features/budget/budgetSlice';
import { Transaction } from '@/types/transaction';

interface ChartDataItem {
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  overBudget: number;
  budgetPercentage: number;
}

interface BudgetVsActualChartProps {
  month: string;
}

export default function BudgetVsActualChart({ month }: BudgetVsActualChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const categories = useAppSelector(selectAllCategories) as Category[];
  
  // Theme colors - using card's background colors
  const colors = {
    background: 'transparent', // Make chart background transparent to show card's background
    text: isDark ? '#e9d5ff' : '#4c1d95',
    grid: isDark ? 'rgba(167, 139, 250, 0.2)' : 'rgba(139, 92, 246, 0.1)',
    tooltipBg: isDark ? 'rgba(76, 29, 149, 0.9)' : '#f5f3ff', // Matches MonthlyExpenseChart's dark:bg-violet-900/90
    tooltipText: isDark ? '#f5f3ff' : '#4c1d95',
    tooltipBorder: isDark ? 'rgba(124, 58, 237, 0.5)' : '#c4b5fd',
  };
  const allTransactions = useAppSelector(selectAllTransactions);
  
  // Format the month to ensure consistency (YYYY-MM)
  const formattedMonth = useMemo(() => {
    const [year, monthNum] = month.split('-').map(Number);
    return `${year}-${String(monthNum).padStart(2, '0')}`;
  }, [month]);

  // Filter transactions by month
  const transactions = useMemo<Transaction[]>(() => {
    const [year, monthNum] = formattedMonth.split('-').map(Number);
    
    return allTransactions.filter((transaction: Transaction) => {
      const transactionDate = new Date(transaction.date);
      const transactionYear = transactionDate.getFullYear();
      const transactionMonth = transactionDate.getMonth() + 1;
      
      return transactionYear === year && transactionMonth === monthNum;
    });
  }, [allTransactions, formattedMonth]);
  const budgets: BudgetItem[] = useAppSelector(selectBudgets);
  const isLoading = false;
  const isError = false;

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (!transactions || !budgets || !Array.isArray(budgets)) {
      return [];
    }

    // 1. Calculate spending by category for the current month
    const categorySpending: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (transactionMonth === month) {
        const categoryId = transaction.categoryId?.toString() || 'uncategorized';
        categorySpending[categoryId] = (categorySpending[categoryId] || 0) + Math.abs(transaction.amount);
      }
    });

    // 2. Filter and process budgets for the current month
    const filteredBudgets = budgets
      .filter(budget => {
        if (!budget) return false;
        
        // Normalize budget month format (should already be in YYYY-MM format from the API)
        const budgetMonth = budget.month || '';
        const matches = budgetMonth.startsWith(month.substring(0, 7)); // Match YYYY-MM
        
        if (!matches) return false;
        
        // Ensure we have a valid category ID
        const budgetCategoryId = budget.categoryId?.toString();
        if (!budgetCategoryId || budgetCategoryId === '0') {
          return false;
        }
        
        // Ensure the category exists
        const category = categories.find(c => c.id.toString() === budgetCategoryId);
        if (!category) {
          return false;
        }
        
        return true;
      })
      .map(budget => ({
        ...budget,
        // Ensure category info is complete
        category: {
          id: budget.categoryId,
          name: budget.category?.name || 'Uncategorized'
        }
      }));

    // 3. Create chart data
    const chartDataItems = filteredBudgets.map(budget => {
      const budgetCategoryId = budget.categoryId.toString();
      const category = categories.find(c => c.id.toString() === budgetCategoryId);
      const spent = categorySpending[budgetCategoryId] || 0;
      const remaining = Math.max(0, budget.amount - spent);
      const overBudget = Math.max(0, spent - budget.amount);
      const budgetPercentage = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;

      return {
        name: category?.name || `Category ${budgetCategoryId}`,
        budget: budget.amount,
        spent,
        remaining,
        overBudget,
        budgetPercentage,
        categoryId: budgetCategoryId,
        categoryName: category?.name || 'Uncategorized'
      };
    });

    return chartDataItems.sort((a, b) => b.spent - a.spent);
  }, [transactions, budgets, categories, month]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading budgets</div>;

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">
          No budget data available. Set up budgets to see the comparison.
        </p>
      </div>
    );
  }

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      payload: ChartDataItem;
      color?: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const budget = payload[0].value;
      const spent = payload[1].value;
      const remaining = budget - spent;
      const isOverBudget = spent > budget;
      
      return (
        <div 
          className={"rounded-lg border p-3 shadow-lg text-sm " +
          "border-violet-200 bg-violet-50 text-violet-900 " +
          "dark:border-violet-900/50 dark:bg-violet-900/90 dark:text-violet-50"}
        >
          <p className="font-semibold" style={{ color: isDark ? '#e9d5ff' : '#5b21b6' }}>{label || 'Category'}</p>
          <div className="space-y-1 mt-1">
            <div className="flex justify-between">
              <span style={{ color: isDark ? '#c4b5fd' : '#6d28d9' }}>Budget:</span>
              <span className="font-medium">₹{budget.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: isDark ? '#c4b5fd' : '#6d28d9' }}>Spent:</span>
              <span className="font-medium" style={{ color: isOverBudget ? '#ef4444' : (isDark ? '#34d399' : '#059669') }}>
                ₹{spent.toFixed(2)} {isOverBudget && '(Over)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: isDark ? '#c4b5fd' : '#6d28d9' }}>Remaining:</span>
              <span className="font-medium" style={{ color: remaining < 0 ? '#ef4444' : (isDark ? '#34d399' : '#059669') }}>
                ₹{Math.abs(remaining).toFixed(2)} {remaining < 0 ? '(Over)' : '(Left)'}
              </span>
            </div>
            {budget > 0 && (
              <div className="flex justify-between">
                <span style={{ color: isDark ? '#c4b5fd' : '#6d28d9' }}>Utilization:</span>
                <span className="font-medium" style={{ color: isOverBudget ? '#ef4444' : (isDark ? '#34d399' : '#059669') }}>
                  {Math.min(100, (spent / budget) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  interface CustomLegendProps {
    payload?: Array<{
      value: string;
      color?: string;
    }>;
  }

  const CustomLegend = ({}: CustomLegendProps) => {
    return (
      <div 
        className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs"
        style={{ color: colors.text }}
      >
        {/* Budget Legend */}
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ background: 'linear-gradient(to bottom, #8b5cf6, #7c3aed)' }}
          />
          <span>Budget</span>
        </div>
        
        {/* Spent (Under Budget) */}
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm"
            style={{ background: isDark ? 'linear-gradient(to bottom, #34d399, #059669)' : 'linear-gradient(to bottom, #10b981, #059669)' }}
          />
          <span>Spent (Under Budget)</span>
        </div>
        
        {/* Spent (Over Budget) */}
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm"
            style={{ background: 'linear-gradient(to bottom, #ef4444, #dc2626)' }}
          />
          <span>Spent (Over Budget)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white dark:bg-violet-950/30 rounded-lg">
      <div className="h-full w-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barGap={0}
            barCategoryGap="25%"
            barSize={20}
          >
            <defs>
              <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor={isDark ? '#6d28d9' : '#7c3aed'} />
              </linearGradient>
              <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#34d399' : '#10b981'} />
                <stop offset="100%" stopColor={isDark ? '#059669' : '#047857'} />
              </linearGradient>
              <linearGradient id="overBudgetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor={isDark ? '#dc2626' : '#b91c1c'} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? 'rgba(167, 139, 250, 0.2)' : 'rgba(139, 92, 246, 0.15)'}
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              tick={{ 
                fill: isDark ? '#e9d5ff' : '#4c1d95',
                fontSize: 12
              }}
              tickLine={{ 
                stroke: isDark ? '#8b5cf6' : '#7c3aed',
                strokeWidth: 1
              }}
              axisLine={{ 
                stroke: isDark ? '#7c3aed' : '#6d28d9',
                strokeWidth: 1
              }}
              tickMargin={8}
            />
            <YAxis 
              tickFormatter={(value) => `₹${value}`}
              tick={{ 
                fill: isDark ? '#e9d5ff' : '#4c1d95',
                fontSize: 12
              }}
              tickLine={{ 
                stroke: isDark ? '#8b5cf6' : '#7c3aed',
                strokeWidth: 1
              }}
              axisLine={{ 
                stroke: isDark ? '#7c3aed' : '#6d28d9',
                strokeWidth: 1
              }}
              width={80}
              tickMargin={8}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ 
                fill: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(199, 210, 254, 0.3)',
                radius: 4,
                stroke: isDark ? '#8b5cf6' : '#7c3aed',
                strokeWidth: 1
              }}
              wrapperStyle={{ zIndex: 1000 }}
            />
            <Legend content={<CustomLegend />} />
            <Bar 
              dataKey="budget" 
              name="Budget" 
              fill="url(#budgetGradient)"
              radius={[4, 4, 0, 0]}
              activeBar={{
                fill: '#7c3aed',
                stroke: '#6d28d9',
                strokeWidth: 1,
                radius: 4
              }}
            />
            <Bar 
              dataKey="spent" 
              name="Spent"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry: ChartDataItem, index: number) => (
                <Cell 
                  key={`spent-${index}`}
                  fill={entry.spent > (entry.budget || 0) ? 'url(#overBudgetGradient)' : 'url(#spentGradient)'}
                  radius={4}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
