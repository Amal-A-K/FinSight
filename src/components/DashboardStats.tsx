'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, PieChart, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStatsProps {
  totalExpenses: number;
  topCategory: string;
  avgMonthly?: number;
  percentageChange?: number;
  isLoading?: boolean;
}

export function DashboardStats({ 
  totalExpenses,
  topCategory,
  avgMonthly,
  percentageChange,
  isLoading = false
}: DashboardStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const renderChangeIndicator = (value?: number) => {
    if (value === undefined) return null;
    
    const isPositive = value >= 0;
    return (
      <span className={`text-sm ml-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(value)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[...Array(avgMonthly !== undefined ? 3 : 2)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Expenses Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-600" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Expenses</h3>
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
            {renderChangeIndicator(percentageChange)}
          </div>
        </Card>

        {/* Top Category Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-violet-600" />
              <h3 className="text-sm font-medium text-muted-foreground">Top Category</h3>
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

        {/* Average Monthly Card (conditional) */}
        {avgMonthly !== undefined && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                <h3 className="text-sm font-medium text-muted-foreground">Avg Monthly</h3>
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
        )}
      </div>
    </TooltipProvider>
  );
}