'use client';

import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { TransactionList } from "@/components/ui/transaction-list";
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import Loading from "./loading";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete transaction');
      }

      await fetchTransactions();
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-violet-900">Transactions</h1>
      <TransactionList 
        transactions={transactions} 
        onDelete={handleDelete}
      />
    </Card>
  );
}
