import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageCircle, 
  Sparkles, 
  MapPin, 
  Coins,
  CheckCircle2
} from 'lucide-react';
import { Job } from '../types';
import { generateWhatsAppShareText, getWhatsAppShareUrl, formatPayment } from '../lib/utils';
import { getGreenApiConfig } from '../lib/greenApiService';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isBotEnabled, setIsBotEnabled] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (isOpen) {
      getGreenApiConfig().then((cfg) => {
        if (cfg.isEnabled && cfg.idInstance && cfg.apiTokenInstance && cfg.chatId) {
          setIsBotEnabled(true);
          setGroupName(cfg.groupName || 'קבוצת הנוער');
        } else {
          setIsBotEnabled(false);
        }
      }).catch(() => setIsBotEnabled(false));
    }
  }, [isOpen]);

  if (!isOpen || !job) return null;

  const appUrl = window.location.origin;
  const deepLink = `${appUrl}/?jobId=${job.id}`;
  const shareText = generateWhatsAppShareText(job);
  const shareUrl = getWhatsAppShareUrl(job);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-right"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          id="btn-close-share-modal"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="bg-gradient-to-l from-emerald-600 via-teal-600 to-blue-600 p-6 sm:p-7 text-white">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur flex items-center justify-center text-2xl font-bold">
              💬
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black heading-font">
                שיתוף עבודה בקיבוץ
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
                {isBotEnabled ? `הודעה נשלחת לקבוצת הוואטסאפ של הקיבוץ` : `הפץ את המודעה בקבוצות הקיבוץ בלחיצה`}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {/* Bot status banner */}
          {isBotEnabled && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold">נשלח אוטומטית ל-WhatsApp! 🤖</div>
                <div className="text-emerald-700 text-[11px]">
                  הבוט פרסם את המודעה ברגע זה ל<strong>{groupName}</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Job summary pill */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-base font-bold text-slate-900 mb-1">{job.title}</div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                {formatPayment(job.payment)}
              </span>
              <span className="flex items-center gap-1 text-slate-500 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {job.location}
              </span>
            </div>
          </div>

          {/* Message Preview Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              נוסח ההודעה שנשלח:
            </label>
            <div className="relative p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-xs font-mono leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto font-medium">
              {shareText}
            </div>
          </div>

          {/* Secondary / Extra Action: Open WhatsApp */}
          <a
            id="btn-open-whatsapp-share"
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa4f] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 group"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>רוצה לשתף ידנית גם לאיש קשר או קבוצה נוספת? לחץ כאן</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-100 group-hover:translate-x-[-2px] transition-transform" />
          </a>

          {/* Quick Copy Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="btn-copy-direct-link"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">הקישור הועתק!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>העתק קישור ישיר</span>
                </>
              )}
            </button>

            <button
              id="btn-copy-full-text"
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">ההודעה הועתקה!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>העתק את כל הטקסט</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-1">
            <button
              id="btn-done-share-modal"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              סגור וסיים
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
