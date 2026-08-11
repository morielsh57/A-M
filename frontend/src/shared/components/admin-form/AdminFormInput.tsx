import React from 'react';

const AdminFormInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({
  className = '',
  ...inputProps
}, ref) => (
  <input
    className={['admin-form__control', className].filter(Boolean).join(' ')}
    ref={ref}
    {...inputProps}
  />
));

AdminFormInput.displayName = 'AdminFormInput';

export default AdminFormInput;
