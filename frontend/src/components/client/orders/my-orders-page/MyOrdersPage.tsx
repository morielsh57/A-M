import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import AppPagination from '../../../../shared/components/app-pagination/AppPagination';
import AppTitle from '../../../../shared/components/app-title/AppTitle';
import Breadcrumbs from '../../../../shared/components/breadcrumbs/Breadcrumbs';
import {
  getMyOrders,
  getMyOrdersCacheKey,
  MY_ORDERS_PAGE_SIZE,
  type IMyOrdersRequest,
} from '../orders.store';
import MyOrdersEmptyState from './my-orders-empty-state/MyOrdersEmptyState';
import MyOrdersList from './my-orders-list/MyOrdersList';
import MyOrdersState from './my-orders-state/MyOrdersState';
import './MyOrdersPage.scss';

const getPageFromSearchParams = (pageParam: string | null) => {
  const page = Number(pageParam || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const MyOrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { myOrdersByQueryReq } = useAppSelector((store) => store.ordersStoreReducer);
  const currentPage = getPageFromSearchParams(searchParams.get('page'));

  const ordersRequestParams = useMemo<IMyOrdersRequest>(() => ({
    page: currentPage,
    page_size: MY_ORDERS_PAGE_SIZE,
  }), [currentPage]);
  const ordersCacheKey = getMyOrdersCacheKey(ordersRequestParams);
  const myOrdersReq = myOrdersByQueryReq[ordersCacheKey];

  useEffect(() => {
    if (!myOrdersReq) {
      dispatch(getMyOrders(ordersRequestParams));
    }
  }, [dispatch, myOrdersReq, ordersRequestParams]);

  const orders = myOrdersReq?.data || [];
  const pagination = myOrdersReq?.meta?.pagination;
  const isLoading = !myOrdersReq || myOrdersReq.status === EAPIStatus.PENDING;
  const totalItems = pagination?.total_items || orders.length;
  const pageSize = pagination?.page_size || MY_ORDERS_PAGE_SIZE;

  const handlePageChange = (page: number) => {
    navigate(APP_ROUTING_PATHS.APP_ORDERS_PAGE(page));
  };

  const handleViewOrder = (orderId: number) => {
    navigate(APP_ROUTING_PATHS.APP_ORDER_PAGE(orderId));
  };

  const handleContinueShopping = () => {
    navigate(APP_ROUTING_PATHS.APP_HOME_PAGE);
  };

  return (
    <section className="my-orders-page">
      <Breadcrumbs pageName="My Orders" />
      <div className="my-orders-page__header">
        <AppTitle title="My Orders" />
        <p className="my-orders-page__subtitle">
          Track your purchases and open the full details for each order.
        </p>
      </div>

      {isLoading && (
        <MyOrdersState
          title="Loading your orders..."
          message="Preparing your order history."
        />
      )}

      {!isLoading && myOrdersReq?.error && (
        <MyOrdersState
          isError
          title="Orders could not be loaded"
          message={myOrdersReq.error.message || 'Please try again later.'}
        />
      )}

      {!isLoading && !myOrdersReq?.error && orders.length === 0 && (
        <MyOrdersEmptyState onContinueShopping={handleContinueShopping} />
      )}

      {!isLoading && !myOrdersReq?.error && orders.length > 0 && (
        <div className="my-orders-page__results">
          <MyOrdersList orders={orders} onViewOrder={handleViewOrder} />
          <div className="my-orders-page__pagination">
            <AppPagination
              page={pagination?.page || currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default MyOrdersPage;
