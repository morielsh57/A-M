import React, { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AppButton from '../../../../shared/components/app-button/AppButton';
import { formatPrice } from '../../../../shared/components/product-card/productCard.utils';
import { addCartItem, openCart } from '../../cart/cart.store';
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
  const dispatch = useAppDispatch();
  const addCartItemReqStatus = useAppSelector((store) => store.cartStoreReducer.addCartItemReq.status);
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
  const isAddingToCart = addCartItemReqStatus === EAPIStatus.PENDING;

  const onColorSelect = (color: string) => {
    const nextVariant = getBestVariantForColor(activeVariants, color, selectedVariant?.size);
    onVariantSelect(nextVariant?.variant_id);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedVariantInStock || isAddingToCart) return;

    try {
      await dispatch(addCartItem({
        variant_id: selectedVariant.variant_id,
        quantity,
      })).unwrap();
      dispatch(openCart());
    } catch (error) {
      dispatch(openCart());
    }
  };

  return (
    <section className="product-page__purchase-panel">
      <h1 className="product-page__title">{product.name}</h1>
      <ProductRating stars={Number(product.average_rating || 0)} />
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
        disabled={!selectedVariantInStock || isAddingToCart}
        onClick={handleAddToCart}
      >
        {isAddingToCart ? 'Adding...' : 'Add To Bag'}
      </AppButton>
    </section>
  );
};

export default ProductPurchasePanel;
