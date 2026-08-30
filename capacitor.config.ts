import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goonscroll.app',
  appName: 'GoonScroll',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'ionic',
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  ios: {
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#101828',
    preferredContentMode: 'mobile',
  },
};

export default config;
