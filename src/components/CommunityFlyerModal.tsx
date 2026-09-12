import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  MessageCircle, 
  Heart, 
  Sparkles, 
  Users, 
  Briefcase, 
  CalendarCheck,
  Share2
} from 'lucide-react';
import { ThreeFourLogo } from './ThreeFourLogo';

interface CommunityFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityFlyerModal: React.FC<CommunityFlyerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.origin;

  const flyerWhatsAppText = `🌾 *שלוש - ארבע לעבודה בקיבוץ!* 🌾
_מחברים בין עבודות בקיבוץ לבין הנוער שלנו (שכבות י'–י"ב)_

חברות וחברים יקרים,
הנוער שלנו בשכבות י'–י"ב מגייס כסף למימון *חג המחזור וטיול סיום י"ב* – ואנחנו צריכים אתכם!

יש לכם עבודה קטנה או גדולה בבית או בחצר?
👶 *בייביסיטר*
🐕 *דוגיסיטר וטיול עם כלבים*
🍽️ *שטיפת כלים וניקיון*
🌿 *סידור גינה ועישוב*
📦 *עזרה בהובלות, פריקה וסחיבה*
...וכל עזרה אחרת שאתם צריכים!

*איך זה עובד? פשוט ומהיר:*
1. נכנסים לקישור (בלי סיבוכים – הרשמה פשוטה עם שם וטלפון):
🔗 ${appUrl}
2. מפרסמים מודעה קצרה עם פרטי העבודה, המועד והתשלום.
3. הנוער רואה את העבודה ונרשם אליה ישירות – ויוצרים קשר לתיאום!

בואו נפרגן לנוער שלנו, נרוויח עזרה איכותית בבית ונעזור להם להגיע ליעד! 💪✨`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(flyerWhatsAppText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy flyer text:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(flyerWhatsAppText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:max-w-none print:rounded-none"
        dir="rtl"
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200 print:hidden">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>פלייר הסברה לחברי הקיבוץ</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title="הדפס פלייר"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">הדפסה</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              aria-label="סגור"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Visual Flyer Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header Banner */}
          <div className="text-center space-y-3 pb-6 border-b border-emerald-100">
            <div className="flex justify-center">
              <ThreeFourLogo size="lg" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-extrabold border border-emerald-200">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>גיוס כספים לחג המחזור וטיול סיום י״ב</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              צריכים עזרה בבית או בחצר? <br className="hidden sm:inline" />
              <span className="text-emerald-700">הנוער של הקיבוץ כאן בשבילכם!</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              השקנו את אפליקציית לוח העבודות הקהילתי של הקיבוץ, המחברת ישירות בין חברים שצריכים עזרה לבין בני הנוער שלנו (שכבות י'–י"ב).
            </p>
          </div>

          {/* Goal Highlight */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-lg">
              🎯
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-950 mb-0.5">
                המטרה: איסוף כספים משותף של הנוער
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                כל עבודה שאתם מפרסמים עוזרת לנוער לממן את <strong>חג המחזור</strong> ואת <strong>מסע סיום י״ב</strong> בעבודה עצמית וערכית!
              </p>
            </div>
          </div>

          {/* Types of Jobs Grid */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider text-right">
              איזה עבודות אפשר לפרסם בלוח?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-bold text-slate-800">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="text-lg">👶</span>
                <span>בייביסיטר ושמרטפות</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="text-lg">🐕</span>
                <span>דוגיסיטר וטיול כלבים</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="text-lg">🍽️</span>
                <span>שטיפת כלים וסדר</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="text-lg">🌿</span>
                <span>עישוב וסידור גינה</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="text-lg">📦</span>
                <span>סחיבה, פריקה והובלה</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="text-lg">🧹</span>
                <span>ניקיון ועזרה כללית</span>
              </div>
            </div>
          </div>

          {/* Simple Steps */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider text-right">
              איך מפרסמים עבודה? ב-3 צעדים קלים:
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-slate-800">
                  <strong>נכנסים לאפליקציה:</strong> הרשמה פשוטה ומהירה עם שם ומספר טלפון בלבד.
                </span>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-slate-800">
                  <strong>מפרסמים מודעה:</strong> בוחרים תחום עבודה, תאריך, שעה ותשלום מוצע.
                </span>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-slate-800">
                  <strong>עובדים נרשמים:</strong> הנוער רואה את העבודה ונרשם אליה ישירות – יוצרים קשר בוואטסאפ או בטלפון וסוגרים!
                </span>
              </div>
            </div>
          </div>

          {/* Link box */}
          <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-center">
            <span className="text-xs text-slate-600 block mb-1">
              כתובת האפליקציה בקיבוץ:
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono select-all">
              {appUrl}
            </span>
          </div>
        </div>

        {/* Footer Actions (Hidden on print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebd5d] text-white rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>שתף בוואטסאפ</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">הועתק ללוח!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>העתק נוסח מלא</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            סגור
          </button>
        </div>

      </div>
    </div>
  );
};
