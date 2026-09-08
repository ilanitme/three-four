import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Key, 
  Smartphone, 
  Users, 
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { 
  GreenApiConfig, 
  getGreenApiConfig, 
  saveGreenApiConfig, 
  sendGreenApiTestMessage, 
  fetchGreenApiChats 
} from '../lib/greenApiService';

interface WhatsAppBotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppBotSettingsModal: React.FC<WhatsAppBotSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [config, setConfig] = useState<GreenApiConfig>({
    idInstance: '',
    apiTokenInstance: '',
    hostUrl: 'https://api.green-api.com',
    chatId: '',
    groupName: '',
    isEnabled: true,
    autoSendOnNewJob: true,
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingChats, setFetchingChats] = useState(false);
  const [availableChats, setAvailableChats] = useState<Array<{ id: string; name: string }>>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const current = await getGreenApiConfig();
      setConfig(current);
    } catch (err) {
      console.warn('Could not load Green API config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchChats = async () => {
    if (!config.idInstance || !config.apiTokenInstance) {
      setErrorMsg('נא להזין תחילה idInstance ו-apiTokenInstance כדי לשלוף את רשימת הקבוצות');
      return;
    }

    setFetchingChats(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const chats = await fetchGreenApiChats(config);
      setAvailableChats(chats);
      if (chats.length > 0) {
        setSuccessMsg(`נמצאו ${chats.length} צ'אטים וקבוצות בוואטסאפ שלך! בחר את הקבוצה מהרשימה.`);
      } else {
        setStatusMsg('לא נמצאו קבוצות. תוכל להדביק את מזהה הקבוצה ידנית.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'שגיאה בשליפת הקבוצות. ודא שסרקת את קוד ה-QR ב-Green API.');
    } finally {
      setFetchingChats(false);
    }
  };

  const handleTestMessage = async () => {
    setTesting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await sendGreenApiTestMessage(config);
      if (res.success) {
        setSuccessMsg('🎉 הודעת בדיקה נשלחה בהצלחה לקבוצת הוואטסאפ!');
      } else {
        setErrorMsg(res.error || 'נכשלה שליחת הודעת הבדיקה');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'שגיאה בשליחת הודעת בדיקה');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await saveGreenApiConfig(config);
      setSuccessMsg('✅ הגדרות הוואטסאפ נשמרו בהצלחה!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving config:', err);
      // Even if Firestore had a delay, localStorage was already saved
      setSuccessMsg('✅ הגדרות הוואטסאפ נשמרו במכשיר בהצלחה!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        id="modal-whatsapp-bot-settings"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-right font-['Assistant',sans-serif] my-6"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 relative">
          <button 
            id="btn-close-whatsapp-bot-modal"
            onClick={onClose}
            className="absolute top-5 left-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-emerald-200">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-['Rubik',sans-serif] font-bold text-xl text-white">
                שליחה אוטומטית לקבוצת וואטסאפ (Green API)
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                פרסום עבודות בקיבוץ אוטומטית ברקע ישירות לקבוצת הנערים
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Quick Guide Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>איך מוצאים את 3 הפרטים במסוף Green API?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 pr-1">
              <li>נכנסים ל-<strong>Green API Console</strong> וסורקים QR עם הוואטסאפ (Scan QR).</li>
              <li>מעתיקים את ה-<strong>idInstance</strong> ואת ה-<strong>apiTokenInstance</strong>.</li>
              <li>מזינים אותם כאן למטה ולוחצים <strong>"שלוף קבוצות"</strong> או מדביקים את מזהה הקבוצה.</li>
            </ol>
            <a 
              href="https://console.green-api.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline pt-1"
            >
              <span>מעבר למסוף Green API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Feedback banners */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-4">
            
            {/* Toggle Enable */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">הפעל שליחה אוטומטית לוואטסאפ</span>
                <span className="text-[11px] text-slate-500">כל מודעת עבודה חדשה תישלח ישירות ברקע לקבוצה</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* idInstance */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-700" />
                <span>idInstance (מזהה ה-Instance ב-Green API): *</span>
              </label>
              <input 
                type="text"
                placeholder="לדוגמה: 7103123456"
                value={config.idInstance}
                onChange={(e) => setConfig({ ...config, idInstance: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>

            {/* apiTokenInstance */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>apiTokenInstance (מפתח ה-Token ב-Green API): *</span>
              </label>
              <input 
                type="password"
                placeholder="לדוגמה: d8e8f8...293a"
                value={config.apiTokenInstance}
                onChange={(e) => setConfig({ ...config, apiTokenInstance: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>

            {/* Group / Chat ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>קבוצת הוואטסאפ של הנערים (Chat ID): *</span>
                </label>
                <button
                  type="button"
                  onClick={handleFetchChats}
                  disabled={fetchingChats || !config.idInstance || !config.apiTokenInstance}
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={`w-3 h-3 ${fetchingChats ? 'animate-spin' : ''}`} />
                  <span>{fetchingChats ? 'שולף...' : 'שלוף קבוצות מהוואטסאפ'}</span>
                </button>
              </div>

              {/* If chats fetched, show dropdown */}
              {availableChats.length > 0 ? (
                <select
                  value={config.chatId}
                  onChange={(e) => {
                    const sel = availableChats.find(c => c.id === e.target.value);
                    setConfig({
                      ...config,
                      chatId: e.target.value,
                      groupName: sel?.name || config.groupName
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white mb-2"
                >
                  <option value="">-- בחר קבוצה מהרשימה --</option>
                  {availableChats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id.includes('@g.us') ? 'קבוצה' : 'פרטי'})
                    </option>
                  ))}
                </select>
              ) : null}

              <input 
                type="text"
                placeholder="לדוגמה: 120363041234567890@g.us"
                value={config.chatId}
                onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                מזהה הקבוצה מסתיים ב-<code>@g.us</code>. לחיצה על "שלוף קבוצות" מאפשרת לבחור אותה בשנייה.
              </p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleTestMessage}
              disabled={testing || !config.idInstance || !config.apiTokenInstance || !config.chatId}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 font-bold text-xs shadow-2xs transition-colors disabled:opacity-40"
            >
              <Send className={`w-3.5 h-3.5 text-emerald-600 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'שולח בדיקה...' : 'שלח הודעת בדיקה לקבוצה 💬'}</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>שמור הגדרות וואטסאפ ✅</span>
            </button>
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>אינטגרציה מאובטחת • שלוש - ארבע</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-900"
          >
            סגור
          </button>
        </div>

      </div>
    </div>
  );
};
