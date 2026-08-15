import React from 'react';
import './CheckoutDelivery.scss';

interface CheckoutDeliveryProps {
  address: string;
  onAddressChange: (address: string) => void;
}

const CheckoutDelivery: React.FC<CheckoutDeliveryProps> = ({ address, onAddressChange }) => (
  <section className="checkout-delivery checkout-card">
    <div className="checkout-card__heading">
      <span>1</span>
      <div>
        <h2>Delivery information</h2>
        <p>Choose where your selected items should be delivered.</p>
      </div>
    </div>

    <div className="checkout-delivery__choices" role="radiogroup" aria-label="Delivery method">
      <label className="checkout-delivery__choice checkout-delivery__choice--selected">
        <input type="radio" name="delivery-method" checked readOnly />
        <span><strong>Home delivery</strong><small>$10 delivery fee</small></span>
      </label>
      <label className="checkout-delivery__choice checkout-delivery__choice--disabled">
        <input type="radio" name="delivery-method" disabled />
        <span><strong>Pickup points</strong><small>Coming soon</small></span>
      </label>
    </div>

    <label className="checkout-delivery__address">
      <span>Delivery address</span>
      <textarea
        value={address}
        onChange={(event) => onAddressChange(event.target.value)}
        placeholder="Enter your full delivery address"
        rows={3}
        required
      />
      {!address.trim() && <small>A delivery address is required before payment.</small>}
    </label>
  </section>
);

export default CheckoutDelivery;
