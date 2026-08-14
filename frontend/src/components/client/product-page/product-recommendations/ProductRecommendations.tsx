import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../app/store';
import { EAPIStatus } from '../../../../shared/api/models';
import ProductCard from '../../../../shared/components/product-card/ProductCard';
import {
  getCategoryProducts,
  getCategoryProductsCacheKey,
} from '../../../product-page/product.store';
import type { CategoryId, ProductId } from '../../../product-page/product.types';
import { getMainCategoryIdForProduct } from '../productPage.utils';
import './ProductRecommendations.scss';

interface ProductRecommendationsProps {
  productCategoryId: CategoryId;
  currentProductId: ProductId;
}

const RECOMMENDED_PRODUCTS_SIZE = 5;

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  productCategoryId,
  currentProductId,
}) => {
  const dispatch = useAppDispatch();
  const { categoryProductsByQueryReq } = useAppSelector((store) => store.productPageStoreReducer);
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const mainCategoryId = useMemo(
    () => getMainCategoryIdForProduct(productCategoryId, getMainCategoriesReq.data || []),
    [getMainCategoriesReq.data, productCategoryId],
  );
  const requestParams = useMemo(() => {
    if (!mainCategoryId) return undefined;

    return {
      main_category: mainCategoryId,
      page: 1,
      page_size: RECOMMENDED_PRODUCTS_SIZE,
    };
  }, [mainCategoryId]);
  const requestKey = requestParams ? getCategoryProductsCacheKey(requestParams) : undefined;
  const recommendedProductsReq = requestKey ? categoryProductsByQueryReq[requestKey] : undefined;

  useEffect(() => {
    if (!requestParams || recommendedProductsReq) return;

    dispatch(getCategoryProducts(requestParams));
  }, [dispatch, recommendedProductsReq, requestParams]);

  const products = (recommendedProductsReq?.data || [])
    .filter((product) => String(product.product_id) !== String(currentProductId))
    .slice(0, 4);
  const isLoading = !recommendedProductsReq || recommendedProductsReq.status === EAPIStatus.PENDING;

  if (!mainCategoryId || (!isLoading && products.length === 0)) {
    return null;
  }

  return (
    <aside className="product-page__recommendations" aria-label="Recommended products">
      <h2>You might also like</h2>

      {isLoading && Array.from({ length: 4 }).map((_, index) => (
        <div className="product-page__recommendation-card product-page__recommendation-card--loading" key={index} />
      ))}

      {!isLoading && products.map((product) => (
        <ProductCard
          key={String(product.product_id)}
          product={product}
          display="compact"
        />
      ))}
    </aside>
  );
};

export default ProductRecommendations;
