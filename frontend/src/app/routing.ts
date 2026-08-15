const ROOT_PATH = '/';
const AUTH_PATH = '/auth';
const APP_PATH = '/app';
const PRODUCT_SEGMENT = 'product';
const CATEGORY_SEGMENT = 'category';
const SEARCH_SEGMENT = 'search';
const ADMIN_ROOT_PATH = '/admin';

const LOGIN_SEGMENT = 'login';
const SIGNUP_SEGMENT = 'signup';

const ADMIN_AUTH_SEGMENT = 'auth';
const ADMIN_LOGIN_SEGMENT = 'login';
const ADMIN_HOME_SEGMENT = 'home';
const ADMIN_PROFILE_SEGMENT = 'profile';
const ADMIN_PRODUCTS_SEGMENT = 'products';
const ADMIN_WOMEN_PRODUCTS_SEGMENT = 'products/women';
const ADMIN_MEN_PRODUCTS_SEGMENT = 'products/men';
const ADMIN_GIRLS_PRODUCTS_SEGMENT = 'products/girls';
const ADMIN_BOYS_PRODUCTS_SEGMENT = 'products/boys';
const ADMIN_ACCESSORIES_SEGMENT = 'products/accessories';
const ADMIN_EDIT_PRICE_SEGMENT = 'products/edit-price';
const ADMIN_CUSTOMERS_SEGMENT = 'users/customers';
const ADMIN_ADMINS_SEGMENT = 'users/admins';
const ADMIN_SUPPLIERS_SEGMENT = 'users/suppliers';
const ADMIN_CATEGORIES_SEGMENT = 'categories';
const ADMIN_ORDERS_SEGMENT = 'orders';

export const APP_ROUTING_PATHS = {
  ROOT: ROOT_PATH,
  AUTH: AUTH_PATH,
  APP: APP_PATH,
  PRODUCT: PRODUCT_SEGMENT,
  CATEGORY: CATEGORY_SEGMENT,
  SEARCH: SEARCH_SEGMENT,
  LOGIN: LOGIN_SEGMENT,
  SIGNUP: SIGNUP_SEGMENT,
  ADMIN: {
    ROOT: ADMIN_ROOT_PATH,
    AUTH: ADMIN_AUTH_SEGMENT,
    LOGIN: ADMIN_LOGIN_SEGMENT,
    HOME: ADMIN_HOME_SEGMENT,
    PROFILE: ADMIN_PROFILE_SEGMENT,
    PRODUCTS: ADMIN_PRODUCTS_SEGMENT,
    WOMEN_PRODUCTS: ADMIN_WOMEN_PRODUCTS_SEGMENT,
    MEN_PRODUCTS: ADMIN_MEN_PRODUCTS_SEGMENT,
    GIRLS_PRODUCTS: ADMIN_GIRLS_PRODUCTS_SEGMENT,
    BOYS_PRODUCTS: ADMIN_BOYS_PRODUCTS_SEGMENT,
    ACCESSORIES: ADMIN_ACCESSORIES_SEGMENT,
    EDIT_PRICE: ADMIN_EDIT_PRICE_SEGMENT,
    CUSTOMERS: ADMIN_CUSTOMERS_SEGMENT,
    ADMINS: ADMIN_ADMINS_SEGMENT,
    SUPPLIERS: ADMIN_SUPPLIERS_SEGMENT,
    CATEGORIES: ADMIN_CATEGORIES_SEGMENT,
    ORDERS: ADMIN_ORDERS_SEGMENT,
  },
  AUTH_LOGIN_PAGE: `${AUTH_PATH}/${LOGIN_SEGMENT}`,
  AUTH_SIGNUP_PAGE: `${AUTH_PATH}/${SIGNUP_SEGMENT}`,
  APP_HOME_PAGE: APP_PATH,
  APP_PRODUCT_PAGE: (productId: string | number, variantId?: string | number | null) => (
    `${APP_PATH}/${PRODUCT_SEGMENT}/${productId}${variantId ? `?variant=${variantId}` : ''}`
  ),
  APP_CATEGORY_PAGE: (
    categoryType: 'main' | 'sub',
    categoryId: string | number,
    page: string | number = 1,
  ) => `${APP_PATH}/${CATEGORY_SEGMENT}/${categoryType}/${categoryId}?page=${page}`,
  APP_SEARCH_PAGE: (
    searchQuery = '',
    page: string | number = 1,
  ) => `${APP_PATH}/${SEARCH_SEGMENT}?q=${encodeURIComponent(searchQuery)}&page=${page}`,
  ADMIN_LOGIN_PAGE: `${ADMIN_ROOT_PATH}/${ADMIN_AUTH_SEGMENT}/${ADMIN_LOGIN_SEGMENT}`,
  ADMIN_HOME_PAGE: `${ADMIN_ROOT_PATH}/${ADMIN_HOME_SEGMENT}`,
  ADMIN_PRODUCTS_PAGE: (categoryId: string | number) => `${ADMIN_ROOT_PATH}/${ADMIN_PRODUCTS_SEGMENT}/${categoryId}`,
  ADMIN_CUSTOMER_EDIT_PAGE: (userId: string | number) => (
    `${ADMIN_ROOT_PATH}/${ADMIN_CUSTOMERS_SEGMENT}/${userId}/edit`
  ),
  ADMIN_ADMINISTRATOR_EDIT_PAGE: (userId: string | number) => (
    `${ADMIN_ROOT_PATH}/${ADMIN_ADMINS_SEGMENT}/${userId}/edit`
  ),
  ADMIN_PAGE: (segment: string) => `${ADMIN_ROOT_PATH}/${segment}`,
  ADMIN_PAGE_WITH_PAGE: (segment: string, page: string | number) => `${ADMIN_ROOT_PATH}/${segment}/${page}`,
} as const;


export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/register',
    REFRESH: '/auth/token/refresh',
    LOGOUT: '/auth/logout',
    PASSWORD_CHANGE: '/auth/password/change',
  },
  ADMIN: {
    DASHBOARD_OVERVIEW: '/admin/dashboard/overview',
    PRODUCTS: '/admin/products/',
    PRODUCT_DETAIL: (productId: string | number) => `/admin/products/${productId}`,
    PRODUCT_VARIANTS: (productId: string | number) => `/admin/products/${productId}/variants`,
    PRODUCT_VARIANT_DETAIL: (
      productId: string | number,
      variantId: string | number,
    ) => `/admin/products/${productId}/variants/${variantId}`,
    PRODUCT_IMAGES_UPLOAD: (productId: string | number) => `/admin/products/${productId}/images/upload`,
    PRODUCT_IMAGE_DETAIL: (
      productId: string | number,
      imageId: string | number,
    ) => `/admin/products/${productId}/images/${imageId}`,
    USERS: '/admin/users/',
    USER_DETAIL: (userId: string | number) => `/admin/users/${userId}`,
  },
  USERS: '/users',
  USERS_ME: '/users/me',
  CATEGORIES: '/categories/',
  CATEGORIES_MAIN: '/categories/main',
  CATEGORIES_COUNT: '/categories/count',
  CATEGORY_DETAIL: (categoryId: string | number) => `/categories/${categoryId}`,
  PRODUCTS: '/products/',
  PRODUCT_AUTOCOMPLETE: '/products/autocomplete',
  PRODUCT_DETAIL: (productId: string | number) => `/products/${productId}`,
} as const;
