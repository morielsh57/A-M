import React from 'react';
import type { IOrderListItem } from '../../orders.store';
import MyOrdersCard from '../my-orders-card/MyOrdersCard';
import './MyOrdersList.scss';

interface MyOrdersListProps {
  orders: IOrderListItem[];
  onViewOrder: (orderId: number) => void;
}

const MyOrdersList: React.FC<MyOrdersListProps> = ({
  orders,
  onViewOrder,
}) => (
  <div className="my-orders-list">
    {orders.map((order) => (
      <MyOrdersCard
        key={order.order_id}
        order={order}
        onViewOrder={onViewOrder}
      />
    ))}
  </div>
);

export default MyOrdersList;
