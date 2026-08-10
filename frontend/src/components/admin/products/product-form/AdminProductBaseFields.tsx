import React from 'react';
import AdminFormCheckbox from '../../../../shared/components/admin-form/AdminFormCheckbox';
import AdminFormField from '../../../../shared/components/admin-form/AdminFormField';
import AdminFormInput from '../../../../shared/components/admin-form/AdminFormInput';
import AdminFormSelect from '../../../../shared/components/admin-form/AdminFormSelect';
import AdminFormTextarea from '../../../../shared/components/admin-form/AdminFormTextarea';
import type { IMainCategory } from '../../../../shared/store/category/category.types';
import type { CategoryId } from '../../../product-page/product.types';
import type { AdminProductBaseFormValues } from './adminProductForm.types';
import { getMainCategoryOptions, getSubCategoryOptions } from './adminProductForm.utils';

interface AdminProductBaseFieldsProps {
  disableMainCategorySelect?: boolean;
  mainCategories: IMainCategory[];
  values: AdminProductBaseFormValues;
  onChange: (values: AdminProductBaseFormValues) => void;
}

const AdminProductBaseFields: React.FC<AdminProductBaseFieldsProps> = ({
  disableMainCategorySelect = false,
  mainCategories,
  onChange,
  values,
}) => {
  const updateField = <K extends keyof AdminProductBaseFormValues>(
    key: K,
    value: AdminProductBaseFormValues[K],
  ) => onChange({ ...values, [key]: value });

  const subCategoryOptions = getSubCategoryOptions(mainCategories, values.main_category_id);

  return (
    <section className="admin-form__section">
      <h3 className="admin-form__section-title">Base product details</h3>
      <div className="admin-form__grid">
        <AdminFormField label="Catalog number">
          <AdminFormInput
            value={values.catalog_number}
            onChange={(event) => updateField('catalog_number', event.target.value)}
          />
        </AdminFormField>

        <AdminFormField label="Name">
          <AdminFormInput
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
        </AdminFormField>

        <AdminFormField label="Price">
          <AdminFormInput
            min="0"
            step="0.01"
            type="number"
            value={values.price}
            onChange={(event) => updateField('price', event.target.value)}
          />
        </AdminFormField>

        <AdminFormField label="Fabric">
          <AdminFormInput
            value={values.fabric}
            onChange={(event) => updateField('fabric', event.target.value)}
          />
        </AdminFormField>

        <AdminFormField label="Main category">
          <AdminFormSelect
            disabled={disableMainCategorySelect}
            options={getMainCategoryOptions(mainCategories)}
            placeholder="Select main category"
            searchSelect
            value={values.main_category_id}
            onChange={(value) => {
              onChange({
                ...values,
                main_category_id: value as CategoryId,
                sub_category_id: null,
              });
            }}
          />
        </AdminFormField>

        <AdminFormField label="Sub category">
          <AdminFormSelect
            disabled={!values.main_category_id}
            options={subCategoryOptions}
            placeholder="Optional sub category"
            searchSelect
            value={values.sub_category_id}
            onChange={(value) => updateField('sub_category_id', value as CategoryId)}
          />
        </AdminFormField>

        <AdminFormField label="Tags">
          <AdminFormInput
            value={values.tags}
            onChange={(event) => updateField('tags', event.target.value)}
          />
        </AdminFormField>

        <div className="admin-form__field">
          <span className="admin-form__label">Status</span>
          <AdminFormCheckbox
            checked={values.is_active}
            label="Active product"
            onChange={(event) => updateField('is_active', event.target.checked)}
          />
        </div>

        <AdminFormField label="Description">
          <AdminFormTextarea
            value={values.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </AdminFormField>

        <AdminFormField label="Information">
          <AdminFormTextarea
            value={values.information}
            onChange={(event) => updateField('information', event.target.value)}
          />
        </AdminFormField>
      </div>
    </section>
  );
};

export default AdminProductBaseFields;
