'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { EditTransactionModal } from "@/components/ui/edit-transaction-modal";
import { DeleteTransactionModal } from "@/components/ui/delete-transaction-modal";
import { formatCurrency } from '@/lib/format';
import { useAppDispatch } from '@/lib/hooks';
import { updateTransaction, deleteTransaction } from '@/features/transactions/transactionSlice';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  async function handleDelete(transaction: Transaction) {
    setDeletingTransaction(transaction);
    setIsDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!deletingTransaction) return;

    // The parent's `onDelete` function handles the API call, re-fetching, and toast notifications.
    await onDelete(deletingTransaction.id.toString());
  }

  const dispatch = useAppDispatch();

  async function handleEdit(updatedTransaction: Transaction) {
    try {
      const resultAction = await dispatch(updateTransaction(updatedTransaction));
      
      if (updateTransaction.fulfilled.match(resultAction)) {
        setEditingTransaction(null);
        setIsEditModalOpen(false);
      } else if (updateTransaction.rejected.match(resultAction)) {
        throw new Error('Failed to update transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  }

  function openEditModal(transaction: Transaction) {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-violet-800 dark:text-violet-200">{transaction.description}</h3>
              <p className="text-violet-600 dark:text-violet-300 font-medium">
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-sm text-violet-500 dark:text-violet-400">
                {new Date(transaction.date).toLocaleDateString()}
              </p>
              {transaction.category && (
                <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-800/60 text-violet-800 dark:text-violet-200 mt-2 border border-violet-200 dark:border-violet-700">
                  {transaction.category.name}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => openEditModal(transaction)}
                className="p-2 hover:bg-violet-100 dark:hover:bg-violet-800/50 rounded-full transition-colors duration-200"
                title="Edit transaction"
              >
                <PencilIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </button>
              <button
                onClick={() => handleDelete(transaction)}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors duration-200"
                title="Delete transaction"
              >
                <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </Card>
      ))}

      {isEditModalOpen && editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTransaction(null);
          }}
          onSave={handleEdit}
        />
      )}

      {isDeleteModalOpen && deletingTransaction && (
        <DeleteTransactionModal
          transaction={deletingTransaction}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingTransaction(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}