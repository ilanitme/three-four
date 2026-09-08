import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  Phone, 
  Copy, 
  Check, 
  Sparkles, 
  User, 
  MapPin, 
  Coins, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Job, UserProfile } from '../types';
import { 
  generateClaimWhatsAppMessage, 
  getClaimWhatsAppUrl, 
  cleanPhoneForWhatsApp, 
  formatPayment 
} from '../lib/utils';

interface ClaimSuccessWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  worker: UserProfile | null;
}

export const ClaimSuccessWhatsAppModal: React.FC<ClaimSuccessWhatsAppModalProps> = ({
  isOpen,
  onClose,
  job,
  worker,
}) => {
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (job && worker && isOpen) {
      const generated = generateClaimWhatsAppMessage(job, worker);
      setMessageText(generated);
      setCopied(false);
    }
  }, [job, worker, isOpen]);

  if (!isOpen || !job || !worker) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  const cleanPhone = cleanPhoneForWhatsApp(job.creatorPhone || '');
  const waDirectUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  const handleSendWhatsApp = () => {
    window.open(waDirectUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="btn-close-claim-whatsapp-modal"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10"
          title="סגור חלון"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="bg-gradient-to-l from-emerald-600 via-teal-600 to-cyan-700 p-5 sm:p-6 text-white">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur flex items-center justify-center text-2xl font-bold shrink-0 shadow-inner">
              🎉
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/30 text-emerald-100 border border-emerald-300/40 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>העבודה נלקחה בהצלחה!</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black heading-font text-white leading-tight">
                שליחת הודעת וואטסאפ למפרסם
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                מומלץ לשלוח הודעה ל-<strong>{job.creatorName || 'מפרסם העבודה'}</strong> כדי לעדכן שלקחת את העבודה ולתאם הגעה
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Recipient & Job Summary Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">נשלח אל מפרסם/ת העבודה:</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900">{job.creatorName}</span>
                </div>
              </div>

              <div className="text-left">
                <span className="text-[11px] text-slate-400 block">מספר טלפון:</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-slate-800" dir="ltr">
                  {job.creatorPhone}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700 truncate max-w-[220px]">
                📌 {job.title}
              </span>
              <span className="text-teal-700 font-black bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                {formatPayment(job.payment)}
              </span>
            </div>
          </div>

          {/* Editable Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>נוסח ההודעה (באפשרותך לערוך לפני השליחה):</span>
              </label>

              <button
                id="btn-copy-claim-whatsapp-text"
                onClick={handleCopy}
                className="text-[11px] font-bold text-slate-600 hover:text-teal-700 flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">הועתק!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>העתק טקסט</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              id="claim-whatsapp-message-textarea"
              rows={7}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3 rounded-2xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden leading-relaxed resize-none font-sans"
              placeholder="נוסח ההודעה לוואטסאפ..."
            />
            <p className="text-[11px] text-slate-400">
              ההודעה כוללת את שמך, מספר הטלפון שלך ופרטי העבודה כדי שתוכלו לתאם ישירות.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-2.5">
            
            {/* Direct WhatsApp Action Button (Not Green API) */}
            <a
              id="btn-send-claim-whatsapp"
              href={waDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSendWhatsApp}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa4f] text-white font-black text-sm sm:text-base shadow-md shadow-[#25D366]/30 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>פתח וואטסאפ ושלח הודעה ל-{job.creatorName || 'מפרסם'}</span>
              <ExternalLink className="w-4 h-4 text-white/80" />
            </a>

            {/* Direct Phone Call Alternative */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                id="btn-call-creator-from-claim-modal"
                href={`tel:${job.creatorPhone}`}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>חייג למפרסם: {job.creatorPhone}</span>
              </a>

              <button
                id="btn-dismiss-claim-whatsapp-modal"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs border border-slate-200 flex items-center justify-center transition-colors"
              >
                סגור (אשלח מאוחר יותר)
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
