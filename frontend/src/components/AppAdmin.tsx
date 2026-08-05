import { APP_ROUTING_PATHS } from '../app/routing';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLogin from '../app/auth/admin/admin-login/AdminLogin';
import { ProtectedAdminRoute } from '../app/guards/admin/ProtectedAdminRoute';
import AdminMain from './admin/main/AdminMain';
import AdminHome from './admin/home/AdminHome';
import AdminProfile from './admin/profile/AdminProfile';

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
      </Route>
      <Route path="*" element={<Navigate to={APP_ROUTING_PATHS.ADMIN_HOME_PAGE} replace />} />
    </Routes>
  );
}

export default AppAdmin;
