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

export interface IReview {
  review_id: number;
  product_id: number;
  customer_name: string;
  review_text: string;
  stars: number;
  date_created: string;
}

export interface IProductReviewsRequest {
  product_id: string | number;
  page?: number;
  page_size?: number;
}

export interface IReviewPayload {
  stars: number;
  review_text: string;
}

export interface ICreateProductReviewRequest {
  product_id: string | number;
  payload: IReviewPayload & {
    order_id: string | number;
  };
}

export interface IUpdateReviewRequest {
  review_id: string | number;
  payload: IReviewPayload;
}

interface ReviewsStoreState extends ApiDataStateType {
  productReviewsByQueryReq: Record<string, IAPIRequestState<IReview[]>>;
  createProductReviewReq: IAPIRequestState<IReview>;
  updateReviewReq: IAPIRequestState<IReview>;
}

const initialState: ReviewsStoreState = {
  productReviewsByQueryReq: {},
  createProductReviewReq: APIRequestState.create<IReview>(),
  updateReviewReq: APIRequestState.create<IReview>(),
};

export const PRODUCT_REVIEWS_PAGE_SIZE = 100;

export const getProductReviewsCacheKey = (params: IProductReviewsRequest) => [
  `product:${params.product_id}`,
  `page:${params.page || 1}`,
  `page_size:${params.page_size || PRODUCT_REVIEWS_PAGE_SIZE}`,
].join('|');

export const getProductReviews = createApiThunk<IReview[], IProductReviewsRequest>(
  'reviews/getProductReviews',
  (params) => apiService.get<IReview[], IMeta>(
    API_ROUTES.PRODUCT_REVIEWS(params.product_id),
    {
      params: {
        page: params.page || 1,
        page_size: params.page_size || PRODUCT_REVIEWS_PAGE_SIZE,
      },
    },
  ),
);

export const createProductReview = createApiThunk<IReview, ICreateProductReviewRequest>(
  'reviews/createProductReview',
  ({ product_id, payload }) => apiService.post<IReview, ICreateProductReviewRequest['payload']>(
    API_ROUTES.PRODUCT_REVIEWS(product_id),
    payload,
  ),
);

export const updateReview = createApiThunk<IReview, IUpdateReviewRequest>(
  'reviews/updateReview',
  ({ review_id, payload }) => apiService.patch<IReview, IReviewPayload>(
    API_ROUTES.REVIEW_DETAIL(review_id),
    payload,
  ),
);

export const reviewsStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIMapReducerCases(
    getProductReviews,
    'productReviewsByQueryReq',
    getProductReviewsCacheKey,
    apiBuilder,
  );
  createAPIReducerCases(createProductReview, 'createProductReviewReq', apiBuilder);
  createAPIReducerCases(updateReview, 'updateReviewReq', apiBuilder);
});
