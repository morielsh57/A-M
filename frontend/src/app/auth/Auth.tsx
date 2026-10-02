import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { removeItemFromLocalStorage, setItemInLocalStorage } from '../../shared/utils/localStorage.utils';
import { AUTH_LOCAL_STORAGE_KEYS } from '../constants';
import { useApiData } from '../../shared/hooks/useApiData';
import { isUserAdminOrSupplier } from './auth.utils';
import {
  clearCurrentAdminOrSupplierUser,
  clearCurrentUser,
  getCurrentAdminOrSupplier,
  getCurrentUser,
} from '../../shared/store/user/user.store';
import { APP_ROUTING_PATHS } from '../routing';
import { addToast } from '../../shared/utils/toast.utils';
import { getCart } from '../../components/client/cart/cart.store';

export const Auth: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { loginRes, adminLoginRes } = useAppSelector((store) => store.authStoreReducer);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const clearSavedAuth = () => {
    removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.USER);
    removeItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ADMIN_OR_SUPPLIER_USER);
    dispatch(clearCurrentUser());
    dispatch(clearCurrentAdminOrSupplierUser());
  };

  const persistTokens = (access: string, refresh: string) => {
    setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN, access);
    setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refresh);
  };

  const handleClientLoginSuccess = async (loginData: typeof loginRes.data) => {
    if (!loginData?.access || !loginData.refresh) {
      return;
    }

    persistTokens(loginData.access, loginData.refresh);

    try {
      const userData = await dispatch(getCurrentUser()).unwrap();
      await dispatch(getCart()).unwrap();
      addToast(`welcome ${userData?.name || ''} to our store, you logged in`, {
        appearance: 'success',
        autoDismiss: true,
      });
    } finally {
      const requestedPath = (location.state as { returnTo?: unknown } | null)?.returnTo;
      navigate(
        typeof requestedPath === 'string' && requestedPath.startsWith(`${APP_ROUTING_PATHS.APP}/`)
          ? requestedPath
          : APP_ROUTING_PATHS.APP,
        { replace: true },
      );
    }
  };

  const handleAdminLoginSuccess = async (loginData: typeof adminLoginRes.data) => {
    if (!loginData?.access || !loginData.refresh) {
      return;
    }

    if (!isUserAdminOrSupplier(loginData.access)) {
      clearSavedAuth();
      addToast('You must be an admin or supplier user to access the admin panel.', {
        appearance: 'error',
        autoDismiss: true,
      });
      return;
    }

    persistTokens(loginData.access, loginData.refresh);
    dispatch(getCurrentAdminOrSupplier()).finally(() => {
      addToast('Welcome to the admin panel. You are now logged in.', {
        appearance: 'success',
        autoDismiss: true,
      });
      navigate(APP_ROUTING_PATHS.ADMIN_HOME_PAGE);
    });
  };

  // Email verification redirects back with auth tokens so the new customer is logged in automatically.
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const access = searchParams.get('access');
    const refresh = searchParams.get('refresh');

    if (!access || !refresh) {
      return;
    }

    persistTokens(access, refresh);

    void (async () => {
      try {
        const userData = await dispatch(getCurrentUser()).unwrap();
        await dispatch(getCart()).unwrap();
        addToast(`welcome ${userData?.name || ''} to our store, your email was verified`, {
          appearance: 'success',
          autoDismiss: true,
        });
      } finally {
        searchParams.delete('access');
        searchParams.delete('refresh');
        const cleanSearch = searchParams.toString();
        navigate(
          {
            pathname: location.pathname,
            search: cleanSearch ? `?${cleanSearch}` : '',
          },
          { replace: true },
        );
      }
    })();
  }, [dispatch, location.pathname, location.search, navigate]);

  useApiData(loginRes, {
    onFulfilled(loginData) {
      void handleClientLoginSuccess(loginData);
    },
  });

  useApiData(adminLoginRes, {
    onFulfilled(loginData) {
      void handleAdminLoginSuccess(loginData);
    },
    onRejected() {
      if (adminLoginRes.error?.message) {
        addToast(adminLoginRes.error.message, {
          appearance: 'error',
          autoDismiss: true,
        });
        return;
      }

      addToast('Login failed. Please try again.', {
       appearance: 'error',
        autoDismiss: true,
      });
    },
  });

  return <>{children}</>;
};
