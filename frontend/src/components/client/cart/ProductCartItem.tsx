import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { formatPrice } from '../../../shared/components/product-card/productCard.utils';
import type { ICartItem } from './cart.types';
import './ProductCartItem.scss';

export interface ProductCartItemProps {
  item: ICartItem;
  image?: string;
  isSelected: boolean;
  isUpdating?: boolean;
  onSelectedChange: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

const ProductCartItem: React.FC<ProductCartItemProps> = ({
  item,
  image,
  isSelected,
  isUpdating = false,
  onSelectedChange,
  onQuantityChange,
  onRemove,
}) => {
  const variantText = [item.color, item.size].filter(Boolean).join(' / ');
  const canDecrease = item.quantity > 1 && !isUpdating;
  const canIncrease = item.quantity < item.available_quantity && !isUpdating;

  return (
    <article className="product-cart-item">
      <label className="product-cart-item__select">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelectedChange}
          aria-label={`Select ${item.product_name} for checkout`}
        />
        <span />
      </label>

      <div className="product-cart-item__image">
        {image ? <img src={image} alt={item.product_name} /> : <span>No image</span>}
      </div>

      <div className="product-cart-item__content">
        <div className="product-cart-item__top-row">
          <h3>{item.product_name}</h3>
          <button
            type="button"
            className="product-cart-item__remove"
            onClick={onRemove}
            disabled={isUpdating}
            aria-label={`Remove ${item.product_name} from cart`}
          >
            <DeleteOutlined />
          </button>
        </div>
        <p>{variantText}</p>
        <strong>{formatPrice(item.unit_price)}</strong>

        <div className="product-cart-item__bottom-row">
          <div className="product-cart-item__quantity" aria-label={`Quantity for ${item.product_name}`}>
            <button
              type="button"
              onClick={() => onQuantityChange(item.quantity - 1)}
              disabled={!canDecrease}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span>{item.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantityChange(item.quantity + 1)}
              disabled={!canIncrease}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <span className="product-cart-item__line-total">{formatPrice(item.total_price)}</span>
        </div>
      </div>
    </article>
  );
};

export default ProductCartItem;
