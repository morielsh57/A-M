import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import AppButton from '../../../shared/components/app-button/AppButton';
import { formatPrice } from '../../../shared/components/product-card/productCard.utils';
import type { ICartItem } from './cart.types';
import ProductCartQuantityDropdown from './ProductCartQuantityDropdown';
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

  const handleRemoveClick = () => {
    Modal.confirm({
      title: `Remove ${item.product_name} from your cart?`,
      content: 'This item will be removed from your shopping cart.',
      okText: 'Remove item',
      cancelText: 'Keep item',
      maskClosable: true,
      okButtonProps: { danger: true },
      onOk: onRemove,
    });
  };

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
          <AppButton
            type="button"
            className="product-cart-item__remove"
            variant="danger"
            onClick={handleRemoveClick}
            disabled={isUpdating}
            aria-label={`Remove ${item.product_name} from cart`}
          >
            <DeleteOutlined />
          </AppButton>
        </div>
        <p>{variantText}</p>
        <strong>{formatPrice(item.unit_price)}</strong>

        <div className="product-cart-item__bottom-row">
          <ProductCartQuantityDropdown
            availableQuantity={item.available_quantity}
            productName={item.product_name}
            quantity={item.quantity}
            onQuantityChange={onQuantityChange}
          />

          <span className="product-cart-item__line-total">{formatPrice(item.total_price)}</span>
        </div>
      </div>
    </article>
  );
};

export default ProductCartItem;
