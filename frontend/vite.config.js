import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || '739741002165-6t4c64ucbr1re1n4a0gslc86gh52gdoc.apps.googleusercontent.com';
const facebookAppId = process.env.VITE_FACEBOOK_APP_ID || '1568316161683442';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    'import.meta.env.VITE_FACEBOOK_APP_ID': JSON.stringify(facebookAppId),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
