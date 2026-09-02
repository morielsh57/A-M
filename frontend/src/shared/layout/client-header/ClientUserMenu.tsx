import React from 'react';
import Avatar from '@mui/material/Avatar';
import { LogoutOutlined, ShoppingOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { logout } from '../../utils/logout.utils';
import './ClientUserMenu.scss';

const ClientUserMenu: React.FC = () => {
  const navigate = useNavigate();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'orders',
      label: 'My orders',
      icon: <ShoppingOutlined />,
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'profile') {
      navigate(APP_ROUTING_PATHS.APP_PROFILE_PAGE);
      return;
    }

    if (key === 'orders') {
      navigate(APP_ROUTING_PATHS.APP_ORDERS_PAGE());
      return;
    }

    if (key === 'logout') {
      void logout({ redirectPath: APP_ROUTING_PATHS.AUTH_LOGIN_PAGE });
    }
  };

  return (
    <Dropdown
      menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
      arrow
      classNames={{ root: 'client-store-header__user-dropdown' }}
      placement="bottomRight"
      trigger={['click']}
    >
      <button type="button" className="client-store-header__profile" aria-label="Profile menu">
        <Avatar className="client-store-header__avatar">
          <UserOutlined />
        </Avatar>
      </button>
    </Dropdown>
  );
};

export default ClientUserMenu;
