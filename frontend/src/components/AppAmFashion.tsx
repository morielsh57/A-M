import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "react-toast-notifications";
import { Provider } from 'react-redux';
import { store } from "../app/store";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { ThemeProvider as StylesThemeProvider } from "@mui/styles";
import { APP_ROUTING_PATHS } from "../app/routing";
import RouteOutlet from "./util/routeOutlet";
import Main from './client/main/Main';
import Home from './client/home/Home';
import ProductPage from './client/product-page/ProductPage';
import CategoryPage from './client/category-page/CategoryPage';
import SearchPage from './client/search-page/SearchPage';
import { ProtectedLoginRoute } from '../app/guards/client/ProtectedLoginRoute';
import ClientLogin from '../app/auth/client/client-login/ClientLogin';
import paletteColors from '../shared/styles/colors.module.scss';
import ClientSignup from '../app/auth/client/client-signup/ClientSignup';
import { Auth } from '../app/auth/Auth';
import AppAdmin from './AppAdmin';
import ScrollRestoration from '../shared/components/scroll-restoration/ScrollRestoration';
import CheckoutPage from './client/checkout/CheckoutPage';
import OrderDetailsPage from './client/orders/order-details-page/OrderDetailsPage';
import { ProtectedCheckoutRoute } from '../app/guards/client/ProtectedCheckoutRoute';

const AppAMFashion: React.FC = (props) => {
  const theme = createTheme(
    {
      palette: {
        primary: {
          main: paletteColors.deepPink8,
          light: paletteColors.deepPink6,
          dark: paletteColors.deepPink9,
        },
        secondary: {
          main: paletteColors.deepPink7,
          light: paletteColors.deepPink5,
          dark: paletteColors.deepPink8,
          contrastText: paletteColors.natural1,
        },
        background: {
          default: paletteColors.natural1,
          paper: paletteColors.pink0,
        },
        text: {
          primary: paletteColors.natural9,
          secondary: paletteColors.purple6,
          disabled: paletteColors.purple6,
        },
        action: {
          disabled: paletteColors.deepPink4,
          disabledBackground: paletteColors.deepPink1,
        },
      },
    }
  );

  return (
    <ThemeProvider theme={theme}>
      <StylesThemeProvider theme={theme}>
        <Provider store={store}>
          <ToastProvider>
            <Router>
              <Auth>
                <ScrollRestoration />
                <Routes>
                  <Route path={APP_ROUTING_PATHS.AUTH} element={<RouteOutlet />}>
                    <Route path={APP_ROUTING_PATHS.LOGIN} element={
                      <ProtectedLoginRoute>
                        <ClientLogin />
                      </ProtectedLoginRoute>} />
                    <Route path={APP_ROUTING_PATHS.SIGNUP} element={
                      <ProtectedLoginRoute>
                        <ClientSignup />
                      </ProtectedLoginRoute>} />
                    <Route index element={<Navigate to={APP_ROUTING_PATHS.AUTH_LOGIN_PAGE} replace />} />
                  </Route>
                  <Route path={APP_ROUTING_PATHS.APP} element={<Main />}>
                    <Route index element={<Home />} />
                    <Route path={`${APP_ROUTING_PATHS.PRODUCT}/:productId`} element={<ProductPage />} />
                    <Route path={`${APP_ROUTING_PATHS.CATEGORY}/:categoryType/:categoryId`} element={<CategoryPage />} />
                    <Route path={APP_ROUTING_PATHS.SEARCH} element={<SearchPage />} />
                    <Route path={APP_ROUTING_PATHS.CHECKOUT} element={(
                      <ProtectedCheckoutRoute>
                        <CheckoutPage />
                      </ProtectedCheckoutRoute>
                    )} />
                    <Route path={`${APP_ROUTING_PATHS.ORDER}/:orderId`} element={(
                      <ProtectedCheckoutRoute>
                        <OrderDetailsPage />
                      </ProtectedCheckoutRoute>
                    )} />
                  </Route>
                  <Route path={`${APP_ROUTING_PATHS.ADMIN.ROOT}/*`} element={<AppAdmin />} />
                  <Route path={APP_ROUTING_PATHS.ROOT} element={<Navigate to={APP_ROUTING_PATHS.APP_HOME_PAGE} replace />} />
                  <Route path="*" element={<Navigate to={APP_ROUTING_PATHS.APP_HOME_PAGE} replace />} />
                </Routes>
              </Auth>
            </Router>
          </ToastProvider>
        </Provider>
      </StylesThemeProvider>
    </ThemeProvider>
  );
};

export default AppAMFashion;
