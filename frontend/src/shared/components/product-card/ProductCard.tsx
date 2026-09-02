import React from 'react';
import { Link } from 'react-router-dom';
import type { IProductCardProps } from '../../../components/product-page/product.types';
import {
  formatPrice,
  getColorValue,
  getProductPageUrl,
  mockProductItem,
} from './productCard.utils';
import './ProductCard.scss';

const ProductCard: React.FC<IProductCardProps> = ({
  product = mockProductItem,
  width,
  display = 'default',
}) => {
  const selectedVariantId = product.selected_variant_id;
  const productImage = product.images[0] || product.colors.find((color) => color.images[0])?.images[0];
  const cardClassName = [
    'product-card',
    display === 'compact' ? 'product-card--compact' : '',
  ].filter(Boolean).join(' ');

  return (
    <article className={cardClassName} style={width ? { width } : undefined}>
      <Link
        className="product-card__stretched-link"
        to={getProductPageUrl(product)}
        aria-label={`View ${product.name}`}
      />

      <div className="product-card__media">
        {productImage ? (
          <img className="product-card__image" src={productImage} alt={product.name} />
        ) : (
          <span className="product-card__image-placeholder">No image</span>
        )}
        <div className="product-card__quick-view">View details</div>
      </div>

      <div className="product-card__content">
        <h3 className="product-card__name" title={product.name}>{product.name}</h3>

        <div className="product-card__meta">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          {product.fabric && <span className="product-card__fabric">{product.fabric}</span>}
        </div>
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
      </div>
    </article>
  );
};

export default ProductCard;
