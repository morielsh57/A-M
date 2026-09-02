import React from 'react';
import { useAppSelector } from '../../../app/store';
import { EUserRole } from '../../store/user/user.types';
import AdminUserMenu from './AdminUserMenu';
import AdminLogo from '../../components/admin-logo/AdminLogo';
import SupplierNotificationsDropdown from '../../../components/admin/notifications/supplier-notifications-dropdown/SupplierNotificationsDropdown';
import './AdminHeader.scss';

const AdminHeader: React.FC = () => {
  const { adminOrSupplierUser } = useAppSelector((store) => store.userStoreReducer);
  const user = adminOrSupplierUser;
  const shouldShowBell = user?.role === EUserRole.SUPPLIER;

  const getPanelType = (): string => {
    if (user?.role === EUserRole.ADMIN) {
      return 'Admin';
    }
    if (user?.role === EUserRole.SUPPLIER) {
      return 'Supplier';
    }

    return 'Admin & Supplier';
  };

  return (
    <header className="admin-header">
      <AdminLogo />
      <div className="admin-header__actions">
        {shouldShowBell && <SupplierNotificationsDropdown />}

        <AdminUserMenu />
      </div>
    </header>
  );
};

export default AdminHeader;
