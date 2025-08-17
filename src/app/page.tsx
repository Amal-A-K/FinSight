'use client'; // Add this at the top

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { LoadingContainer } from "@/components/ui/loading-container";
import { useEffect, useState, useCallback } from "react";

interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
}

interface MonthlyData {
  name: string;
  amount: number;
}

export default function Dashboard() {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/transactions');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
        const transactions: Transaction[] = data;
        
        const monthlyData = transactions.reduce((acc: Record<number, number>, transaction) => {
          const month = new Date(transaction.date).getMonth();
          acc[month] = (acc[month] || 0) + transaction.amount;
          return acc;
        }, {});

        const formattedData = Object.entries(monthlyData).map(([month, amount]) => ({
          name: new Date(0, parseInt(month)).toLocaleString('default', { month: 'short' }),
          amount: amount as number
        }));

        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // You might want to set an error state here to show to the user
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatYAxisTick = useCallback((value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-violet-900 dark:text-violet-300">FinSight - Personal Finance Tracker Dashboard</h1>
      {isLoading ? (
        <LoadingContainer message="Loading transactions..." className="text-violet-700 dark:text-violet-300" />
      ) : (
        <Card className="p-4 sm:p-6 border-violet-200 dark:border-violet-800 shadow-lg shadow-violet-100 dark:shadow-violet-900/20">
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b21a8' }}  // text-violet-800
                  tickLine={{ stroke: '#7c3aed' }}  // violet-600
                  axisLine={{ stroke: '#7c3aed' }}  // violet-600
                />
                <YAxis 
                  tickFormatter={formatYAxisTick}
                  tick={{ fill: '#6b21a8' }}  // text-violet-800
                  tickLine={{ stroke: '#7c3aed' }}  // violet-600
                  axisLine={{ stroke: '#7c3aed' }}  // violet-600
                />
                <Tooltip 
                  formatter={(value: number) => [
                    formatYAxisTick(value),
                    'Amount'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #8b5cf6',  // violet-500
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.1)',  // violet-600 shadow
                    color: '#6b21a8'  // text-violet-800
                  }}
                  cursor={{ fill: '#8b5cf620' }}  // violet-500 with opacity
                />
                <Bar 
                  dataKey="amount" 
                  fill="#7c3aed"  // violet-600
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                  activeBar={{ fill: '#6d28d9' }}  // violet-700 for hover
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}