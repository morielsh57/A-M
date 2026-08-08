import { createAction, createReducer } from '@reduxjs/toolkit';
import type { IProductCardProduct } from './product.types';

export interface ProductPageStoreState {
  selectedProduct?: IProductCardProduct;
}

const initialState: ProductPageStoreState = {
  selectedProduct: undefined,
};

export const setSelectedProduct = createAction<IProductCardProduct>('productPage/setSelectedProduct');
export const clearSelectedProduct = createAction('productPage/clearSelectedProduct');

export const productPageStoreReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setSelectedProduct, (state, action) => {
      state.selectedProduct = action.payload;
    })
    .addCase(clearSelectedProduct, (state) => {
      state.selectedProduct = undefined;
    });
});
