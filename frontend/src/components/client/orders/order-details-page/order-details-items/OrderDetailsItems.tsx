import React from 'react';
import { formatPrice } from '../../../../../shared/components/product-card/productCard.utils';
import type { ICheckoutOrder } from '../../../checkout/checkout.store';
import './OrderDetailsItems.scss';

interface OrderDetailsItemsProps {
  order: ICheckoutOrder;
  itemImages: Map<string, string>;
}

const OrderDetailsItems: React.FC<OrderDetailsItemsProps> = ({
  order,
  itemImages,
}) => (
  <section className="order-details-items">
    <h2>Items in this order</h2>
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
                ? <img src={image} alt={item.product_name} />
                : <span>No image</span>}
            </div>
            <div className="order-details-item__details">
              <h3>{item.product_name}</h3>
              <p>{[item.color, item.size].filter(Boolean).join(' / ') || 'Standard variant'}</p>
              <span>Quantity: {item.quantity}</span>
              <span>{formatPrice(item.unit_price)} each</span>
            </div>
            <strong>{formatPrice(item.total_price)}</strong>
          </article>
        );
      })}
    </div>
  </section>
);

export default OrderDetailsItems;
