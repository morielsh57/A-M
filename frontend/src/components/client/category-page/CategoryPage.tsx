import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import AppPagination from '../../../shared/components/app-pagination/AppPagination';
import AppTitle from '../../../shared/components/app-title/AppTitle';
import Breadcrumbs from '../../../shared/components/breadcrumbs/Breadcrumbs';
import ProductCard from '../../../shared/components/product-card/ProductCard';
import ProductCardSkeleton from '../../../shared/components/product-card-skeleton/ProductCardSkeleton';
import ProductsGridWrapper from '../../../shared/components/products-grid-wrapper/ProductsGridWrapper';
import { getCategoryProducts, getCategoryProductsCacheKey } from '../../product-page/product.store';
import type { IProductsListRequestParams } from '../../product-page/product.types';
import './CategoryPage.scss';

const CATEGORY_PRODUCTS_PAGE_SIZE = 20;

const getPageFromSearchParams = (pageParam: string | null) => {
  const page = Number(pageParam || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const CategoryPage: React.FC = () => {
  const { categoryType, categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const { categoryProductsByQueryReq } = useAppSelector((store) => store.productPageStoreReducer);
  const mainCategories = getMainCategoriesReq.data || [];
  const currentPage = getPageFromSearchParams(searchParams.get('page'));
  const isSubCategory = categoryType === 'sub';
  const isMainCategory = categoryType === 'main';

  const selectedCategory = useMemo(() => {
    if (isMainCategory) {
      const mainCategory = mainCategories.find(
        (category) => String(category.category_id) === String(categoryId),
      );

      return {
        mainCategory,
        subCategory: undefined,
      };
    }

    if (isSubCategory) {
      for (const mainCategory of mainCategories) {
        const subCategory = mainCategory.subcategories.find(
          (category) => String(category.category_id) === String(categoryId),
        );

        if (subCategory) {
          return {
            mainCategory,
            subCategory,
          };
        }
      }
    }

    return {
      mainCategory: undefined,
      subCategory: undefined,
    };
  }, [categoryId, isMainCategory, isSubCategory, mainCategories]);

  const categoryTitle = useMemo(() => {
    if (isMainCategory) {
      return selectedCategory.mainCategory?.main_category_name || 'Category';
    }

    if (isSubCategory && selectedCategory.subCategory) {
      return selectedCategory.subCategory.sub_category_name
        || selectedCategory.subCategory.main_category_name;
    }

    return 'Category';
  }, [isMainCategory, isSubCategory, selectedCategory]);

  const breadcrumbLinks = selectedCategory.subCategory && selectedCategory.mainCategory
    ? [{
      to: APP_ROUTING_PATHS.APP_CATEGORY_PAGE('main', selectedCategory.mainCategory.category_id),
      name: selectedCategory.mainCategory.main_category_name,
    }]
    : undefined;

  const productRequestParams = useMemo<IProductsListRequestParams | undefined>(() => {
    if (!categoryId || (!isMainCategory && !isSubCategory)) {
      return undefined;
    }

    return {
      page: currentPage,
      page_size: CATEGORY_PRODUCTS_PAGE_SIZE,
      ...(isSubCategory ? { sub_category: categoryId } : { main_category: categoryId }),
    };
  }, [categoryId, currentPage, isMainCategory, isSubCategory]);

  const productsCacheKey = productRequestParams
    ? getCategoryProductsCacheKey(productRequestParams)
    : undefined;
  const categoryProductsReq = productsCacheKey
    ? categoryProductsByQueryReq[productsCacheKey]
    : undefined;

  useEffect(() => {
    if (!productRequestParams || categoryProductsReq) {
      return;
    }

    dispatch(getCategoryProducts(productRequestParams));
  }, [categoryProductsReq, dispatch, productRequestParams]);

  const products = categoryProductsReq?.data || [];
  const pagination = categoryProductsReq?.meta?.pagination;
  const isLoading = categoryProductsReq?.status === EAPIStatus.PENDING;
  const isInitialLoading = (!categoryProductsReq || isLoading) && products.length === 0;
  const totalItems = pagination?.total_items || products.length;
  const pageSize = pagination?.page_size || CATEGORY_PRODUCTS_PAGE_SIZE;

  const handlePageChange = (page: number) => {
    if (!categoryId || (!isMainCategory && !isSubCategory)) {
      return;
    }

    navigate(APP_ROUTING_PATHS.APP_CATEGORY_PAGE(isSubCategory ? 'sub' : 'main', categoryId, page));
  };

  if (!categoryId || (!isMainCategory && !isSubCategory)) {
    return (
      <div className="category-page">
        <AppTitle title="Category not found" />
      </div>
    );
  }

  return (
    <div className="category-page">
      <Breadcrumbs linkAr={breadcrumbLinks} pageName={categoryTitle} />
      <AppTitle title={categoryTitle} />

      {!isInitialLoading && products.length === 0 && (
        <p className="category-page__message">No products found in this category.</p>
      )}

      {isInitialLoading && (
        <ProductsGridWrapper>
          {Array.from({ length: CATEGORY_PRODUCTS_PAGE_SIZE }).map((_, index) => (
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

      <AppPagination
        page={pagination?.page || currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default CategoryPage;
