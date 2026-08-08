import React from 'react';
import { EAPIStatus } from '../../../shared/api/models';
import { useAppSelector } from '../../../app/store';
import AdminProfileCard from './AdminProfileCard';
import AdminProfileDetailsForm from './AdminProfileDetailsForm';
import AdminChangePasswordForm from './AdminChangePasswordForm';
import './AdminProfile.scss';

const AdminProfile: React.FC = () => {
  const { adminOrSupplierUser, getCurrentAdminOrSupplierRequest } = useAppSelector((store) => store.userStoreReducer);
  const isLoading = !adminOrSupplierUser && getCurrentAdminOrSupplierRequest.status === EAPIStatus.PENDING;

  return (
    <section className="admin-profile">
      <div className="admin-profile__header">
        <div>
          <p className="admin-profile__eyebrow">Account settings</p>
          <h1 className="admin-profile__title">Profile</h1>
          <p className="admin-profile__subtitle">Manage your contact details and password from one place.</p>
        </div>
        <div className="admin-profile__status">{isLoading ? 'Loading profile' : 'Active account'}</div>
      </div>

      <div className="admin-profile__content">
        <AdminProfileCard user={adminOrSupplierUser} isLoading={isLoading} />
        <div className="admin-profile__forms">
          <AdminProfileDetailsForm user={adminOrSupplierUser} />
          <AdminChangePasswordForm />
        </div>
      </div>
    </section>
  );
};

export default AdminProfile;
