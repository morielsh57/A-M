import React from 'react';

interface AdminFormCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

const AdminFormCheckbox: React.FC<AdminFormCheckboxProps> = ({
  className = '',
  label,
  ...checkboxProps
}) => (
  <label className={['admin-form__checkbox', className].filter(Boolean).join(' ')}>
    <input type="checkbox" {...checkboxProps} />
    <span>{label}</span>
  </label>
);

export default AdminFormCheckbox;
