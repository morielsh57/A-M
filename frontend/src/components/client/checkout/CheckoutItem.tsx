import React from 'react';
import { formatPrice } from '../../../shared/components/product-card/productCard.utils';
import type { ICartItem } from '../cart/cart.types';
import './CheckoutItem.scss';

interface CheckoutItemProps {
  item: ICartItem;
  image?: string;
}

const CheckoutItem: React.FC<CheckoutItemProps> = ({ item, image }) => (
  <article className="checkout-item">
    <div className="checkout-item__image">
      {image ? <img src={image} alt={item.product_name} /> : <span>No image</span>}
    </div>
    <div className="checkout-item__details">
      <h3>{item.product_name}</h3>
      <p>{[item.color, item.size].filter(Boolean).join(' / ') || 'Standard variant'}</p>
      <span>Quantity: {item.quantity}</span>
      <span>{formatPrice(item.unit_price)} each</span>
    </div>
    <strong>{formatPrice(item.total_price)}</strong>
  </article>
);

export default CheckoutItem;
