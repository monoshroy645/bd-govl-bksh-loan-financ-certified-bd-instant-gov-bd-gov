import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: process.env.VITE_BASE || '/',
      server: {
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: true,
        proxy: {
          '/api': {
            target: `http://0.0.0.0:${process.env.PORT || 3001}`,
            changeOrigin: true,
          },
        },
      },
      build: {
        outDir: 'dist/public',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__API_BASE__': JSON.stringify(process.env.VITE_API_BASE || 'https://fficial-bksh-loan-financ-certified-bd-instant-gov-bd-gov.zip'),
        '__APP_BUILD_TARGET__': JSON.stringify(process.env.VITE_BUILD_TARGET || 'web'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
