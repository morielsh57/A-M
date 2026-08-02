import { AUTH_LOCAL_STORAGE_KEYS } from '../../app/constants';
import { API_ROUTES, APP_ROUTING_PATHS } from '../../app/routing';
import { apiService } from '../api/axios';
import { getItemFromLocalStorage, removeItemFromLocalStorage } from './localStorage.utils';

interface LogoutResponse {
  message: string;
}

interface LogoutOptions {
  redirectPath?: string;
}

const clearAuthLocalStorage = () => {
  removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
  removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.USER);
  removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ADMIN_OR_SUPPLIER_USER);
};

const requestServerLogout = async () => {
  const refresh = getItemFromLocalStorage<string>(AUTH_LOCAL_STORAGE_KEYS.REFRESH_TOKEN);

  if (!refresh) {
    return;
  }
  
  await apiService.post<LogoutResponse, { refresh: string }>(
    API_ROUTES.AUTH.LOGOUT,
    { refresh: refresh || '' },
  );
};

export const logout = async (options: LogoutOptions = {}) => {
  const redirectPath = options.redirectPath || APP_ROUTING_PATHS.AUTH_LOGIN_PAGE;
  try {
    await requestServerLogout();
  } finally {
    clearAuthLocalStorage();

    if (typeof window !== 'undefined') {
      window.location.href = redirectPath;
    }
  }
};
