import React from 'react';
import { MailOutlined, PhoneOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons';
import type { IAdminOrSupplierUser } from '../../../shared/store/user/user.types';

interface AdminProfileCardProps {
  user?: IAdminOrSupplierUser;
  isLoading: boolean;
}

const AdminProfileCard: React.FC<AdminProfileCardProps> = ({ user, isLoading }) => {
  const displayName = user?.name || (isLoading ? 'Loading user' : 'Admin user');

  return (
    <aside className="admin-profile-card">
      <div className="admin-profile-card__avatar">
        <UserOutlined />
      </div>
      <div className="admin-profile-card__identity">
        <p className="admin-profile-card__role">{user?.role || 'Management user'}</p>
        <h2>{displayName}</h2>
      </div>

      <div className="admin-profile-card__details">
        <div className="admin-profile-card__detail">
          <MailOutlined />
          <div>
            <span>Email</span>
            <strong>{user?.email || 'Not available'}</strong>
          </div>
        </div>
        <div className="admin-profile-card__detail">
          <PhoneOutlined />
          <div>
            <span>Phone</span>
            <strong>{user?.phone || 'Not set'}</strong>
          </div>
        </div>
        <div className="admin-profile-card__detail">
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

export default AdminProfileCard;
