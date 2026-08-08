import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { createReducer } from '@reduxjs/toolkit';
import { apiService, createApiThunk } from '../../api/axios';
import { APIRequestState, type IAPIRequestState } from '../../api/models';
import { createAPIReducerCases, type ApiDataStateType } from '../utils';
import { API_ROUTES } from '../../../app/routing';
import type {
  ICategory,
  ICategoryCount,
  ICategoryDetailRequestParams,
  ICategoryListRequestParams,
  ICategoryWriteRequest,
  IDeleteCategoryRequestParams,
  IDeleteCategoryResponse,
  IMainCategory,
  IUpdateCategoryRequestParams,
} from './category.types';

export interface CategoryStoreState extends ApiDataStateType {
  getCategoriesCountReq: IAPIRequestState<ICategoryCount>;
  getAllCategoriesReq: IAPIRequestState<ICategory[]>;
  getMainCategoriesReq: IAPIRequestState<IMainCategory[]>;
  getCategoryByIdReq: IAPIRequestState<ICategory>;
  createCategoryReq: IAPIRequestState<ICategory>;
  updateCategoryReq: IAPIRequestState<ICategory>;
  deleteCategoryReq: IAPIRequestState<IDeleteCategoryResponse>;
}

const initialState: CategoryStoreState = {
  getCategoriesCountReq: APIRequestState.create<ICategoryCount>(),
  getAllCategoriesReq: APIRequestState.create<ICategory[]>(),
  getMainCategoriesReq: APIRequestState.create<IMainCategory[]>(),
  getCategoryByIdReq: APIRequestState.create<ICategory>(),
  createCategoryReq: APIRequestState.create<ICategory>(),
  updateCategoryReq: APIRequestState.create<ICategory>(),
  deleteCategoryReq: APIRequestState.create<IDeleteCategoryResponse>(),
};

export const getCategoriesCount = createApiThunk<ICategoryCount>(
  'category/getCategoriesCount',
  () => apiService.get<ICategoryCount>(API_ROUTES.CATEGORIES_COUNT),
);

export const getAllCategories = createApiThunk<ICategory[], ICategoryListRequestParams | void>(
  'category/getAllCategories',
  (params) => apiService.get<ICategory[]>(API_ROUTES.CATEGORIES, { params }),
);

export const getMainCategories = createApiThunk<IMainCategory[]>(
  'category/getMainCategories',
  () => apiService.get<IMainCategory[]>(API_ROUTES.CATEGORIES_MAIN),
);

export const getCategoryById = createApiThunk<ICategory, ICategoryDetailRequestParams>(
  'category/getCategoryById',
  ({ category_id }) => apiService.get<ICategory>(API_ROUTES.CATEGORY_DETAIL(category_id)),
);

export const createCategory = createApiThunk<ICategory, ICategoryWriteRequest>(
  'category/createCategory',
  (payload) => apiService.post<ICategory, ICategoryWriteRequest>(API_ROUTES.CATEGORIES, payload),
);

export const updateCategory = createApiThunk<ICategory, IUpdateCategoryRequestParams>(
  'category/updateCategory',
  ({ category_id, payload }) => apiService.patch<ICategory, Partial<ICategoryWriteRequest>>(
    API_ROUTES.CATEGORY_DETAIL(category_id),
    payload,
  ),
);

export const deleteCategory = createApiThunk<IDeleteCategoryResponse, IDeleteCategoryRequestParams>(
  'category/deleteCategory',
  ({ category_id }) => apiService.delete<IDeleteCategoryResponse>(API_ROUTES.CATEGORY_DETAIL(category_id)),
);

export const categoryStoreReducer = createReducer(initialState, (builder) => {
  const apiBuilder = builder as unknown as ActionReducerMapBuilder<ApiDataStateType>;

  createAPIReducerCases(getCategoriesCount, 'getCategoriesCountReq', apiBuilder);
  createAPIReducerCases(getAllCategories, 'getAllCategoriesReq', apiBuilder);
  createAPIReducerCases(getMainCategories, 'getMainCategoriesReq', apiBuilder);
  createAPIReducerCases(getCategoryById, 'getCategoryByIdReq', apiBuilder);
  createAPIReducerCases(createCategory, 'createCategoryReq', apiBuilder);
  createAPIReducerCases(updateCategory, 'updateCategoryReq', apiBuilder);
  createAPIReducerCases(deleteCategory, 'deleteCategoryReq', apiBuilder);
});
