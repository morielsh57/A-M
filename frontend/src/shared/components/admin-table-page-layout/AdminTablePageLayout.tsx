import React from 'react';
import './AdminTablePageLayout.scss';

interface AdminTablePageLayoutProps {
  children: React.ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
}

const AdminTablePageLayout: React.FC<AdminTablePageLayoutProps> = ({
  children,
  eyebrow,
  subtitle,
  title,
}) => {
  return (
    <section className="admin-table-page-layout">
      <div className="admin-table-page-layout__header">
        <div>
          <p className="admin-table-page-layout__eyebrow">{eyebrow}</p>
          <h1 className="admin-table-page-layout__title">{title}</h1>
          <p className="admin-table-page-layout__subtitle">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
};

export default AdminTablePageLayout;
