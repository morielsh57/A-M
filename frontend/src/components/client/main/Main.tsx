import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './../../../shared/layout/client-header/Header';
import ClientFooter from '../../../shared/layout/client-footer/ClientFooter';
import './Main.scss';

const Main: React.FC = () => {
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
