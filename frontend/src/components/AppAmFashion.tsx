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

const AppAMFashion: React.FC = (props) => {
  const theme = createTheme();

  return (
    <ThemeProvider theme={theme}>
    <StylesThemeProvider theme={theme}>
    <Provider store={store}>
    <ToastProvider>
      <Router>
        <Routes>
          <Route path={APP_ROUTING_PATHS.AUTH} element={<RouteOutlet />}>
            <Route path={APP_ROUTING_PATHS.LOGIN} element={<>Login will be here</>} />
            <Route path={APP_ROUTING_PATHS.SIGNUP} element={<>Sign Up will be here</>} />
            <Route index element={<Navigate to={APP_ROUTING_PATHS.AUTH_LOGIN_PAGE} replace />} />
          </Route>
          <Route path={APP_ROUTING_PATHS.APP} element={<Main />}>
            <Route index element={<Home />} />
          </Route>
          {/* AppAdmin will be here */}
          <Route path={APP_ROUTING_PATHS.ROOT} element={<Navigate to={APP_ROUTING_PATHS.APP_HOME_PAGE} replace />} />
          <Route path="*" element={<Navigate to={APP_ROUTING_PATHS.APP_HOME_PAGE} replace />} />
        </Routes>
      </Router>
    </ToastProvider>
    </Provider>
    </StylesThemeProvider>
    </ThemeProvider>
  );
};

export default AppAMFashion;
