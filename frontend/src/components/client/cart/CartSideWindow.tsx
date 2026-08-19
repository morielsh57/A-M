import React, { useEffect } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import AppButton from '../../../shared/components/app-button/AppButton';
import { formatPrice } from '../../../shared/components/product-card/productCard.utils';
import {
  getProductDetail,
  getProductDetailCacheKey,
} from '../../product-page/product.store';
import ProductCartItem from './ProductCartItem';
import {
  closeCart,
  getCart,
  removeCartItem,
  setAllCartItemsSelected,
  toggleCartItemSelected,
  updateCartItem,
} from './cart.store';
import { getCartItemImage, getSelectedCartTotal } from './cart.utils';
import './CartSideWindow.scss';

const CartSideWindow: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    getCartReq,
    isCartOpen,
    removeCartItemReq,
    selectedCartProductIds,
    updateCartItemReq,
  } = useAppSelector((store) => store.cartStoreReducer);
  const { productDetailByProductReq } = useAppSelector((store) => store.productPageStoreReducer);
  const cart = getCartReq.data;
  const cartItems = cart?.items || [];
  const selectedCartProductIdSet = new Set(selectedCartProductIds.map(String));
  const selectedItemsCount = cartItems.filter((item) => (
    selectedCartProductIdSet.has(String(item.cart_product_id))
  )).length;
  const isLoading = getCartReq.status === EAPIStatus.PENDING;
  const isUpdating = (
    updateCartItemReq.status === EAPIStatus.PENDING
    || removeCartItemReq.status === EAPIStatus.PENDING
  );
  const selectedTotal = getSelectedCartTotal(cart, selectedCartProductIds);

  const handleCloseCart = () => {
    dispatch(closeCart());
  };

  useEffect(() => {
    if (!isCartOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseCart();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCartOpen]);

  useEffect(() => {
    if (isCartOpen && getCartReq.status === EAPIStatus.IDLE) {
      dispatch(getCart());
    }
  }, [dispatch, getCartReq.status, isCartOpen]);

  useEffect(() => {
    if (!isCartOpen || cartItems.length === 0) return;

    const productIds = Array.from(new Set(cartItems.map((item) => item.product_id)));

    productIds.forEach((productId) => {
      const productDetailKey = getProductDetailCacheKey({ product_id: productId });
      const productDetailReq = productDetailByProductReq[productDetailKey];
      const shouldFetchProduct = !productDetailReq
        || productDetailReq.status === EAPIStatus.IDLE
        || productDetailReq.status === EAPIStatus.REJECTED;

      if (shouldFetchProduct) {
        dispatch(getProductDetail({ product_id: productId }));
      }
    });
  }, [cartItems, dispatch, isCartOpen, productDetailByProductReq]);

  return (
    <div
      className={[
        'cart-side-window',
        isCartOpen ? 'cart-side-window--open' : '',
      ].filter(Boolean).join(' ')}
      aria-hidden={!isCartOpen}
      onMouseDown={handleCloseCart}
    >
      <aside
        className="cart-side-window__panel"
        aria-label="Shopping cart"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cart-side-window__header">
          <button
            className="cart-side-window__back-button"
            type="button"
            onClick={handleCloseCart}
            aria-label="Close cart"
          >
            <ArrowLeftOutlined />
          </button>
          <div>
            <p>Your bag</p>
            <h2>Shopping cart</h2>
          </div>
        </header>

        <div className="cart-side-window__body">
          {isLoading && (
            <div className="cart-side-window__empty-state">
              <h3>Loading your bag</h3>
              <p>Pulling your cart items now.</p>
            </div>
          )}

          {!isLoading && getCartReq.error && (
            <div className="cart-side-window__empty-state cart-side-window__empty-state--error">
              <h3>Cart could not load</h3>
              <p>{getCartReq.error.message || 'Please try again.'}</p>
              <AppButton variant="secondary" onClick={() => dispatch(getCart())}>
                Try again
              </AppButton>
            </div>
          )}

          {!isLoading && !getCartReq.error && cartItems.length === 0 && (
            <div className="cart-side-window__empty-state">
              <h3>Your cart is empty</h3>
              <p>Items you add to your bag will appear here.</p>
            </div>
          )}

          {!isLoading && !getCartReq.error && cartItems.length > 0 && (
            <>
              <div className="cart-side-window__select-row">
                <span>{selectedItemsCount} selected</span>
                <button
                  type="button"
                  onClick={() => dispatch(setAllCartItemsSelected(selectedItemsCount !== cartItems.length))}
                >
                  {selectedItemsCount === cartItems.length ? 'Unselect all' : 'Select all'}
                </button>
              </div>

              <div className="cart-side-window__items">
                {cartItems.map((item) => (
                  <ProductCartItem
                    key={item.cart_product_id}
                    item={item}
                    image={getCartItemImage(
                      item,
                      productDetailByProductReq[
                        getProductDetailCacheKey({ product_id: item.product_id })
                      ]?.data,
                    )}
                    isSelected={selectedCartProductIdSet.has(String(item.cart_product_id))}
                    isUpdating={isUpdating}
                    onSelectedChange={() => dispatch(toggleCartItemSelected(item.cart_product_id))}
                    onQuantityChange={(quantity) => {
                      if (quantity < 1 || quantity > item.available_quantity) return;
                      dispatch(updateCartItem({ cart_product_id: item.cart_product_id, quantity }));
                    }}
                    onRemove={() => dispatch(removeCartItem({ cart_product_id: item.cart_product_id }))}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <footer className="cart-side-window__footer">
          <div className="cart-side-window__subtotal">
            <span>Subtotal</span>
            <strong>{formatPrice(selectedTotal)}</strong>
          </div>
          <AppButton
            className="cart-side-window__checkout-button"
            disabled={selectedItemsCount === 0}
            onClick={() => {
              dispatch(closeCart());
              navigate(APP_ROUTING_PATHS.APP_CHECKOUT_PAGE);
            }}
          >
            Checkout
          </AppButton>
        </footer>
      </aside>
    </div>
  );
};

export default CartSideWindow;
