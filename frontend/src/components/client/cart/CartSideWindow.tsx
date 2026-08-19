import React, { useEffect } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import AppButton from '../../../shared/components/app-button/AppButton';
import { closeCart } from './cart.store';
import './CartSideWindow.scss';

const CartSideWindow: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isCartOpen } = useAppSelector((store) => store.cartStoreReducer);

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
          <div className="cart-side-window__empty-state">
            <h3>Your cart is empty</h3>
            <p>Items you add to your bag will appear here.</p>
          </div>
        </div>

        <footer className="cart-side-window__footer">
          <div className="cart-side-window__subtotal">
            <span>Subtotal</span>
            <strong>$0.00</strong>
          </div>
          <AppButton
            className="cart-side-window__checkout-button"
            disabled
            onClick={() => undefined}
          >
            Checkout
          </AppButton>
        </footer>
      </aside>
    </div>
  );
};

export default CartSideWindow;
