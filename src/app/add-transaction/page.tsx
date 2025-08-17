"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';

export default function AddTransaction() {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add transaction');
      }
      
      toast.success('Transaction added successfully');
      router.push('/transactions');
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to add transaction');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-violet-50 p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-violet-900">Add Transaction</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-violet-700">Amount</label>
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
          <label className="block mb-1 text-violet-700">Description</label>
          <Input 
            type="text" 
            placeholder="What was this for?"
            required 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div>
          <label className="block mb-1 text-violet-700">Date</label>
          <Input 
            type="date" 
            required 
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
        </div>

        <Button type="submit" className="w-full bg-violet-950 hover:bg-violet-800 text-white">Add Transaction</Button>
      </form>
    </div>
  );
}