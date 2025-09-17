'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-toastify';
import { Category } from '@prisma/client';

const formSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)'),
});

type BudgetFormValues = z.infer<typeof formSchema>;

interface BudgetFormProps {
  categories: Category[];
  initialData?: {
    id?: number;
    categoryId: string;
    amount: string;
    month: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BudgetForm({ 
  categories, 
  initialData, 
  onSuccess, 
  onCancel 
}: BudgetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!initialData?.id;

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      amount: '',
      month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    },
  });

  // Initialize form with initialData if it exists
  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        amount: initialData.amount.toString(),
      });
    } else {
      form.reset({
        categoryId: '',
        amount: '',
        month: new Date().toISOString().slice(0, 7),
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: BudgetFormValues) => {
    try {
      setIsLoading(true);
      const payload = {
        categoryId: parseInt(data.categoryId, 10),
        amount: parseFloat(data.amount),
        month: data.month,
      };

      const url = initialData?.id 
        ? `/api/budgets?id=${initialData.id}`
        : '/api/budgets';
      
      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save budget');
      }

      toast.success(`Budget ${isEditMode ? 'updated' : 'created'} successfully`);

      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save budget');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isEditMode}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="0.00" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="month"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Month</FormLabel>
              <FormControl>
                <Input 
                  type="month" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </span>
            ) : isEditMode ? (
              'Update Budget'
            ) : (
              'Create Budget'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
