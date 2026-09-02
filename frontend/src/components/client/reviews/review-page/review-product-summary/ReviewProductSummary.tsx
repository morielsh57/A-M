import React from 'react';
import { formatPrice } from '../../../../../shared/components/product-card/productCard.utils';
import type { IOrderItem } from '../../../orders/orders.store';
import './ReviewProductSummary.scss';

interface ReviewProductSummaryProps {
  item: IOrderItem;
}

const ReviewProductSummary: React.FC<ReviewProductSummaryProps> = ({ item }) => (
  <article className="review-product-summary">
    <div className="review-product-summary__image">
      {item.image_url ? (
        <img
          className="review-product-summary__image-file"
          src={item.image_url}
          alt={item.product_name}
        />
      ) : (
        <span className="review-product-summary__image-placeholder">No image</span>
      )}
    </div>
    <div className="review-product-summary__details">
      <h2 className="review-product-summary__name">{item.product_name}</h2>
      <p className="review-product-summary__variant">
        {[item.color, item.size].filter(Boolean).join(' / ') || 'Standard variant'}
      </p>
      <span className="review-product-summary__meta">Quantity: {item.quantity}</span>
      <span className="review-product-summary__meta">{formatPrice(item.unit_price)} each</span>
    </div>
  </article>
);

export default ReviewProductSummary;
