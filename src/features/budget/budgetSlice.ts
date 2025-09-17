import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/lib/store';

export interface BudgetItem {
  id: string;
  amount: number;
  month: string;
  categoryId: number;
  category: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BudgetState {
  items: BudgetItem[];
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: BudgetState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Helper function to normalize budget data
const normalizeBudget = (budget: any): BudgetItem => {
  // Handle both categoryId and categoryid properties (case sensitivity issue from API)
  let categoryId = Number(budget.categoryId || budget.categoryid);
  if (isNaN(categoryId) || categoryId === 0) {
    categoryId = Number(budget.category?.id) || 0;
  }
  
  return {
    id: String(budget.id),
    amount: Number(budget.amount) || 0,
    month: budget.month || new Date().toISOString().slice(0, 7), // Default to current month
    categoryId: categoryId,
    category: {
      id: categoryId,
      name: budget.category?.name || 'Uncategorized',
    },
    createdAt: budget.createdAt || new Date().toISOString(),
    updatedAt: budget.updatedAt || new Date().toISOString(),
  };
};

// Async thunks
export const fetchBudgets = createAsyncThunk<
  BudgetItem[],
  string | undefined,
  { state: RootState; rejectValue: string }
>('budgets/fetchBudgets', async (month, { getState, rejectWithValue }) => {
  const url = month ? `/api/budgets?month=${month}` : '/api/budgets';
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      let errorMessage = `Failed to fetch budgets: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Error parsing error response
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map(normalizeBudget);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch budgets';
    console.error('Error in fetchBudgets:', {
      error: errorMessage,
      url,
      month,
      timestamp: new Date().toISOString()
    });
    return rejectWithValue(errorMessage);
  }
});

export const saveBudget = createAsyncThunk<
  BudgetItem,
  { amount: number; month: string; categoryId: number },
  { state: RootState; rejectValue: string }
>('budgets/saveBudget', async ({ amount, month, categoryId }, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, month, categoryId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to save budget');
    }
    
    const data = await response.json();
    return normalizeBudget(data);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to save budget');
  }
});

const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    resetBudgets(state) {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    // Handle fetchBudgets
    builder.addCase(fetchBudgets.pending, (state) => {
      if (!state) return;
      state.loading = true;
      state.error = null;
    });
    
    builder.addCase(fetchBudgets.fulfilled, (state, action) => {
      if (!state) {
        console.error('State is undefined in fetchBudgets.fulfilled');
        return;
      }
      
      state.loading = false;
      
      try {
        // Safely get payload and ensure it's an array
        const payload = Array.isArray(action.payload) ? action.payload : [];
        const currentItems = Array.isArray(state.items) ? state.items : [];
        
        // Create a map of existing items for faster lookups
        const existingItemsMap = new Map(
          currentItems
            .filter((item): item is BudgetItem => Boolean(item))
            .map(item => [`${item.categoryId}-${item.month}`, item])
        );
        
        // Update the map with new items, overwriting existing ones with the same key
        payload.forEach(item => {
          if (item && item.categoryId && item.month) {
            existingItemsMap.set(`${item.categoryId}-${item.month}`, item);
          }
        });
        
        // Convert map values back to array
        state.items = Array.from(existingItemsMap.values());
      } catch (error) {
        console.error('Error processing budgets:', error);
        state.items = [];
      }
      
      state.lastFetched = new Date().toISOString();
      state.error = null;
    });
    
    builder.addCase(fetchBudgets.rejected, (state, action) => {
      if (!state) return;
      state.loading = false;
      state.error = action.payload 
        ? String(action.payload) 
        : action.error?.message || 'Failed to fetch budgets';
      state.items = [];
    });

    // saveBudget
    builder.addCase(saveBudget.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(saveBudget.fulfilled, (state, action) => {
      state.loading = false;
      
      // Update existing or add new budget
      const index = state.items.findIndex(item => 
        item.categoryId === action.payload.categoryId && 
        item.month === action.payload.month
      );
      
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.push(action.payload);
      }
      
      state.error = null;
    });
    builder.addCase(saveBudget.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to save budget';
    });
  },
});

// Selectors
export const selectBudgets = (state: RootState) => state.budgets.items;

export const selectBudgetsByMonth = createSelector(
  [selectBudgets, (_: RootState, month: string) => month],
  (budgets, month) => budgets.filter(budget => budget.month === month)
);

export const selectBudgetByCategoryAndMonth = createSelector(
  [selectBudgets, (_: RootState, categoryId: number, month: string) => ({ categoryId, month })],
  (budgets, { categoryId, month }) => 
    budgets.find(budget => 
      budget.categoryId === categoryId && budget.month === month
    )
);

export const selectTotalBudgetForMonth = createSelector(
  [selectBudgets, (_: RootState, month: string) => month],
  (budgets, month) => 
    budgets
      .filter(budget => budget.month === month)
      .reduce((sum, budget) => sum + budget.amount, 0)
);

export const selectBudgetLoading = (state: RootState) => state.budgets.loading;
export const selectBudgetError = (state: RootState) => state.budgets.error;
export const selectLastFetched = (state: RootState) => state.budgets.lastFetched;

// Export actions
export const { clearError, resetBudgets } = budgetSlice.actions;

export default budgetSlice.reducer;
