import React, { useEffect, useMemo, useState } from 'react';
import {
  AppstoreOutlined,
  DashboardOutlined,
  DownOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { NavLink, useLocation } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../api/models';
import { getMainCategories } from '../../store/category/category.store';
import { EUserRole } from '../../store/user/user.types';
import './AdminNavbar.scss';

interface AdminNavbarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface AdminNavbarItem {
  label: string;
  path: string;
  roles?: EUserRole[];
}

interface AdminNavbarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles?: EUserRole[];
  items?: AdminNavbarItem[];
  path?: string;
}

const createAdminPath = (segment: string) => APP_ROUTING_PATHS.ADMIN_PAGE(segment);

const adminNavbarSections: AdminNavbarSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardOutlined />,
    path: createAdminPath(APP_ROUTING_PATHS.ADMIN.HOME),
  },
  {
    id: 'account',
    label: 'Profile',
    icon: <UserOutlined />,
    path: createAdminPath(APP_ROUTING_PATHS.ADMIN.PROFILE),
  },
  {
    id: 'products',
    label: 'Products',
    icon: <AppstoreOutlined />,
    items: [],
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: <TagsOutlined />,
    path: createAdminPath(APP_ROUTING_PATHS.ADMIN.CATEGORIES),
    roles: [EUserRole.ADMIN],
  },
  {
    id: 'users',
    label: 'Users',
    icon: <TeamOutlined />,
    roles: [EUserRole.ADMIN],
    items: [
      { label: 'Customers', path: createAdminPath(APP_ROUTING_PATHS.ADMIN.CUSTOMERS) },
      { label: 'Admins', path: createAdminPath(APP_ROUTING_PATHS.ADMIN.ADMINS) },
      { label: 'Suppliers', path: createAdminPath(APP_ROUTING_PATHS.ADMIN.SUPPLIERS) },
    ],
  },
  {
    id: 'orders',
    label: 'Users orders',
    icon: <ShoppingCartOutlined />,
    path: createAdminPath(APP_ROUTING_PATHS.ADMIN.ORDERS),
  },
  {
    id: 'pickup-points',
    label: 'Pickup points',
    icon: <EnvironmentOutlined />,
    path: createAdminPath(APP_ROUTING_PATHS.ADMIN.PICKUP_POINTS),
    roles: [EUserRole.ADMIN],
  },
];

const isRoleAllowed = (roles: EUserRole[] | undefined, role: EUserRole | undefined) => {
  return !roles || (!!role && roles.includes(role));
};

const getVisibleSections = (role: EUserRole | undefined) => {
  return adminNavbarSections
    .filter((section) => isRoleAllowed(section.roles, role))
    .map((section) => ({
      ...section,
      items: section.items?.filter((item) => isRoleAllowed(item.roles, role)),
    }));
};

const AdminNavbar: React.FC<AdminNavbarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { adminOrSupplierUser } = useAppSelector((store) => store.userStoreReducer);
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const mainCategories = getMainCategoriesReq.data || [];
  const productCategoryItems = useMemo(() => (
    mainCategories.map((category) => ({
      label: category.main_category_name,
      path: APP_ROUTING_PATHS.ADMIN_PRODUCTS_PAGE(category.category_id),
    }))
  ), [mainCategories]);
  const visibleSections = useMemo(() => (
    getVisibleSections(adminOrSupplierUser?.role).map((section) => (
      section.id === 'products'
        ? { ...section, items: productCategoryItems }
        : section
    ))
  ), [adminOrSupplierUser?.role, productCategoryItems]);
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(() => new Set(['products']));

  useEffect(() => {
    if (
      mainCategories.length === 0
      && getMainCategoriesReq.status === EAPIStatus.IDLE
    ) {
      dispatch(getMainCategories());
    }
  }, [dispatch, getMainCategoriesReq.status, mainCategories.length]);

  useEffect(() => {
    const activeSection = visibleSections.find((section) => {
      return section.items?.some((item) => location.pathname.startsWith(item.path));
    });

    if (activeSection) {
      setOpenSectionIds((currentOpenSections) => {
        if (currentOpenSections.has(activeSection.id)) {
          return currentOpenSections;
        }

        return new Set(currentOpenSections).add(activeSection.id);
      });
    }
  }, [location.pathname, visibleSections]);

  const toggleSection = (sectionId: string) => {
    setOpenSectionIds((currentOpenSections) => {
      const nextOpenSections = new Set(currentOpenSections);

      if (nextOpenSections.has(sectionId)) {
        nextOpenSections.delete(sectionId);
      } else {
        nextOpenSections.add(sectionId);
      }

      return nextOpenSections;
    });
  };

  return (
    <>
      <nav className={`admin-navbar ${isOpen ? 'admin-navbar--open' : 'admin-navbar--closed'}`} aria-label="Admin navigation">
        <div className="admin-navbar__inner">
          <div className="admin-navbar__header">
            <span className="admin-navbar__eyebrow">Panel menu</span>
            <span className="admin-navbar__title">Manage store</span>
          </div>

          <div className="admin-navbar__sections">
            {visibleSections.map((section) => {
              const isSectionOpen = openSectionIds.has(section.id);

              if (section.path) {
                return (
                  <NavLink
                    key={section.id}
                    to={section.path}
                    className={({ isActive }) => `admin-navbar__section-link ${isActive ? 'admin-navbar__section-link--active' : ''}`}
                    onClick={onToggle}
                  >
                    <span className="admin-navbar__section-icon">{section.icon}</span>
                    <span>{section.label}</span>
                  </NavLink>
                );
              }

              return (
                <section key={section.id} className="admin-navbar__section">
                  <button
                    type="button"
                    className={`admin-navbar__section-button ${isSectionOpen ? 'admin-navbar__section-button--open' : ''}`}
                    aria-expanded={isSectionOpen}
                    onClick={() => toggleSection(section.id)}
                  >
                    <span className="admin-navbar__section-icon">{section.icon}</span>
                    <span>{section.label}</span>
                    <DownOutlined className="admin-navbar__section-chevron" />
                  </button>

                  <div className={`admin-navbar__section-items ${isSectionOpen ? 'admin-navbar__section-items--open' : ''}`}>
                    <div className="admin-navbar__section-items-inner">
                      {section.items?.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => `admin-navbar__item ${isActive ? 'admin-navbar__item--active' : ''}`}
                          onClick={onToggle}
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </nav>

      <button
        type="button"
        className={`admin-navbar__toggle ${isOpen ? 'admin-navbar__toggle--open' : 'admin-navbar__toggle--closed'}`}
        aria-label={isOpen ? 'Collapse admin navigation' : 'Expand admin navigation'}
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        {isOpen ? <LeftOutlined /> : <RightOutlined />}
      </button>
    </>
  );
};

export default AdminNavbar;
