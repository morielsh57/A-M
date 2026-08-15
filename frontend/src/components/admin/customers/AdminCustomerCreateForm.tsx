import React from 'react';
import AdminUserForm from '../users/AdminUserForm';
import type { AdminManagedRole } from './adminCustomers.types';

interface AdminCustomerCreateFormProps {
  accountLabel?: string;
  accountRole?: AdminManagedRole;
  onCancel: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: () => void;
}

const AdminCustomerCreateForm: React.FC<AdminCustomerCreateFormProps> = ({
  accountLabel = 'customer',
  accountRole = 'Customer',
  onCancel,
  onDirtyChange,
  onSaved,
}) => (
  <AdminUserForm
    accountLabel={accountLabel}
    allowedRoles={[accountRole]}
    initialRole={accountRole}
    mode="create"
    onCancel={onCancel}
    onDirtyChange={onDirtyChange}
    onSaved={onSaved}
  />
);

export default AdminCustomerCreateForm;
