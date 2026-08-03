import React from 'react';
import { BellFilled } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Badge, Dropdown } from 'antd';
import { Link } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppSelector } from '../../../app/store';
import { EUserRole, IUserNotification } from '../../store/user.types';
import AdminUserMenu from './AdminUserMenu';
import AdminLogo from '../../components/admin-logo/AdminLogo';
import './AdminHeader.scss';

const decodeTypeNot = (type?: string): string => {
  if (type?.toLocaleLowerCase() === 'canceled') {
    return 'Order cancellation';
  }

  return 'New order has been received';
};

const bellMenuStyle = (isRead?: boolean): string => {
  if (!isRead) {
    return 'rgb(229, 241, 255)';
  }

  return 'white';
};

const AdminHeader: React.FC = () => {
  const { adminOrSupplierUser } = useAppSelector((store) => store.userStoreReducer);
  const user = adminOrSupplierUser;
  // TODO: get supplier notificatino form the backend when  the backend updated
  const notifications: IUserNotification[] = [];
  const shouldShowBell = user?.role === EUserRole.SUPPLIER;

  const notificationItems: MenuProps['items'] = notifications.length
    ? notifications.map((item) => ({
      key: item.notification_id || `${item.orderNumber || 'notification'}`,
      className: 'admin-header-bell-menu-item',
      style: {
        background: bellMenuStyle(item.isRead),
        borderBottom: '1px solid rgb(180, 180, 180)',
      },
      label: (
        <span className="text-decoration-none">
          {decodeTypeNot(item.type)}
        </span>
      ),
    }))
    : [
      {
        key: 'notifications-empty',
        className: 'admin-header-bell-menu-item',
        label: <span className="text-decoration-none">No notifications yet</span>,
      },
    ];

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
        {shouldShowBell && (
          <Dropdown
            menu={{ items: notificationItems, className: 'p-0' }}
            arrow
            classNames={{ root: 'admin-header__notifications-dropdown' }}
            placement="bottomRight"
            trigger={['click']}
          >
            <button type="button" className="admin-header__bell" aria-label="Notifications">
              <Badge count={user?.unreadCounter} size="small">
                <span className="admin-header__bell-icon">
                  <BellFilled />
                </span>
              </Badge>
            </button>
          </Dropdown>
        )}

        <AdminUserMenu />
      </div>
    </header>
  );
};

export default AdminHeader;
