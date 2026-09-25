import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createReducer } from '@reduxjs/toolkit';
import { API_ROUTES } from '../../../app/routing';
import { apiService, createApiThunk } from '../../../shared/api/axios';
import {
  APIRequestState,
  EAPIStatus,
  type IAPIRequestState,
  type IMeta,
} from '../../../shared/api/models';
import {
  createAPIMapReducerCases,
  createAPIReducerCases,
  type ApiDataStateType,
} from '../../../shared/store/utils';
import type {
  IAdminProductDetail,
  IAdminProductDetailRequestParams,
  IAdminProductImage,
  IAdminProductImagePreview,
  IAdminProductImagePreviewRequestParams,
  IAdminProductImageUploadRequestParams,
  IAdminProductListItem,
  IAdminProductsListRequestParams,
  IAdminProductVariantWriteRequestParams,
  IAdminProductWriteRequest,
  IDeleteAdminProductRequestParams,
  IDeleteAdminProductImageRequestParams,
  IUpdateAdminProductRequestParams,
} from './adminProducts.types';

export interface AdminProductsStoreState extends ApiDataStateType {
  adminProductsByQueryReq: Record<string, IAPIRequestState<IAdminProductListItem[]>>;
  adminProductDetailByProductReq: Record<string, IAPIRequestState<IAdminProductDetail>>;
  adminProductImagePreviewByProductReq: Record<string, IAPIRequestState<IAdminProductImagePreview>>;
  createAdminProductReq: IAPIRequestState<IAdminProductDetail>;
  updateAdminProductReq: IAPIRequestState<IAdminProductDetail>;
  createAdminProductVariantReq: IAPIRequestState<IAdminProductDetail>;
  updateAdminProductVariantReq: IAPIRequestState<IAdminProductDetail>;
  uploadAdminProductImagesReq: IAPIRequestState<IAdminProductImage[]>;
  deleteAdminProductReq: IAPIRequestState<void>;
}

const initialState: AdminProductsStoreState = {
  adminProductsByQueryReq: {},
  adminProductDetailByProductReq: {},
  adminProductImagePreviewByProductReq: {},
  createAdminProductReq: APIRequestState.create<IAdminProductDetail>(),
  updateAdminProductReq: APIRequestState.create<IAdminProductDetail>(),
  createAdminProductVariantReq: APIRequestState.create<IAdminProductDetail>(),
  updateAdminProductVariantReq: APIRequestState.create<IAdminProductDetail>(),
  uploadAdminProductImagesReq: APIRequestState.create<IAdminProductImage[]>(),
  deleteAdminProductReq: APIRequestState.create<void>(),
};

export const getAdminProductsCacheKey = (params: IAdminProductsListRequestParams) => [
  `category:${params.category || ''}`,
  `page:${params.page || 1}`,
  `page_size:${params.page_size || ''}`,
  `search:${params.search || ''}`,
  `active:${params.is_active ?? ''}`,
].join('|');

export const getAdminProductImagePreviewCacheKey = (
  params: IAdminProductImagePreviewRequestParams,
) => String(params.product_id);

export const getAdminProductDetailCacheKey = (
  params: IAdminProductDetailRequestParams,
) => String(params.product_id);

const getPreviewImages = (product: IAdminProductDetail): string[] => {
  const productImages = product.images
    ?.filter((image) => image.secure_url)
    .map((image) => image.secure_url) || [];
  const variantImages = product.variants.flatMap((variant) => variant.images || []);

  return Array.from(new Set([...productImages, ...variantImages])).slice(0, 3);
};

