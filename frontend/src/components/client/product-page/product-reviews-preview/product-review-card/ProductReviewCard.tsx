import React from 'react';
import ProductRating from '../../product-rating/ProductRating';
import type { IReview } from '../../../reviews/reviews.store';
import './ProductReviewCard.scss';

interface ProductReviewCardProps {
  review: IReview;
}

const ProductReviewCard: React.FC<ProductReviewCardProps> = ({ review }) => (
  <article className="product-review-card">
    <div className="product-review-card__avatar">
      {(review.customer_name || '?').charAt(0)}
    </div>
    <div className="product-review-card__content">
      <h3 className="product-review-card__name">
        {review.customer_name || 'Customer'}
      </h3>
      <ProductRating stars={review.stars} />
      <p className="product-review-card__text">{review.review_text}</p>
    </div>
  </article>
);

export default ProductReviewCard;
