import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './../../../shared/layout/client-header/Header';
import ClientFooter from '../../../shared/layout/client-footer/ClientFooter';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { EAPIStatus } from '../../../shared/api/models';
import { getMainCategories } from '../../../shared/store/category/category.store';
import './Main.scss';

const Main: React.FC = () => {
  const dispatch = useAppDispatch();
  const { getMainCategoriesReq } = useAppSelector((store) => store.categoryStoreReducer);
  const mainCategories = getMainCategoriesReq.data || [];

  useEffect(() => {
    if (
      mainCategories.length === 0
      && getMainCategoriesReq.status === EAPIStatus.IDLE
    ) {
      dispatch(getMainCategories());
    }
  }, [dispatch, getMainCategoriesReq.status, mainCategories.length]);

  return (
    <main className="client-main-container">
      <Header />
      <div className="client-main-scrollable-content-container">
        <Outlet />
        <ClientFooter />
      </div>
    </main>
  );
};

export default Main;
