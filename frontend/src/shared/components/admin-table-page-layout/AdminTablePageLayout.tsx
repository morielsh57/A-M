import React from 'react';
import AppButton from '../app-button/AppButton';
import './AdminTablePageLayout.scss';

interface AdminTablePageLayoutProps {
  children: React.ReactNode;
  createButtonLabel?: string;
  eyebrow: string;
  isCreateDisabled?: boolean;
  subtitle: string;
  title: string;
  onCreateClick?: () => void;
}

const AdminTablePageLayout: React.FC<AdminTablePageLayoutProps> = ({
  children,
  createButtonLabel,
  eyebrow,
  isCreateDisabled = false,
  subtitle,
  title,
  onCreateClick,
}) => {
  return (
    <section className="admin-table-page-layout">
      <div className="admin-table-page-layout__header">
        <div>
          <p className="admin-table-page-layout__eyebrow">{eyebrow}</p>
          <h1 className="admin-table-page-layout__title">{title}</h1>
          <p className="admin-table-page-layout__subtitle">{subtitle}</p>
        </div>

        {createButtonLabel && onCreateClick && (
          <AppButton
            className="admin-table-page-layout__create-button"
            disabled={isCreateDisabled}
            onClick={onCreateClick}
          >
            {createButtonLabel}
          </AppButton>
        )}
      </div>

      {children}
    </section>
  );
};

export default AdminTablePageLayout;
