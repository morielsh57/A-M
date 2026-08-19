import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { openCart } from '../../../components/client/cart/cart.store';
import { cartIcon } from '../../../components/util/iconsFunc';

const CartButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((store) => store.cartStoreReducer.getCartReq.data?.items || []);
  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleOpenCart = () => {
    dispatch(openCart());
  };

  return (
    <div className="col-4">
      <button
        className="cart-header-btn mt-2 display-4 text-start fw-bold"
        style={{ cursor: 'pointer' }}
        onClick={handleOpenCart}
        aria-label="Open shopping cart"
      >
        {cartIcon()}
        {cartItemsCount > 0 && (
          <span className="cart-header-btn__badge">{cartItemsCount}</span>
        )}
      </button>
    </div>
  );
};

export default CartButton;
