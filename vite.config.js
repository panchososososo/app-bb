import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cambia '/app-bb/' por '/<nombre-de-tu-repo>/' si tu repositorio se llama distinto.
export default defineConfig({
  plugins: [react()],
  base: '/app-bb/',
});
