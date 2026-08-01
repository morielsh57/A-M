const ROOT_PATH = '/';
const AUTH_PATH = '/auth';
const APP_PATH = '/app';
const ADMIN_ROOT_PATH = '/admin';

const LOGIN_SEGMENT = 'login';
const SIGNUP_SEGMENT = 'signup';

const ADMIN_AUTH_SEGMENT = 'auth';
const ADMIN_LOGIN_SEGMENT = 'login';
const ADMIN_HOME_SEGMENT = 'home';

export const APP_ROUTING_PATHS = {
  ROOT: ROOT_PATH,
  AUTH: AUTH_PATH,
  APP: APP_PATH,
  LOGIN: LOGIN_SEGMENT,
  SIGNUP: SIGNUP_SEGMENT,
  ADMIN: {
    ROOT: ADMIN_ROOT_PATH,
    AUTH: ADMIN_AUTH_SEGMENT,
    LOGIN: ADMIN_LOGIN_SEGMENT,
    HOME: ADMIN_HOME_SEGMENT,
  },
  AUTH_LOGIN_PAGE: `${AUTH_PATH}/${LOGIN_SEGMENT}`,
  AUTH_SIGNUP_PAGE: `${AUTH_PATH}/${SIGNUP_SEGMENT}`,
  APP_HOME_PAGE: APP_PATH,
  ADMIN_LOGIN_PAGE: `${ADMIN_ROOT_PATH}/${ADMIN_AUTH_SEGMENT}/${ADMIN_LOGIN_SEGMENT}`,
  ADMIN_HOME_PAGE: `${ADMIN_ROOT_PATH}/${ADMIN_HOME_SEGMENT}`,
  ADMIN_PAGE: (segment: string) => `${ADMIN_ROOT_PATH}/${segment}`,
  ADMIN_PAGE_WITH_PAGE: (segment: string, page: string | number) => `${ADMIN_ROOT_PATH}/${segment}/${page}`,
} as const;


export const API_ROUTES = {
  AUTH: {
    LOGIN: '/users/login',
    SIGNUP: '/api/v1/auth/register/',
    REFRESH: '/auth/refresh',
  },
  USERS: '/users',
  USERS_ME: '/users/me',
} as const;
