import React from 'react';
import './AdminForm.scss';

interface AdminFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

const AdminForm: React.FC<AdminFormProps> = ({ children, className = '', ...formProps }) => {
  return (
    <form className={['admin-form', className].filter(Boolean).join(' ')} {...formProps}>
      {children}
    </form>
  );
};

export default AdminForm;
