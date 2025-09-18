'use client';

import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Input } from "@/components/ui/input";
import { Transaction } from '@/types/transaction';
import { toast } from 'react-toastify';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from 'react';
import { DatePicker } from './date-picker';

interface Category {
  id: number;
  name: string;
}

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    transaction?.categoryId?.toString() || 'no-category'
  );
  const [amount, setAmount] = useState<string>(transaction?.amount?.toString() || '');
  const [description, setDescription] = useState<string>(transaction?.description || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    transaction?.date ? new Date(transaction.date).toISOString() : new Date().toISOString()
  );

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

  useEffect(() => {
    const newSelectedCategory = transaction.category?.id ? transaction.category.id.toString() : 'no-category';
    setSelectedCategory(newSelectedCategory);
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      const updatedTransaction: Transaction = {
        ...transaction,
        amount: parseFloat(formData.get('amount') as string),
        description: formData.get('description') as string,
        date: selectedDate,
        // Convert categoryId to number or null
        categoryId: selectedCategory !== 'no-category' ? parseInt(selectedCategory, 10) : null
      };
      
      await onSave(updatedTransaction);
      toast.success('Transaction updated successfully!');
      closeModal();
    } catch (error) {
      toast.error('Failed to update transaction');
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal} initialFocus={amountInputRef}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0  bg-violet-950/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white dark:bg-violet-950 backdrop-blur-md p-6 text-left align-middle shadow-xl transition-all border border-violet-200 dark:border-violet-800">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-violet-900 dark:text-violet-100 mt-4 mb-4"
                >
                  Edit Transaction
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-violet-700 dark:text-violet-300 mb-1">
                      Amount
                    </label>
                    <Input
                      type="number"
                      id="amount"
                      name="amount"
                      ref={amountInputRef}
                      className="w-full"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-violet-700 dark:text-violet-300 mb-1">
                      Description
                    </label>
                    <Input
                      id="description"
                      name="description"
                      className="w-full"
                      placeholder="Enter description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-violet-700 dark:text-violet-300 mb-1">
                      Date
                    </label>
                    <DatePicker
                      value={selectedDate}
                      onChange={(date) => {
                        const formattedDate = new Date(date).toISOString();
                        setSelectedDate(formattedDate);
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-violet-700 dark:text-violet-300 mb-1">
                      Category
                    </label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
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
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="inline-flex justify-center rounded-md border border-violet-300 dark:border-violet-700 bg-white dark:bg-violet-900 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 dark:hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 transition-colors"
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