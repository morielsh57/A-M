import React from 'react';
import './AppButton.scss';

export type AppButtonVariant = 'primary';

export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
}

const AppButton: React.FC<AppButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...buttonProps
}) => {
  const buttonClassName = [
    'app-button',
    `app-button--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={buttonClassName} {...buttonProps}>
      {children}
    </button>
  );
};

export default AppButton;
