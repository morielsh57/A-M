import type { FunctionComponent, ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUserRoleFromToken } from '../../auth/auth.utils';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../constants';
import { APP_ROUTING_PATHS } from '../../routing';
import { getItemFromLocalStorage } from '../../../shared/utils/localStorage.utils';
import { EUserRole } from '../../../shared/store/user/user.types';

interface ProtectedCheckoutRouteProps {
  children: ReactElement;
}

export const ProtectedCheckoutRoute: FunctionComponent<ProtectedCheckoutRouteProps> = ({
  children,
}) => {
  const location = useLocation();
  const token = getItemFromLocalStorage<string>(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    return (
      <Navigate
        to={APP_ROUTING_PATHS.AUTH_LOGIN_PAGE}
        replace
        state={{ returnTo: `${location.pathname}${location.search}` }}
      />
    );
  }

  // The backend issues login tokens only after email verification. Admins are
  // also allowed to use the customer shopping flow by product requirement.
  const role = getUserRoleFromToken(token);
  if (role !== EUserRole.CUSTOMER && role !== EUserRole.ADMIN) {
    return <Navigate to={APP_ROUTING_PATHS.APP_HOME_PAGE} replace />;
  }

  return children;
};
