import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useForm } from 'react-hook-form';
import { useToasts } from 'react-toast-notifications';
import { changePasswordRequest } from '../../../../app/auth/auth.store';
import { APP_ROUTING_PATHS } from '../../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AppButton from '../../../../shared/components/app-button/AppButton';
import { logout } from '../../../../shared/utils/logout.utils';
import './ChangePasswordForm.scss';

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const defaultValues: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

const ChangePasswordForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();
  const { changePasswordRes } = useAppSelector((store) => store.authStoreReducer);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
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

  const formSend = async (values: ChangePasswordFormValues) => {
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
      void logout({ redirectPath: APP_ROUTING_PATHS.AUTH_LOGIN_PAGE });
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
    <section className="change-password-form">
      <div className="change-password-form__header">
        <div>
          <p className="change-password-form__eyebrow">Security</p>
          <h2>Change password</h2>
        </div>
        <p>Changing your password signs you out after the server accepts it.</p>
      </div>

      <form onSubmit={handleSubmit(formSend)}>
        <div className="change-password-form__grid">
          <label className="change-password-form__field">
            <span>Current password</span>
            <input {...currentPasswordRef} name="currentPassword" type="password" className="form-control change-password-form__input" placeholder="Current password" />
            {errors.currentPassword && <small>{errors.currentPassword.message}</small>}
          </label>

          <label className="change-password-form__field">
            <span>New password</span>
            <input {...newPasswordRef} name="newPassword" type="password" className="form-control change-password-form__input" placeholder="New password" />
            {errors.newPassword && <small>{errors.newPassword.message}</small>}
          </label>

          <label className="change-password-form__field change-password-form__field--full">
            <span>Confirm new password</span>
            <input {...confirmNewPasswordRef} name="confirmNewPassword" type="password" className="form-control change-password-form__input" placeholder="Confirm new password" />
            {errors.confirmNewPassword && <small>{errors.confirmNewPassword.message}</small>}
          </label>
        </div>

        {submitError && <div className="change-password-form__error">{submitError}</div>}

        <div className="change-password-form__actions">
          <AppButton type="submit" disabled={isSaveDisabled} data-testid="change-password-submit">
            {isSaveDisabled ? <CircularProgress size={20} color="inherit" /> : 'Change password'}
          </AppButton>
        </div>
      </form>
    </section>
  );
};

export default ChangePasswordForm;
