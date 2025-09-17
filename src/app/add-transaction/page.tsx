"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Category {
  id: number;
  name: string;
}

export default function AddTransaction() {
  const [categories, setCategories] = useState<Category[]>([]);
  // Ensure categoryId is always a string for the Select component
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    categoryId: "no-category"
  });

  const router = useRouter();

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
      })
      .catch(() => {
        toast.error('Failed to load categories');
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId === 'no-category' ? '' : formData.categoryId
      };
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add transaction');
      }
      
      toast.success('Transaction added successfully');
      router.push('/transactions');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add transaction');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-violet-50 dark:bg-violet-950/50 p-6 rounded-lg shadow-md dark:shadow-violet-900/20 border border-violet-100 dark:border-violet-800">
      <h1 className="text-2xl font-bold mb-6 text-violet-900 dark:text-violet-100">Add Transaction</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-violet-700 dark:text-violet-300">Amount</label>
          <Input 
            type="number" 
            step="0.01"
            placeholder="0.00"
            required 
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
          />
        </div>
        <div>
          <label className="block mb-1 text-violet-700 dark:text-violet-300">Description</label>
          <Input 
            type="text" 
            placeholder="What was this for?"
            required 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div>
          <label className="block mb-1 text-violet-700 dark:text-violet-300">Date</label>
          <DatePicker
            value={formData.date}
            onChange={(date) => setFormData({...formData, date})}
          />
        </div>
        <div>
          <label className="block mb-1 text-violet-700 dark:text-violet-300">Category</label>
          <Select
            onValueChange={(value) => {
              setFormData(prev => ({
                ...prev,
                categoryId: value
              }));
            }}
            value={formData.categoryId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-category">No category</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full bg-violet-950 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-700 text-white">
          Add Transaction
        </Button>
      </form>
    </div>
  );
}