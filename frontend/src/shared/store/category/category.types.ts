export type CategoryId = string | number;

export interface ICategory {
  category_id: CategoryId;
  short_id: string;
  main_category_name: string;
  sub_category_name: string | null;
  parent_category_id: CategoryId | null;
  is_active: boolean;
  date_created: string;
}

export interface IMainCategory extends ICategory {
  subcategories: ICategory[];
}

export interface ICategoryCount {
  count: number;
}

export interface ICategoryListRequestParams {
  page?: number;
  page_size?: number;
}

export interface ICategoryDetailRequestParams {
  category_id: CategoryId;
}

export interface ICategoryWriteRequest {
  short_id: string;
  main_category_name: string;
  sub_category_name?: string | null;
  parent_category_id?: CategoryId | null;
  is_active?: boolean;
}

export interface IUpdateCategoryRequestParams {
  category_id: CategoryId;
  payload: Partial<ICategoryWriteRequest>;
}

export interface IDeleteCategoryRequestParams {
  category_id: CategoryId;
}

export interface IDeleteCategoryResponse {
  message: string;
}
