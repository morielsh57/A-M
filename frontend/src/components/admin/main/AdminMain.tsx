import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { EAPIStatus } from '../../../shared/api/models';
import { AUTH_LOCAL_STORAGE_KEYS } from '../../../app/constants';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { getCurrentAdminOrSupplier } from '../../../shared/store/user.store';
import { getItemFromLocalStorage } from '../../../shared/utils/localStorage.utils';
import AdminHeader from '../../../shared/layout/admin-header/AdminHeader';
import './AdminMain.scss';

const AdminMain: React.FC = () => {
  const dispatch = useAppDispatch();
  const { adminOrSupplierUser, getCurrentAdminOrSupplierRequest } = useAppSelector((store) => store.userStoreReducer);

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

  return (
    <main className="admin-main-container">
      <AdminHeader />
      <div className="admin-main-scrollable-content-container">
        <Outlet />
      </div>
    </main>
  );
};

export default AdminMain;
