import { configureStore } from '@reduxjs/toolkit';
import appScreenSlice from '@/renderer/store/slices/appScreenSlice';

export const store = configureStore({
  reducer: {
    appScreen: appScreenSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export default store;
