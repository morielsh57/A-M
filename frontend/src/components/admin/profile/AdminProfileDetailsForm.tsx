import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useForm } from 'react-hook-form';
import { useToasts } from 'react-toast-notifications';
import { EAPIStatus } from '../../../shared/api/models';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { updateCurrentUserProfile } from '../../../shared/store/user/user.store';
import type { IAdminOrSupplierUser } from '../../../shared/store/user/user.types';
import AppButton from '../../../shared/components/app-button/AppButton';

interface AdminProfileDetailsFormProps {
  user?: IAdminOrSupplierUser;
}

interface AdminProfileDetailsFormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const getDefaultValues = (user?: IAdminOrSupplierUser): AdminProfileDetailsFormValues => ({
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  address: user?.address || '',
});

const AdminProfileDetailsForm: React.FC<AdminProfileDetailsFormProps> = ({ user }) => {
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();
  const { updateCurrentUserProfileRequest } = useAppSelector((store) => store.userStoreReducer);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminProfileDetailsFormValues>({
    defaultValues: getDefaultValues(user),
  });

  React.useEffect(() => {
    reset(getDefaultValues(user));
  }, [reset, user]);

  const nameRef = register('name', { required: true, minLength: 2 });
  const phoneRef = register('phone', { required: true, minLength: 9 });
  const addressRef = register('address', { required: true, minLength: 2 });

  const formSend = async (values: AdminProfileDetailsFormValues) => {
    setSubmitError(null);

    try {
      await dispatch(updateCurrentUserProfile({
        name: values.name.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
      })).unwrap();

      addToast('Profile details updated successfully.', {
        appearance: 'success',
        autoDismiss: true,
      });

      reset({
        name: values.name.trim(),
        email: user?.email || values.email,
        phone: values.phone.trim(),
        address: values.address.trim(),
      });
    } catch (error) {
      setSubmitError('We could not update your profile details. Please try again.');
    }
  };

  const isSaveDisabled = isSubmitting || updateCurrentUserProfileRequest.status === EAPIStatus.PENDING;

  return (
    <section className="admin-profile-form">
      <div className="admin-profile-form__header">
        <div>
          <h2>Profile details</h2>
        </div>
        <p>Email is read-only in this form.</p>
      </div>

      <form onSubmit={handleSubmit(formSend)}>
        <div className="admin-profile-form__grid">
          <label className="admin-profile-form__field">
            <span>Full name</span>
            <input {...nameRef} name="name" className="form-control admin-profile-form__input" placeholder="Full name" />
            {errors.name && <small>Name must be at least 2 characters.</small>}
          </label>

          <label className="admin-profile-form__field">
            <span>Email</span>
            <input
              {...register('email')}
              name="email"
              type="email"
              className="form-control admin-profile-form__input admin-profile-form__input--readonly"
              placeholder="Email"
              readOnly
            />
          </label>

          <label className="admin-profile-form__field">
            <span>Phone</span>
            <input {...phoneRef} name="phone" className="form-control admin-profile-form__input" placeholder="Phone number" />
            {errors.phone && <small>Phone number must be at least 9 digits.</small>}
          </label>

          <label className="admin-profile-form__field admin-profile-form__field--full">
            <span>Address</span>
            <textarea {...addressRef} name="address" className="form-control admin-profile-form__input admin-profile-form__input--textarea" placeholder="Address" rows={3} />
            {errors.address && <small>Address must be at least 2 characters.</small>}
          </label>
        </div>

        {submitError && <div className="admin-profile-form__error">{submitError}</div>}

        <div className="admin-profile-form__actions">
          <AppButton type="submit" disabled={isSaveDisabled} data-testid="admin-profile-details-submit">
            {isSaveDisabled ? <CircularProgress size={20} color="inherit" /> : 'Save details'}
          </AppButton>
        </div>
      </form>
    </section>
  );
};

export default AdminProfileDetailsForm;
