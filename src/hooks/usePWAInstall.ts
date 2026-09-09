import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function checkIsStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isStandaloneMedia =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches;

  const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const isAndroidAppReferrer = document.referrer.includes('android-app://');
  const isUrlPwa = window.location.search.includes('source=pwa') || window.location.search.includes('mode=pwa');
  const isLocalStoragePwa = localStorage.getItem('three_four_is_standalone_app') === 'true';

  const standalone = isStandaloneMedia || isIOSStandalone || isAndroidAppReferrer || isUrlPwa || isLocalStoragePwa;

  if (standalone) {
    try {
      localStorage.setItem('three_four_is_standalone_app', 'true');
    } catch {}
  }

  return standalone;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsStandaloneApp());
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed & running as standalone PWA)
    const isStandalone = checkIsStandaloneApp();
    setIsInstalled(isStandalone);

    // Detect iOS devices (iPhone, iPad, iPod)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const isAndroidDevice = /android/.test(ua);
    setIsAndroid(isAndroidDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    install,
  };
}
