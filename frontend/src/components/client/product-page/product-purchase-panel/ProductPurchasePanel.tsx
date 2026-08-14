import React, { useMemo, useState } from 'react';
import AppButton from '../../../../shared/components/app-button/AppButton';
import { formatPrice } from '../../../../shared/components/product-card/productCard.utils';
import type { IProduct, IProductVariant, ProductVariantId } from '../../../product-page/product.types';
import ProductColorPicker from '../product-color-picker/ProductColorPicker';
import ProductRating from '../product-rating/ProductRating';
import ProductSizeSelector from '../product-size-selector/ProductSizeSelector';
import {
  getBestVariantForColor,
  getColorOptions,
  getSizeOptionsForColor,
  isVariantInStock,
} from '../productPage.utils';
import './ProductPurchasePanel.scss';

interface ProductPurchasePanelProps {
  product: IProduct;
  activeVariants: IProductVariant[];
  selectedVariant?: IProductVariant;
  onVariantSelect: (variantId?: ProductVariantId) => void;
}

const ProductPurchasePanel: React.FC<ProductPurchasePanelProps> = ({
  product,
  activeVariants,
  selectedVariant,
  onVariantSelect,
}) => {
  const [quantity, setQuantity] = useState(1);
  const selectedColor = selectedVariant?.color?.trim() || 'Default';
  const colorOptions = useMemo(
    () => getColorOptions(activeVariants),
    [activeVariants],
  );
  const sizeOptions = useMemo(
    () => getSizeOptionsForColor(activeVariants, selectedColor),
    [activeVariants, selectedColor],
  );
  const selectedVariantInStock = isVariantInStock(selectedVariant);

  const onColorSelect = (color: string) => {
    const nextVariant = getBestVariantForColor(activeVariants, color, selectedVariant?.size);
    onVariantSelect(nextVariant?.variant_id);
  };

  return (
    <section className="product-page__purchase-panel">
      <h1 className="product-page__title">{product.name}</h1>
      <ProductRating />
      <p className="product-page__price">{formatPrice(product.price)}</p>

      {product.description && (
        <p className="product-page__description">{product.description}</p>
      )}

      <ProductSizeSelector
        selectedVariantId={selectedVariant?.variant_id}
        sizeOptions={sizeOptions}
        onSizeSelect={onVariantSelect}
      />

      <ProductColorPicker
        colorOptions={colorOptions}
        selectedColor={selectedColor}
        onColorSelect={onColorSelect}
      />

      <div className="product-page__quantity" aria-label="Quantity">
        <button
          type="button"
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span>{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((value) => value + 1)}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <AppButton
        className="product-page__add-to-cart"
        disabled={!selectedVariantInStock}
        onClick={() => undefined}
      >
        Add To Bag
      </AppButton>
    </section>
  );
};

export default ProductPurchasePanel;
