import React from 'react';
import AdminFormCheckbox from '../../../../shared/components/admin-form/AdminFormCheckbox';
import AdminFormField from '../../../../shared/components/admin-form/AdminFormField';
import AdminFormInput from '../../../../shared/components/admin-form/AdminFormInput';
import AdminFormTextarea from '../../../../shared/components/admin-form/AdminFormTextarea';
import type { IAdminUsersFormErrors, IAdminUsersFormValues } from '../adminUsers.types';

interface AdminUsersFormFieldsProps {
  errors: IAdminUsersFormErrors;
  fieldPrefix: string;
  isEditMode: boolean;
  onChange: <K extends keyof IAdminUsersFormValues>(
    key: K,
    value: IAdminUsersFormValues[K],
  ) => void;
  roleLabel: string;
  values: IAdminUsersFormValues;
}

const AdminUsersFormFields: React.FC<AdminUsersFormFieldsProps> = ({
  errors,
  fieldPrefix,
  isEditMode,
  onChange,
  roleLabel,
  values,
}) => (
  <section className="admin-form__section">
    <h3 className="admin-form__section-title">Account information</h3>
    <div className="admin-form__grid">
      <AdminFormField htmlFor={`${fieldPrefix}-name`} label="Name" error={errors.name}>
        <AdminFormInput
          id={`${fieldPrefix}-name`}
          autoComplete="name"
          placeholder={`Enter ${roleLabel} name`}
          value={values.name}
          onChange={(event) => onChange('name', event.target.value)}
        />
      </AdminFormField>

      <AdminFormField htmlFor={`${fieldPrefix}-email`} label="Email" error={errors.email}>
        <AdminFormInput
          id={`${fieldPrefix}-email`}
          autoComplete="email"
          disabled={isEditMode}
          placeholder={`Enter ${roleLabel} email`}
          readOnly={isEditMode}
          type="email"
          value={values.email}
          onChange={(event) => onChange('email', event.target.value)}
        />
      </AdminFormField>

      {!isEditMode && (
        <>
          <AdminFormField htmlFor={`${fieldPrefix}-password`} label="Password" error={errors.password}>
            <AdminFormInput
              id={`${fieldPrefix}-password`}
              autoComplete="new-password"
              type="password"
              value={values.password}
              onChange={(event) => onChange('password', event.target.value)}
            />
          </AdminFormField>

          <AdminFormField
            htmlFor={`${fieldPrefix}-confirm-password`}
            label="Confirm password"
            error={errors.confirmPassword}
          >
            <AdminFormInput
              id={`${fieldPrefix}-confirm-password`}
              autoComplete="new-password"
              type="password"
              value={values.confirmPassword}
              onChange={(event) => onChange('confirmPassword', event.target.value)}
            />
          </AdminFormField>
        </>
      )}

      <AdminFormField htmlFor={`${fieldPrefix}-phone`} label="Phone">
        <AdminFormInput
          id={`${fieldPrefix}-phone`}
          autoComplete="tel"
          placeholder="Enter phone number"
          value={values.phone}
          onChange={(event) => onChange('phone', event.target.value)}
        />
      </AdminFormField>

      <AdminFormField htmlFor={`${fieldPrefix}-address`} label="Address">
        <AdminFormTextarea
          id={`${fieldPrefix}-address`}
          autoComplete="street-address"
          placeholder="Enter address"
          value={values.address}
          onChange={(event) => onChange('address', event.target.value)}
        />
      </AdminFormField>

      <div className="admin-form__field">
        <span className="admin-form__label">Status</span>
        <AdminFormCheckbox
          checked={values.is_active}
          label={`Active ${roleLabel} account`}
          onChange={(event) => onChange('is_active', event.target.checked)}
        />
      </div>
    </div>
  </section>
);

export default AdminUsersFormFields;
