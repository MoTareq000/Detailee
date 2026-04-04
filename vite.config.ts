import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL;

  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: supabaseUrl
      ? {
          proxy: {
            '/supabase': {
              target: supabaseUrl,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => path.replace(/^\/supabase/, ''),
            },
          },
        }
      : undefined,
  };
});
