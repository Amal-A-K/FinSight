'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, PieChart, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';

interface DashboardStatsProps {
  totalExpenses: number;
  topCategory: string;
  totalBudget?: number;
  avgMonthly?: number;
  isLoading?: boolean;
}

export default function DashboardStats({ 
  totalExpenses,
  topCategory,
  totalBudget,
  avgMonthly,
  isLoading = false
}: DashboardStatsProps) {

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(avgMonthly !== undefined ? 4 : 2)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  // Render all cards in a consistent way to maintain hook order
  const renderTotalExpensesCard = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-600" />
          <h3 className="text-sm font-medium text-violet-700 dark:text-violet-300">Total Expenses</h3>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Sum of all transactions this period</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-baseline mt-1">
        <p className="text-2xl font-bold">
          {formatCurrency(totalExpenses)}
        </p>
      </div>
    </Card>
  );

  const renderTopCategoryCard = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-violet-600" />
          <h3 className="text-sm font-medium text-violet-700 dark:text-violet-300">Top Category</h3>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Your highest spending category</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-2xl font-bold mt-1">
        {topCategory || 'N/A'}
      </p>
    </Card>
  );

  const renderAvgMonthlyCard = () => {
    if (avgMonthly === undefined) return null;
    
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            <h3 className="text-sm font-medium text-violet-700 dark:text-violet-300">Avg Monthly</h3>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Average spending per month</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-2xl font-bold mt-1">
          {formatCurrency(avgMonthly)}
        </p>
      </Card>
    );
  };

  const renderTotalBudgetCard = () => {
    if (totalBudget === undefined) return null;
    
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-violet-600" />
            <h3 className="text-sm font-medium text-violet-700 dark:text-violet-300">Monthly Budget</h3>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Total budget for the current month</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-2xl font-bold mt-1">
          {formatCurrency(totalBudget)}
        </p>
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {renderTotalExpensesCard()}
        {renderTopCategoryCard()}
        {renderAvgMonthlyCard()}
        {renderTotalBudgetCard()}
      </div>
    </TooltipProvider>
  );
}