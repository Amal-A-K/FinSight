'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
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
        <div className={cn(
          "rounded-lg border p-3 shadow-lg text-sm",
          "border-violet-200 bg-violet-50 text-violet-900",
          "dark:border-violet-900/50 dark:bg-violet-900/90 dark:text-violet-50"
        )}>
          <p className="font-semibold text-violet-700 dark:text-violet-200">{label || 'Category'}</p>
          <div className="space-y-1 mt-1">
            <div className="flex justify-between">
              <span className="text-violet-600 dark:text-violet-300">Budget:</span>
              <span className="font-medium">₹{budget.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-violet-600 dark:text-violet-300">Spent:</span>
              <span className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                ₹{spent.toFixed(2)} {isOverBudget && '(Over)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-violet-600 dark:text-violet-300">Remaining:</span>
              <span className={`font-medium ${remaining < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                ₹{Math.abs(remaining).toFixed(2)} {remaining < 0 ? '(Over)' : '(Left)'}
              </span>
            </div>
            {budget > 0 && (
              <div className="flex justify-between">
                <span className="text-violet-600 dark:text-violet-300">Utilization:</span>
                <span className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
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

  interface AxisTickProps {
    x?: number;
    y?: number;
    payload?: {
      value: string;
    };
  }

  const CustomizedAxisTick = ({ x, y, payload }: AxisTickProps) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#666">
          {payload?.value}
        </text>
      </g>
    );
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
        {/* Budget Legend */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-violet-500 to-violet-600" />
          <span>Budget</span>
        </div>
        
        {/* Spent (Under Budget) */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-green-500 to-green-600" />
          <span>Spent (Under Budget)</span>
        </div>
        
        {/* Spent (Over Budget) */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-red-500 to-red-600" />
          <span>Spent (Over Budget)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      <div className="h-full w-full">
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
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="overBudgetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
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
              tickFormatter={(value) => `₹${value}`}
              tick={{ fill: '#6b21a8' }}
              tickLine={{ stroke: '#8b5cf6' }}
              axisLine={{ stroke: '#8b5cf6' }}
              className="dark:text-violet-300"
              width={80}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ 
                fill: 'rgba(196, 181, 253, 0.2)',
                radius: 4,
                stroke: '#8b5cf6',
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
