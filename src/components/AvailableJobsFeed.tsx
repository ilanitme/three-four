import React, { useState, useMemo } from 'react';
import { 
  Search, 
  PlusCircle, 
  X, 
  ArrowRightLeft, 
  PhoneCall, 
  Phone,
  FileText
} from 'lucide-react';
import { Job, UserProfile } from '../types';
import { JobCard } from './JobCard';
import { isUserAdmin, updateUserProfile } from '../lib/firebase';
import { PWAInstallButton } from './PWAInstallButton';
import { usePWAInstall, checkIsStandaloneApp } from '../hooks/usePWAInstall';

interface AvailableJobsFeedProps {
  jobs: Job[];
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenPostJob: () => void;
  onOpenShare: (job: Job) => void;
  onOpenDetails: (job: Job) => void;
  onEditJob: (job: Job) => void;
  onClaimSuccess?: (job: Job) => void;
  onOpenFlyer?: () => void;
}

export const AvailableJobsFeed: React.FC<AvailableJobsFeedProps> = ({
  jobs,
  currentUser,
  onOpenAuth,
  onOpenPostJob,
  onOpenShare,
  onOpenDetails,
  onEditJob,
  onClaimSuccess,
  onOpenFlyer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [switchingRole, setSwitchingRole] = useState(false);
  const { isInstalled } = usePWAInstall();
  const [isStandalone] = useState<boolean>(() => checkIsStandaloneApp());
  const [installBannerDismissed, setInstallBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('three_four_feed_install_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissInstallBanner = () => {
    try {
      localStorage.setItem('three_four_feed_install_dismissed', 'true');
    } catch {}
    setInstallBannerDismissed(true);
  };

  const isAdmin = isUserAdmin(currentUser);
  const isJobSeeker = currentUser?.isLookingForJob === true && !isAdmin;
  const isEmployer = currentUser && !currentUser.isLookingForJob && !isAdmin;
  const canPublish = !currentUser || (!isJobSeeker || isAdmin);

  const handleToggleRole = async () => {
    if (!currentUser) return;
    setSwitchingRole(true);
    try {
      await updateUserProfile(currentUser.uid, {
        isLookingForJob: !currentUser.isLookingForJob
      });
      window.location.reload();
    } catch (err) {
      console.error('Error toggling role:', err);
    } finally {
      setSwitchingRole(false);
    }
  };

  // Filter jobs by text search and always sort by newest
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // If user is Employer (Not looking for a job and not admin): only show their own jobs
      if (isEmployer) {
        if (job.creatorId !== currentUser?.uid) return false;
      } else {
        // Otherwise only show jobs that are new / available
        if (job.status !== 'new') return false;
      }

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const inTitle = job.title?.toLowerCase().includes(query);
        const inDetails = job.details?.toLowerCase().includes(query);
        const inLocation = job.location?.toLowerCase().includes(query);
        const inCategory = job.category?.toLowerCase().includes(query);
        const inContactName = job.contactName?.toLowerCase().includes(query);
        if (!inTitle && !inDetails && !inLocation && !inCategory && !inContactName) return false;
      }

      return true;
    }).sort((a, b) => {
      // Always sort by newest
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
  }, [jobs, searchTerm, isEmployer, currentUser?.uid]);

  const hasSearch = searchTerm.trim().length > 0;

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Employer Banner Notification if in Employer mode */}
      {isEmployer && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-xl shrink-0 font-bold">
              🏡
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-amber-950">
                מצב מפרסם עבודות (מעסיק בקיבוץ)
              </h3>
              <p className="text-xs text-amber-900/80">
                מוצגות רק העבודות שפרסמת. באפשרותך לערוך או להסיר אותן בכל עת.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleRole}
            disabled={switchingRole}
            className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
            <span>מעבר למצב מחפש עבודה</span>
          </button>
        </div>
      )}

      {/* Welcoming Kibbutz Bulletin Board Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-6 sm:p-8 shadow-md border border-emerald-700/50">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-extrabold text-emerald-200 mb-3 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>לוח עבודות ועזרה הדדית בקיבוץ 🌾</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black heading-font mb-2 leading-tight">
              {isEmployer
                ? 'ניהול העבודות שפרסמת בקיבוץ'
                : isJobSeeker
                ? `שלום ${currentUser?.fullName || ''}, מצא עבודה בקיבוץ!`
                : 'שלוש - ארבע ולעבודה!'}
            </h1>
            <p className="text-sm sm:text-base text-emerald-100 font-medium leading-relaxed mb-6">
              {isEmployer
                ? 'עקוב אחרי מי שנרשם לעבודות שלך, ערוך מודעות וסמן עבודות שהושלמו.'
                : 'בייביסיטר, גינון, ניקיון, טיול עם כלבים, עזרה בענפים וסיוע לחברים — בקלות ובשמחה.'}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {canPublish && (
                <button
                  id="btn-feed-post-job-hero"
                  onClick={onOpenPostJob}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PlusCircle className="w-5 h-5 text-slate-950" />
                  <span>פרסם עבודה חדשה בקיבוץ +</span>
                </button>
              )}

              {onOpenFlyer && (
                <button
                  id="btn-feed-open-flyer"
                  onClick={onOpenFlyer}
                  className="w-full sm:w-auto px-4 py-3.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
                  title="הצג פלייר הסבר לחברי הקיבוץ"
                >
                  <FileText className="w-4 h-4 text-emerald-300" />
                  <span>פלייר הסברה לחברים 📄</span>
                </button>
              )}
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 select-none shrink-0 text-center">
            <span className="text-4xl mb-2">🌾</span>
            <span className="text-lg font-black text-white font-['Rubik',sans-serif]">
              שלוש - ארבע
            </span>
            <span className="text-xs text-emerald-200 mt-0.5">
              עזרה הדדית בקהילה
            </span>
          </div>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Simple & Clean Search Bar */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="input-feed-search"
              type="text"
              placeholder="חיפוש חופשי (בייביסיטר, גינון, שכונה, שם מפרסם...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium placeholder:text-slate-400 text-slate-900"
            />
            {hasSearch && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 left-0 flex items-center pl-4 text-xs sm:text-sm text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                title="נקה חיפוש"
              >
                <X className="w-4 h-4 mr-1" />
                <span>נקה</span>
              </button>
            )}
          </div>
          {hasSearch && (
            <div className="mt-2.5 px-1 flex items-center justify-between text-xs text-slate-500">
              <span>תוצאות חיפוש עבור: <strong>&quot;{searchTerm}&quot;</strong> ({filteredJobs.length} נמצאו)</span>
              <button
                onClick={() => setSearchTerm('')}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                הצג את כל העבודות
              </button>
            </div>
          )}
        </div>

        {/* Job Cards List */}
        <div className="p-4 sm:p-6 space-y-4">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                currentUser={currentUser}
                onOpenAuth={onOpenAuth}
                onOpenShare={onOpenShare}
                onOpenDetails={onOpenDetails}
                onEditJob={onEditJob}
                onClaimSuccess={onClaimSuccess}
              />
            ))
          ) : (
            <div className="py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
                🌾
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 heading-font mb-1">
                {isEmployer
                  ? 'טרם פרסמת מודעות עבודה בקיבוץ'
                  : hasSearch
                  ? 'לא נמצאו עבודות התואמות לחיפוש'
                  : 'אין כרגע עבודות פנויות בלוח'}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                {isEmployer
                  ? 'פרסם מודעת עבודה ראשונה וקבל מענה מהיר מחברי ונוער הקיבוץ!'
                  : hasSearch
                  ? 'נסה לחפש מילה אחרת (למשל: בייביסיטר, גינון, כלבים)'
                  : 'היה הראשון שמפרסם בקשת עבודה בקיבוץ!'}
              </p>

              {hasSearch ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  נקה חיפוש והצג הכל
                </button>
              ) : canPublish ? (
                <button
                  onClick={onOpenPostJob}
                  className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-2xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>פרסם בקשת עבודה בקיבוץ</span>
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer Summary bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-600 text-xs sm:text-sm">
          <span className="font-semibold">
            {isEmployer
              ? `מוצגות ${filteredJobs.length} עבודות שפרסמת`
              : `מוצגות ${filteredJobs.length} עבודות (מסודר לפי החדשות ביותר)`}
          </span>
          {hasSearch && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-emerald-800 hover:text-emerald-950 font-bold transition-colors cursor-pointer"
            >
              הצג הכל
            </button>
          )}
        </div>

      </div>

      {/* Mobile PWA Install Box */}
      {!isStandalone && !isInstalled && !installBannerDismissed && (
        <div 
          id="main-pwa-install-banner"
          className="relative bg-emerald-800 text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right border border-emerald-700"
        >
          <button
            onClick={handleDismissInstallBanner}
            aria-label="סגור הודעה"
            className="absolute top-3 left-3 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="סגור הודעה"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 pl-6 sm:pl-0">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-amber-200 shrink-0">
              <img src="/apple-touch-icon.png" alt="שלוש-ארבע" className="w-9 h-9 rounded-xl object-cover" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-white font-['Rubik',sans-serif] flex items-center justify-center sm:justify-start gap-1.5">
                <span>השתמש ב״שלוש - ארבע״ כאפליקציה בנייד</span>
                <span>📱</span>
              </h4>
              <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                התקנה מהירה לאייפון ולאנדרואיד — פתיחה ישירה ממסך הבית ללא צורך בדפדפן
              </p>
            </div>
          </div>

          <PWAInstallButton />
        </div>
      )}

      {/* Technical Support Box - Prominent, Friendly, Senior-Safe */}
      <div 
        id="main-technical-support-banner"
        className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
            <PhoneCall className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 font-['Rubik',sans-serif] flex items-center justify-center sm:justify-start gap-2">
              <span>לתמיכה טכנית ועזרה נא לפנות לאילנית</span>
              <span className="text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">בשמחה! 😊</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
              עזרה בהרשמה, פרסום מודעות, תקלות או שאלות לגבי המערכת
            </p>
          </div>
        </div>

        <a
          id="btn-call-support-ilanit"
          href="tel:0549311010"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
          title="התקשר לאילנית - 054-9311010"
        >
          <Phone className="w-4 h-4 text-emerald-200" />
          <span dir="ltr" className="tracking-wider font-mono font-bold">054-9311010</span>
          <span className="text-xs text-emerald-100 font-sans mr-1">• חייג עכשיו</span>
        </a>
      </div>

    </div>
  );
};
