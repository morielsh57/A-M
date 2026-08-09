import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createReducer } from '@reduxjs/toolkit';
import { API_ROUTES } from '../../../app/routing';
import { apiService, createApiThunk } from '../../../shared/api/axios';
import { APIRequestState, type IAPIRequestState, type IMeta } from '../../../shared/api/models';
import {
  createAPIMapReducerCases,
  createAPIReducerCases,
  type ApiDataStateType,
} from '../../../shared/store/utils';
import type {
  IAdminProductDetail,
  IAdminProductImagePreview,
  IAdminProductImagePreviewRequestParams,
  IAdminProductListItem,
  IAdminProductsListRequestParams,
  IDeleteAdminProductRequestParams,
} from './adminProducts.types';

export interface AdminProductsStoreState extends ApiDataStateType {
  adminProductsByQueryReq: Record<string, IAPIRequestState<IAdminProductListItem[]>>;
  adminProductImagePreviewByProductReq: Record<string, IAPIRequestState<IAdminProductImagePreview>>;
  deleteAdminProductReq: IAPIRequestState<void>;
}

const initialState: AdminProductsStoreState = {
  adminProductsByQueryReq: {},
  adminProductImagePreviewByProductReq: {},
  deleteAdminProductReq: APIRequestState.create<void>(),
};

export const getAdminProductsCacheKey = (params: IAdminProductsListRequestParams) => [
  `category:${params.category || ''}`,
  `page:${params.page || 1}`,
  `page_size:${params.page_size || ''}`,
].join('|');

export const getAdminProductImagePreviewCacheKey = (
  params: IAdminProductImagePreviewRequestParams,
) => String(params.product_id);

const getPreviewImages = (product: IAdminProductDetail): string[] => {
  const productImages = product.images
    ?.filter((image) => image.secure_url)
    .map((image) => image.secure_url) || [];
  const variantImages = product.variants.flatMap((variant) => variant.images || []);

  return Array.from(new Set([...productImages, ...variantImages])).slice(0, 3);
};

export const getAdminProducts = createApiThunk<IAdminProductListItem[], IAdminProductsListRequestParams>(
  'adminProducts/getAdminProducts',
  (params) => apiService.get<IAdminProductListItem[], IMeta>(
    API_ROUTES.ADMIN.PRODUCTS,
    { params },
  ),
);

export const getAdminProductImagePreview = createApiThunk<
  IAdminProductImagePreview,
  IAdminProductImagePreviewRequestParams
>(
  'adminProducts/getAdminProductImagePreview',
  async ({ product_id }) => {
    const response = await apiService.get<IAdminProductDetail>(
      API_ROUTES.ADMIN.PRODUCT_DETAIL(product_id),
    );
    const product = response.data;

    return {
      product_id,
      images: getPreviewImages(product),
    };
  },
);

export const deleteAdminProduct = createApiThunk<void, IDeleteAdminProductRequestParams>(
  'adminProducts/deleteAdminProduct',
  ({ product_id }) => apiService.delete<void>(API_ROUTES.ADMIN.PRODUCT_DETAIL(product_id)),
);

export const adminProductsStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIMapReducerCases(
    getAdminProducts,
    'adminProductsByQueryReq',
    getAdminProductsCacheKey,
    apiBuilder,
  );

  createAPIMapReducerCases(
    getAdminProductImagePreview,
    'adminProductImagePreviewByProductReq',
    getAdminProductImagePreviewCacheKey,
    apiBuilder,
  );

  createAPIReducerCases(deleteAdminProduct, 'deleteAdminProductReq', apiBuilder);
});
