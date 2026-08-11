import React, { useEffect } from 'react';
import { APP_ROUTING_PATHS } from '../../../app/routing';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import { getHomeCategoryProducts } from '../../product-page/product.store';
import './HomeCategoryList.scss';
import HomeCategorySection from './HomeCategorySection';

const HOME_CATEGORY_PRODUCTS_SIZE = 6;

const HomeCategoryList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const { homeCategoryProductsByCategoryReq } = useAppSelector((store) => store.productPageStoreReducer);
  const mainCategories = getMainCategoriesReq.data || [];

  useEffect(() => {
    mainCategories.forEach((category) => {
      const categoryKey = String(category.category_id);
      const categoryReq = homeCategoryProductsByCategoryReq[categoryKey];

      if (!categoryReq) {
        dispatch(getHomeCategoryProducts({
          main_category: category.category_id,
          page_size: HOME_CATEGORY_PRODUCTS_SIZE,
        }));
      }
    });
  }, [dispatch, homeCategoryProductsByCategoryReq, mainCategories]);

  return (
    <div className="home-page-categories">
      {mainCategories.map((category) => {
        const categoryKey = String(category.category_id);
        const categoryLink = APP_ROUTING_PATHS.APP_CATEGORY_PAGE('main', category.category_id);
        const categoryReq = homeCategoryProductsByCategoryReq[categoryKey];
        const products = categoryReq?.data || [];
        const isLoading = !categoryReq || categoryReq.status === EAPIStatus.PENDING;

        return (
          <HomeCategorySection
            key={categoryKey}
            category={category}
            categoryLink={categoryLink}
            products={products}
            isLoading={isLoading}
            skeletonCount={HOME_CATEGORY_PRODUCTS_SIZE}
          />
        );
      })}
    </div>
  );
};

export default HomeCategoryList
