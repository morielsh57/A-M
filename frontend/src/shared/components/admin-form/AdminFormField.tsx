import React from 'react';

interface AdminFormFieldProps {
  children: React.ReactNode;
  error?: string;
  htmlFor?: string;
  label: string;
}

const AdminFormField: React.FC<AdminFormFieldProps> = ({
  children,
  error,
  htmlFor,
  label,
}) => {
  return (
    <label className="admin-form__field" htmlFor={htmlFor}>
      <span className="admin-form__label">{label}</span>
      {children}
      {error && <span className="admin-form__error">{error}</span>}
    </label>
  );
};

export default AdminFormField;
