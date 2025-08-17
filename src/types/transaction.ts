export interface Transaction {
  id: number;
  amount: number;
  date: string | Date;
  description: string;
  createdAt: string | Date;
}

export interface MonthlyData {
  name: string;
  amount: number;
}