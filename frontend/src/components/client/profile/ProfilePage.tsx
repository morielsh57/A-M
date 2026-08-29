import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import Breadcrumbs from '../../../shared/components/breadcrumbs/Breadcrumbs';
import { getCurrentUser } from '../../../shared/store/user/user.store';
import ChangePasswordForm from './change-password-form/ChangePasswordForm';
import ProfileCard from './profile-card/ProfileCard';
import ProfileDetailsForm from './profile-details-form/ProfileDetailsForm';
import './ProfilePage.scss';
import AppTitle from '../../../shared/components/app-title/AppTitle';

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, getCurrentUserRequest } = useAppSelector((store) => store.userStoreReducer);
  const isLoading = !user && getCurrentUserRequest.status === EAPIStatus.PENDING;

  React.useEffect(() => {
    if (!user && getCurrentUserRequest.status === EAPIStatus.IDLE) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, getCurrentUserRequest.status, user]);

  return (
    <section className="profile-page">
      <Breadcrumbs pageName="Profile" />
      <AppTitle title="Profile" />
      <div className="profile-page__header">
        <div>
          <p className="profile-page__eyebrow">Account settings</p>
          <p className="profile-page__subtitle">Manage your contact details and password from one place.</p>
        </div>
      </div>

      <div className="profile-page__content">
        <ProfileCard user={user} isLoading={isLoading} />
        <div className="profile-page__forms">
          <ProfileDetailsForm user={user} />
          <ChangePasswordForm />
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
