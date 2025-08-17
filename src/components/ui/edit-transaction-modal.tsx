'use client';

import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Input } from "@/components/ui/input";
import { Transaction } from '@/types/transaction';
import { toast } from 'react-toastify';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  onSave: (data: Transaction) => Promise<void>;
}

export function EditTransactionModal({
  isOpen,
  onClose: closeModal,
  transaction,
  onSave,
}: EditTransactionModalProps) {
  const amountInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await onSave({
        ...transaction,
        amount: parseFloat(formData.get('amount') as string),
        description: formData.get('description') as string,
        date: new Date(formData.get('date') as string).toISOString(),
      });
      closeModal();
    } catch (error) {
      toast.error('Failed to update transaction');
      console.error('Error updating transaction:', error);
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal} initialFocus={amountInputRef}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0  bg-violet-950/30 backdrop:bg-transparent-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white backdrop-blur-md p-6 text-left align-middle shadow-xl transition-all border border-white/20">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-violet-900 mb-4"
                >
                  Edit Transaction
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-violet-700 mb-1">
                      Amount
                    </label>
                    <Input
                      ref={amountInputRef}
                      type="number"
                      name="amount"
                      id="amount"
                      defaultValue={transaction?.amount}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-violet-700 mb-1">
                      Description
                    </label>
                    <Input
                      type="text"
                      name="description"
                      id="description"
                      defaultValue={transaction?.description}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="date" className="block  text-violet-700 mb-1">
                      Date
                    </label>
                    <Input
                      type="date"
                      name="date"
                      id="date"
                      defaultValue={transaction ? new Date(transaction.date).toISOString().split('T')[0] : ''}
                      required
                    />
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="inline-flex justify-center rounded-md border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
