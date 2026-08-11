import React from 'react';
import '../product-card/ProductCard.scss';

const ProductCardSkeleton: React.FC = () => {
  return (
    <article className="product-card product-card--skeleton" aria-hidden="true">
      <div className="product-card__media product-card__skeleton-block" />

      <div className="product-card__content">
        <div className="product-card__name product-card__skeleton-line product-card__skeleton-line--name" />
        <div className="product-card__meta">
          <div className="product-card__price product-card__skeleton-line product-card__skeleton-line--price" />
          <div className="product-card__fabric product-card__skeleton-line product-card__skeleton-line--fabric" />
        </div>
        <div className="product-card__colors">
          <span className="product-card__color product-card__skeleton-circle" />
          <span className="product-card__color product-card__skeleton-circle" />
          <span className="product-card__color product-card__skeleton-circle" />
        </div>
      </div>
    </article>
  );
};

export default ProductCardSkeleton;
