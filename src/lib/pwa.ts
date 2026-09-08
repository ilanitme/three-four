import { registerSW } from 'virtual:pwa-register';

export function initPWA() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('PWA: Content updated');
      },
      onOfflineReady() {
        console.log('PWA: App is ready for offline use');
      },
    });
  }
}
