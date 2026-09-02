import React from 'react';
import Avatar from '@mui/material/Avatar';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { logout } from '../../utils/logout.utils';
import './AdminUserMenu.scss';

const AdminUserMenu: React.FC = () => {
  const navigate = useNavigate();

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
    },
  ];

  const handleProfileMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'profile') {
      navigate(APP_ROUTING_PATHS.ADMIN_PAGE(APP_ROUTING_PATHS.ADMIN.PROFILE));
      return;
    }

    if (key === 'logout') {
      void logout({ redirectPath: APP_ROUTING_PATHS.ADMIN_LOGIN_PAGE });
    }
  };

  return (
    <Dropdown
      menu={{ items: profileMenuItems, onClick: handleProfileMenuClick }}
      arrow
      classNames={{ root: 'admin-header__user-dropdown' }}
      placement="bottomRight"
      trigger={['click']}
    >
      <button type="button" className="admin-header__profile" aria-label="Profile menu">
        <Avatar className="admin-header__avatar">
          <UserOutlined />
        </Avatar>
      </button>
    </Dropdown>
  );
};

export default AdminUserMenu;
