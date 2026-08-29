import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import AppButton from '../../../shared/components/app-button/AppButton';
import AppTitle from '../../../shared/components/app-title/AppTitle';
import Breadcrumbs from '../../../shared/components/breadcrumbs/Breadcrumbs';
import { formatPrice } from '../../../shared/components/product-card/productCard.utils';
import { getCurrentUser } from '../../../shared/store/user/user.store';
import { getProductDetail, getProductDetailCacheKey } from '../../product-page/product.store';
import { getCart } from '../cart/cart.store';
import { getCartItemImage } from '../cart/cart.utils';
import CheckoutDelivery from './checkout-delivery/CheckoutDelivery';
import CheckoutPayment from './checkout-payment/CheckoutPayment';
import CheckoutItem from './CheckoutItem';
import './CheckoutPage.scss';

const CheckoutPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { getCartReq, selectedCartProductIds } = useAppSelector((store) => store.cartStoreReducer);
  const { productDetailByProductReq } = useAppSelector((store) => store.productPageStoreReducer);
  const { user, getCurrentUserRequest } = useAppSelector((store) => store.userStoreReducer);

  const selectedIds = useMemo(
    () => new Set(selectedCartProductIds.map(String)),
    [selectedCartProductIds],
  );
  const checkoutItems = useMemo(
    () => getCartReq.data?.items.filter((item) => selectedIds.has(String(item.cart_product_id))) || [],
    [getCartReq.data, selectedIds],
  );
  const subtotal = checkoutItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  const total = subtotal;
  const isLoading = getCartReq.status === EAPIStatus.PENDING
    || getCurrentUserRequest.status === EAPIStatus.PENDING;
  useEffect(() => {
    if (getCartReq.status === EAPIStatus.IDLE) dispatch(getCart());
    if (!user && getCurrentUserRequest.status === EAPIStatus.IDLE) dispatch(getCurrentUser());
  }, [dispatch, getCartReq.status, getCurrentUserRequest.status, user]);

  useEffect(() => {
    checkoutItems.forEach((item) => {
      const key = getProductDetailCacheKey({ product_id: item.product_id });
      const request = productDetailByProductReq[key];
      if (!request || request.status === EAPIStatus.IDLE || request.status === EAPIStatus.REJECTED) {
        dispatch(getProductDetail({ product_id: item.product_id }));
      }
    });
  }, [checkoutItems, dispatch, productDetailByProductReq]);

  if (isLoading) {
    return <div className="checkout-page checkout-page__state"><h2>Loading checkout...</h2><p>Preparing your selected items.</p></div>;
  }

  if (getCartReq.error || getCurrentUserRequest.error) {
    return (
      <div className="checkout-page checkout-page__state checkout-page__state--error">
        <h2>Checkout could not be loaded</h2>
        <p>{getCartReq.error?.message || getCurrentUserRequest.error?.message || 'Please try again.'}</p>
        <AppButton onClick={() => { dispatch(getCart()); dispatch(getCurrentUser()); }}>Try again</AppButton>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="checkout-page checkout-page__state">
        <h2>No items selected for checkout</h2>
        <p>Open your cart and select at least one product before continuing.</p>
        <AppButton onClick={() => navigate(APP_ROUTING_PATHS.APP_HOME_PAGE)}>Continue shopping</AppButton>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Breadcrumbs pageName="Checkout" />
      <div className="checkout-page__title"><AppTitle title="Checkout" /></div>
      <p className="checkout-page__intro">Review your selected items and pickup details before payment.</p>

      <div className="checkout-page__layout">
        <main className="checkout-page__main">
          <section className="checkout-card">
            <div className="checkout-card__heading"><span>1</span><div><h2>Your items</h2><p>{checkoutItems.length} selected product{checkoutItems.length === 1 ? '' : 's'}</p></div></div>
            <div>
              {checkoutItems.map((item) => {
                const detail = productDetailByProductReq[getProductDetailCacheKey({ product_id: item.product_id })]?.data;
                return <CheckoutItem key={item.cart_product_id} item={item} image={getCartItemImage(item, detail)} />;
              })}
            </div>
          </section>
          <CheckoutDelivery userAddress={user?.address || ''} />
        </main>

        <aside className="checkout-summary checkout-card">
          <h2>Order summary</h2>
          <div><span>Selected items</span><strong>{formatPrice(subtotal)}</strong></div>
          <div><span>Pickup point</span><strong>Free</strong></div>
          <div className="checkout-summary__total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
          <CheckoutPayment
            hasSelectedItems={checkoutItems.length > 0}
            selectedItemCount={checkoutItems.length}
            total={formatPrice(total)}
          />
        </aside>
      </div>
    </div>
  );
};

export default CheckoutPage;
