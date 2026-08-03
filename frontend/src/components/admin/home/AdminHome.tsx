import React, { useEffect } from 'react';
import { EAPIStatus } from '../../../shared/api/models';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EUserRole } from '../../../shared/store/user.types';
import AdminDashboard from './AdminDashboard';
import { getAdminDashboardOverview } from './AdminHome.store';
import type { IAdminDashboardOverview } from './AdminHome.types';
import SupplierDashboard from './SupplierDashboard';
import './AdminHome.scss';

const getDashboardContent = (
  role: EUserRole | undefined,
  overview: IAdminDashboardOverview | undefined,
  isLoading: boolean,
  formatTrend: (trendPercent?: number) => string,
) => {
  if (role === EUserRole.SUPPLIER) {
    return (
      <SupplierDashboard
        overview={overview}
        isLoading={isLoading}
        formatTrend={formatTrend}
      />
    );
  }

  return (
    <AdminDashboard
      overview={overview}
      isLoading={isLoading}
      formatTrend={formatTrend}
    />
  );
};

const getDashboardHeader = (role: EUserRole | undefined) => {
  if (role === EUserRole.SUPPLIER) {
    return {
      title: 'Supplier Dashboard',
      subtitle: 'Track your product performance, revenue, and inventory focus areas.',
    };
  }

  return {
    title: 'Dashboard',
    subtitle: 'Track the store health, customer growth, and sales performance.',
  };
};

const AdminHome: React.FC = () => {
  const dispatch = useAppDispatch();
  const { dashboardOverviewRequest } = useAppSelector((store) => store.adminHomeStoreReducer);
  const { adminOrSupplierUser } = useAppSelector((store) => store.userStoreReducer);
  const overview = dashboardOverviewRequest.data;
  const isLoading = dashboardOverviewRequest.status === EAPIStatus.PENDING;
  const dashboardHeader = getDashboardHeader(adminOrSupplierUser?.role);

  useEffect(() => {
    if (dashboardOverviewRequest.status === EAPIStatus.IDLE) {
      dispatch(getAdminDashboardOverview());
    }
  }, [dashboardOverviewRequest.status, dispatch]);

  const formatTrend = (trendPercent = 0) => {
    const prefix = trendPercent > 0 ? '+' : '';
    return `${prefix}${trendPercent.toFixed(1)}%`;
  };

  const dashboardContent = getDashboardContent(
    adminOrSupplierUser?.role,
    overview,
    isLoading,
    formatTrend,
  );

  return (
    <section className="admin-home">
      <div className="admin-home__header">
        <div>
          <p className="admin-home__eyebrow">Management overview</p>
          <h1 className="admin-home__title">{dashboardHeader.title}</h1>
          <p className="admin-home__subtitle">{dashboardHeader.subtitle}</p>
        </div>
        <div className="admin-home__date">Updated today</div>
      </div>

      {dashboardContent}
    </section>
  );
};

export default AdminHome;
