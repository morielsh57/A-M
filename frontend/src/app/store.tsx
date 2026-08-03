import type { ThunkAction, Action } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import { injectStoreAxiosInterceptors } from '../shared/api/interceptors';
import { sharedStoreReducer } from '../shared/store/shared.store';
import { authStoreReducer } from './auth/auth.store';
import { userStoreReducer } from '../shared/store/user.store';
import { adminHomeStoreReducer } from '../components/admin/home/AdminHome.store';

export const rootReducer = {
  sharedStoreReducer,
  authStoreReducer,
  userStoreReducer,
  adminHomeStoreReducer,
};

enableMapSet();

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

injectStoreAxiosInterceptors(store);
