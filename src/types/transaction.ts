export interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
  type: 'expense' | 'income';
  category?: {
    id: number;
    name: string;
  };
  categoryId?: number | null;
}

export interface MonthlyData {
  name: string;
  amount: number;
}