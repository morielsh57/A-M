import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import AppButton from '../../../shared/components/app-button/AppButton';
import Breadcrumbs from '../../../shared/components/breadcrumbs/Breadcrumbs';
import {
  getActiveVariants,
  getDefaultVariant,
  getProductCategoryBreadcrumbLinks,
  getVariantById,
} from './productPage.utils';
import {
  getProductDetail,
  getProductDetailCacheKey as getProductDetailRequestKey,
} from '../../product-page/product.store';
import ProductDetailsCare from './product-details-care/ProductDetailsCare';
import ProductImageGallery from './product-image-gallery/ProductImageGallery';
import ProductPurchasePanel from './product-purchase-panel/ProductPurchasePanel';
import ProductRecommendations from './product-recommendations/ProductRecommendations';
import ProductReviewsPreview from './product-reviews-preview/ProductReviewsPreview';
import './ProductPage.scss';

const ProductPage: React.FC = () => {
  const { productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { productDetailByProductReq } = useAppSelector((store) => store.productPageStoreReducer);
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const variantId = searchParams.get('variant');
  const productDetailKey = productId ? getProductDetailRequestKey({ product_id: productId }) : undefined;
  const productDetailReq = productDetailKey ? productDetailByProductReq[productDetailKey] : undefined;

  useEffect(() => {
    if (!productId || productDetailReq) {
      return;
    }

    dispatch(getProductDetail({ product_id: productId }));
  }, [dispatch, productDetailReq, productId]);

  const product = productDetailReq?.data;
  const activeVariants = useMemo(() => getActiveVariants(product?.variants), [product?.variants]);
  const selectedVariant = useMemo(() => {
    const variantFromUrl = getVariantById(activeVariants, variantId);
    return variantFromUrl || getDefaultVariant(activeVariants);
  }, [activeVariants, variantId]);
  const isLoading = !productDetailReq || productDetailReq.status === EAPIStatus.PENDING;
  const breadcrumbLinks = useMemo(() => (
    product
      ? getProductCategoryBreadcrumbLinks(product.category_id, getMainCategoriesReq.data || [])
      : undefined
  ), [getMainCategoriesReq.data, product]);

  const updateSelectedVariant = (nextVariantId?: string | number) => {
    if (!productId || !nextVariantId) return;

    setSearchParams(
      { variant: String(nextVariantId) },
      {
        replace: true,
        state: { preventScrollReset: true },
      },
    );
  };

  if (!productId) {
    return (
      <div className="product-page">
        <div className="product-page__empty-state">
          <h1>Product not found</h1>
          <p>We could not find the product you were looking for.</p>
          <AppButton onClick={() => navigate(APP_ROUTING_PATHS.APP_HOME_PAGE)}>
            Back to shop
          </AppButton>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="product-page">
        <div className="product-page__shell product-page__shell--loading">
          <div className="product-page__skeleton product-page__skeleton--media" />
          <div className="product-page__skeleton-panel">
            <div className="product-page__skeleton product-page__skeleton--title" />
            <div className="product-page__skeleton product-page__skeleton--line" />
            <div className="product-page__skeleton product-page__skeleton--line-short" />
            <div className="product-page__skeleton product-page__skeleton--button" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-page">
        <div className="product-page__empty-state">
          <h1>Product unavailable</h1>
          <p>{productDetailReq?.error?.message || 'This product is not available right now.'}</p>
          <AppButton onClick={() => navigate(APP_ROUTING_PATHS.APP_HOME_PAGE)}>
            Continue shopping
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page">
      <Breadcrumbs linkAr={breadcrumbLinks} pageName={product.name} />

      <section className="product-page__shell" aria-label={`${product.name} details`}>
        <ProductImageGallery
          product={product}
          activeVariants={activeVariants}
          selectedVariant={selectedVariant}
        />

        <div className="product-page__content">
          <ProductPurchasePanel
            product={product}
            activeVariants={activeVariants}
            selectedVariant={selectedVariant}
            onVariantSelect={updateSelectedVariant}
          />

          <section className="product-page__info-block">
            <h2>Size info</h2>
            <ul>
              <li>True to size.</li>
              <li>0 = XXS, 1 = XS, 2 = S, 3 = M, 4 = L, 5 = XL, 6 = 2XL, 7 = 3XL.</li>
            </ul>
          </section>

          <ProductDetailsCare information={product.information} />
          <ProductReviewsPreview />
        </div>

        <ProductRecommendations
          productCategoryId={product.category_id}
          currentProductId={product.product_id}
        />
      </section>
    </div>
  );
};

export default ProductPage;
