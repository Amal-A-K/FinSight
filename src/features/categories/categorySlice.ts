import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

interface CategoryState {
  categories: Category[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  status: 'idle',
  error: null,
};

export const fetchCategories = createAsyncThunk('categories/fetchCategories', async () => {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return await response.json();
});

export const addCategory = createAsyncThunk('categories/addCategory', async (category: Omit<Category, 'id'>) => {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add category');
  }
  return await response.json();
});

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch categories';
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      });
  },
});

export const selectAllCategories = (state: { categories: CategoryState }) => 
  state.categories.categories;

export const selectCategoryById = (state: { categories: CategoryState }, categoryId: number) =>
  state.categories.categories.find(category => category.id === categoryId);

export const selectCategoriesStatus = (state: { categories: CategoryState }) =>
  state.categories.status;

export default categorySlice.reducer;
