import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { removeItemFromLocalStorage, setItemInLocalStorage } from '../../shared/utils/localStorage.utils';
import { AUTH_LOCAL_STORAGE_KEYS } from '../constants';
import { useApiData } from '../../shared/hooks/useApiData';
import { getUserIdFromToken, isUserAdminOrSupplier } from './auth.utils';
import {
  clearCurrentAdminOrSupplierUser,
  clearCurrentUser,
  getAdminOrSupplierById,
  getUserById,
} from '../../shared/store/user.store';
import { APP_ROUTING_PATHS } from '../routing';
import { useToasts } from 'react-toast-notifications';

export const Auth: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { loginRes, adminLoginRes } = useAppSelector((store) => store.authStoreReducer);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();

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
    const userId = getUserIdFromToken(loginData.access);

    if (!userId) {
      addToast('welcome to our store, you logged in', {
        appearance: 'success',
        autoDismiss: true,
      });
      navigate(APP_ROUTING_PATHS.APP);
      return;
    }

    try {
      const userData = await dispatch(getUserById({ id: userId })).unwrap();
      addToast(`welcome ${userData.data?.name || ''} to our store, you logged in`, {
        appearance: 'success',
        autoDismiss: true,
      });
    } finally {
      navigate(APP_ROUTING_PATHS.APP);
    }
    // TODO: on successfull login check if user has cart items in the local storage and if so, add them to the cart in the backend DB.
    // Then, request the user's cart from the backend database. 
    // The response includes the complete cart: items saved during previous logged-in sessions and items added locally during the current session before login. 
    // Finally, update the cart in the frontend store and localStorage.
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
    const userId = getUserIdFromToken(loginData.access);

    if (userId) {
      await dispatch(getAdminOrSupplierById({ id: userId })).finally(() => {
        addToast('Welcome to the admin panel. You are now logged in.', {
          appearance: 'success',
          autoDismiss: true,
        });
        navigate(APP_ROUTING_PATHS.ADMIN_HOME_PAGE);
      });
      return;
    }

    addToast('Welcome to the admin panel. You are now logged in.', {
      appearance: 'success',
      autoDismiss: true,
    });
    navigate(APP_ROUTING_PATHS.ADMIN_HOME_PAGE);
  };

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
