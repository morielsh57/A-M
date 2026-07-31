import React from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../../app/constants';
import mainLogo from '../../../assets/images/main-logo.png';
import SearchInput from './SearchInput';
import CartButton from './CartButton';
import ClientNavbar from '../client-navbar/ClientNavbar';
import AppLogo from '../../components/app-logo/AppLogo';
import "./Header.scss";

const Header: React.FC = () => {
  return (
    <header className="client-store-header pt-md-0 pt-3">
      <SearchInput view="mobile" />
      <div className="row justify-content-around align-items-center col-11 mx-auto">
        <CartButton />
        <div className="col-4 text-center">
          <AppLogo />
        </div>
        <div className="col-4 text-end d-flex align-items-center border-1 border-white justify-content-end">
          <SearchInput view="desktop" />
          {/* TODO: add user avatar when login complete */}
          {localStorage[AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN] ? (
            <>user avatar will be here</>
          ) : (
            <Link to={APP_ROUTING_PATHS.AUTH_LOGIN_PAGE} className="btn btn-outline-purple fw-bold">LogIn</Link>
          )}
        </div>
      </div>
      <ClientNavbar />
    </header>
  );
};

export default Header;
