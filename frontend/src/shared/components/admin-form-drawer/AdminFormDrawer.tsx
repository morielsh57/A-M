import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import './AdminFormDrawer.scss';

const ADMIN_FORM_DRAWER_CLOSE_DURATION_MS = 280;

interface AdminFormDrawerProps {
  children: React.ReactNode;
  isOpen: boolean;
  subtitle?: string;
  title: React.ReactNode;
  onClose: () => void;
}

const AdminFormDrawer: React.FC<AdminFormDrawerProps> = ({
  children,
  isOpen,
  subtitle,
  title,
  onClose,
}) => {
  const [shouldRender, setShouldRender] = React.useState(isOpen);
  const [isClosing, setIsClosing] = React.useState(false);

  // close the drawer with a delay to allow for the closing animation to complete
  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return undefined;
    }

    if (!shouldRender) {
      return undefined;
    }

    setIsClosing(true);

    const closeTimerId = window.setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, ADMIN_FORM_DRAWER_CLOSE_DURATION_MS);

    return () => window.clearTimeout(closeTimerId);
  }, [isOpen, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  const drawerClassName = [
    'admin-form-drawer',
    isClosing ? 'admin-form-drawer--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={drawerClassName} role="presentation" onClick={onClose}>
      <aside
        aria-modal="true"
        className="admin-form-drawer__panel"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-form-drawer__header">
          <div>
            <h2 className="admin-form-drawer__title">{title}</h2>
            {subtitle && <p className="admin-form-drawer__subtitle">{subtitle}</p>}
          </div>

          <button
            aria-label="Close drawer"
            className="admin-form-drawer__close-button"
            type="button"
            onClick={onClose}
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="admin-form-drawer__content">{children}</div>
      </aside>
    </div>
  );
};

export default AdminFormDrawer;
