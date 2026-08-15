// PWA Notification Service
// Handles browser notifications for AUTO generation complete, publish complete, etc.

export function isNotificationSupported() {
  return typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
}

export async function requestPermission() {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

export function showNotification(title, options = {}) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    const notif = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/icon-192.png',
      badge: options.badge || '/icon-72.png',
      tag: options.tag || 'zmusic',
      requireInteraction: options.requireInteraction || false,
      ...options,
    });
    if (options.onClick) notif.onclick = options.onClick;
    setTimeout(() => notif.close(), options.duration || 8000);
    return notif;
  } catch (e) {
    console.warn('Notification failed:', e);
  }
}

export function notifyAutoComplete(songTitle, engine) {
  showNotification('🎵 AUTO 生成完成!', {
    body: `《${songTitle}》已由 ${engine} 生成完毕`,
    tag: 'auto-complete',
    icon: '/icon-192.png',
  });
}

export function notifyPublishComplete(platform, songTitle) {
  showNotification('📤 发布完成!', {
    body: `《${songTitle}》已发布到 ${platform}`,
    tag: 'publish-complete',
  });
}

export function notifyBatchComplete(total, success, failed) {
  showNotification('📦 批量生成完成!', {
    body: `共 ${total} 首 · 成功 ${success} · 失败 ${failed}`,
    tag: 'batch-complete',
    duration: 10000,
  });
}

export default {
  isNotificationSupported,
  requestPermission,
  showNotification,
  notifyAutoComplete,
  notifyPublishComplete,
  notifyBatchComplete,
};
