import React, { useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { useToasts } from 'react-toast-notifications';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AdminForm from '../../../../shared/components/admin-form/AdminForm';
import AdminFormActions from '../../../../shared/components/admin-form/AdminFormActions';
import AdminFormError from '../../../../shared/components/admin-form/AdminFormError';
import { createAdminUser, getAdminUser, updateAdminUser } from '../adminUsers.store';
import type { EUserRole } from '../../../../shared/store/user/user.types';
import type {
  IAdminUserDetailRequestParams,
  IAdminUsersFormErrors,
  IAdminUsersFormValues,
} from '../adminUsers.types';
import {
  EMPTY_ADMIN_USER_FORM_VALUES,
  getAdminUserCreatePayload,
  getAdminUserFormErrorMessage,
  getAdminUserRoleLabel,
  getAdminUserUpdatePayload,
  getAdminUserValues,
  validateAdminUserForm,
} from '../adminUsers.utils';
import AdminUsersFormFields from './AdminUsersFormFields';

interface AdminUsersFormProps {
  role: EUserRole;
  onCancel: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: () => void;
  userId?: IAdminUserDetailRequestParams['user_id'];
}

const AdminUsersForm: React.FC<AdminUsersFormProps> = ({
  role,
  onCancel,
  onDirtyChange,
  onSaved,
  userId,
}) => {
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();
  const { userByIdReq } = useAppSelector(
    (store) => store.adminUsersStoreReducer,
  );
  const userReq = userId !== undefined ? userByIdReq[String(userId)] : undefined;
  const user = userReq?.data;
  const isEditMode = userId !== undefined;
  const isLoading = isEditMode && (
    !userReq
    || userReq.status === EAPIStatus.PENDING
  );
  const [values, setValues] = useState<IAdminUsersFormValues>(
    isEditMode ? getAdminUserValues(user) : EMPTY_ADMIN_USER_FORM_VALUES,
  );
  const [initialSnapshot, setInitialSnapshot] = useState(
    JSON.stringify(isEditMode ? getAdminUserValues(user) : EMPTY_ADMIN_USER_FORM_VALUES),
  );
  const [errors, setErrors] = useState<IAdminUsersFormErrors>({});
  const [requestError, setRequestError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const snapshot = useMemo(() => JSON.stringify(values), [values]);
  const roleLabel = getAdminUserRoleLabel(role);
  const fieldPrefix = `${isEditMode ? 'edit' : 'create'}-${roleLabel}`;

  useEffect(() => {
    setErrors({});
    setRequestError(undefined);

    if (userId !== undefined) {
      void dispatch(getAdminUser({ user_id: userId }));
      return;
    }

    const nextValues = EMPTY_ADMIN_USER_FORM_VALUES;
    setValues(nextValues);
    setInitialSnapshot(JSON.stringify(nextValues));
  }, [dispatch, userId]);

  useEffect(() => {
    if (!user) return;
    const nextValues = getAdminUserValues(user);
    setValues(nextValues);
    setInitialSnapshot(JSON.stringify(nextValues));
  }, [user]);

  useEffect(() => {
    onDirtyChange(snapshot !== initialSnapshot);
  }, [initialSnapshot, onDirtyChange, snapshot]);

  const updateValue = <K extends keyof IAdminUsersFormValues>(
    key: K,
    value: IAdminUsersFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setRequestError(undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateAdminUserForm(isEditMode, values);
    setErrors(validationErrors);
    setRequestError(undefined);
    if (Object.keys(validationErrors).length) return;

    setIsSubmitting(true);

    try {
      if (!isEditMode) {
        await dispatch(createAdminUser(getAdminUserCreatePayload(role, values))).unwrap();
        addToast(`${role} created successfully.`, { appearance: 'success', autoDismiss: true });
      } else {
        if (userId === undefined) return;
        await dispatch(updateAdminUser({
          user_id: userId,
          payload: getAdminUserUpdatePayload(values),
        })).unwrap();
        addToast(`${role} updated successfully.`, { appearance: 'success', autoDismiss: true });
      }
      onDirtyChange(false);
      onSaved();
    } catch (error) {
      setRequestError(getAdminUserFormErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-form__loading">
        <Spin size="large" /> Loading {roleLabel}...
      </div>
    );
  }

  if (isEditMode && userReq?.status === EAPIStatus.REJECTED) {
    return (
      <div className="admin-form__loading">
        {getAdminUserFormErrorMessage(userReq.error, 'The user could not be loaded. Please try again.')}
      </div>
    );
  }

  return (
    <AdminForm onSubmit={handleSubmit}>
      <AdminUsersFormFields
        errors={errors}
        fieldPrefix={fieldPrefix}
        isEditMode={isEditMode}
        roleLabel={roleLabel}
        values={values}
        onChange={updateValue}
      />
      <AdminFormError message={requestError} />
      <AdminFormActions
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? `Save ${roleLabel}` : `Create ${roleLabel}`}
        onCancel={onCancel}
      />
    </AdminForm>
  );
};

export default AdminUsersForm;
