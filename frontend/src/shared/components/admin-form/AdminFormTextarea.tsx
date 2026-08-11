import React from 'react';

const AdminFormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...textareaProps
}) => (
  <textarea
    className={['admin-form__control', 'admin-form__control--textarea', className]
      .filter(Boolean)
      .join(' ')}
    {...textareaProps}
  />
);

export default AdminFormTextarea;
