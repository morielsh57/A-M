import React from 'react';
import { HomeOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import type { IUser } from '../../../../shared/store/user/user.types';
import './ProfileCard.scss';

interface ProfileCardProps {
  user?: IUser;
  isLoading: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, isLoading }) => {
  const displayName = user?.name || (isLoading ? 'Loading user' : 'Customer user');

  return (
    <aside className="profile-card">
      <div className="profile-card__avatar">
        <UserOutlined />
      </div>
      <div className="profile-card__identity">
        <h2>{displayName}</h2>
        <p className="profile-card__role">{user?.role || 'Customer'}</p>
      </div>

      <div className="profile-card__details">
        <div className="profile-card__detail">
          <MailOutlined />
          <div>
            <span>Email</span>
            <strong>{user?.email || 'Not available'}</strong>
          </div>
        </div>
        <div className="profile-card__detail">
          <PhoneOutlined />
          <div>
            <span>Phone</span>
            <strong>{user?.phone || 'Not set'}</strong>
          </div>
        </div>
        <div className="profile-card__detail">
          <HomeOutlined />
          <div>
            <span>Address</span>
            <strong>{user?.address || 'Not set'}</strong>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ProfileCard;
