import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { fileURLToPath } from 'url';

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
          silenceDeprecations: ['import', 'global-builtin', 'if-function', 'legacy-js-api', 'color-functions'],
        },
      },
    },
    build: {
      outDir: 'build',
      sourcemap: false,
    },
    server: {
      host: true,
      port: 3001,
      strictPort: true,
    },
  };
});
