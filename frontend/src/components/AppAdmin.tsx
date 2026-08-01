import React from 'react';
import { APP_ROUTING_PATHS } from '../app/routing';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLogin from '../app/auth/admin/admin-login/AdminLogin';

function AppAdmin() {
  return (
    <Routes>
      <Route index element={<Navigate to={`${APP_ROUTING_PATHS.ADMIN.AUTH}/${APP_ROUTING_PATHS.ADMIN.LOGIN}`} replace />} />
      <Route path={`${APP_ROUTING_PATHS.ADMIN.AUTH}/${APP_ROUTING_PATHS.ADMIN.LOGIN}`} element={<AdminLogin />} />
      <Route path="*" element={<Navigate to={APP_ROUTING_PATHS.ADMIN_LOGIN_PAGE} replace />} />
    </Routes>
  );
}

export default AppAdmin;
