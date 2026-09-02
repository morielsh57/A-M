import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useForm } from 'react-hook-form';
import { addToast } from '../../../shared/utils/toast.utils';
import { changePasswordRequest } from '../../../app/auth/auth.store';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import AppButton from '../../../shared/components/app-button/AppButton';
import { logout } from '../../../shared/utils/logout.utils';

interface AdminChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const defaultValues: AdminChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

const AdminChangePasswordForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { changePasswordRes } = useAppSelector((store) => store.authStoreReducer);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminChangePasswordFormValues>({
    defaultValues,
  });

  const currentPasswordRef = register('currentPassword', {
    required: 'Current password is required.',
  });
  const newPasswordRef = register('newPassword', {
    required: 'New password is required.',
    minLength: {
      value: 8,
      message: 'New password must be at least 8 characters.',
    },
  });
  const confirmNewPasswordRef = register('confirmNewPassword', {
    required: 'Confirm your new password.',
    validate: (value) => value === getValues('newPassword') || 'New passwords do not match.',
  });

  const formSend = async (values: AdminChangePasswordFormValues) => {
    try {
      await dispatch(changePasswordRequest({
        current_password: values.currentPassword,
        new_password: values.newPassword,
        new_password_confirm: values.confirmNewPassword,
      })).unwrap();

      reset(defaultValues);
      addToast('Password changed successfully. Please log in again.', {
        appearance: 'success',
        autoDismiss: true,
      });
      void logout({ redirectPath: APP_ROUTING_PATHS.ADMIN_LOGIN_PAGE });
    } catch (error) {
      // The rejected request state below owns the displayed error message.
    }
  };

  const isSaveDisabled = isSubmitting || changePasswordRes.status === EAPIStatus.PENDING;
 
  const changePasswordError = changePasswordRes.status === EAPIStatus.REJECTED
    ? changePasswordRes.error
    : undefined;

  const newPasswordDetails = (
    changePasswordError?.details as { new_password?: string[] | string } | undefined
  )?.new_password;

  const newPasswordErrorMessage = Array.isArray(newPasswordDetails)
    ? newPasswordDetails.join(' ')
    : newPasswordDetails;

  const submitError = [
    changePasswordError?.message,
    newPasswordErrorMessage,
  ].filter(Boolean).join(' ');

  return (
    <section className="admin-profile-form">
      <div className="admin-profile-form__header">
        <div>
          <p className="admin-profile-form__eyebrow">Security</p>
          <h2>Change password</h2>
        </div>
        <p>Changing your password signs you out after the server accepts it.</p>
      </div>

      <form onSubmit={handleSubmit(formSend)}>
        <div className="admin-profile-form__grid">
          <label className="admin-profile-form__field">
            <span>Current password</span>
            <input {...currentPasswordRef} name="currentPassword" type="password" className="form-control admin-profile-form__input" placeholder="Current password" />
            {errors.currentPassword && <small>{errors.currentPassword.message}</small>}
          </label>

          <label className="admin-profile-form__field">
            <span>New password</span>
            <input {...newPasswordRef} name="newPassword" type="password" className="form-control admin-profile-form__input" placeholder="New password" />
            {errors.newPassword && <small>{errors.newPassword.message}</small>}
          </label>

          <label className="admin-profile-form__field admin-profile-form__field--full">
            <span>Confirm new password</span>
            <input {...confirmNewPasswordRef} name="confirmNewPassword" type="password" className="form-control admin-profile-form__input" placeholder="Confirm new password" />
            {errors.confirmNewPassword && <small>{errors.confirmNewPassword.message}</small>}
          </label>
        </div>

        {submitError && <div className="admin-profile-form__error">{submitError}</div>}

        <div className="admin-profile-form__actions">
          <AppButton type="submit" disabled={isSaveDisabled} data-testid="admin-change-password-submit">
            {isSaveDisabled ? <CircularProgress size={20} color="inherit" /> : 'Change password'}
          </AppButton>
        </div>
      </form>
    </section>
  );
};

export default AdminChangePasswordForm;
