import React, { useEffect, useMemo, useState } from 'react';
import { useToasts } from 'react-toast-notifications';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus, type IAPIError } from '../../../shared/api/models';
import AdminForm from '../../../shared/components/admin-form/AdminForm';
import AdminFormActions from '../../../shared/components/admin-form/AdminFormActions';
import AdminFormCheckbox from '../../../shared/components/admin-form/AdminFormCheckbox';
import AdminFormError from '../../../shared/components/admin-form/AdminFormError';
import AdminFormField from '../../../shared/components/admin-form/AdminFormField';
import AdminFormInput from '../../../shared/components/admin-form/AdminFormInput';
import AdminFormSelect from '../../../shared/components/admin-form/AdminFormSelect';
import {
  createCategory,
  getCategoryById,
  updateCategory,
} from '../../../shared/store/category/category.store';
import type {
  CategoryId,
  ICategory,
  ICategoryWriteRequest,
  IMainCategory,
} from '../../../shared/store/category/category.types';

type CategoryType = 'main' | 'sub';

interface CategoryFormValues {
  categoryType: CategoryType;
  shortId: string;
  mainCategoryName: string;
  subCategoryName: string;
  parentCategoryId: CategoryId | null;
  isActive: boolean;
}

interface CategoryFormErrors {
  shortId?: string;
  mainCategoryName?: string;
  subCategoryName?: string;
  parentCategoryId?: string;
}

interface CategoryFormProps {
  categoryId?: CategoryId;
  mainCategories: IMainCategory[];
  onCancel: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onSaved: () => void;
}

const EMPTY_VALUES: CategoryFormValues = {
  categoryType: 'main',
  shortId: '',
  mainCategoryName: '',
  subCategoryName: '',
  parentCategoryId: null,
  isActive: true,
};

const mapCategoryToValues = (category: ICategory): CategoryFormValues => ({
  categoryType: category.parent_category_id ? 'sub' : 'main',
  shortId: category.short_id,
  mainCategoryName: category.main_category_name,
  subCategoryName: category.sub_category_name || '',
  parentCategoryId: category.parent_category_id,
  isActive: category.is_active,
});

const getApiErrorMessage = (error: unknown) => {
  const apiError = error as IAPIError | undefined;
  const details = apiError?.details;

  if (details && typeof details === 'object') {
    const messages = Object.values(details as Record<string, string[] | string>)
      .flat()
      .filter(Boolean);

    if (messages.length) {
      return messages.join(' ');
    }
  }

  return apiError?.message || 'The category could not be saved. Please try again.';
};

const validateValues = (values: CategoryFormValues): CategoryFormErrors => {
  const errors: CategoryFormErrors = {};

  if (!values.shortId.trim()) errors.shortId = 'Short ID is required.';
  if (!values.mainCategoryName.trim()) errors.mainCategoryName = 'Main category name is required.';

  if (values.categoryType === 'sub') {
    if (!values.parentCategoryId) errors.parentCategoryId = 'Parent category is required.';
    if (!values.subCategoryName.trim()) errors.subCategoryName = 'Subcategory name is required.';
  }

  return errors;
};

