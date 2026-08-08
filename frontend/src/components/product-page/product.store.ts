import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createAction, createReducer } from '@reduxjs/toolkit';
import { API_ROUTES } from '../../app/routing';
import { apiService, createApiThunk } from '../../shared/api/axios';
import { type IAPIRequestState, type IMeta } from '../../shared/api/models';
import { createAPIMapReducerCases, type ApiDataStateType } from '../../shared/store/utils';
import type {
  IHomeCategoryProductsRequest,
  IProductCardProduct,
  IProductsListRequestParams,
} from './product.types';

export interface ProductPageStoreState {
  categoryProductsByQueryReq: Record<string, IAPIRequestState<IProductCardProduct[]>>;
  homeCategoryProductsByCategoryReq: Record<string, IAPIRequestState<IProductCardProduct[]>>;
  selectedProduct?: IProductCardProduct;
}

const initialState: ProductPageStoreState = {
  categoryProductsByQueryReq: {},
  homeCategoryProductsByCategoryReq: {},
  selectedProduct: undefined,
};

export const setSelectedProduct = createAction<IProductCardProduct>('productPage/setSelectedProduct');
export const clearSelectedProduct = createAction('productPage/clearSelectedProduct');

export const getCategoryProductsCacheKey = (params: IProductsListRequestParams) => [
  `page:${params.page || 1}`,
  `page_size:${params.page_size || ''}`,
  `category:${params.category || ''}`,
  `main_category:${params.main_category || ''}`,
  `sub_category:${params.sub_category || ''}`,
  `search:${params.search || ''}`,
  `size:${params.size || ''}`,
  `color:${params.color || ''}`,
  `min_price:${params.min_price || ''}`,
  `max_price:${params.max_price || ''}`,
  `in_stock:${params.in_stock ?? ''}`,
  `ordering:${params.ordering || ''}`,
].join('|');

export const getHomeCategoryProductsCacheKey = (params: IHomeCategoryProductsRequest) => (
  String(params.main_category)
);

export const getCategoryProducts = createApiThunk<IProductCardProduct[], IProductsListRequestParams>(
  'productPage/getCategoryProducts',
  (params) => apiService.get<IProductCardProduct[], IMeta>(
    API_ROUTES.PRODUCTS,
    { params },
  ),
);

export const getHomeCategoryProducts = createApiThunk<IProductCardProduct[], IHomeCategoryProductsRequest>(
  'productPage/getHomeCategoryProducts',
  ({ main_category, page_size = 5 }) => apiService.get<IProductCardProduct[], IMeta>(
    API_ROUTES.PRODUCTS,
    {
      params: {
        main_category,
        page: 1,
        page_size,
      },
    },
  ),
);

export const productPageStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIMapReducerCases(
    getCategoryProducts,
    'categoryProductsByQueryReq',
    getCategoryProductsCacheKey,
    apiBuilder,
  );

  createAPIMapReducerCases(
    getHomeCategoryProducts,
    'homeCategoryProductsByCategoryReq',
    getHomeCategoryProductsCacheKey,
    apiBuilder,
  );

  builder
    .addCase(setSelectedProduct, (state, action) => {
      state.selectedProduct = action.payload;
    })
    .addCase(clearSelectedProduct, (state) => {
      state.selectedProduct = undefined;
    });
});
