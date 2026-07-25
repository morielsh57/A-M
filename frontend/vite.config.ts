import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { fileURLToPath } from 'url';
import { resolve } from 'node:path';

export default defineConfig(({ mode, command }) => {
  const envDir = fileURLToPath(new URL('.', import.meta.url));
  const fileEnv = loadEnv(mode, envDir, 'REACT_APP_');
  const osEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('REACT_APP_') && v !== undefined) {
      osEnv[k] = v;
    }
  }

  const useHttps = process.env.HTTPS === 'true';

  return {
    plugins: [
      react(),
      ...(useHttps ? [basicSsl()] : []),
    ],
    envPrefix: 'REACT_APP_',
    define: {
      'process.env': JSON.stringify({
        NODE_ENV: command === 'build' ? 'production' : 'development',
        ...fileEnv,
        ...osEnv,
      }),
    },
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['import', 'global-builtin', 'if-function', 'legacy-js-api'],
        },
      },
    },
    build: {
      outDir: 'build',
      sourcemap: false,
    },
    server: {
      port: 3001,
      strictPort: true,
    },
    resolve: {
      alias: [
        { find: '@material-ui/core', replacement: resolve(__dirname, 'src/compat/material-ui/core') },
        { find: '@material-ui/icons', replacement: resolve(__dirname, 'src/compat/material-ui/icons') },
        { find: '@material-ui/lab', replacement: resolve(__dirname, 'src/compat/material-ui/lab') },
        { find: /^antd$/, replacement: resolve(__dirname, 'src/compat/antd.tsx') },
        { find: 'antd/dist/antd.css', replacement: resolve(__dirname, 'src/compat/antd.css') },
        { find: 'react-google-maps', replacement: resolve(__dirname, 'src/compat/react-google-maps.tsx') },
        { find: 'react-paypal-button-v2', replacement: resolve(__dirname, 'src/compat/react-paypal-button-v2.tsx') },
        { find: 'react-toast-notifications', replacement: resolve(__dirname, 'src/compat/react-toast-notifications.tsx') },
        { find: 'redux-devtools-extension', replacement: resolve(__dirname, 'src/compat/redux-devtools-extension.ts') },
      ],
    },
  };
});
