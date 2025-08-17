'use client';

import { Transaction } from "@/types/transaction";
import { Button } from "./button";
import { formatCurrency } from '@/lib/format';

interface DeleteTransactionModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteTransactionModal({
  transaction,
  isOpen,
  onClose,
  onConfirm
}: DeleteTransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-violet-950/30 bg-transparent-md flex items-center justify-center z-50">
      <div className="bg-white backdrop-blur-md p-6 rounded-lg shadow-lg max-w-md w-full border border-violet-200 dark:border-violet-800">
        <h2 className="text-xl font-semibold mb-4 text-violet-900 dark:text-violet-900">Delete Transaction</h2>
        <p className="mb-4 text-violet-700 dark:text-violet-700">
          Are you sure you want to delete this transaction?
          <br />
          <span className="font-medium text-violet-900 dark:text-violet-900">{transaction.description}</span>
          <br />
          <span className="text-violet-800 dark:text-violet-800">Amount: {formatCurrency(transaction.amount)}</span>
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-violet-300 text-violet-700 hover:bg-violet-50 hover:text-violet-800 dark:border-violet-700 dark:text-violet-700 dark:hover:bg-violet-50"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className="bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500 dark:bg-violet-600 dark:hover:bg-violet-700"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
