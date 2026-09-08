import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  User, 
  Phone, 
  PlusCircle, 
  Layers,
  Sparkles,
  RotateCcw,
  MessageCircle,
  Share2,
  Star,
  ShieldCheck,
  FileSpreadsheet,
  MessageSquare,
  ExternalLink,
  Settings,
  ArrowRightLeft,
  Users,
  Download,
  Copy,
  Check,
  Link as LinkIcon
} from 'lucide-react';
import { Job, UserProfile, DashboardSubTab, FeedbackReview } from '../types';
import { JobCard } from './JobCard';
import { fetchUserReviews, isUserAdmin, updateUserProfile } from '../lib/firebase';
import { formatHebrewDate } from '../lib/utils';
import { downloadJobsCsvFile, getSavedSpreadsheetInfo } from '../lib/googleSheetsService';

interface DashboardViewProps {
  user: UserProfile;
  postedJobs: Job[];
  claimedJobs: Job[];
  allJobs?: Job[];
  onOpenPostJob: () => void;
  onOpenShare: (job: Job) => void;
  onOpenDetails: (job: Job) => void;
  onEditJob: (job: Job) => void;
  onOpenGoogleSheets?: () => void;
  onOpenGoogleSheetsFile?: () => void;
  onOpenWhatsAppBot?: () => void;
  onRefreshUser?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  postedJobs,
  claimedJobs,
  allJobs = [],
  onOpenPostJob,
  onOpenShare,
  onOpenDetails,
  onEditJob,
  onOpenGoogleSheets,
  onOpenGoogleSheetsFile,
  onOpenWhatsAppBot,
  onRefreshUser,
}) => {
  const isAdmin = isUserAdmin(user);
  const isJobSeeker = user.isLookingForJob === true && !isAdmin;
  const isEmployer = !user.isLookingForJob && !isAdmin;
  const canPublish = !isJobSeeker || isAdmin;

  const [subTab, setSubTab] = useState<DashboardSubTab>(isJobSeeker ? 'claimed' : 'posted');
  const [reviews, setReviews] = useState<FeedbackReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      getSavedSpreadsheetInfo().then((info) => {
        if (info.spreadsheetUrl) {
          setSheetUrl(info.spreadsheetUrl);
        } else if (info.spreadsheetId) {
          setSheetUrl(`https://docs.google.com/spreadsheets/d/${info.spreadsheetId}/edit`);
        }
      });
    }
  }, [isAdmin]);

  const handleDownloadAllJobsCsv = () => {
    try {
      const jobsToExport = allJobs.length > 0 ? allJobs : [...postedJobs, ...claimedJobs];
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadJobsCsvFile(jobsToExport, `יומן_עבודות_שלוש_ארבע_${timestamp}.csv`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleCopySheetUrl = async () => {
    if (!sheetUrl) return;
    try {
      await navigator.clipboard.writeText(sheetUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      window.prompt('העתק כתובת Google Sheet:', sheetUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      setLoadingReviews(true);
      fetchUserReviews(user.uid)
        .then(setReviews)
        .catch(console.error)
        .finally(() => setLoadingReviews(false));
    }
  }, [user?.uid, subTab]);

  const handleToggleRole = async () => {
    if (!user) return;
    setSwitchingRole(true);
    try {
      await updateUserProfile(user.uid, {
        isLookingForJob: !user.isLookingForJob
      });
      if (onRefreshUser) {
        onRefreshUser();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error switching role:', err);
    } finally {
      setSwitchingRole(false);
    }
  };

  const activePostedCount = postedJobs.filter(j => j.status === 'new' || j.status === 'in_progress').length;
  const activeClaimedCount = claimedJobs.filter(j => j.status === 'in_progress').length;
  const completedCount = [...postedJobs, ...claimedJobs].filter(j => j.status === 'completed').length;

  const avgRating = user.ratingAverage || 5.0;
  const ratingCount = user.ratingCount || reviews.length;

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* User Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 to-teal-600 text-white font-black text-xl flex items-center justify-center border-2 border-white shadow-md font-['Rubik',sans-serif]">
              {user.fullName.slice(0, 2) || 'יש'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-slate-900 heading-font">
                  {user.fullName}
                </h2>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                    <span>👑 מנהל מערכת (ADMIN)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>מאומת SMS</span>
                  </span>
                )}
                {user.isLookingForJob ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                    <span>🙋‍♂️ מחפש/ת עבודה</span>
                    {user.youthGroup && (
                      <span className="font-extrabold text-teal-950">
                        • {user.youthGroup}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    <span>🏢 מפרסם/ת עבודות</span>
                  </span>
                )}

                {/* Quick Role Switcher */}
                {!isAdmin && (
                  <button
                    id="btn-toggle-user-role"
                    onClick={handleToggleRole}
                    disabled={switchingRole}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-300 transition-colors shadow-2xs"
                    title="שנה מצב חשבון בין מחפש עבודה למפרסם עבודות"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-teal-600" />
                    <span>{user.isLookingForJob ? 'החלף למפרסם עבודות' : 'החלף למחפש עבודה'}</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1">
                <span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded-lg text-slate-700 font-bold">
                  {user.phoneNumber}
                </span>
                <span>•</span>
                <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{avgRating.toFixed(1)} ({ratingCount} דירוגים)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* WhatsApp Bot Setting - ONLY FOR ADMIN */}
            {isAdmin && onOpenWhatsAppBot && (
              <button
                id="btn-dashboard-whatsapp-bot"
                onClick={onOpenWhatsAppBot}
                className="px-3.5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs sm:text-sm font-bold rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2"
                title="הגדרות בוט וואטסאפ (מנהל מערכת)"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>בוט וואטסאפ</span>
              </button>
            )}

            {/* Google Sheets Live Backup - ONLY FOR ADMIN */}
            {isAdmin && (
              <div className="flex items-center bg-teal-50 border border-teal-200 rounded-2xl overflow-hidden shadow-xs">
                <button
                  id="btn-dashboard-google-sheets"
                  onClick={onOpenGoogleSheets}
                  className="px-3.5 py-3 hover:bg-teal-100 text-teal-950 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  title="יומן וקישור Google Sheet (מנהל מערכת)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span>Google Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                </button>
                {onOpenGoogleSheets && (
                  <button
                    id="btn-dashboard-google-sheets-settings"
                    onClick={onOpenGoogleSheets}
                    className="p-3 text-teal-700 hover:bg-teal-100 border-r border-teal-200 transition-colors"
                    title="הגדרות וקישור Google Sheets"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Quick 1-Click CSV Download - ONLY FOR ADMIN */}
            {isAdmin && (
              <button
                id="btn-dashboard-download-csv"
                onClick={handleDownloadAllJobsCsv}
                className="px-3.5 py-3 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs sm:text-sm font-bold rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="הורדת יומן עבודות מלא (קובץ CSV / Excel)"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-800">הורד!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-teal-600" />
                    <span>הורד CSV</span>
                  </>
                )}
              </button>
            )}

            {/* Only employers and admins can publish new jobs */}
            {canPublish && (
              <button
                id="btn-dashboard-post-job"
                onClick={onOpenPostJob}
                className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>פרסם עבודה בקיבוץ +</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 text-center">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-1">
              עבודות שפרסמתי
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {postedJobs.length}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-1">
              עבודות שלקחתי
            </span>
            <span className="text-xl sm:text-2xl font-black text-teal-700">
              {claimedJobs.length}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-1">
              דירוג קהילתי
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
              <Star className="w-5 h-5 fill-amber-500" />
              <span>{avgRating.toFixed(1)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Admin Google Sheets & Data Export Management Bar */}
      {isAdmin && (
        <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-cyan-900 text-white rounded-3xl p-5 shadow-lg space-y-3 font-['Assistant',sans-serif]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-['Rubik',sans-serif] font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <span>יומן עבודות וגיבוי Google Sheets</span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-sans">
                    ניהול מנהל
                  </span>
                </h3>
                <p className="text-xs text-teal-100/90">
                  קבלת קישור ישיר, הורדה מהירה ב-CSV/Excel וסנכרון מלא
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-admin-bar-download-csv"
                onClick={handleDownloadAllJobsCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>קובץ CSV הורד בהצלחה!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-emerald-300" />
                    <span>הורד קובץ גיליון (CSV)</span>
                  </>
                )}
              </button>

              {onOpenGoogleSheets && (
                <button
                  id="btn-admin-bar-open-sheets-modal"
                  onClick={onOpenGoogleSheets}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>ניהול וסנכרון</span>
                </button>
              )}
            </div>
          </div>

          {/* Direct URL Bar */}
          {sheetUrl ? (
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-xs rounded-2xl p-2 border border-white/10">
              <LinkIcon className="w-4 h-4 text-teal-300 shrink-0 mr-1" />
              <input
                type="text"
                readOnly
                value={sheetUrl}
                className="flex-1 bg-transparent text-xs text-teal-50 font-mono outline-hidden select-all text-left"
                dir="ltr"
              />
              <button
                id="btn-admin-bar-copy-url"
                onClick={handleCopySheetUrl}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>הועתק!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-teal-200" />
                    <span>העתק קישור</span>
                  </>
                )}
              </button>
              <a
                id="btn-admin-bar-open-url"
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-teal-950 text-xs font-extrabold transition-colors shrink-0"
              >
                <span>פתח גיליון</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-teal-100 bg-black/20 rounded-2xl p-3 border border-white/10">
              <span>עדיין לא הוגדר קישור ל-Google Sheet</span>
              {onOpenGoogleSheets && (
                <button
                  onClick={onOpenGoogleSheets}
                  className="text-xs font-bold text-emerald-300 hover:underline cursor-pointer"
                >
                  הגדר קישור או סנכרן כעת
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Tabs Selection */}
      <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200">
        <button
          id="btn-subtab-posted"
          onClick={() => setSubTab('posted')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'posted'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>עבודות שפרסמתי ({postedJobs.length})</span>
          {activePostedCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              subTab === 'posted' ? 'bg-white text-blue-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {activePostedCount}
            </span>
          )}
        </button>

        <button
          id="btn-subtab-claimed"
          onClick={() => setSubTab('claimed')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'claimed'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>עבודות שלקחתי ({claimedJobs.length})</span>
          {activeClaimedCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              subTab === 'claimed' ? 'bg-white text-blue-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {activeClaimedCount}
            </span>
          )}
        </button>

        <button
          id="btn-subtab-reviews"
          onClick={() => setSubTab('reviews')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'reviews'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>חוות דעת ודירוגים ({reviews.length})</span>
        </button>
      </div>

      {/* Subtab 1: Jobs I Posted */}
      {subTab === 'posted' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-slate-800">
              מודעות העבודה שיצרת
            </h3>
            <span className="text-xs text-slate-400">
              כאשר עובד לוקח את העבודה, פרטי הקשר שלו יופיעו כאן מיידית
            </span>
          </div>

          {postedJobs.length > 0 ? (
            <div className="space-y-3.5">
              {postedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  currentUser={user}
                  onOpenAuth={() => {}}
                  onOpenShare={onOpenShare}
                  onOpenDetails={onOpenDetails}
                  onEditJob={onEditJob}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                📤
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">
                טרם פרסמת מודעות עבודה
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-sm mx-auto">
                צריך עזרה בהובלה, הרכבה, ניקיון או שליחות? פרסם מודעה עכשיו ותקבל מענה מהיר מהקהילה
              </p>
              <button
                onClick={onOpenPostJob}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-blue-200 transition-colors inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>פרסם עבודה חדשה</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Jobs I Claimed */}
      {subTab === 'claimed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-slate-800">
              עבודות שלקחת לביצוע
            </h3>
            <span className="text-xs text-slate-400">
              צור קשר עם המזמין לתיאום, וסמן כהושלם בסיום
            </span>
          </div>

          {claimedJobs.length > 0 ? (
            <div className="space-y-3.5">
              {claimedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  currentUser={user}
                  onOpenAuth={() => {}}
                  onOpenShare={onOpenShare}
                  onOpenDetails={onOpenDetails}
                  onEditJob={onEditJob}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                💼
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">
                טרם לקחת עבודות
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                עבור לעמוד העבודות הפנויות וקח עבודה שמתאימה לך בלחיצה אחת
              </p>
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Reviews & Ratings */}
      {subTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-slate-800">
              חוות דעת ודירוגים שקיבלת ({reviews.length})
            </h3>
            <span className="text-xs text-slate-400">
              דירוגים שניתנו לך על ידי מזמינים ועובדים לאחר סיום עבודות
            </span>
          </div>

          {loadingReviews ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs text-slate-500">טוען חוות דעת...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {rev.fromUserName}
                      </h4>
                      <span className="text-[11px] text-slate-400 block">
                        על העבודה &quot;{rev.jobTitle}&quot; • {rev.role === 'creator' ? 'מזמין העבודה' : 'העובד שביצע'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-black text-amber-900 mr-1">
                        {rev.rating}.0
                      </span>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                      &quot;{rev.comment}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                ⭐
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">
                טרם התקבלו חוות דעת
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                לאחר השלמת עבודות, המזמינים והעובדים יוכלו לדרג אותך ולהשאיר חוות דעת שתופיע כאן
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
