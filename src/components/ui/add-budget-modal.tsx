'use client';

import { Fragment, useRef, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import { toast } from 'react-toastify';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Category {
  id: number;
  name: string;
  color?: string;
}

interface BudgetData {
  id?: number;
  categoryId: string | number;
  amount: string | number;
  month: string;
}

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBudgetAdded: () => void;
  initialMonth?: string; // Format: YYYY-MM
  initialData?: BudgetData;
}

export function AddBudgetModal({
  isOpen,
  onClose,
  onBudgetAdded,
  initialMonth,
  initialData
}: AddBudgetModalProps) {
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [month, setMonth] = useState<string>(initialMonth || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error('Failed to load categories');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (categories.length === 0) {
      fetchCategories();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset form when modal is opened/closed or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Set the selected category when editing
        setSelectedCategory(initialData.categoryId.toString());
        setAmount(initialData.amount.toString());
        setMonth(initialData.month || '');
      } else {
        // Reset form for new budget
        if (categories.length > 0) {
          setSelectedCategory(categories[0].id.toString());
        }
        setAmount('');
        // Set default month to current month if not provided
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        setMonth(initialMonth || `${year}-${month}`);
      }
    }
  }, [isOpen, initialData, categories.length, initialMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !amount || !month) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = initialData?.id 
        ? `/api/budgets?id=${initialData.id}`
        : '/api/budgets';

      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(amount.toString()), 
          month, 
          categoryId: parseInt(selectedCategory, 10) 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save budget');
      }

      toast.success(initialData?.id ? 'Budget updated successfully' : 'Budget added successfully');
      onBudgetAdded();
      onClose();
      // Reset form
      setAmount('');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose} initialFocus={amountInputRef}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-violet-950/30 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-violet-950 backdrop-blur-md p-6 text-left align-middle shadow-xl transition-all border border-violet-200 dark:border-violet-800">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-violet-900 dark:text-violet-100 mb-4"
                >
                  {initialData ? 'Edit Budget' : 'Add Budget'}
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="category" className="block text-violet-700 dark:text-violet-300 mb-1">
                      Category
                    </label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoading ? 'Loading categories...' : 'Select a category'} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoading ? (
                          <div className="py-2 px-3 text-sm text-gray-500">Loading categories...</div>
                        ) : categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                              className="flex items-center gap-2"
                            >
                              {category.color && (
                                <span 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              <span className="truncate">{category.name}</span>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="py-2 px-3 text-sm text-gray-500">No categories found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="amount" className="block text-violet-700 dark:text-violet-300 mb-1">
                      Amount (₹)
                    </label>
                    <Input
                      ref={amountInputRef}
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="month" className="block text-violet-700 dark:text-violet-300 mb-1">
                      Month
                    </label>
                    <MonthPicker 
                      value={month} 
                      onChange={setMonth} 
                      className="w-full"
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !amount || !selectedCategory || !month}
                    >
                      {isSubmitting 
                        ? 'Saving...' 
                        : initialData 
                          ? 'Update Budget' 
                          : 'Add Budget'}
                    </Button>
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
