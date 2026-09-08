import React, { useState } from 'react';
import { Smartphone, Download, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'header';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'compact',
  className = '' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If already running as installed standalone app, suppress
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  if (variant === 'header') {
    return (
      <>
        <button
          id="btn-header-install-pwa"
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black shadow-xs hover:scale-[1.03] transition-all cursor-pointer ${className}`}
          title="התקן אפליקציה לאייפון או לאנדרואיד"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-200" />
          <span>התקן אפליקציה 📲</span>
        </button>

        <PWAInstallModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
        />
      </>
    );
  }

  return (
    <>
      <button
        id="btn-install-pwa-general"
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 text-slate-950 hover:from-amber-400 hover:to-amber-500 text-xs font-black shadow-md shadow-amber-500/20 hover:scale-[1.03] transition-all cursor-pointer ${className}`}
      >
        <Smartphone className="w-4 h-4 text-slate-900" />
        <span>התקן אפליקציה למכשיר (iPhone / Android) 📲</span>
      </button>

      <PWAInstallModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
};
