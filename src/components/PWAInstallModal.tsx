import React from 'react';
import { 
  Smartphone, 
  Share, 
  PlusSquare, 
  Download, 
  CheckCircle2, 
  X, 
  Sparkles,
  ArrowDown,
  Apple,
  Layers
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleAndroidInstall = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-['Assistant',sans-serif]"
      onClick={onClose}
    >
      <div 
        id="modal-pwa-install"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-right relative"
      >
        {/* Header with App Brand */}
        <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-cyan-900 text-white p-6 relative">
          <button 
            id="btn-close-pwa-modal"
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center">
              <img 
                src="/apple-touch-icon.png" 
                alt="שלוש - ארבע" 
                className="w-12 h-12 rounded-xl object-cover" 
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-teal-100 text-[11px] font-bold mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>התקנה כאפליקציה למכשיר</span>
              </div>
              <h3 className="font-['Rubik',sans-serif] font-bold text-xl text-white">
                שלוש - ארבע בנייד
              </h3>
              <p className="text-xs text-teal-100/90 mt-0.5">
                חוויית אפליקציה מלאה, מהירה ונוחה במסך הבית
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Key Advantages */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 rounded-2xl bg-teal-50/70 border border-teal-100">
              <span className="text-lg block">⚡</span>
              <span className="text-[11px] font-bold text-teal-950 block">פתיחה מיידית</span>
              <span className="text-[10px] text-slate-500">ללא שורת כתובת</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-teal-50/70 border border-teal-100">
              <span className="text-lg block">📲</span>
              <span className="text-[11px] font-bold text-teal-950 block">מסך מלא</span>
              <span className="text-[10px] text-slate-500">כמו מחנות יישומים</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-teal-50/70 border border-teal-100">
              <span className="text-lg block">🛡️</span>
              <span className="text-[11px] font-bold text-teal-950 block">שמירה מקומית</span>
              <span className="text-[10px] text-slate-500">וחיבור מהיר</span>
            </div>
          </div>

          {/* Already installed notification */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm font-['Rubik',sans-serif]">האפליקציה כבר מותקנת במכשירך!</h4>
              <p className="text-xs text-emerald-700">
                אתה פועל במצב אפליקציה עצמאי (Standalone App).
              </p>
            </div>
          ) : isInstallable ? (
            /* Android / Chrome 1-Click Install Flow */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm font-['Rubik',sans-serif]">
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  <span>התקנה ישירה באנדרואיד / כרום</span>
                </div>
                <p className="text-xs text-slate-600">
                  לחץ על הכפתור מטה כדי להוסיף את אפליקציית ״שלוש - ארבע״ ישירות למסך הבית של הטלפון.
                </p>
              </div>

              <button
                id="btn-modal-install-android-direct"
                onClick={handleAndroidInstall}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-teal-700/25 transition-all cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>התקן אפליקציה למכשיר עכשיו</span>
              </button>
            </div>
          ) : (
            /* iPhone (iOS Safari) or Manual Steps */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-['Rubik',sans-serif]">
                  <Apple className="w-4 h-4 text-slate-700" />
                  <span>הוראות התקנה באייפון (iOS Safari):</span>
                </span>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  פשוט ב-3 שלבים
                </span>
              </div>

              {/* Steps List */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-7 h-7 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="text-xs text-slate-700 flex-1">
                    <span className="font-bold block text-slate-900">
                      לחץ על כפתור השיתוף (Share) בדפדפן Safari
                    </span>
                    <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                      בתחתית המסך באייפון: אייקון ריבוע עם חץ עולה
                      <Share className="w-3.5 h-3.5 text-teal-600 inline" />
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-7 h-7 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="text-xs text-slate-700 flex-1">
                    <span className="font-bold block text-slate-900">
                      גלול בתפריט ובחר ״הוסף למסך הבית״ (Add to Home Screen)
                    </span>
                    <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                      מלווה באייקון ריבוע ופלוס
                      <PlusSquare className="w-3.5 h-3.5 text-teal-600 inline" />
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-7 h-7 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    3
                  </div>
                  <div className="text-xs text-slate-700 flex-1">
                    <span className="font-bold block text-slate-900">
                      לחץ על ״הוסף״ (Add) בפינה השמאלית העליונה
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      האייקון של ״שלוש - ארבע״ יופיע במסך הבית של האייפון שלך!
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-[11px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>טיפ: מומלץ לפתוח בדפדפן <strong>Safari</strong> באייפון כדי לאפשר הוספה למסך הבית.</span>
              </div>
            </div>
          )}

          {/* Close button */}
          <button
            id="btn-modal-pwa-dismiss"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
