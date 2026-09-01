import React from 'react';
import { formatPrice } from '../../../../../shared/components/product-card/productCard.utils';
import type { IOrder } from '../../orders.store';
import './OrderDetailsItems.scss';

interface OrderDetailsItemsProps {
  order: IOrder;
  itemImages: Map<string, string>;
}

const OrderDetailsItems: React.FC<OrderDetailsItemsProps> = ({
  order,
  itemImages,
}) => (
  <section className="order-details-items">
    <h2 className="order-details-items__title">Items in this order</h2>
    <div className="order-details-items__list">
      {order.items.map((item) => {
        const image = itemImages.get(String(item.variant_id));

        return (
          <article
            className="order-details-item"
            key={item.order_item_id || `${item.variant_id}-${item.product_name}`}
          >
            <div className="order-details-item__image">
              {image
                ? <img className="order-details-item__image-file" src={image} alt={item.product_name} />
                : <span className="order-details-item__image-placeholder">No image</span>}
            </div>
            <div className="order-details-item__details">
              <h3 className="order-details-item__name">{item.product_name}</h3>
              <p className="order-details-item__variant">
                {[item.color, item.size].filter(Boolean).join(' / ') || 'Standard variant'}
              </p>
              <span className="order-details-item__meta">Quantity: {item.quantity}</span>
              <span className="order-details-item__meta">{formatPrice(item.unit_price)} each</span>
            </div>
            <strong className="order-details-item__total">{formatPrice(item.total_price)}</strong>
          </article>
        );
      })}
    </div>
  </section>
);

export default OrderDetailsItems;
