import React from 'react';

import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { setItemInLocalStorage } from '../../shared/utils/localStorage.utils';
import { AUTH_LOCAL_STORAGE_KEYS } from '../constants';
import { useApiData } from '../../shared/hooks/useApiData';
import { loginRequest } from './auth.store';
import { getUserIdFromToken } from './auth.utils';
import { getUserById } from '../../shared/store/user.store';
import { APP_ROUTING_PATHS } from '../routing';
import { useToasts } from 'react-toast-notifications';

export const Auth: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { loginRes } = useAppSelector((store) => store.authStoreReducer);
  const { user } = useAppSelector((state) => state.userStoreReducer);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  let { addToast } = useToasts();

  // observe login results, and if successful, save the tokens and navigate to the home page
  useApiData(loginRes, {
    onFulfilled(loginData) {
      if (loginData.access && loginData.refresh) {
        const { access, refresh } = loginData;
        setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN, access);
        setItemInLocalStorage(AUTH_LOCAL_STORAGE_KEYS.REFRESH_TOKEN, refresh);
        const userId = getUserIdFromToken(access);
        // on success login get the user data and navigate to the home page
        dispatch(getUserById({ id: userId }))
          .unwrap()
          .finally(() => {
            addToast(`welcome ${user?.name || ''} to our store, you logged in`, {
              appearance: "success",
              autoDismiss: true,
            });
            navigate(`${APP_ROUTING_PATHS.APP}`);
          });
        // TODO: on successfull login check if user has cart items in the local storage and if so, add them to the cart in the backend DB.
        // Then, request the user's cart from the backend database. 
        // The response includes the complete cart: items saved during previous logged-in sessions and items added locally during the current session before login. 
        // Finally, update the cart in the frontend store and localStorage.     
      }
    },
  });

  return <>{children}</>;
};