const cacheAdminProductDetail = (
  state: ApiDataStateType,
  product: IAdminProductDetail,
) => {
  const productKey = getAdminProductDetailCacheKey({ product_id: product.product_id });

  state.adminProductDetailByProductReq[productKey] = {
    status: EAPIStatus.FULFILLED,
    data: product,
  };
  state.adminProductImagePreviewByProductReq[productKey] = {
    status: EAPIStatus.FULFILLED,
    data: {
      product_id: product.product_id,
      images: getPreviewImages(product),
    },
  };
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

export const getAdminProductDetail = createApiThunk<
  IAdminProductDetail,
  IAdminProductDetailRequestParams
>(
  'adminProducts/getAdminProductDetail',
  ({ product_id }) => apiService.get<IAdminProductDetail>(
    API_ROUTES.ADMIN.PRODUCT_DETAIL(product_id),
  ),
);

export const createAdminProduct = createApiThunk<IAdminProductDetail, IAdminProductWriteRequest>(
  'adminProducts/createAdminProduct',
  (payload) => apiService.post<IAdminProductDetail, IAdminProductWriteRequest>(
    API_ROUTES.ADMIN.PRODUCTS,
    payload,
  ),
);

export const updateAdminProduct = createApiThunk<IAdminProductDetail, IUpdateAdminProductRequestParams>(
  'adminProducts/updateAdminProduct',
  ({ product_id, payload }) => apiService.patch<IAdminProductDetail, Partial<IAdminProductWriteRequest>>(
    API_ROUTES.ADMIN.PRODUCT_DETAIL(product_id),
    payload,
  ),
);

export const uploadAdminProductImages = createApiThunk<
  IAdminProductImage[],
  IAdminProductImageUploadRequestParams
>(
  'adminProducts/uploadAdminProductImages',
  ({
    alt_texts,
    display_orders,
    files,
    primary_image_index,
    product_id,
  }) => {
    const formData = new FormData();

    files.forEach((file) => formData.append('files', file));
    alt_texts?.forEach((altText) => formData.append('alt_texts', altText));
    display_orders?.forEach((displayOrder) => {
      formData.append('display_orders', String(displayOrder));
    });

    if (primary_image_index !== undefined) {
      formData.append('primary_image_index', String(primary_image_index));
    }

    return apiService.post<IAdminProductImage[], FormData>(
      API_ROUTES.ADMIN.PRODUCT_IMAGES_UPLOAD(product_id),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
);

export const createAdminProductVariant = createApiThunk<
  IAdminProductDetail,
  IAdminProductVariantWriteRequestParams
>(
  'adminProducts/createAdminProductVariant',
  ({ product_id, payload }) => apiService.post(
    API_ROUTES.ADMIN.PRODUCT_VARIANTS(product_id),
    payload,
  ),
);

export const updateAdminProductVariant = createApiThunk<
  IAdminProductDetail,
  IAdminProductVariantWriteRequestParams
>(
  'adminProducts/updateAdminProductVariant',
  ({ product_id, payload, variant_id }) => apiService.patch(
    API_ROUTES.ADMIN.PRODUCT_VARIANT_DETAIL(product_id, variant_id || ''),
    payload,
  ),
);

export const deleteAdminProduct = createApiThunk<void, IDeleteAdminProductRequestParams>(
  'adminProducts/deleteAdminProduct',
  ({ product_id }) => apiService.delete<void>(API_ROUTES.ADMIN.PRODUCT_DETAIL(product_id)),
);

export const deleteAdminProductImage = createApiThunk<
  void,
  IDeleteAdminProductImageRequestParams
>(
  'adminProducts/deleteAdminProductImage',
  ({ image_id, product_id }) => apiService.delete<void>(
    API_ROUTES.ADMIN.PRODUCT_IMAGE_DETAIL(product_id, image_id),
  ),
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
    getAdminProductDetail,
    'adminProductDetailByProductReq',
    getAdminProductDetailCacheKey,
    apiBuilder,
  );

  createAPIMapReducerCases(
    getAdminProductImagePreview,
    'adminProductImagePreviewByProductReq',
    getAdminProductImagePreviewCacheKey,
    apiBuilder,
  );

  createAPIReducerCases(createAdminProduct, 'createAdminProductReq', apiBuilder, {
    onFulfilled: cacheAdminProductDetail,
  });
  createAPIReducerCases(updateAdminProduct, 'updateAdminProductReq', apiBuilder, {
    onFulfilled: cacheAdminProductDetail,
  });
  createAPIReducerCases(createAdminProductVariant, 'createAdminProductVariantReq', apiBuilder, {
    onFulfilled: cacheAdminProductDetail,
  });
  createAPIReducerCases(updateAdminProductVariant, 'updateAdminProductVariantReq', apiBuilder, {
    onFulfilled: cacheAdminProductDetail,
  });
  createAPIReducerCases(uploadAdminProductImages, 'uploadAdminProductImagesReq', apiBuilder);
  createAPIReducerCases(deleteAdminProduct, 'deleteAdminProductReq', apiBuilder);
});
