import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import type { ProductId } from '../../../product-page/product.types';
import {
  getProductReviews,
  getProductReviewsCacheKey,
  PRODUCT_REVIEWS_PAGE_SIZE,
  type IProductReviewsRequest,
} from '../../reviews/reviews.store';
import ProductReviewCard from './product-review-card/ProductReviewCard';
import './ProductReviewsPreview.scss';

interface ProductReviewsPreviewProps {
  productId: ProductId;
}

const ProductReviewsPreview: React.FC<ProductReviewsPreviewProps> = ({ productId }) => {
  const dispatch = useAppDispatch();
  const { productReviewsByQueryReq } = useAppSelector((store) => store.reviewsStoreReducer);
  const requestParams = useMemo<IProductReviewsRequest>(() => ({
    product_id: productId,
    page: 1,
    page_size: PRODUCT_REVIEWS_PAGE_SIZE,
  }), [productId]);
  const requestKey = getProductReviewsCacheKey(requestParams);
  const reviewsReq = productReviewsByQueryReq[requestKey];
  const reviews = reviewsReq?.data || [];
  const isLoading = !reviewsReq || reviewsReq.status === EAPIStatus.PENDING;

  useEffect(() => {
    if (!reviewsReq) {
      dispatch(getProductReviews(requestParams));
    }
  }, [dispatch, requestParams, reviewsReq]);

  return (
    <section className="product-page__reviews">
      <div className="product-page__reviews-header">
        <h2 className="product-page__reviews-title">Reviews</h2>
      </div>

      {isLoading && (
        <p className="product-page__reviews-state">Loading reviews...</p>
      )}

      {!isLoading && reviewsReq?.error && (
        <p className="product-page__reviews-state">Reviews could not be loaded.</p>
      )}

      {!isLoading && !reviewsReq?.error && reviews.length === 0 && (
        <p className="product-page__reviews-state">No reviews yet.</p>
      )}

      {!isLoading && !reviewsReq?.error && reviews.map((review) => (
        <ProductReviewCard key={review.review_id} review={review} />
      ))}
    </section>
  );
};

export default ProductReviewsPreview;
