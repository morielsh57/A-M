import React from 'react';
import type { IProductPageSizeOption } from '../productPage.utils';
import './ProductSizeSelector.scss';

interface ProductSizeSelectorProps {
  selectedVariantId?: string | number;
  sizeOptions: IProductPageSizeOption[];
  onSizeSelect: (variantId: string | number) => void;
}

const ProductSizeSelector: React.FC<ProductSizeSelectorProps> = ({
  selectedVariantId,
  sizeOptions,
  onSizeSelect,
}) => {
  return (
    <section className="product-page__section">
      <label className="product-page__field-label">Size:</label>
      <div className="product-page__size-list" role="listbox" aria-label="Select size">
        {sizeOptions.map((sizeOption) => {
          const isAvailable = sizeOption.inStock && !!sizeOption.variant;
          const isSelected = String(sizeOption.variant?.variant_id) === String(selectedVariantId);

          return (
            <button
              key={sizeOption.size}
              className={[
                'product-page__size-button',
                isSelected ? 'product-page__size-button--selected' : '',
                !isAvailable ? 'product-page__size-button--sold-out' : '',
              ].filter(Boolean).join(' ')}
              type="button"
              disabled={!isAvailable}
              onClick={() => sizeOption.variant && onSizeSelect(sizeOption.variant.variant_id)}
              aria-selected={isSelected}
              role="option"
              title={isAvailable ? `Select ${sizeOption.size}` : `${sizeOption.size} is sold out`}
            >
              <span>{sizeOption.size}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProductSizeSelector;
