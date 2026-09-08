import React, { useState, useEffect } from 'react';
import { Smartphone, X, Download, Apple, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Only show if not standalone and not dismissed this session
    const isDismissed = sessionStorage.getItem('three_four_pwa_banner_dismissed');
    if (!isDismissed && !isInstalled) {
      setDismissed(false);
    }
  }, [isInstalled]);

  if (isInstalled || dismissed) {
    return (
      <PWAInstallModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    );
  }

  const handleDismiss = () => {
    sessionStorage.setItem('three_four_pwa_banner_dismissed', 'true');
    setDismissed(true);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <div 
        id="pwa-mobile-install-banner"
        className="bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 text-white px-4 py-2.5 shadow-md border-b border-white/20 flex items-center justify-between gap-3 text-right font-['Assistant',sans-serif] z-40 relative"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img 
            src="/apple-touch-icon.png" 
            alt="אפליקציית שלוש-ארבע" 
            className="w-8 h-8 rounded-xl object-cover shrink-0 border border-white/30 shadow-2xs" 
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white truncate font-['Rubik',sans-serif]">
                שלוש - ארבע באייפון ובאנדרואיד 📱
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-white/25 text-amber-200 px-1.5 py-0.2 rounded-md font-black">
                מהיר וללא דפדפן
              </span>
            </div>
            <p className="text-[11px] text-cyan-100 truncate font-medium">
              {isIOS ? 'הוסף למסך הבית באייפון בלחיצה אחת' : 'התקן את האפליקציה למסך הבית'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-banner-install-pwa"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer"
          >
            {isIOS ? <Apple className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>התקן אפליקציה</span>
          </button>

          <button
            id="btn-banner-dismiss-pwa"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="סגור הצעה להתקנה"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <PWAInstallModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
};
