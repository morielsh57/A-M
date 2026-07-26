import React from 'react';
import { ConfigProvider } from 'antd';
import './bootstrap-custom.scss';
import './App.scss';
import AppAMFashion from './components/AppAmFashion';

const App: React.FC = () => {

  return (
    <ConfigProvider>
      <div className="App">
        <AppAMFashion />
      </div>
    </ConfigProvider>
  );
}

export default App;
