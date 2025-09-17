'use client';

import { Transaction } from "@/types/transaction";
import { Button } from "./button";
import { formatCurrency } from '@/lib/format';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "sm:max-w-[425px] bg-white dark:bg-violet-950/95 border-violet-200 dark:border-violet-800/80",
          "ring-1 ring-violet-100 dark:ring-violet-800/50"
        )}
      >
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40 sm:mx-0">
            <AlertTriangle
              className="h-6 w-6 text-violet-600 dark:text-violet-300"
              aria-hidden="true"
            />
          </div>
          <DialogTitle
            className={cn(
              "mt-3 text-center sm:text-left text-lg font-semibold",
              "text-gray-900 dark:text-violet-50"
            )}
          >
            Delete Transaction
          </DialogTitle>
          <div className="mt-2 text-center sm:text-left text-gray-600 dark:text-violet-200/90">
            <DialogDescription asChild>
              <div>
                Are you sure you want to delete this transaction?
                <div className="mt-2 p-3 bg-violet-50 dark:bg-violet-900/30 rounded-md">
                  <div className="font-medium text-violet-900 dark:text-violet-100">{transaction.description}</div>
                  <div className="text-violet-800 dark:text-violet-200">Amount: {formatCurrency(transaction.amount)}</div>
                </div>
              </div>
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <Button
            variant="destructive"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className="w-full sm:w-auto"
          >
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="mt-3 w-full sm:mt-0 sm:mr-3 sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
