import React, { useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { addToast } from '../../../../shared/utils/toast.utils';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AdminForm from '../../../../shared/components/admin-form/AdminForm';
import AdminFormActions from '../../../../shared/components/admin-form/AdminFormActions';
import AdminFormCheckbox from '../../../../shared/components/admin-form/AdminFormCheckbox';
import AdminFormError from '../../../../shared/components/admin-form/AdminFormError';
import AdminFormField from '../../../../shared/components/admin-form/AdminFormField';
import AdminFormInput from '../../../../shared/components/admin-form/AdminFormInput';
import AdminFormTextarea from '../../../../shared/components/admin-form/AdminFormTextarea';
import {
  createAdminPickupPoint,
  getAdminPickupPoint,
  updateAdminPickupPoint,
} from '../adminPickupPoints.store';
import type {
  IAdminPickupPointDetailRequestParams,
  IAdminPickupPointFormErrors,
  IAdminPickupPointFormValues,
} from '../adminPickupPoints.types';
import {
  EMPTY_ADMIN_PICKUP_POINT_FORM_VALUES,
  getAdminPickupPointErrorMessage,
  getAdminPickupPointPayload,
  getAdminPickupPointValues,
  validateAdminPickupPointForm,
} from '../adminPickupPoints.utils';
import './AdminPickupPointForm.scss';

interface AdminPickupPointFormProps {
  onCancel: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: () => void;
  pickupPointId?: IAdminPickupPointDetailRequestParams['pick_up_point_id'];
}

const AdminPickupPointForm: React.FC<AdminPickupPointFormProps> = ({
  onCancel,
  onDirtyChange,
  onSaved,
  pickupPointId,
}) => {
  const dispatch = useAppDispatch();
  const { pickupPointByIdReq } = useAppSelector((store) => store.adminPickupPointsStoreReducer);
  const pickupPointReq = pickupPointId !== undefined
    ? pickupPointByIdReq[String(pickupPointId)]
    : undefined;
  const pickupPoint = pickupPointReq?.data;
  const isEditMode = pickupPointId !== undefined;
  const isLoading = isEditMode && (
    !pickupPointReq
    || pickupPointReq.status === EAPIStatus.PENDING
  );
  const [values, setValues] = useState<IAdminPickupPointFormValues>(
    isEditMode ? getAdminPickupPointValues(pickupPoint) : EMPTY_ADMIN_PICKUP_POINT_FORM_VALUES,
  );
  const [initialSnapshot, setInitialSnapshot] = useState(
    JSON.stringify(isEditMode
      ? getAdminPickupPointValues(pickupPoint)
      : EMPTY_ADMIN_PICKUP_POINT_FORM_VALUES),
  );
  const [errors, setErrors] = useState<IAdminPickupPointFormErrors>({});
  const [requestError, setRequestError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentSnapshot = useMemo(() => JSON.stringify(values), [values]);

  useEffect(() => {
    setErrors({});
    setRequestError(undefined);

    if (pickupPointId !== undefined) {
      void dispatch(getAdminPickupPoint({ pick_up_point_id: pickupPointId }));
      return;
    }

    setValues(EMPTY_ADMIN_PICKUP_POINT_FORM_VALUES);
    setInitialSnapshot(JSON.stringify(EMPTY_ADMIN_PICKUP_POINT_FORM_VALUES));
  }, [dispatch, pickupPointId]);

  useEffect(() => {
    if (!pickupPoint) return;
    const nextValues = getAdminPickupPointValues(pickupPoint);
    setValues(nextValues);
    setInitialSnapshot(JSON.stringify(nextValues));
  }, [pickupPoint]);

  useEffect(() => {
    onDirtyChange(currentSnapshot !== initialSnapshot);
  }, [currentSnapshot, initialSnapshot, onDirtyChange]);

  const updateValue = <K extends keyof IAdminPickupPointFormValues>(
    key: K,
    value: IAdminPickupPointFormValues[K],
  ) => {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [key]: undefined }));
    setRequestError(undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateAdminPickupPointForm(values);
    setErrors(validationErrors);
    setRequestError(undefined);

    if (Object.keys(validationErrors).length) return;

    setIsSubmitting(true);

    try {
      if (pickupPointId !== undefined) {
        await dispatch(updateAdminPickupPoint({
          pick_up_point_id: pickupPointId,
          payload: getAdminPickupPointPayload(values),
        })).unwrap();
        addToast('Pickup point updated successfully.', {
          appearance: 'success',
          autoDismiss: true,
        });
      } else {
        await dispatch(createAdminPickupPoint(getAdminPickupPointPayload(values))).unwrap();
        addToast('Pickup point created successfully.', {
          appearance: 'success',
          autoDismiss: true,
        });
      }

      onDirtyChange(false);
      onSaved();
    } catch (error) {
      setRequestError(getAdminPickupPointErrorMessage(
        error,
        'The pickup point could not be saved. Please try again.',
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-pickup-point-form__loading">
        <Spin size="large" /> Loading pickup point...
      </div>
    );
  }

  if (isEditMode && pickupPointReq?.status === EAPIStatus.REJECTED) {
    return (
      <div className="admin-pickup-point-form__loading">
        {getAdminPickupPointErrorMessage(
          pickupPointReq.error,
          'The pickup point could not be loaded. Please try again.',
        )}
      </div>
    );
  }

  return (
    <AdminForm onSubmit={handleSubmit}>
      <section className="admin-form__section">
        <h3 className="admin-form__section-title">Pickup point details</h3>
        <div className="admin-form__grid">
          <AdminFormField error={errors.name} htmlFor="pickup-point-name" label="Name">
            <AdminFormInput
              id="pickup-point-name"
              placeholder="e.g. Dizengoff Center"
              value={values.name}
              onChange={(event) => updateValue('name', event.target.value)}
            />
          </AdminFormField>

          <AdminFormField error={errors.lat} htmlFor="pickup-point-lat" label="Latitude">
            <AdminFormInput
              id="pickup-point-lat"
              inputMode="decimal"
              placeholder="e.g. 32.075000"
              value={values.lat}
              onChange={(event) => updateValue('lat', event.target.value)}
            />
          </AdminFormField>

          <AdminFormField error={errors.lng} htmlFor="pickup-point-lng" label="Longitude">
            <AdminFormInput
              id="pickup-point-lng"
              inputMode="decimal"
              placeholder="e.g. 34.775000"
              value={values.lng}
              onChange={(event) => updateValue('lng', event.target.value)}
            />
          </AdminFormField>

          <AdminFormField htmlFor="pickup-point-address" label="Address">
            <AdminFormTextarea
              id="pickup-point-address"
              placeholder="Enter pickup point address"
              value={values.address}
              onChange={(event) => updateValue('address', event.target.value)}
            />
          </AdminFormField>

          <AdminFormField htmlFor="pickup-point-description" label="Description">
            <AdminFormTextarea
              id="pickup-point-description"
              placeholder="Add internal notes or customer-facing pickup instructions"
              value={values.description}
              onChange={(event) => updateValue('description', event.target.value)}
            />
          </AdminFormField>

          <div className="admin-form__field">
            <span className="admin-form__label">Status</span>
            <AdminFormCheckbox
              checked={values.is_active}
              label="Active pickup point"
              onChange={(event) => updateValue('is_active', event.target.checked)}
            />
          </div>
        </div>
      </section>

      <AdminFormError message={requestError} />
      <AdminFormActions
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? 'Save pickup point' : 'Create pickup point'}
        onCancel={onCancel}
      />
    </AdminForm>
  );
};

export default AdminPickupPointForm;
