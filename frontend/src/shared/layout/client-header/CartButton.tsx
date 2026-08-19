import React from 'react';
import { useAppDispatch } from '../../../app/store';
import { openCart } from '../../../components/client/cart/cart.store';
import { cartIcon } from '../../../components/util/iconsFunc';

const CartButton: React.FC = () => {
  const cartsAr: { amount: number }[] = []; // TODO: Replace with actual cart items from redux cart store when implemented
  const dispatch = useAppDispatch();

  const handleOpenCart = () => {
    dispatch(openCart());
  };

  return (
    <div className="col-4">
      <button
        className="cart-header-btn mt-2 display-4 text-start fw-bold"
        style={{ cursor: 'pointer' }}
        onClick={handleOpenCart}
      >
        {cartIcon()}
        {cartsAr.length > 0 && (
          <div className="badge bg-danger">{cartTotal(cartsAr)}</div>
        )}
      </button>
    </div>
  );
};

const cartTotal = (cartsAr: { amount: number }[]) => {
  let total = 0;
  cartsAr.forEach((item) => {
    total += item.amount;
  });
  return total;
};

export default CartButton;
