import React, { useState, useEffect } from 'react';
import { Smartphone, ExternalLink, LogIn, X, Compass, Info } from 'lucide-react';
import { checkIsStandaloneApp } from '../hooks/usePWAInstall';
import { UserProfile } from '../types';
import { getPersistentUserCookie } from '../lib/firebase';

interface AppBridgeBannerProps {
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const AppBridgeBanner: React.FC<AppBridgeBannerProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const [isStandalone, setIsStandalone] = useState(true);
  const [isInApp, setIsInApp] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone installed app
    const standalone = checkIsStandaloneApp();
    setIsStandalone(standalone);

    if (standalone) return;

    // Detect user agents
    const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
    const isWhatsApp = /whatsapp/i.test(ua);
    const isOtherInApp = /fban|fbav|instagram|line|micromessenger|snapchat|telegram/i.test(ua);
    setIsInApp(isWhatsApp || isOtherInApp);

    const android = /android/i.test(ua);
    setIsAndroid(android);

    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('threefour_bridge_banner_dismissed') === 'true';
    setDismissed(isDismissed);
  }, []);

  // If already running in the application or dismissed, do not show
  if (isStandalone || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem('threefour_bridge_banner_dismissed', 'true');
    setDismissed(true);
  };

  const handleOpenApp = () => {
    const currentUrl = window.location.href;
    const cleanHost = window.location.host;
    const pathAndQuery = window.location.pathname + window.location.search;

    if (isAndroid) {
      // Chrome Intent to launch installed Chrome WebAPK / Chrome directly
      const chromeIntent = `intent://${cleanHost}${pathAndQuery}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = chromeIntent;
      return;
    }

    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    // Default web redirect
    window.location.href = currentUrl;
  };

  return (
    <div 
      id="app-bridge-banner"
      className="bg-slate-900 text-white px-3.5 py-2 sm:py-2.5 text-right font-['Assistant',sans-serif] text-xs border-b border-slate-700 shadow-md relative z-30"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Information Message */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div className="text-[12px] sm:text-xs text-slate-200">
            {isInApp ? (
              <span>
                נפתחה תצוגה מתוך וואטסאפ.{' '}
                <strong className="text-teal-300">מומלץ לפתוח באפליקציה המותקנת</strong> כדי להישאר מחוברים לחשבונך.
              </span>
            ) : (
              <span>
                צופה דרך הדפדפן?{' '}
                <strong className="text-teal-300">האפליקציה מותקנת במסך הבית?</strong> פתח בה לחוויה מושלמת.
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 mr-auto">
          {/* Open in App Button */}
          <button
            onClick={handleOpenApp}
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>פתח באפליקציה</span>
          </button>

          {/* Quick Login if not logged in */}
          {!currentUser && (
            <button
              onClick={() => onOpenAuth('login')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>התחבר לחשבון</span>
            </button>
          )}

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="סגור הודעה"
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Modal / Tooltip Guide if user clicks open in app on iPhone inside WhatsApp */}
      {showIosGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-right"
          onClick={() => setShowIosGuide(false)}
        >
          <div 
            className="bg-white text-slate-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-black text-sm text-teal-800 flex items-center gap-1.5 font-['Rubik',sans-serif]">
                <Compass className="w-4 h-4 text-teal-600" />
                <span>מעבר לאפליקציה / ספארי באייפון</span>
              </h3>
              <button 
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mb-3">
              באייפון, קישורים מוואטסאפ נפתחים בתצוגה פנימית זמנית. כדי לעבור לאפליקציה המותקנת או לספארי שבו שמורה ההתחברות שלך:
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-2 mb-4">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                <span>לחץ על סמל השיתוף <strong>⎋</strong> או <strong>⋯</strong> (בתחתית או בראש המסך בוואטסאפ).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <span>בחר בתפריט <strong>"פתח בספארי" (Open in Safari)</strong> או באפליקציה המותקנת.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs text-center shadow-xs"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
