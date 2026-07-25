import React from 'react';
import type { MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import { Dropdown } from 'antd';

const MOBILE_MENU_ITEMS: MenuProps['items'] = [
  {
    key: 'women',
    label: 'Women',
    className: 'py-2',
    children: [
      { key: 'women-tops', className: 'menuItemNav', label: <Link to="#">Tops</Link> },
      { key: 'women-pants', className: 'menuItemNav', label: <Link to="#">Pants</Link> },
      { key: 'women-drasses', className: 'menuItemNav', label: <Link to="#">Drasses</Link> },
    ],
  },
  {
    key: 'men',
    label: 'Men',
    className: 'py-2',
    children: [
      { key: 'men-shirts', className: 'menuItemNav', label: <Link to="#">Shirts</Link> },
      { key: 'men-pants', className: 'menuItemNav', label: <Link to="#">Pants</Link> },
    ],
  },
  {
    key: 'boys',
    label: 'Boys',
    className: 'py-2',
    children: [
      { key: 'boys-shirts', className: 'menuItemNav', label: <Link to="#">Shirts</Link> },
      { key: 'boys-pants', className: 'menuItemNav', label: <Link to="#">Pants</Link> },
    ],
  },
  {
    key: 'girls',
    label: 'Girls',
    className: 'py-2',
    children: [
      { key: 'girls-tops', className: 'menuItemNav', label: <Link to="#">Tops</Link> },
      { key: 'girls-pants', className: 'menuItemNav', label: <Link to="#">Pants</Link> },
      { key: 'girls-drasses', className: 'menuItemNav', label: <Link to="#">Drasses</Link> },
    ],
  },
  { key: 'accessories', className: 'menuItemNav ps-2 py-2', label: <Link to="#">Accessories</Link> },
];

const ClientMobileNavbar: React.FC = () => {
  return (
    <Dropdown menu={{ items: MOBILE_MENU_ITEMS, className: 'py-0 w-sm-25 w-50' }} trigger={['click']}>
      <div className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
        <i className="fa fa-bars text-light" aria-hidden="true"></i>
      </div>
    </Dropdown>
  );
};

export default ClientMobileNavbar;
