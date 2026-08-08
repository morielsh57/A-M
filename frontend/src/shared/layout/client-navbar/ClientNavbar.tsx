import React from 'react';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import { Dropdown } from 'antd';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppSelector } from '../../../app/store';
import type { ICategory, IMainCategory } from '../../store/category/category.types';
import ClientMobileNavbar from './ClientMobileNavbar';
import './ClientNavbar.scss';

const getMainCategoryLabel = (category: IMainCategory) => category.main_category_name;

const getSubCategoryLabel = (category: ICategory) => (
  category.sub_category_name || category.main_category_name
);

const createMenuItems = (category: IMainCategory): MenuProps['items'] =>
  category.subcategories.map((subCategory) => ({
    key: String(subCategory.category_id),
    className: 'menuItemNav',
    label: (
      <Link to={APP_ROUTING_PATHS.APP_CATEGORY_PAGE('sub', subCategory.category_id)}>
        {getSubCategoryLabel(subCategory)}
      </Link>
    ),
  }));

const ClientNavbar: React.FC = () => {
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const mainCategories = getMainCategoriesReq.data || [];

  return (
    <nav className="nav-client mx-md-auto text-light d-md-flex align-items-center justify-content-md-center py-md-3 py-2 w-100">
      <div className="desktop-navbar-contaienr d-md-flex d-none">
        {mainCategories.map((category) => {
          const categoryLink = APP_ROUTING_PATHS.APP_CATEGORY_PAGE('main', category.category_id);

          if (!category.subcategories?.length) {
            return (
              <Link
                key={String(category.category_id)}
                to={categoryLink}
                className="text-decoration-none text-white"
              >
                {getMainCategoryLabel(category)}
              </Link>
            );
          }

          return (
            <Dropdown
              key={String(category.category_id)}
              menu={{ items: createMenuItems(category), className: 'py-0' }}
            >
              <Link to={categoryLink} className="ant-dropdown-link">
                {getMainCategoryLabel(category)} <DownOutlined className="nav-dropdown-icon" />
              </Link>
            </Dropdown>
          );
        })}
      </div>
      <div className="d-md-none d-block">
        <ClientMobileNavbar />
      </div>
    </nav>
  );
};

export default ClientNavbar;
