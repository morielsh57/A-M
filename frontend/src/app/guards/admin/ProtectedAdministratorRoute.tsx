import type { FunctionComponent, ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../constants';
import { APP_ROUTING_PATHS } from '../../routing';
import { isUserAdmin } from '../../auth/auth.utils';
import { getItemFromLocalStorage } from '../../../shared/utils/localStorage.utils';

interface IProps {
  children: ReactElement;
}

export const ProtectedAdministratorRoute: FunctionComponent<IProps> = ({ children }) => {
  const token = getItemFromLocalStorage<string>(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  if (!isUserAdmin(token)) {
    return <Navigate to={APP_ROUTING_PATHS.ADMIN_HOME_PAGE} replace />;
  }

  return children;
};
