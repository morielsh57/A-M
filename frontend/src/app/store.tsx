import type { ThunkAction, Action } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import { injectStoreAxiosInterceptors } from '../shared/api/interceptors';
import { sharedStoreReducer } from '../shared/store/shared.store';
import { authStoreReducer } from './auth/auth.store';
import { adminHomeStoreReducer } from '../components/admin/home/AdminHome.store';
import { productPageStoreReducer } from '../components/product-page/product.store';
import { userStoreReducer } from '../shared/store/user/user.store';
import { categoryStoreReducer } from '../shared/store/category/category.store';
import { adminProductsStoreReducer } from '../components/admin/products/adminProducts.store';
import { cartStoreReducer } from '../components/client/cart/cart.store';
import { adminUsersStoreReducer } from '../components/admin/users/adminUsers.store';
import { checkoutStoreReducer } from '../components/client/checkout/checkout.store';

export const rootReducer = {
  sharedStoreReducer,
  authStoreReducer,
  userStoreReducer,
  categoryStoreReducer,
  adminHomeStoreReducer,
  adminProductsStoreReducer,
  adminUsersStoreReducer,
  productPageStoreReducer,
  cartStoreReducer,
  checkoutStoreReducer,
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
