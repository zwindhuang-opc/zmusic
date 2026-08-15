import { Capacitor } from '@capacitor/core';

/**
 * Mobile (Capacitor) bootstrap initializer.
 *
 * CRITICAL for avoiding black screen on launch:
 *  - Do NOT call SplashScreen.hide() eagerly during module init.
 *  - Hide the native splash ONLY after React has mounted + painted its first frame,
 *    signalled by the `zmusic:ui-ready` window event (dispatched from main.jsx).
 *  - As a safety net (in case the event never fires), force-hide after a timeout.
 */
async function initMobile() {
  if (!Capacitor.isNativePlatform()) return;

  window.Capacitor = Capacitor;

  const { StatusBar, Style } = await import('@capacitor/status-bar');
  const { SplashScreen } = await import('@capacitor/splash-screen');
  const { App: CapApp } = await import('@capacitor/app');
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  const { Keyboard } = await import('@capacitor/keyboard');

  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#0a0a0f' });
  } catch (e) {
    console.warn('[mobile] StatusBar init failed:', e);
  }

  /** Hide native splash screen safely (swallow errors so UI never blocks). */
  const hideSplash = async () => {
    try {
      await SplashScreen.hide({ fadeOutDuration: 300 });
    } catch (e) {
      console.warn('[mobile] SplashScreen.hide failed:', e);
    }
  };

  let splashHidden = false;
  const dismissOnce = () => {
    if (splashHidden) return;
    splashHidden = true;
    // Allow one extra frame so React paint commits before we fade the native splash.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => hideSplash());
    });
  };

  // Primary path: wait for React to signal first paint completed.
  // main.jsx fires `zmusic:ui-ready` via window.__zmusic_dismiss_bootstrap().
  window.addEventListener('zmusic:ui-ready', dismissOnce, { once: true });

  // Safety net: never leave splash visible forever.
  // Capacitor plugin default auto-hide is 2000ms so 6000ms is very generous.
  setTimeout(dismissOnce, 6000);

  try {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });
  } catch (e) {
    console.warn('[mobile] backButton listener failed:', e);
  }

  try {
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });
  } catch (e) {
    console.warn('[mobile] Keyboard listeners failed:', e);
  }

  window.hapticFeedback = (style = 'light') => {
    try {
      const impact = style === 'medium' ? ImpactStyle.Medium : style === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Light;
      Haptics.impact({ style: impact });
    } catch (e) {
      console.warn('[mobile] haptic failed:', e);
    }
  };
}

export { initMobile };
