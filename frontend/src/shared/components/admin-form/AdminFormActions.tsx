import React from 'react';
import AppButton from '../app-button/AppButton';

interface AdminFormActionsProps {
  cancelLabel?: string;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel: () => void;
}

const AdminFormActions: React.FC<AdminFormActionsProps> = ({
  cancelLabel = 'Cancel',
  isSubmitting = false,
  submitLabel = 'Save',
  onCancel,
}) => (
  <div className="admin-form__actions">
    <AppButton
      className="admin-form__action-button"
      disabled={isSubmitting}
      type="button"
      variant="secondary"
      onClick={onCancel}
    >
      {cancelLabel}
    </AppButton>
    <AppButton className="admin-form__action-button" disabled={isSubmitting} type="submit">
      {isSubmitting ? 'Saving...' : submitLabel}
    </AppButton>
  </div>
);

export default AdminFormActions;
