import React from 'react'
import AppTitle from '../../../shared/components/app-title/AppTitle'
import { IMainCategory } from '../../../shared/store/category/category.types';
import { IProductCardProduct } from '../../product-page/product.types';
import ProductsGridWrapper from '../../../shared/components/products-grid-wrapper/ProductsGridWrapper';
import ProductCard from '../../../shared/components/product-card/ProductCard';
import { Link } from 'react-router-dom';
import ProductCardSkeleton from '../../../shared/components/product-card-skeleton/ProductCardSkeleton';

interface HomeCategorySectionProps {
  category: IMainCategory;
  categoryLink: string;
  products: IProductCardProduct[];
  isLoading: boolean;
  skeletonCount?: number;
}

const HomeCategorySection: React.FC<HomeCategorySectionProps> = ({
  category,
  categoryLink,
  products,
  isLoading,
  skeletonCount = 6,
}) => {
  const isInitialLoading = isLoading && products.length === 0;

  return (
    <section className="home-page-categories__category-section">
      <AppTitle title={category.main_category_name} to={categoryLink} />

      {!isInitialLoading && products.length === 0 && (
        <p className="home-page-categories__category-message">No products in this category yet.</p>
      )}

      {isInitialLoading && (
        <ProductsGridWrapper>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </ProductsGridWrapper>
      )}

      {!isInitialLoading && products.length > 0 && (
        <ProductsGridWrapper>
          {products.map((product) => (
            <ProductCard key={String(product.product_id)} product={product} />
          ))}
        </ProductsGridWrapper>
      )}

      <Link to={categoryLink} className="home-page-categories__category-more">
        More products of {category.main_category_name}
      </Link>
    </section>
  )
}

export default HomeCategorySection
