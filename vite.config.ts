/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import aitDevtools from '@apps-in-toss/devtools/unplugin';

export default defineConfig({
  // 미니앱 번들은 호스팅 경로가 고정되지 않으므로 상대 경로로 뽑는다.
  base: './',
  plugins: [aitDevtools.vite(), react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