const CategoryForm: React.FC<CategoryFormProps> = ({
  categoryId,
  mainCategories,
  onCancel,
  onDirtyChange,
  onSaved,
}) => {
  const dispatch = useAppDispatch();
  const { addToast } = useToasts();
  const { getCategoryByIdReq } = useAppSelector((store) => store.categoryStoreReducer);
  const [values, setValues] = useState<CategoryFormValues>(EMPTY_VALUES);
  const [originalSnapshot, setOriginalSnapshot] = useState(JSON.stringify(EMPTY_VALUES));
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [requestError, setRequestError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = categoryId !== undefined;
  const loadedCategory = getCategoryByIdReq.data?.category_id === categoryId
    ? getCategoryByIdReq.data
    : undefined;
  const isLoading = isEditMode && (
    getCategoryByIdReq.status === EAPIStatus.PENDING
    || (!loadedCategory && getCategoryByIdReq.status !== EAPIStatus.REJECTED)
  );

  useEffect(() => {
    setErrors({});
    setRequestError(undefined);

    if (categoryId !== undefined) {
      void dispatch(getCategoryById({ category_id: categoryId }));
      return;
    }

    setValues(EMPTY_VALUES);
    setOriginalSnapshot(JSON.stringify(EMPTY_VALUES));
  }, [categoryId, dispatch]);

  useEffect(() => {
    if (!loadedCategory) return;
    const nextValues = mapCategoryToValues(loadedCategory);
    setValues(nextValues);
    setOriginalSnapshot(JSON.stringify(nextValues));
  }, [loadedCategory]);

  const currentSnapshot = useMemo(() => JSON.stringify(values), [values]);

  useEffect(() => {
    onDirtyChange(currentSnapshot !== originalSnapshot);
  }, [currentSnapshot, onDirtyChange, originalSnapshot]);

  const updateValue = <K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setRequestError(undefined);
  };

  const selectParent = (parentCategoryId: CategoryId) => {
    const parent = mainCategories.find(
      (category) => String(category.category_id) === String(parentCategoryId),
    );

    setValues((current) => ({
      ...current,
      parentCategoryId,
      mainCategoryName: parent?.main_category_name || current.mainCategoryName,
    }));
    setErrors((current) => ({
      ...current,
      parentCategoryId: undefined,
      mainCategoryName: undefined,
    }));
    setRequestError(undefined);
  };

  const handleCategoryTypeChange = (categoryType: CategoryType) => {
    setValues((current) => ({
      ...current,
      categoryType,
      parentCategoryId: categoryType === 'main' ? null : current.parentCategoryId,
      subCategoryName: categoryType === 'main' ? '' : current.subCategoryName,
    }));
    setErrors({});
    setRequestError(undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateValues(values);
    setErrors(validationErrors);
    setRequestError(undefined);

    if (Object.keys(validationErrors).length) return;

    const payload: ICategoryWriteRequest = {
      short_id: values.shortId.trim(),
      main_category_name: values.mainCategoryName.trim(),
      sub_category_name: values.categoryType === 'sub' ? values.subCategoryName.trim() : null,
      parent_category_id: values.categoryType === 'sub' ? values.parentCategoryId : null,
      is_active: values.isActive,
    };

    setIsSubmitting(true);

    try {
      if (categoryId !== undefined) {
        await dispatch(updateCategory({ category_id: categoryId, payload })).unwrap();
      } else {
        await dispatch(createCategory(payload)).unwrap();
      }

      addToast(categoryId !== undefined
        ? 'Category updated successfully.'
        : 'Category created successfully.', {
        appearance: 'success',
        autoDismiss: true,
      });
      onDirtyChange(false);
      onSaved();
    } catch (error) {
      setRequestError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="admin-category-form__loading">Loading category details...</div>;
  }

  if (isEditMode && getCategoryByIdReq.status === EAPIStatus.REJECTED) {
    return (
      <div className="admin-category-form__loading">
        {getApiErrorMessage(getCategoryByIdReq.error)}
      </div>
    );
  }

  const parentOptions = mainCategories
    .filter((category) => String(category.category_id) !== String(categoryId))
    .map((category) => ({
      label: category.main_category_name,
      value: category.category_id,
    }));

  return (
    <AdminForm onSubmit={handleSubmit}>
      <section className="admin-form__section">
        <h3 className="admin-form__section-title">Category details</h3>
        <div className="admin-form__grid">
          <AdminFormField label="Category type">
            <AdminFormSelect
              options={[
                { label: 'Main category', value: 'main' },
                { label: 'Subcategory', value: 'sub' },
              ]}
              value={values.categoryType}
              onChange={(value) => handleCategoryTypeChange(value as CategoryType)}
            />
          </AdminFormField>

          <AdminFormField error={errors.shortId} label="Short ID">
            <AdminFormInput
              placeholder="e.g. women-dresses"
              value={values.shortId}
              onChange={(event) => updateValue('shortId', event.target.value)}
            />
          </AdminFormField>


          {values.categoryType === 'main' && (
            <AdminFormField error={errors.mainCategoryName} label="Main category name">
              <AdminFormInput
                placeholder="e.g. Women"
                value={values.mainCategoryName}
                onChange={(event) => updateValue('mainCategoryName', event.target.value)}
              />
            </AdminFormField>
          )}

          {values.categoryType === 'sub' && (
            <AdminFormField error={errors.subCategoryName} label="Name">
              <AdminFormInput
                placeholder="e.g. Dresses"
                value={values.subCategoryName}
                onChange={(event) => updateValue('subCategoryName', event.target.value)}
              />
            </AdminFormField>
          )}

          
          {values.categoryType === 'sub' && (
            <AdminFormField error={errors.parentCategoryId} label="Parent category">
              <AdminFormSelect
                options={parentOptions}
                placeholder="Select main category"
                searchSelect
                value={values.parentCategoryId}
                onChange={(value) => selectParent(value as CategoryId)}
              />
            </AdminFormField>
          )}

          <div className="admin-form__field">
            <span className="admin-form__label">Status</span>
            <AdminFormCheckbox
              checked={values.isActive}
              label="Active category"
              onChange={(event) => updateValue('isActive', event.target.checked)}
            />
          </div>
        </div>
      </section>

      <AdminFormError message={requestError} />
      <AdminFormActions
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? 'Save category' : 'Create category'}
        onCancel={onCancel}
      />
    </AdminForm>
  );
};

export default CategoryForm;
