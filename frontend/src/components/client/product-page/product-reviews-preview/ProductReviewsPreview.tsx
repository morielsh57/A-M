import React from 'react';
import ProductRating from '../product-rating/ProductRating';
import './ProductReviewsPreview.scss';

const mockReviews = [
  {
    user_name: 'Moriel Shmaya',
    stars: 4,
    review_text: 'Like this shirt.',
  },
  {
    user_name: 'Amit Kedem',
    stars: 3,
    review_text: 'Comfortable fit and nice fabric.',
  }
];

const ProductReviewsPreview: React.FC = () => {
  return (
    <section className="product-page__reviews">
      {mockReviews.map((review) => (
        <article className="product-page__review" key={review.user_name}>
          <div className="product-page__review-avatar">
            {review.user_name.charAt(0)}
          </div>
          <div>
            <h3>{review.user_name}</h3>
            <ProductRating rating={review.stars} showReviewCount={false} />
            <p>{review.review_text}</p>
          </div>
        </article>
      ))}
    </section>
  );
};

export default ProductReviewsPreview;
