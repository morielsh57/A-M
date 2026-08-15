import React from 'react';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../api/models';
import mockProductImage from '../../../assets/images/shirt.webp';
import { addCartItem, openCart } from '../../../components/client/cart/cart.store';
import type { IProductCardProps } from '../../../components/product-page/product.types';
import { formatPrice, getColorValue, getProductPageUrl, mockProductItem } from './productCard.utils';
import './ProductCard.scss';

const ProductCard: React.FC<IProductCardProps> = ({
  product = mockProductItem,
  width,
  display = 'default',
}) => {
  const dispatch = useAppDispatch();
  const addCartItemReqStatus = useAppSelector((store) => store.cartStoreReducer.addCartItemReq.status);
  const selectedVariantId = product.selected_variant_id;
  const selectedColorOption = product.colors.find((color) => color.variant_id === selectedVariantId);
  const productImage = product.images[0] || product.colors.find((color) => color.images[0])?.images[0] || mockProductImage;
  const canAddToCart = Boolean(selectedVariantId && (selectedColorOption?.in_stock ?? product.in_stock ?? true));
  const isAddingToCart = addCartItemReqStatus === EAPIStatus.PENDING;
  const cardClassName = [
    'product-card',
    display === 'compact' ? 'product-card--compact' : '',
  ].filter(Boolean).join(' ');

  const handleAddToCart = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!selectedVariantId || !canAddToCart || isAddingToCart) return;

    try {
      await dispatch(addCartItem({
        variant_id: selectedVariantId,
        quantity: 1,
      })).unwrap();
      dispatch(openCart());
    } catch (error) {
      dispatch(openCart());
    }
  };

  return (
    <article className={cardClassName} style={width ? { width } : undefined}>
      <Link
        className="product-card__stretched-link"
        to={getProductPageUrl(product)}
        aria-label={`View ${product.name}`}
      />

      <div className="product-card__media">
        <img className="product-card__image" src={productImage} alt={product.name} />
        <div className="product-card__quick-view">View details</div>
      </div>

      <div className="product-card__content">
        <h3 className="product-card__name" title={product.name}>{product.name}</h3>

        <div className="product-card__meta">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          {product.fabric && <span className="product-card__fabric">{product.fabric}</span>}
        </div>
        <div className="product-card__footer">

          <div className="product-card__colors" aria-label={`Available colors for ${product.name}`}>
            {product.colors.map((colorOption) => {
              const colorValue = getColorValue(colorOption.color);
              const isSelected = colorOption.variant_id === selectedVariantId;

              return (
                <Link
                  key={`${colorOption.color}-${colorOption.variant_id}`}
                  className={[
                    'product-card__color',
                    isSelected ? 'product-card__color--selected' : '',
                    !colorOption.in_stock ? 'product-card__color--out-of-stock' : '',
                  ].filter(Boolean).join(' ')}
                  to={getProductPageUrl(product, colorOption)}
                  title={`${colorOption.color}${colorOption.in_stock ? '' : ' - out of stock'}`}
                  aria-label={`${colorOption.color}${colorOption.in_stock ? '' : ' out of stock'}`}
                >
                  <span
                    className="product-card__color-swatch"
                    style={{ backgroundColor: colorValue }}
                  />
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            className="product-card__cart-button"
            onClick={handleAddToCart}
            disabled={!canAddToCart || isAddingToCart}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCartOutlined />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
