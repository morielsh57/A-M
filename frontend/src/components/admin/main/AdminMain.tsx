import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { EAPIStatus } from '../../../shared/api/models';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../../app/constants';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { getCurrentAdminOrSupplier } from '../../../shared/store/user.store';
import { getItemFromLocalStorage } from '../../../shared/utils/localStorage.utils';
import AdminHeader from '../../../shared/layout/admin-header/AdminHeader';
import AdminNavbar from '../../../shared/layout/admin-navbar/AdminNavbar';
import './AdminMain.scss';

const AdminMain: React.FC = () => {
  const dispatch = useAppDispatch();
  const { adminOrSupplierUser, getCurrentAdminOrSupplierRequest } = useAppSelector((store) => store.userStoreReducer);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const adminHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = getItemFromLocalStorage(AUTH_LOCAL_STORAGE_KEYS.ADMIN_OR_SUPPLIER_USER);
    const accessToken = getItemFromLocalStorage<string>(AUTH_LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    const shouldRequestUser =
      !savedUser
      && !adminOrSupplierUser
      && !!accessToken
      && getCurrentAdminOrSupplierRequest.status !== EAPIStatus.PENDING;

    if (shouldRequestUser) {
      void dispatch(getCurrentAdminOrSupplier());
    }
  }, [adminOrSupplierUser, dispatch, getCurrentAdminOrSupplierRequest.status]);

  // match the navbar position with the header height, so that the navbar is not hidden behind the header
  useLayoutEffect(() => {
    const headerElement = adminHeaderRef.current;

    if (!headerElement) {
      return undefined;
    }

    const updateHeaderHeight = () => {
      setHeaderHeight(headerElement.getBoundingClientRect().height);
    };
    const resizeObserver = new ResizeObserver(updateHeaderHeight);

    updateHeaderHeight();
    resizeObserver.observe(headerElement);
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  const adminMainStyle = headerHeight
    ? ({ '--admin-header-height': `${headerHeight}px` } as React.CSSProperties)
    : undefined;

  return (
    <main
      className={`admin-main-container ${isNavbarOpen ? 'admin-main-container--nav-open' : ''}`}
      style={adminMainStyle}
    >
      <div ref={adminHeaderRef} className="admin-main-container__header">
        <AdminHeader />
      </div>
      <AdminNavbar isOpen={isNavbarOpen} onToggle={() => setIsNavbarOpen((isOpen) => !isOpen)} />
      <div className="admin-main-scrollable-content-container">
        <Outlet />
      </div>
    </main>
  );
};

export default AdminMain;
