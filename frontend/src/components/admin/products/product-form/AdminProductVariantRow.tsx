import React from 'react';
import { Modal } from 'antd';
import { DownOutlined, DeleteOutlined } from '@ant-design/icons';
import { PRODUCT_SIZE_OPTIONS } from '../../../../app/constants';
import AppButton from '../../../../shared/components/app-button/AppButton';
import AdminFormCheckbox from '../../../../shared/components/admin-form/AdminFormCheckbox';
import AdminFormField from '../../../../shared/components/admin-form/AdminFormField';
import AdminFormInput from '../../../../shared/components/admin-form/AdminFormInput';
import AdminFormSelect from '../../../../shared/components/admin-form/AdminFormSelect';
import type { AdminProductVariantFormRow, AdminProductVariantRowError } from './adminProductForm.types';
import AdminProductImageUploader from './AdminProductImageUploader';

interface AdminProductVariantRowProps {
  error?: AdminProductVariantRowError;
  index: number;
  isExpanded: boolean;
  isNewlyAdded?: boolean;
  row: AdminProductVariantFormRow;
  colorInputRef?: React.Ref<HTMLInputElement>;
  onChange: (row: AdminProductVariantFormRow) => void;
  onToggle: () => void;
  onRemove: () => void;
}

const AdminProductVariantRow: React.FC<AdminProductVariantRowProps> = ({
  colorInputRef,
  error,
  index,
  isExpanded,
  isNewlyAdded = false,
  onChange,
  onRemove,
  onToggle,
  row,
}) => {
  const updateRow = <K extends keyof AdminProductVariantFormRow>(
    key: K,
    value: AdminProductVariantFormRow[K],
  ) => onChange({ ...row, [key]: value });
  const variantTitle = `Variant ${index + 1}`;
  const variantIdLabel = row.variant_id ? `#${row.variant_id}` : undefined;
  const handleRemoveClick = () => {
    Modal.confirm({
      title: `Remove ${variantTitle}${variantIdLabel ? ` ${variantIdLabel}` : ''}?`,
      content: 'This variant row will be removed from the form. Unsaved changes in this row will be lost.',
      okText: 'Remove variant',
      cancelText: 'Keep variant',
      okButtonProps: { danger: true },
      onOk: onRemove,
    });
  };

  return (
    <article className={[
      'admin-product-form__variant-row',
      isExpanded ? 'admin-product-form__variant-row--expanded' : '',
      isNewlyAdded ? 'admin-product-form__variant-row--new' : '',
    ].filter(Boolean).join(' ')}
    >
      <div
        className="admin-product-form__variant-summary"
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
          }
        }}
      >
        <button
          aria-label={isExpanded ? 'Collapse variant' : 'Expand variant'}
          className={[
            'admin-product-form__variant-chevron',
            isExpanded ? 'admin-product-form__variant-chevron--expanded' : '',
          ].filter(Boolean).join(' ')}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
        >
          <DownOutlined />
        </button>

        <div className="admin-product-form__variant-summary-text">
          <h4 className="admin-product-form__variant-title">
            {variantTitle}
            {variantIdLabel && (
              <span className="admin-product-form__variant-id">
                {variantIdLabel}
              </span>
            )}
          </h4>
          <p className="admin-product-form__variant-meta">
            <span>{row.color || 'Not selected'},</span>
            <span>{row.size || 'Not selected'}</span>
          </p>
        </div>

        <AppButton
          aria-label={`Remove ${variantTitle}${variantIdLabel ? ` ${variantIdLabel}` : ''}`}
          className="admin-product-form__variant-remove"
          type="button"
          variant="danger"
          onClick={(event) => {
            event.stopPropagation();
            handleRemoveClick();
          }}
        >
          <DeleteOutlined />
        </AppButton>
      </div>

      <div className="admin-product-form__variant-content">
        {error?.duplicate && <p className="admin-product-form__row-error">{error.duplicate}</p>}

        <div className="admin-form__grid">
          <AdminFormField error={error?.color} label="Color">
            <AdminFormInput
              ref={colorInputRef}
              value={row.color}
              onChange={(event) => updateRow('color', event.target.value)}
            />
          </AdminFormField>

          <AdminFormField error={error?.size} label="Size">
            <AdminFormSelect
              options={PRODUCT_SIZE_OPTIONS.map((size) => ({ value: size, label: size }))}
              placeholder="Select size"
              value={row.size}
              onChange={(value) => updateRow('size', String(value))}
            />
          </AdminFormField>

          <AdminFormField error={error?.quantity} label="Quantity">
            <AdminFormInput
              min="0"
              type="number"
              value={row.quantity}
              onChange={(event) => updateRow('quantity', event.target.value)}
            />
          </AdminFormField>

          <div className="admin-form__field">
            <span className="admin-form__label">Status</span>
            <AdminFormCheckbox
              checked={row.is_active}
              label="Active variant"
              onChange={(event) => updateRow('is_active', event.target.checked)}
            />
          </div>
        </div>

        <AdminProductImageUploader
          existingImages={row.existingImages}
          files={row.files}
          onExistingImagesChange={(existingImages) => updateRow('existingImages', existingImages)}
          onFilesChange={(files) => updateRow('files', files)}
        />
      </div>
    </article>
  );
};

export default AdminProductVariantRow;
