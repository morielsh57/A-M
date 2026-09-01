import { APP_ROUTING_PATHS } from '../app/routing';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLogin from '../app/auth/admin/admin-login/AdminLogin';
import { ProtectedAdminRoute } from '../app/guards/admin/ProtectedAdminRoute';
import AdminMain from './admin/main/AdminMain';
import AdminHome from './admin/home/AdminHome';
import AdminProfile from './admin/profile/AdminProfile';
import AdminProductsTablePage from './admin/products/AdminProductsTablePage';
import { ProtectedAdministratorRoute } from '../app/guards/admin/ProtectedAdministratorRoute';
import AdminCategories from './admin/categories/AdminCategories';
import AdminCustomersTablePage from './admin/users/customers/AdminCustomersTablePage';
import AdminAdministratorsTablePage from './admin/users/administrators/AdminAdministratorsTablePage';
import AdminSuppliersTablePage from './admin/users/suppliers/AdminSuppliersTablePage';
import AdminOrdersTablePage from './admin/orders/AdminOrdersTablePage';
import AdminPickupPointsTablePage from './admin/pickup-points/AdminPickupPointsTablePage';

function AppAdmin() {
  return (
    <Routes>
      <Route index element={<Navigate to={APP_ROUTING_PATHS.ADMIN_HOME_PAGE} replace />} />
      <Route path={`${APP_ROUTING_PATHS.ADMIN.AUTH}/${APP_ROUTING_PATHS.ADMIN.LOGIN}`} element={<AdminLogin />} />
      <Route
        element={
          <ProtectedAdminRoute>
            <AdminMain />
          </ProtectedAdminRoute>
        }
      >
        <Route path={APP_ROUTING_PATHS.ADMIN.HOME} element={<AdminHome />} />
        <Route path={APP_ROUTING_PATHS.ADMIN.PROFILE} element={<AdminProfile />} />
        <Route path={`${APP_ROUTING_PATHS.ADMIN.PRODUCTS}/:categoryId`} element={<AdminProductsTablePage />} />
        <Route
          path={APP_ROUTING_PATHS.ADMIN.CATEGORIES}
          element={(
            <ProtectedAdministratorRoute>
              <AdminCategories />
            </ProtectedAdministratorRoute>
          )}
        />
        <Route
          path={APP_ROUTING_PATHS.ADMIN.CUSTOMERS}
          element={(
            <ProtectedAdministratorRoute>
              <AdminCustomersTablePage />
            </ProtectedAdministratorRoute>
          )}
        />
        <Route
          path={APP_ROUTING_PATHS.ADMIN.ADMINS}
          element={(
            <ProtectedAdministratorRoute>
              <AdminAdministratorsTablePage />
            </ProtectedAdministratorRoute>
          )}
        />
         <Route
          path={APP_ROUTING_PATHS.ADMIN.SUPPLIERS}
          element={(
            <ProtectedAdministratorRoute>
              <AdminSuppliersTablePage />
            </ProtectedAdministratorRoute>
          )}
        />
        <Route path={APP_ROUTING_PATHS.ADMIN.ORDERS} element={<AdminOrdersTablePage />} />
        <Route
          path={APP_ROUTING_PATHS.ADMIN.PICKUP_POINTS}
          element={(
            <ProtectedAdministratorRoute>
              <AdminPickupPointsTablePage />
            </ProtectedAdministratorRoute>
          )}
        />
      </Route>
      <Route path="*" element={<Navigate to={APP_ROUTING_PATHS.ADMIN_HOME_PAGE} replace />} />
    </Routes>
  );
}

export default AppAdmin;
