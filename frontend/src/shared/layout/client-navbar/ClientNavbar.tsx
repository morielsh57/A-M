import React from 'react';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import { Dropdown } from 'antd';
import ClientMobileNavbar from './ClientMobileNavbar';
import './ClientNavbar.scss';

const DownIcon = DownOutlined as React.ComponentType<Record<string, never>>;

const NAV_ITEMS = {
  women: ['Tops', 'Pants', 'Drasses'],
  men: ['Shirts', 'Pants'],
  boys: ['Shirts', 'Pants'],
  girls: ['Tops', 'Pants', 'Drasses'],
} as const;

const createMenuItems = (section: string, items: readonly string[]): MenuProps['items'] =>
  items.map((item) => ({
    key: `${section}-${item}`,
    className: 'menuItemNav',
    label: <Link to="#">{item}</Link>,
  }));

const ClientNavbar: React.FC = () => {
  return (
    <nav className="nav-client mx-md-auto text-light d-md-flex align-items-center justify-content-md-center py-md-3 py-2 w-100">
      <div className="desktop-navbar-contaienr d-md-flex d-none">
        <Dropdown
          className="me-5"
          menu={{ items: createMenuItems('women', NAV_ITEMS.women), className: 'py-0' }}
        >
          <Link to="#" className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
            Women <DownIcon className="nav-dropdown-icon" />
          </Link>
        </Dropdown>
        <Dropdown
          className="me-5"
          menu={{ items: createMenuItems('men', NAV_ITEMS.men), className: 'py-0' }}
        >
          <Link to="#" className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
            Men <DownIcon className="nav-dropdown-icon" />
          </Link>
        </Dropdown>
        <Dropdown
          className="me-5"
          menu={{ items: createMenuItems('boys', NAV_ITEMS.boys), className: 'py-0' }}
        >
          <Link to="#" className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
            Boys <DownIcon className="nav-dropdown-icon" />
          </Link>
        </Dropdown>
        <Dropdown
          className="me-5"
          menu={{ items: createMenuItems('girls', NAV_ITEMS.girls), className: 'py-0' }}
        >
          <Link to="#" className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
            Girls <DownIcon className="nav-dropdown-icon" />
          </Link>
        </Dropdown>
        <Link to="#" className="text-decoration-none text-white">Accessories</Link>
      </div>
      <div className="d-md-none d-block">
        <ClientMobileNavbar />
      </div>
    </nav>
  );
};

export default ClientNavbar;
