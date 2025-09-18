'use client';

import { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

interface MonthlyExpenseChartProps {
  transactions: Array<{
    date: string;
    amount: number;
  }>;
  isLoading?: boolean;
  year: number;
}

interface BarChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
}

export function MonthlyExpenseChart({ transactions, isLoading, year }: MonthlyExpenseChartProps) {
  // Process data for the chart
  const monthlyData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Create array for all 12 months
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // Initialize all months with 0
    const monthlyExpenses = months.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {} as Record<string, number>);
    
    // Add expense amounts to respective months
    transactions.forEach(transaction => {
      const month = new Date(transaction.date).toLocaleString('default', { month: 'short' });
      monthlyExpenses[month] += Math.abs(transaction.amount);
    });

    // Convert to array format for chart
    return months.map(month => ({
      name: month,
      amount: monthlyExpenses[month]
    }));
  }, [transactions]);

  // Custom Tooltip component
  const BarChartTooltip = ({ active, payload, label }: BarChartTooltipProps) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className={
        "rounded-lg border p-3 shadow-lg text-sm " +
        "border-violet-200 bg-violet-50 text-violet-900 " +
        "dark:border-violet-900/50 dark:bg-violet-900/90 dark:text-violet-50"
      }>
        <p className="font-semibold text-violet-700 dark:text-white">Month: {label}</p>
        <div className="mt-1">
          <span className="text-violet-600 dark:text-white/80">Amount: </span>
          <span className="font-medium">
            {formatCurrency(Number(payload[0]?.value) || 0)}
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart data...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Monthly Spending - {year}</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={monthlyData}
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
              tick={{ 
                fill: 'var(--text-primary, #4c1d95)',
                fontSize: 12
              }}
              tickLine={{ stroke: 'var(--accent, #7c3aed)' }}
              axisLine={{ stroke: 'var(--accent, #7c3aed)' }}
              className="[--text-primary:#4c1d95] [--accent:#7c3aed] dark:[--text-primary:#ffffff] dark:[--accent:#8b5cf6]"
            />
            <YAxis 
              tickFormatter={(value: number) => formatCurrency(value)}
              tick={{ 
                fill: 'var(--text-primary, #4c1d95)',
                fontSize: 12
              }}
              tickLine={{ stroke: 'var(--accent, #7c3aed)' }}
              axisLine={{ stroke: 'var(--accent, #7c3aed)' }}
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
              width={100}
              tickCount={6}
              className="[--text-primary:#4c1d95] [--accent:#7c3aed] dark:[--text-primary:#ffffff] dark:[--accent:#8b5cf6]"
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
  );
}
