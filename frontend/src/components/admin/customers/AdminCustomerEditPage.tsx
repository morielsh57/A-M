import React, { useEffect, useState } from 'react';
import { Alert, Modal } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import AdminTablePageLayout from '../../../shared/components/admin-table-page-layout/AdminTablePageLayout';
import AppButton from '../../../shared/components/app-button/AppButton';
import AdminUserForm from '../users/AdminUserForm';
import type { AdminManagedRole, IAdminCustomer } from './adminCustomers.types';
import './AdminCustomerEditPage.scss';

interface AdminCustomerEditPageProps {
  accountLabel?: string;
  expectedRole?: AdminManagedRole;
  listSegment?: string;
}

const ROLE_LIST_SEGMENTS: Record<AdminManagedRole, string> = {
  Customer: APP_ROUTING_PATHS.ADMIN.CUSTOMERS,
  Admin: APP_ROUTING_PATHS.ADMIN.ADMINS,
  Supplier: APP_ROUTING_PATHS.ADMIN.SUPPLIERS,
};

const AdminCustomerEditPage: React.FC<AdminCustomerEditPageProps> = ({
  accountLabel = 'customer',
  expectedRole = 'Customer',
  listSegment = APP_ROUTING_PATHS.ADMIN.CUSTOMERS,
}) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const listPath = APP_ROUTING_PATHS.ADMIN_PAGE(listSegment);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);

  const leavePage = () => {
    if (!isDirty) {
      navigate(listPath);
      return;
    }
    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: `Your ${accountLabel} changes have not been saved.`,
      okText: 'Discard changes',
      cancelText: 'Keep editing',
      okButtonProps: { danger: true },
      onOk: () => navigate(listPath),
    });
  };

  const handleSaved = (user: IAdminCustomer) => {
    const nextSegment = ROLE_LIST_SEGMENTS[user.role as AdminManagedRole] || listSegment;
    setIsDirty(false);
    navigate(APP_ROUTING_PATHS.ADMIN_PAGE(nextSegment));
  };

  return (
    <AdminTablePageLayout
      eyebrow="User management"
      title={`Edit ${accountLabel}`}
      subtitle="Update permitted account information, role, and status."
    >
      <div className="admin-customer-edit-page__card">
        {loadError || !userId ? (
          <Alert
            showIcon
            type="error"
            message={`${accountLabel[0].toUpperCase()}${accountLabel.slice(1)} could not be loaded`}
            description={loadError || 'A user identifier is required.'}
            action={<AppButton variant="secondary" onClick={() => navigate(listPath)}>Back to list</AppButton>}
          />
        ) : (
          <AdminUserForm
            accountLabel={accountLabel}
            allowedRoles={['Customer', 'Admin', 'Supplier']}
            initialRole={expectedRole}
            mode="edit"
            userId={userId}
            onCancel={leavePage}
            onDirtyChange={setIsDirty}
            onLoadError={setLoadError}
            onSaved={handleSaved}
          />
        )}
      </div>
    </AdminTablePageLayout>
  );
};

export default AdminCustomerEditPage;
