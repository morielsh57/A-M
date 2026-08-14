import React from 'react';
import { getColorValue } from '../../../../shared/components/product-card/productCard.utils';
import type { IProductPageColorOption } from '../productPage.utils';
import './ProductColorPicker.scss';

interface ProductColorPickerProps {
  colorOptions: IProductPageColorOption[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ProductColorPicker: React.FC<ProductColorPickerProps> = ({
  colorOptions,
  selectedColor,
  onColorSelect,
}) => {
  return (
    <section className="product-page__section">
      <label className="product-page__field-label">Choose color:</label>
      <div className="product-page__color-list" aria-label="Choose color">
        {colorOptions.map((colorOption) => {
          const isSelected = colorOption.color === selectedColor;

          return (
            <button
              key={colorOption.color}
              className={[
                'product-page__color-button',
                isSelected ? 'product-page__color-button--selected' : '',
                !colorOption.inStock ? 'product-page__color-button--out' : '',
              ].filter(Boolean).join(' ')}
              type="button"
              onClick={() => onColorSelect(colorOption.color)}
              aria-label={`Select ${colorOption.color}`}
              aria-pressed={isSelected}
              title={`${colorOption.color}${colorOption.inStock ? '' : ' - out of stock'}`}
            >
              <span
                className="product-page__color-swatch"
                style={{ backgroundColor: getColorValue(colorOption.color) }}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProductColorPicker;
