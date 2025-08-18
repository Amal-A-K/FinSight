'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { EditTransactionModal } from "@/components/ui/edit-transaction-modal";
import { DeleteTransactionModal } from "@/components/ui/delete-transaction-modal";
import { toast } from 'react-toastify';
import { formatCurrency } from '@/lib/format';

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

  async function handleEdit(updatedTransaction: Transaction) {
    try {
      const res = await fetch(`/api/transactions/${updatedTransaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: updatedTransaction.amount,
          description: updatedTransaction.description,
          date: updatedTransaction.date
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update transaction');
      }

      setEditingTransaction(null);
      setIsEditModalOpen(false);
      toast.success('Transaction updated successfully');
      // Refresh transactions
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update transaction');
      console.error('Error updating transaction:', error);
    }
  }  function openEditModal(transaction: Transaction) {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="p-4 border border-violet-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-violet-800">{transaction.description}</h3>
              <p className="text-violet-600">
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-sm text-violet-500">
                {new Date(transaction.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => openEditModal(transaction)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <PencilIcon className="h-5 w-5 text-violet-600" />
              </button>
              <button
                onClick={() => handleDelete(transaction)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <TrashIcon className="h-5 w-5 text-violet-600" />
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