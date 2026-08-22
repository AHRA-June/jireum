import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'jireumsin-simsagi',
  brand: {
    // 심사 서류 톤에 맞춘 청색 도장 컬러
    primaryColor: '#1D4ED8',
  },
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withTitle: true,
    theme: 'light',
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
  },
  webBundleDir: 'dist',
});
