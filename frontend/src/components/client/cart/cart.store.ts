import { createAction, createReducer } from '@reduxjs/toolkit';

export interface CartStoreState {
  isCartOpen: boolean;
}

const initialState: CartStoreState = {
  isCartOpen: false,
};

export const openCart = createAction('cart/openCart');
export const closeCart = createAction('cart/closeCart');
export const toggleCart = createAction('cart/toggleCart');

export const cartStoreReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(openCart, (state) => {
      state.isCartOpen = true;
    })
    .addCase(closeCart, (state) => {
      state.isCartOpen = false;
    })
    .addCase(toggleCart, (state) => {
      state.isCartOpen = !state.isCartOpen;
    });
});
