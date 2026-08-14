import React from 'react';
import './ProductRating.scss';

interface ProductRatingProps {
  rating?: number;
  reviewCount?: number;
  showReviewCount?: boolean;
}

const ProductRating: React.FC<ProductRatingProps> = ({
  rating = 4,
  reviewCount = 75,
  showReviewCount = true,
}) => {
  return (
    <div className="product-page__rating" aria-label={`${rating} out of 5 stars`}>
      <span className="product-page__stars" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={index < rating ? 'product-page__star--filled' : 'product-page__star--empty'}
          >
            ★
          </span>
        ))}
      </span>
      {showReviewCount && <strong>{reviewCount}</strong>}
    </div>
  );
};

export default ProductRating;
