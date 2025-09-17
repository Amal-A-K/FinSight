export interface Category {
  id: number;
  name: string;
  type: 'expense' | 'income';
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}
