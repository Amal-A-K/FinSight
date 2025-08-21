'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import type { TooltipProps } from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

interface CustomTooltipProps extends TooltipProps<number, string> {
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      percent?: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  
  return (
    <div className={cn(
      // Base styles
      "rounded-lg border p-3 shadow-lg text-sm",
      // Light mode
      "border-violet-200 bg-violet-50 text-violet-900",
      // Dark mode
      "dark:border-violet-900/50 dark:bg-violet-900/90 dark:text-violet-50"
    )}>
      <p className="font-semibold text-violet-700 dark:text-violet-200">{data.name}</p>
      <p className="mt-1 font-medium">
        <span className="text-violet-600 dark:text-violet-300">
          ₹{data.value.toFixed(2)}
        </span>
        <span className="text-violet-500 dark:text-violet-400">
          {' '}({(data.percent ? data.percent * 100 : 0).toFixed(2)}%)
        </span>
      </p>
    </div>
  );
};

interface PieData {
  name: string;
  value: number;
  percent?: number;
}

export function CategoryPieChart({ data }: { data: PieData[] }) {

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8B5CF6"
            dataKey="value"
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <RechartsTooltip 
            content={<CustomTooltip />}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}