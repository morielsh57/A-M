import { FunctionComponent, ReactElement } from 'react';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../constants';
import { Navigate } from 'react-router-dom';

interface IProps {
  children: ReactElement;
}

// will wrap the auth routing - if there is token navigate the user inside the app to the issues page
export const ProtectedLoginRoute: FunctionComponent<IProps> = ({ children }) => {
  const tokenLocalStorage = localStorage.getItem(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

  return tokenLocalStorage ? <Navigate to="/" replace /> : children;
};
