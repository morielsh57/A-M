import React from 'react';

interface AdminFormErrorProps {
  message?: string;
}

const AdminFormError: React.FC<AdminFormErrorProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return <p className="admin-form__request-error">{message}</p>;
};

export default AdminFormError;
