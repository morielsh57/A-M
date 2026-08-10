import React from 'react';
import AdminFormField from '../../../../shared/components/admin-form/AdminFormField';
import AdminFormSelect from '../../../../shared/components/admin-form/AdminFormSelect';
import type { IAdminProductListItem } from '../adminProducts.types';
import type { AdminProductSelectorValue } from './adminProductForm.types';
import { getProductSelectorOptions } from './adminProductForm.utils';

interface AdminProductSelectorProps {
  products: IAdminProductListItem[];
  value: AdminProductSelectorValue;
  onChange: (value: AdminProductSelectorValue) => void;
}

const AdminProductSelector: React.FC<AdminProductSelectorProps> = ({
  onChange,
  products,
  value,
}) => (
  <section className="admin-form__section">
    <h3 className="admin-form__section-title">Base product choice</h3>
    <AdminFormField label="Product">
      <AdminFormSelect
        options={getProductSelectorOptions(products)}
        placeholder="Select product"
        searchSelect
        value={value}
        onChange={(nextValue) => onChange(nextValue as AdminProductSelectorValue)}
      />
    </AdminFormField>
  </section>
);

export default AdminProductSelector;
