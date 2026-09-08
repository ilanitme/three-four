import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Check, 
  X, 
  ShieldCheck, 
  FileText,
  Table
} from 'lucide-react';
import { Job } from '../types';
import { downloadJobsCsvFile } from '../lib/googleSheetsService';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allJobs: Job[];
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  allJobs,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloading(true);
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadJobsCsvFile(allJobs, `יומן_עבודות_שלוש_ארבע_${timestamp}.csv`);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        id="modal-csv-export"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-right font-['Assistant',sans-serif] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-cyan-900 text-white p-5 sm:p-6 relative shrink-0">
          <button 
            id="btn-close-csv-modal"
            onClick={onClose}
            aria-label="סגור"
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-emerald-300 shadow-xs">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-['Rubik',sans-serif] font-bold text-lg sm:text-xl text-white">
                הורדת יומן עבודות (קובץ CSV / Excel)
              </h3>
              <p className="text-xs text-teal-100 mt-0.5">
                שלוש - ארבע • ייצוא נתונים מיידי ללא צורך בהרשאות גוגל
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Info Card */}
          <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <div>
                <span className="text-xs font-bold text-teal-950 block">סה״כ עבודות לייצוא:</span>
                <span className="text-sm font-extrabold text-teal-900 font-['Rubik',sans-serif]">
                  {allJobs.length} עבודות במאגר
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-100/90 px-2.5 py-1 rounded-full border border-teal-200">
              Excel / Sheets מוכן ✓
            </span>
          </div>

          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
            <p>
              הקובץ כולל את <strong>כל פרטי העבודות</strong>: כותרת, תאריך פרסום, סוג עבודה, שכונה בקיבוץ, שכר מוצע, שמות ומספרי טלפון של בני הנוער שנרשמו, וסטטוס העבודה.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
              <Table className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                הקובץ מיוצר עם קידוד עברית מלא (UTF-8 BOM), ונפתח באופן מיידי ב-Excel, Numbers במק, או ע״י פתיחה/גרירה ל-Google Drive ו-Google Sheets.
              </span>
            </div>
          </div>

          {/* Download Action Button */}
          <div className="pt-2">
            <button
              id="btn-download-csv-action"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-700 hover:from-emerald-700 hover:to-cyan-800 text-white font-black text-sm shadow-md shadow-teal-800/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-5 h-5 text-emerald-300" />
                  <span>הקובץ ירד בהצלחה! (בדוק את תיקיית ההורדות)</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>הורד את כל העבודות לקובץ טבלה (CSV) עכשיו</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>הורדה ישירה ומאובטחת למכשיר</span>
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
