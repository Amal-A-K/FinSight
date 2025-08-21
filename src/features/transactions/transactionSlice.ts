import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Transaction } from '@/types/transaction';
import { RootState } from '@/lib/store';

interface TransactionState {
  transactions: Transaction[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  selectedYear: number;
}

const initialState: TransactionState = {
  transactions: [],
  status: 'idle',
  error: null,
  selectedYear: new Date().getFullYear(),
};

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (year?: number) => {
    const url = year ? `/api/transactions?year=${year}` : '/api/transactions';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    return await response.json();
  }
);

export const addTransaction = createAsyncThunk(
  'transactions/addTransaction',
  async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add transaction');
    }
    return await response.json();
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async (transaction: Transaction, { dispatch }) => {
    const response = await fetch(`/api/transactions/${transaction.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update transaction');
    }
    const result = await response.json();
    
    // Refetch transactions to ensure we have the latest data
    await dispatch(fetchTransactions());
    
    return result;
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async (id: string, { dispatch }) => {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete transaction');
    }
    
    // Refetch transactions to ensure we have the latest data
    await dispatch(fetchTransactions());
    
    return id;
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setSelectedYear: (state, action: PayloadAction<number>) => {
      state.selectedYear = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch transactions';
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload); // Add to the beginning of the array
        state.status = 'succeeded';
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const index = state.transactions.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(t => t.id.toString() !== action.payload.toString());
      });
  },
});

// Memoized selectors
export const selectAllTransactions = (state: RootState) =>
  state.transactions.transactions;

export const selectSelectedYear = (state: RootState) =>
  state.transactions.selectedYear;

export const selectTransactionStatus = (state: RootState) =>
  state.transactions.status;

export const selectTransactionsByYear = createSelector(
  [selectAllTransactions, selectSelectedYear],
  (transactions, selectedYear) => {
    if (!transactions) return [];
    const targetYear = Number(selectedYear);
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionYear = transactionDate.getFullYear();
      return transactionYear === targetYear;
    });
  }
);

export const { setSelectedYear } = transactionSlice.actions;
export default transactionSlice.reducer;
