import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zmusic.app',
  appName: 'ZMusic',
  webDir: 'dist',
  backgroundColor: '#0a0a0f',
  android: {
    backgroundColor: '#0a0a0f',
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: '#0a0a0f',
    contentInset: 'always',
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0f',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      iosSpinnerStyle: 'small',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0a0a0f',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
