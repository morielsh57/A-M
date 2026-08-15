import React from 'react';
import './ProductCartItem.scss';

export interface ProductCartItemProps {
  image?: string;
  name: string;
  price: string | number;
  color?: string | null;
  size?: string | null;
  quantity: number;
}

const ProductCartItem: React.FC<ProductCartItemProps> = ({
  image,
  name,
  price,
  color,
  size,
  quantity,
}) => {
  return (
    <article className="product-cart-item">
      <div className="product-cart-item__image">
        {image ? <img src={image} alt={name} /> : <span>No image</span>}
      </div>

      <div className="product-cart-item__content">
        <h3>{name}</h3>
        <p>
          {[color, size].filter(Boolean).join(' / ')}
        </p>
        <strong>{price}</strong>
        <span>Qty: {quantity}</span>
      </div>
    </article>
  );
};

export default ProductCartItem;
