import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import AppPagination from '../../../shared/components/app-pagination/AppPagination';
import AppTitle from '../../../shared/components/app-title/AppTitle';
import Breadcrumbs from '../../../shared/components/breadcrumbs/Breadcrumbs';
import ProductCard from '../../../shared/components/product-card/ProductCard';
import ProductCardSkeleton from '../../../shared/components/product-card-skeleton/ProductCardSkeleton';
import ProductsGridWrapper from '../../../shared/components/products-grid-wrapper/ProductsGridWrapper';
import { getSearchProducts, getSearchProductsCacheKey } from '../../product-page/product.store';
import type { IProductsListRequestParams } from '../../product-page/product.types';
import './SearchPage.scss';

const SEARCH_PRODUCTS_PAGE_SIZE = 20;

const getPageFromSearchParams = (pageParam: string | null) => {
  const page = Number(pageParam || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { searchProductsByQueryReq } = useAppSelector((store) => store.productPageStoreReducer);
  const searchQuery = (searchParams.get('q') || '').trim();
  const currentPage = getPageFromSearchParams(searchParams.get('page'));

  const productRequestParams = useMemo<IProductsListRequestParams | undefined>(() => {
    if (!searchQuery) {
      return undefined;
    }

    return {
      search: searchQuery,
      page: currentPage,
      page_size: SEARCH_PRODUCTS_PAGE_SIZE,
    };
  }, [currentPage, searchQuery]);

  const productsCacheKey = productRequestParams
    ? getSearchProductsCacheKey(productRequestParams)
    : undefined;
  const searchProductsReq = productsCacheKey
    ? searchProductsByQueryReq[productsCacheKey]
    : undefined;

  useEffect(() => {
    if (!productRequestParams || searchProductsReq) {
      return;
    }

    dispatch(getSearchProducts(productRequestParams));
  }, [dispatch, productRequestParams, searchProductsReq]);

  const products = searchProductsReq?.data || [];
  const pagination = searchProductsReq?.meta?.pagination;
  const isLoading = searchProductsReq?.status === EAPIStatus.PENDING;
  const isInitialLoading = searchQuery && (!searchProductsReq || isLoading) && products.length === 0;
  const totalItems = pagination?.total_items || products.length;
  const pageSize = pagination?.page_size || SEARCH_PRODUCTS_PAGE_SIZE;
  const title = searchQuery ? `Search results for "${searchQuery}"` : 'Search products';

  const handlePageChange = (page: number) => {
    if (!searchQuery) {
      return;
    }

    navigate(APP_ROUTING_PATHS.APP_SEARCH_PAGE(searchQuery, page));
  };

  return (
    <div className="search-page">
      <Breadcrumbs pageName="Search" />
      <AppTitle title={title} />

      {searchQuery && !isInitialLoading && (
        <p className="search-page__summary">
          {totalItems === 1 ? '1 product found' : `${totalItems} products found`}
        </p>
      )}

      {!searchQuery && (
        <p className="search-page__message">Start by searching for a product you love.</p>
      )}

      {searchQuery && !isInitialLoading && products.length === 0 && (
        <p className="search-page__message">No products found for this search.</p>
      )}

      {isInitialLoading && (
        <ProductsGridWrapper>
          {Array.from({ length: SEARCH_PRODUCTS_PAGE_SIZE }).map((_, index) => (
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

      {searchQuery && (
        <AppPagination
          page={pagination?.page || currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default SearchPage;
