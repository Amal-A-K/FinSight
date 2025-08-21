'use client';

import { Card } from "@/components/ui/card";
import { TransactionList } from "@/components/ui/transaction-list";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchTransactions, deleteTransaction, selectAllTransactions, selectTransactionStatus } from "@/features/transactions/transactionSlice";
import { toast } from 'react-toastify';
import Loading from "./loading";

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const transactions = useAppSelector(selectAllTransactions);
  const status = useAppSelector(selectTransactionStatus);
  
  // Fetch transactions on component mount and when the route changes
  useEffect(() => {
    const fetchTransactionsData = async () => {
      try {
        await dispatch(fetchTransactions()).unwrap();
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        toast.error('Failed to load transactions');
      }
    };
    
    fetchTransactionsData();
    
    // Set up visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTransactionsData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    try {
      const resultAction = await dispatch(deleteTransaction(id));
      if (deleteTransaction.fulfilled.match(resultAction)) {
        toast.success('Transaction deleted successfully');
      } else if (deleteTransaction.rejected.match(resultAction)) {
        throw new Error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  if (status === 'loading' && !transactions.length) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-violet-900 dark:text-violet-100">Transactions</h1>
      </div>
      <Card className="p-6">
        <TransactionList 
          transactions={transactions} 
          onDelete={handleDelete} 
        />
      </Card>
    </div>
  );
}