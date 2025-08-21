export interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface MonthlyData {
  name: string;
  amount: number;
}