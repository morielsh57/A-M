import React from 'react';
import { ConfigProvider } from 'antd';
import './bootstrap-custom.scss';
import './App.scss';
import AppAMFashion from './components/AppAmFashion';

const App: React.FC = () => {
  console.log("env test", process.env.REACT_APP_BASE_URL_SERVER);
  return (
    <ConfigProvider>
      <div className="App">
        <AppAMFashion />
      </div>
    </ConfigProvider>
  );
}

export default App;
