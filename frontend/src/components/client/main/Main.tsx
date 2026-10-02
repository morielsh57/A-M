import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import Header from './../../../shared/layout/client-header/Header';
import ClientFooter from '../../../shared/layout/client-footer/ClientFooter';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import { getMainCategories } from '../../../shared/store/category/category.store';
import { getCart } from '../cart/cart.store';
import './Main.scss';

const Main: React.FC = () => {
  const dispatch = useAppDispatch();
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const { getCartReq } = useAppSelector((store) => store.cartStoreReducer);
  const mainCategories = getMainCategoriesReq.data || [];
  const isInitialAppLoading = (
    mainCategories.length === 0
    && [EAPIStatus.IDLE, EAPIStatus.PENDING].includes(getMainCategoriesReq.status)
  );

  useEffect(() => {
    if (
      mainCategories.length === 0
      && getMainCategoriesReq.status === EAPIStatus.IDLE
    ) {
      dispatch(getMainCategories());
    }
  }, [dispatch, getMainCategoriesReq.status, mainCategories.length]);

  useEffect(() => {
    if (getCartReq.status === EAPIStatus.IDLE) {
      dispatch(getCart());
    }
  }, [dispatch, getCartReq.status]);

  return (
    <main className="client-main-container">
      <Header />
      <div className="client-main-scrollable-content-container">
        {isInitialAppLoading ? (
          <div className="client-main-container__loader">
            <Spin size="large" className='main-spinner' />
          </div>
        ) : (
          <Outlet />
        )}
        <ClientFooter />
      </div>
    </main>
  );
};

export default Main;
