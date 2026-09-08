import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Eye, 
  Sparkles,
  Download,
  Copy,
  Check,
  Edit3,
  Save,
  Link as LinkIcon
} from 'lucide-react';
import { Job } from '../types';
import { 
  connectGoogleAccount, 
  getCachedAccessToken, 
  getSavedSpreadsheetInfo, 
  setCustomSpreadsheetUrl,
  exportAllJobsToSheet,
  downloadJobsCsvFile
} from '../lib/googleSheetsService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allJobs: Job[];
  onSyncComplete?: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  allJobs,
  onSyncComplete,
}) => {
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setCopied(false);
      setIsEditingUrl(false);
      setDownloadSuccess(false);
      loadSheetInfo();
    }
  }, [isOpen]);

  const loadSheetInfo = async () => {
    const info = await getSavedSpreadsheetInfo();
    if (info.spreadsheetId) {
      setSheetId(info.spreadsheetId);
      const url = info.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${info.spreadsheetId}/edit`;
      setSheetUrl(url);
      setCustomUrlInput(url);
    }
    const lastSync = localStorage.getItem('three_four_last_sheets_sync');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync).toLocaleString('he-IL'));
    }
  };

  const handleCopyUrl = async () => {
    if (!sheetUrl) return;
    try {
      await navigator.clipboard.writeText(sheetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback prompt for clipboard copy
      window.prompt('העתק את כתובת ה-Google Sheet:', sheetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveCustomUrl = async () => {
    if (!customUrlInput.trim()) {
      setErrorMsg('אנא הזן קישור או מזהה של קובץ Google Sheet');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const saved = await setCustomSpreadsheetUrl(customUrlInput);
      setSheetId(saved.spreadsheetId);
      setSheetUrl(saved.spreadsheetUrl);
      setIsEditingUrl(false);
      setSuccessMsg('כתובת ה-Google Sheet נשמרה בהצלחה!');
    } catch (err: any) {
      setErrorMsg(err?.message || 'שגיאה בשמירת כתובת הגיליון');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadJobsCsvFile(allJobs, `יומן_עבודות_שלוש_ארבע_${timestamp}.csv`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg('שגיאה בהורדת הקובץ: ' + (err?.message || 'אנא נסה שנית'));
    }
  };

  const handleSyncNow = async () => {
    const confirmed = window.confirm(
      `האם לסנכרן כעת ${allJobs.length} עבודות ממאגר שלוש-ארבע לקובץ Google Sheets?`
    );
    if (!confirmed) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setStatusMsg('מתחבר ל-Google...');

    try {
      let token = getCachedAccessToken();
      if (!token) {
        setStatusMsg('מבקש אישור גישה מ-Google...');
        const authRes = await connectGoogleAccount();
        token = authRes.accessToken;
      }

      setStatusMsg('מסנכרן את מאגר הנתונים...');
      const result = await exportAllJobsToSheet(allJobs, token, (msg) => setStatusMsg(msg));
      
      setSheetId(result.spreadsheetId);
      setSheetUrl(result.spreadsheetUrl);
      setCustomUrlInput(result.spreadsheetUrl);
      setLastSyncTime(new Date().toLocaleString('he-IL'));
      setSuccessMsg(`המאגר סונכרן בהצלחה (${result.syncedCount} עבודות מעודכנות בגיליון)!`);
      
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      console.error('Sync to Sheets failed:', err);
      setErrorMsg(err.message || 'אירעה שגיאה בסנכרון ל-Google Sheets');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        id="modal-google-sheets"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-right font-['Assistant',sans-serif] max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-cyan-900 text-white p-6 relative shrink-0">
          <button 
            id="btn-close-sheets-modal"
            onClick={onClose}
            className="absolute top-5 left-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-['Rubik',sans-serif] font-bold text-xl text-white">
                יומן וגיבוי Google Sheets ו-Excel
              </h3>
              <p className="text-xs text-teal-100 mt-0.5">
                שלוש - ארבע • קבלת קישור ישיר, הורדת קובץ וסנכרון נתונים
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Quick Stats Banner */}
          <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <div>
                <span className="text-xs font-bold text-teal-950 block">סך מודעות במאגר:</span>
                <span className="text-sm font-extrabold text-teal-900 font-['Rubik',sans-serif]">{allJobs.length} עבודות</span>
              </div>
            </div>
            {lastSyncTime && (
              <div className="text-left">
                <span className="text-[11px] text-slate-500 block">סנכרון אחרון:</span>
                <span className="text-xs font-mono text-slate-700">{lastSyncTime}</span>
              </div>
            )}
          </div>

          {/* Direct File Download Card (Immediate Offline / 1-Click CSV/Excel) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/30 border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-['Rubik',sans-serif]">
                  <Download className="w-4 h-4 text-teal-600" />
                  <span>הורדה מיידית של מאגר העבודות (CSV / Excel)</span>
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  הורד את כל {allJobs.length} העבודות בלחיצה אחת לקובץ טבלה מותאם עברית, מוכן לפתיחה ב-Excel או לייבוא ישיר ל-Google Sheets.
                </p>
              </div>
            </div>

            <button
              id="btn-download-jobs-csv"
              onClick={handleDownloadCsv}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>הקובץ ירד בהצלחה למחשב!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>הורד קובץ יומן עבודות (CSV) עכשיו</span>
                </>
              )}
            </button>
          </div>

          {/* Google Sheet URL & Direct Link Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-['Rubik',sans-serif]">
                <LinkIcon className="w-4 h-4 text-teal-600" />
                <span>קישור ישיר ל-Google Sheet:</span>
              </span>
              <button
                id="btn-toggle-edit-sheet-url"
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingUrl ? 'ביטול עריכה' : 'הזן / שנה קישור קיים'}</span>
              </button>
            </div>

            {isEditingUrl ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="הדבק כאן קישור ל-Google Sheet (למשל https://docs.google.com/spreadsheets/d/...)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-teal-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono text-left"
                  dir="ltr"
                />
                <button
                  id="btn-save-custom-sheet-url"
                  onClick={handleSaveCustomUrl}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors w-full cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>שמור כתובת גיליון</span>
                </button>
              </div>
            ) : sheetUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5">
                  <input
                    type="text"
                    readOnly
                    value={sheetUrl}
                    className="flex-1 bg-transparent text-[11px] font-mono text-slate-700 px-2 outline-hidden select-all text-left"
                    dir="ltr"
                  />
                  <button
                    id="btn-copy-sheet-url"
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors shrink-0"
                    title="העתק קישור ללוח"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">הועתק!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-teal-600" />
                        <span>העתק</span>
                      </>
                    )}
                  </button>
                </div>

                <a
                  id="btn-open-google-sheet-tab"
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>פתח את קובץ ה-Google Sheet בטאב חדש</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80 mr-auto" />
                </a>
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
                <p>עדיין לא הוגדר קישור לקובץ Google Sheet.</p>
                <p className="text-[11px] text-slate-400">
                  ניתן להדביק קישור קיים באמצעות "הזן / שנה קישור קיים" למעלה, או ליצור ולסנכרן גיליון חדש בכפתור מטה.
                </p>
              </div>
            )}
          </div>

          {/* Feedback messages */}
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

          {/* Loading status */}
          {loading && (
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
              <span>{statusMsg || 'מעבד פעולה מול Google Sheets...'}</span>
            </div>
          )}

          {/* Sync CTA */}
          <div className="pt-1">
            <button
              id="btn-sync-google-sheet-now"
              onClick={handleSyncNow}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 font-bold text-xs sm:text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-teal-700 ${loading ? 'animate-spin' : ''}`} />
              <span>{sheetUrl ? 'סנכרן את כל העבודות כעת מול Google Sheets' : 'צור וסנכרן גיליון Google Sheets חדש'}</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>סנכרון וגיבוי ישירות מ-Firebase</span>
          </span>
          <button
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            סגור
          </button>
        </div>

      </div>
    </div>
  );
};

