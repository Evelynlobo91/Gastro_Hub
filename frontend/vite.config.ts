import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Front em http://localhost:5173. Chama a API por /api (proxy no dev),
// evitando CORS e mantendo a mesma URL relativa em qualquer ambiente.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // acessível de fora do container
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
