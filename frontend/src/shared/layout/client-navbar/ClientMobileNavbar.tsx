import React from 'react';
import type { MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import { Dropdown } from 'antd';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppSelector } from '../../../app/store';
import type { ICategory, IMainCategory } from '../../store/category/category.types';

const getMainCategoryLabel = (category: IMainCategory) => category.main_category_name;

const getSubCategoryLabel = (category: ICategory) => (
  category.sub_category_name || category.main_category_name
);

const createMobileMenuItems = (categories: IMainCategory[]): MenuProps['items'] => (
  categories.map((category) => {
    const categoryLink = APP_ROUTING_PATHS.APP_CATEGORY_PAGE('main', category.category_id);
    const children = category.subcategories.map((subCategory) => ({
      key: `sub-${subCategory.category_id}`,
      className: 'menuItemNav',
      label: (
        <Link to={APP_ROUTING_PATHS.APP_CATEGORY_PAGE('sub', subCategory.category_id)}>
          {getSubCategoryLabel(subCategory)}
        </Link>
      ),
    }));

    return {
      key: `main-${category.category_id}`,
      label: <Link to={categoryLink}>{getMainCategoryLabel(category)}</Link>,
      className: 'py-2',
      children: children.length ? children : undefined,
    };
  })
);

const ClientMobileNavbar: React.FC = () => {
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const mainCategories = getMainCategoriesReq.data || [];

  return (
    <Dropdown
      menu={{
        items: createMobileMenuItems(mainCategories),
        className: 'py-0 w-sm-25 w-50',
        triggerSubMenuAction: 'click',
      }}
      trigger={['click']}
    >
      <div className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
        <i className="fa fa-bars text-light" aria-hidden="true"></i>
      </div>
    </Dropdown>
  );
};

export default ClientMobileNavbar;
