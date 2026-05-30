import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { submitReportHandler } from './server/apiHandler.mjs';

function feishuSubmitApi() {
  return {
    name: 'feishu-submit-api',
    configureServer(server) {
      server.middlewares.use('/api/submit-report', (request, response) => {
        submitReportHandler(request, response);
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), feishuSubmitApi()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }

          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts-vendor';
          }

          if (id.includes('node_modules/jspdf')) return 'jspdf-vendor';
          if (id.includes('node_modules/html2canvas')) return 'html2canvas-vendor';
          if (id.includes('node_modules/dompurify')) return 'dompurify-vendor';
        },
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
