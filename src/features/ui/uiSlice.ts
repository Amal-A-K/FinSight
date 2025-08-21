import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeView: 'dashboard' | 'transactions' | 'categories' | 'reports';
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
  };
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  activeView: 'dashboard',
  toast: {
    message: '',
    type: 'info',
    isVisible: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setActiveView: (state, action: PayloadAction<UIState['activeView']>) => {
      state.activeView = action.payload;
    },
    showToast: (state, action: PayloadAction<{ message: string; type?: UIState['toast']['type'] }>) => {
      state.toast = {
        message: action.payload.message,
        type: action.payload.type || 'info',
        isVisible: true,
      };
    },
    hideToast: (state) => {
      state.toast.isVisible = false;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setActiveView,
  showToast,
  hideToast,
} = uiSlice.actions;

export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectActiveView = (state: { ui: UIState }) => state.ui.activeView;
export const selectToast = (state: { ui: UIState }) => state.ui.toast;

export default uiSlice.reducer;
