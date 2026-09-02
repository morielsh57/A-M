import React, { useMemo } from 'react';
import { BellFilled, DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Badge, Dropdown } from 'antd';
import { useNavigate } from 'react-router-dom';
import { addToast } from '../../../../shared/utils/toast.utils';
import { APP_ROUTING_PATHS } from '../../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { markSupplierNotificationRead } from '../supplierNotifications.store';
import type { ISupplierNotification } from '../supplierNotifications.types';
import {
  formatSupplierNotificationDate,
  getSupplierNotificationErrorMessage,
  getSupplierNotificationTitle,
  getSupplierUnreadNotificationsCount,
} from '../supplierNotifications.utils';
import './SupplierNotificationsDropdown.scss';

const getNotificationItemClassName = (notification: ISupplierNotification) => [
  'supplier-notifications-dropdown__item',
  !notification.is_read ? 'supplier-notifications-dropdown__item--unread' : '',
].filter(Boolean).join(' ');

const SupplierNotificationsDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { supplierNotificationsReq } = useAppSelector(
    (store) => store.supplierNotificationsStoreReducer,
  );
  const notifications = useMemo(() => (
    [...(supplierNotificationsReq.data || [])].sort((first, second) => {
      const dateDiff = new Date(second.date_created).getTime() - new Date(first.date_created).getTime();
      return dateDiff || second.notification_id - first.notification_id;
    })
  ), [supplierNotificationsReq.data]);
  const unreadCount = getSupplierUnreadNotificationsCount(notifications);

  const handleNotificationClick = async (notification: ISupplierNotification) => {
    try {
      if (!notification.is_read) {
        await dispatch(markSupplierNotificationRead({
          notification_id: notification.notification_id,
        })).unwrap();
      }

      navigate(APP_ROUTING_PATHS.ADMIN_NOTIFICATION_PAGE(notification.notification_id));
    } catch (error) {
      addToast(
        getSupplierNotificationErrorMessage(error, 'Notification could not be opened. Please try again.'),
        { appearance: 'error', autoDismiss: true },
      );
    }
  };

  const notificationItems = useMemo<MenuProps['items']>(() => {
    if (!notifications.length) {
      return [{
        key: 'notifications-empty',
        disabled: true,
        label: <span className="supplier-notifications-dropdown__empty">No notifications yet</span>,
      }];
    }

    return notifications.map((notification) => ({
      key: String(notification.notification_id),
      className: getNotificationItemClassName(notification),
      label: (
        <span className="supplier-notifications-dropdown__row">
          <span className="supplier-notifications-dropdown__unread-dot">
            {!notification.is_read ? '•' : ''}
          </span>
          <span className="supplier-notifications-dropdown__content">
            <span className="supplier-notifications-dropdown__title">
              {getSupplierNotificationTitle(notification)}
            </span>
            <span className="supplier-notifications-dropdown__date">
              {formatSupplierNotificationDate(notification.date_created)}
            </span>
          </span>
        </span>
      ),
    }));
  }, [notifications]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const notification = notifications.find((item) => String(item.notification_id) === key);
    if (notification) {
      void handleNotificationClick(notification);
    }
  };

  return (
    <Dropdown
      menu={{
        items: notificationItems,
        className: 'supplier-notifications-dropdown__menu',
        onClick: handleMenuClick,
      }}
      arrow
      classNames={{ root: 'supplier-notifications-dropdown' }}
      placement="bottomRight"
      trigger={['click']}
    >
      <button type="button" className="supplier-notifications-dropdown supplier-notifications-dropdown__bell" aria-label="Notifications">
        <Badge count={unreadCount} size="small">
          <span className="supplier-notifications-dropdown__bell-icon">
            <BellFilled />
          </span>
        </Badge>
        <span className="supplier-notifications-dropdown__chevron">
          <DownOutlined />
        </span>
      </button>
    </Dropdown>
  );
};

export default SupplierNotificationsDropdown;
