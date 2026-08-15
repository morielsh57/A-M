import React from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../../app/constants';
import SearchInput from './search-input/SearchInput';
import CartButton from './CartButton';
import ClientNavbar from '../client-navbar/ClientNavbar';
import AppLogo from '../../components/app-logo/AppLogo';
import ClientUserMenu from './ClientUserMenu';
import CartSideWindow from '../../../components/client/cart/CartSideWindow';
import "./Header.scss";

const Header: React.FC = () => {
  const isLoggedIn = Boolean(localStorage.getItem(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN));

  return (
    <header className="client-store-header pt-md-0 pt-3">
      <SearchInput view="mobile" />
      <div className="row justify-content-around align-items-center col-11 mx-auto py-2">
        <CartButton />
        <div className="col-4 text-center">
          <AppLogo />
        </div>
        <div className="col-4 text-end d-flex align-items-center border-1 border-white justify-content-end">
          <SearchInput view="desktop" />
          {isLoggedIn ? (
            <ClientUserMenu />
          ) : (
            <Link to={APP_ROUTING_PATHS.AUTH_LOGIN_PAGE} className="btn btn-outline-purple fw-bold">LogIn</Link>
          )}
        </div>
      </div>
      <ClientNavbar />
      <CartSideWindow />
    </header>
  );
};

export default Header;
