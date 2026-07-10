import { Capacitor } from '@capacitor/core';

async function initMobile() {
  if (!Capacitor.isNativePlatform()) return;

  const { StatusBar, Style } = await import('@capacitor/status-bar');
  const { SplashScreen } = await import('@capacitor/splash-screen');
  const { App: CapApp } = await import('@capacitor/app');
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  const { Keyboard } = await import('@capacitor/keyboard');

  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: '#0a0a0f' });

  await SplashScreen.hide();

  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      CapApp.exitApp();
    } else {
      window.history.back();
    }
  });

  Keyboard.addListener('keyboardWillShow', () => {
    document.body.classList.add('keyboard-open');
  });
  Keyboard.addListener('keyboardWillHide', () => {
    document.body.classList.remove('keyboard-open');
  });

  window.hapticFeedback = (style = 'light') => {
    const impact = style === 'medium' ? ImpactStyle.Medium : style === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Light;
    Haptics.impact({ style: impact });
  };
}

export { initMobile };
