import React from 'react';
import './ProductRating.scss';

const MAX_STARS = 5;
const STAR = '\u2605';

interface ProductRatingProps {
  stars?: number;
}

const ProductRating: React.FC<ProductRatingProps> = ({
  stars = 0,
}) => {
  const starsCount = Math.min(Math.max(Number(stars) || 0, 0), MAX_STARS);
  const filledPercentage = (starsCount / MAX_STARS) * 100;
  const ratingLabel = `${starsCount.toFixed(1)} out of ${MAX_STARS} stars`;

  return (
    <div className="product-page__rating" aria-label={ratingLabel}>
      <span className="product-page__stars" aria-hidden="true">
        <span className="product-page__stars-empty">{STAR.repeat(MAX_STARS)}</span>
        <span
          className="product-page__stars-filled"
          style={{ width: `${filledPercentage}%` }}
        >
          {STAR.repeat(MAX_STARS)}
        </span>
      </span>
    </div>
  );
};

export default ProductRating;
