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
  ArrowRightLeft,
  Users,
  Download,
  Check,
  LogOut
} from 'lucide-react';
import { Job, UserProfile, DashboardSubTab, FeedbackReview } from '../types';
import { JobCard } from './JobCard';
import { fetchUserReviews, isUserAdmin, updateUserProfile } from '../lib/firebase';
import { formatHebrewDate } from '../lib/utils';
import { downloadJobsCsvFile } from '../lib/googleSheetsService';

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
  onClaimSuccess?: (job: Job) => void;
  onLogout?: () => void;
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
  onClaimSuccess,
  onLogout,
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

  const handleDownloadAllJobsCsv = () => {
    try {
      const jobsToExport = allJobs && allJobs.length > 0 ? allJobs : [...postedJobs, ...claimedJobs];
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadJobsCsvFile(jobsToExport, `יומן_עבודות_שלוש_ארבע_${timestamp}.csv`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
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

  const [postedStatusFilter, setPostedStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'completed'>('all');

  const openPostedJobs = postedJobs.filter(j => j.status === 'new');
  const inProgressPostedJobs = postedJobs.filter(j => j.status === 'in_progress');
  const completedPostedJobs = postedJobs.filter(j => j.status === 'completed');

  const filteredPostedJobs = postedJobs.filter(job => {
    if (postedStatusFilter === 'all') return true;
    return job.status === postedStatusFilter;
  });

  const activePostedCount = openPostedJobs.length + inProgressPostedJobs.length;
  const activeClaimedCount = claimedJobs.filter(j => j.status === 'in_progress').length;

  const avgRating = user.ratingAverage || 5.0;
  const ratingCount = user.ratingCount || reviews.length;

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* User Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white font-black text-xl flex items-center justify-center shadow-xs font-['Rubik',sans-serif] shrink-0">
              {user.fullName.slice(0, 2) || 'יש'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 heading-font">
                  {user.fullName}
                </h2>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <span>👑 מנהל מערכת</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>מאומת</span>
                  </span>
                )}
                {user.isLookingForJob ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
                    <span>🙋‍♂️ מחפש/ת עבודה</span>
                    {user.youthGroup && (
                      <span className="font-extrabold text-teal-950">
                        • {user.youthGroup}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    <span>🏡 מפרסם/ת עבודות</span>
                  </span>
                )}

                {/* Quick Role Switcher */}
                {!isAdmin && (
                  <button
                    id="btn-toggle-user-role"
                    onClick={handleToggleRole}
                    disabled={switchingRole}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-300 transition-colors cursor-pointer"
                    title="שנה מצב חשבון בין מחפש עבודה למפרסם עבודות"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-emerald-700" />
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
            {/* CSV Export - ONLY FOR ADMIN */}
            {isAdmin && (
              <button
                id="btn-dashboard-google-sheets"
                onClick={handleDownloadAllJobsCsv}
                className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                title="הורדת יומן עבודות לקובץ CSV / Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>הורד יומן CSV</span>
                <Download className="w-3.5 h-3.5 text-emerald-700" />
              </button>
            )}

            {/* Logout button in header area */}
            {onLogout && (
              <button
                id="btn-dashboard-logout"
                onClick={onLogout}
                className="hidden sm:flex px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold transition-colors items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="התנתק מהמשתמש"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>התנתק</span>
              </button>
            )}

            {/* Only employers and admins can publish new jobs */}
            {canPublish && (
              <button
                id="btn-dashboard-post-job"
                onClick={onOpenPostJob}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>פרסם עבודה בקיבוץ +</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Quick Action Bar with Logout (specifically for phone mode) */}
        {onLogout && (
          <div className="sm:hidden flex items-center gap-2 mt-4 pt-3.5 border-t border-slate-100">
            <button
              id="btn-dashboard-mobile-logout"
              onClick={onLogout}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>התנתק מהמשתמש</span>
            </button>
          </div>
        )}

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
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
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

      {/* Main Tabs Selection */}
      <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200">
        <button
          id="btn-subtab-posted"
          onClick={() => setSubTab('posted')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'posted'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>עבודות שפרסמתי ({postedJobs.length})</span>
          {activePostedCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              subTab === 'posted' ? 'bg-white text-emerald-900' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {activePostedCount}
            </span>
          )}
        </button>

        <button
          id="btn-subtab-claimed"
          onClick={() => setSubTab('claimed')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'claimed'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>עבודות שלקחתי ({claimedJobs.length})</span>
          {activeClaimedCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              subTab === 'claimed' ? 'bg-white text-emerald-900' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {activeClaimedCount}
            </span>
          )}
        </button>

        <button
          id="btn-subtab-reviews"
          onClick={() => setSubTab('reviews')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'reviews'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>חוות דעת ({reviews.length})</span>
        </button>
      </div>

      {/* Subtab 1: Jobs I Posted */}
      {subTab === 'posted' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                מודעות העבודה שפרסמת ({postedJobs.length})
              </h3>
              <p className="text-xs text-slate-500">
                מעקב סטטוס בזמן אמת: פתוח להרשמה, עובדים שנרשמו ועבודות שהושלמו
              </p>
            </div>

            {/* Quick Filter by Status */}
            {postedJobs.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setPostedStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    postedStatusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  הכל ({postedJobs.length})
                </button>

                <button
                  type="button"
                  onClick={() => setPostedStatusFilter('new')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    postedStatusFilter === 'new'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>פתוחות ({openPostedJobs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPostedStatusFilter('in_progress')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    postedStatusFilter === 'in_progress'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 border border-amber-200 text-amber-950 hover:bg-amber-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>בביצוע / נרשמו ({inProgressPostedJobs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPostedStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    postedStatusFilter === 'completed'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>הושלמו ({completedPostedJobs.length})</span>
                </button>
              </div>
            )}
          </div>

          {filteredPostedJobs.length > 0 ? (
            <div className="space-y-3.5">
              {filteredPostedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  currentUser={user}
                  onOpenAuth={() => {}}
                  onOpenShare={onOpenShare}
                  onOpenDetails={onOpenDetails}
                  onEditJob={onEditJob}
                  onClaimSuccess={onClaimSuccess}
                />
              ))}
            </div>
          ) : postedJobs.length > 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
              <p className="text-sm font-bold text-slate-700 mb-2">
                אין מודעות בסטטוס זה
              </p>
              <button
                type="button"
                onClick={() => setPostedStatusFilter('all')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
              >
                הצג את כל המודעות שפרסמת ({postedJobs.length})
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                📤
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                טרם פרסמת מודעות עבודה
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-sm mx-auto">
                צריך עזרה בגינה, בייביסיטר, ניקיון או עזרה במשק? פרסם מודעה עכשיו ותקבל מענה מהיר מהקהילה
              </p>
              <button
                onClick={onOpenPostJob}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
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
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
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
                  onClaimSuccess={onClaimSuccess}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                💼
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                טרם לקחת עבודות
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                עבור לעמוד העבודות הפנויות בלוח וקח עבודה שמתאימה לך בלחיצה אחת
              </p>
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Reviews & Ratings */}
      {subTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              חוות דעת ודירוגים שקיבלת ({reviews.length})
            </h3>
            <span className="text-xs text-slate-400">
              דירוגים שניתנו לך על ידי מזמינים ועובדים לאחר סיום עבודות
            </span>
          </div>

          {loadingReviews ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <div className="inline-block w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs text-slate-500">טוען חוות דעת...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {rev.fromUserName}
                      </h4>
                      <span className="text-xs text-slate-500 block">
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
              <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
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
